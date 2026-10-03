import { notFound } from "next/navigation";
import { db } from "@/lib/db/client";
import { departamentos, elecciones, municipios } from "@/lib/db/schema";
import { resolverEleccionSeleccionada } from "@/lib/queries/eleccion-seleccionada";
import { resolverUbicacion } from "@/lib/queries/ubicacion";
import { obtenerOSincronizarSnapshot } from "@/lib/sync/on-demand";
import { depsSincronizacionOnDemandReales } from "@/lib/sync/on-demand-deps";
import { NavBar } from "../components/NavBar";
import { FiltrosPendingProvider } from "../components/FiltrosPendingContext";
import { EleccionSelector } from "../components/EleccionSelector";
import { FiltrosPendingIndicator } from "../components/FiltrosPendingIndicator";
import { ResultadosSelector } from "../components/ResultadosSelector";
import { construirVistaIntendente } from "@/lib/queries/intendente";
import { StatTile } from "../components/StatTile";
import { VoteBar } from "../components/NoteBar";
import { PartyChip } from "../components/PartyChip";

export const dynamic = "force-dynamic";

export default async function InicioPage({
  searchParams,
}: {
  searchParams: Promise<{
    departamento?: string | string[];
    municipio?: string | string[];
    eleccion?: string;
  }>;
}) {
  const params = await searchParams;
  const [todosDepartamentos, todosMunicipios, todasElecciones] =
    await Promise.all([
      db.select().from(departamentos),
      db.select().from(municipios),
      db.select().from(elecciones),
    ]);

  const ubicacion = resolverUbicacion(params, todosMunicipios);
  if (!ubicacion) {
    notFound();
  }
  const { departamentoId, municipioId } = ubicacion;

  const eleccionSeleccionada = resolverEleccionSeleccionada(
    todasElecciones,
    params.eleccion,
  );

  const municipio = todosMunicipios.find(
    (m) => m.departamentoId === departamentoId && m.id === municipioId,
  );
  const departamento = todosDepartamentos.find((d) => d.id === departamentoId);

  if (!eleccionSeleccionada) {
    return (
      <main>
        No hay ninguna elección configurada. Agregá una en /configuracion.
      </main>
    );
  }

  const snapshot = await obtenerOSincronizarSnapshot(
    eleccionSeleccionada.id,
    eleccionSeleccionada.codeleccion,
    departamentoId,
    municipioId,
    1,
    depsSincronizacionOnDemandReales,
  );

  if (!snapshot) {
    return (
      <main className="esc-page">
        <NavBar
          active="intendente"
          departamentoId={departamentoId}
          municipioId={municipioId}
          codeleccion={eleccionSeleccionada.codeleccion}
        />
        <FiltrosPendingProvider>
          <div className="esc-filtros">
            <EleccionSelector
              elecciones={todasElecciones}
              codeleccionActual={eleccionSeleccionada.codeleccion}
            />
            <ResultadosSelector
              departamentos={todosDepartamentos}
              municipios={todosMunicipios}
              departamentoId={departamentoId}
              municipioId={municipioId}
            />
          </div>
          <FiltrosPendingIndicator />
        </FiltrosPendingProvider>
        <p>
          Sin datos todavía para {municipio?.nombre}, {departamento?.nombre} en{" "}
          {eleccionSeleccionada.nombre}.
        </p>
      </main>
    );
  }

  const vista = construirVistaIntendente(snapshot.payload);

  return (
    <main className="esc-page">
      <NavBar
        active="intendente"
        statusTimestamp={vista.horaFormated}
        departamentoId={departamentoId}
        municipioId={municipioId}
        codeleccion={eleccionSeleccionada.codeleccion}
      />
      <FiltrosPendingProvider>
        <div className="esc-filtros">
          <EleccionSelector
            elecciones={todasElecciones}
            codeleccionActual={eleccionSeleccionada.codeleccion}
          />
          <ResultadosSelector
            departamentos={todosDepartamentos}
            municipios={todosMunicipios}
            departamentoId={departamentoId}
            municipioId={municipioId}
          />
        </div>
        <FiltrosPendingIndicator />
      </FiltrosPendingProvider>
      <h1>Resultados de Intendente</h1>
      <p>
        {municipio?.nombre}, {departamento?.nombre} -
        {eleccionSeleccionada.nombre}
      </p>
      <div className="esc-stat-grid">
        <StatTile
          label="VOTOS ESCRUTADOS"
          value={vista.totales.totalVotos.toLocaleString("es-PY")}
          sublabel={`de ${vista.totales.canElectores.toLocaleString("es-PY")} electores`}
        />
        <StatTile
          label="MESAS ESCRUTADAS"
          value={`${vista.mesasEscrutadasPct.toFixed(0)}%`}
          sublabel={`${vista.totales.mesasPublicadas} de ${vista.totales.totalMesas} mesas`}
          variant="info"
        />
        <StatTile
          label="VOTOS EN BLANCO"
          value={vista.totales.blancos.toLocaleString("es-PY")}
        />
        <StatTile
          label="VOTOS NULOS"
          value={vista.totales.nulos.toLocaleString("es-PY")}
        />
      </div>

      <section>
        <h2>Votos por lista</h2>
        <VoteBar
          rows={vista.candidatos.map((c, idx) => ({
            rank: idx + 1,
            numLista: c.numLista,
            nombre: c.nomCandidato,
            color: c.colLista,
            votos: c.votos,
            pct: c.pctVotos,
            esGanador: c.esGanador,
          }))}
        />
      </section>

      <section>
        <h2>Identidad de listas</h2>
        {vista.candidatos.map((c) => (
          <PartyChip
            key={c.numLista}
            numLista={c.numLista}
            nombre={c.desPartido}
            color={c.colLista}
          />
        ))}
      </section>
    </main>
  );
}
