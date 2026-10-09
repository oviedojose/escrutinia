// Sync general de la elección activa: pide al TSJE cada municipio ×
// candidatura, de a uno y con pausa, y al final marca como finales (no
// oficiales) los snapshots sincronizados desde FECHA_CORTE_FINAL.
//
//   npm run sync:general                 # sincroniza y marca
//   npm run sync:general -- --solo-marcar # solo marca, sin llamar al TSJE
import { and, eq, gte } from "drizzle-orm";
import { db } from "../db/client";
import { elecciones, municipios, resultadosSnapshot } from "../db/schema";
import { obtenerUltimoSnapshot } from "../queries/snapshots";
import { fetchResultadoTsje } from "../tsje/client";
import type { TsjeRespuesta } from "../tsje/types";
import { depsSincronizacionOnDemandReales } from "./on-demand-deps";
import { mismosResultados } from "./mismos-resultados";
import { ordenarObjetivos, sincronizarEnLote } from "./lote";

/** Desde acá, lo sincronizado se considera resultado final (hora de Paraguay). */
const FECHA_CORTE_FINAL = new Date("2026-10-05T00:00:00-03:00");

const OPCIONES = {
  pausaMs: 2_000,
  pausaTrasFalloMs: 30_000,
  maxFallosSeguidos: 5,
};

const esperar = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

async function sincronizarTodo(eleccionId: number, codeleccion: number) {
  const objetivos = ordenarObjetivos(await db.select().from(municipios));
  console.log(
    `${objetivos.length} combinaciones, ~${Math.ceil((objetivos.length * OPCIONES.pausaMs) / 60_000)} min como mínimo.`,
  );

  const resultado = await sincronizarEnLote(
    objetivos,
    {
      esFinal: async (o) =>
        (await obtenerUltimoSnapshot(
          eleccionId,
          o.departamentoId,
          o.municipioId,
          o.candidatura,
        ))?.final ?? false,
      sincronizar: async (o) => {
        const existente = await obtenerUltimoSnapshot(
          eleccionId,
          o.departamentoId,
          o.municipioId,
          o.candidatura,
        );
        const payload = await fetchResultadoTsje({
          codeleccion,
          candidatura: o.candidatura,
          departamento: o.departamentoId,
          municipio: o.municipioId,
        });
        if (existente && mismosResultados(existente.payload, payload)) {
          await depsSincronizacionOnDemandReales.renovarSnapshot(existente.id);
          return "igual";
        }
        await depsSincronizacionOnDemandReales.guardarSnapshot({
          eleccionId,
          departamentoId: o.departamentoId,
          municipioId: o.municipioId,
          candidatura: o.candidatura,
          payload,
        });
        return "nuevo";
      },
      esperar,
      log: console.log,
    },
    OPCIONES,
  );

  console.log(
    `\nNuevos: ${resultado.nuevos} · Sin cambios: ${resultado.iguales} · Ya finales: ${resultado.omitidos} · Fallidos: ${resultado.fallidos.length}${resultado.cortado ? " · CORTADO" : ""}`,
  );
  for (const f of resultado.fallidos) {
    console.log(
      `  falló dpto ${f.objetivo.departamentoId} muni ${f.objetivo.municipioId} cand ${f.objetivo.candidatura}: ${f.error}`,
    );
  }
}

async function marcarFinales(eleccionId: number) {
  const marcados = await db
    .update(resultadosSnapshot)
    .set({ final: true })
    .where(
      and(
        eq(resultadosSnapshot.eleccionId, eleccionId),
        eq(resultadosSnapshot.final, false),
        gte(resultadosSnapshot.sincronizadoEn, FECHA_CORTE_FINAL),
      ),
    )
    .returning({
      departamentoId: resultadosSnapshot.departamentoId,
      municipioId: resultadosSnapshot.municipioId,
      candidatura: resultadosSnapshot.candidatura,
      payload: resultadosSnapshot.payload,
    });

  console.log(`\nMarcados como finales: ${marcados.length}`);
  for (const m of marcados) {
    const { mesasPublicadas, totalMesas } = (m.payload as TsjeRespuesta)
      .totales;
    if (mesasPublicadas < totalMesas) {
      console.log(
        `  ojo, final con mesas sin publicar: dpto ${m.departamentoId} muni ${m.municipioId} cand ${m.candidatura} (${mesasPublicadas}/${totalMesas})`,
      );
    }
  }
}

async function main() {
  const [eleccion] = await db
    .select()
    .from(elecciones)
    .where(eq(elecciones.activa, true));
  if (!eleccion) throw new Error("No hay ninguna elección activa.");
  console.log(`Elección activa: ${eleccion.nombre} (${eleccion.codeleccion})`);

  if (!process.argv.includes("--solo-marcar")) {
    await sincronizarTodo(eleccion.id, eleccion.codeleccion);
  }
  await marcarFinales(eleccion.id);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error en el sync general:", error);
    process.exit(1);
  });
