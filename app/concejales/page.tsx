import {
  cargarContextoResultados,
  MENSAJE_SIN_ELECCION,
  type ParamsResultados,
} from "@/lib/queries/contexto-resultados";
import { obtenerOSincronizarSnapshot } from "@/lib/sync/on-demand";
import { depsSincronizacionOnDemandReales } from "@/lib/sync/on-demand-deps";
import { ResultadosHeader } from "../components/ResultadosHeader";
import { construirVistaConcejales } from "@/lib/queries/concejales";
import { bancasPorDefecto } from "@/lib/dhondt/bancas";
import { StatTile } from "../components/StatTile";
import { SeatDistributionBar } from "../components/SeatDistributionBar";
import { DHondtTable } from "../components/DHondtTable";
import { ElectedList } from "../components/ElectedList";

export const dynamic = "force-dynamic";

export default async function ConcejalesPage({
  searchParams,
}: {
  searchParams: Promise<ParamsResultados>;
}) {
  const contexto = await cargarContextoResultados(await searchParams);
  const { eleccionSeleccionada } = contexto;

  if (!eleccionSeleccionada) {
    return <main className="esc-page">{MENSAJE_SIN_ELECCION}</main>;
  }
  const contextoConEleccion = { ...contexto, eleccionSeleccionada };

  const snapshot = await obtenerOSincronizarSnapshot(
    eleccionSeleccionada.id,
    eleccionSeleccionada.codeleccion,
    contexto.departamentoId,
    contexto.municipioId,
    2,
    depsSincronizacionOnDemandReales,
  );

  if (!snapshot) {
    return (
      <main className="esc-page">
        <ResultadosHeader active="concejales" contexto={contextoConEleccion} />
        <p>
          Sin datos todavía para {contexto.nombreMunicipio},{" "}
          {contexto.nombreDepartamento} en {eleccionSeleccionada.nombre}.
        </p>
      </main>
    );
  }

  const vista = construirVistaConcejales(
    snapshot.payload,
    bancasPorDefecto(contexto.departamentoId, contexto.municipioId),
  );

  return (
    <main className="esc-page">
      <ResultadosHeader
        active="concejales"
        contexto={contextoConEleccion}
        statusTimestamp={vista.horaFormated}
      />
      <h1>Resultados de Concejales</h1>
      <p>
        {contexto.nombreMunicipio}, {contexto.nombreDepartamento} —{" "}
        {eleccionSeleccionada.nombre}
      </p>
      <p className="esc-disclaimer">
        Bancas a repartir: {vista.bancasTotales} (calculado según la cantidad de
        candidatos postulados por lista y la distribución se calcula en base a
        los votos escrutados del TREP mediante el método D&apos;Hondt).
      </p>
      {vista.empateASortear && (
        <p className="esc-disclaimer" role="status">
          Empate exacto: {vista.empateASortear.bancas === 1
            ? "la última banca"
            : `las últimas ${vista.empateASortear.bancas} bancas`}{" "}
          se disputa{vista.empateASortear.bancas === 1 ? "" : "n"} entre{" "}
          {vista.empateASortear.listas
            .map((l) => `${l.numLista} ${l.desPartido}`)
            .join(", ")}{" "}
          con el mismo cociente y la misma cantidad de votos. Según el art. 258
          del Código Electoral se define por sorteo, así que la distribución
          mostrada para esas listas es provisoria.
        </p>
      )}

      <div className="esc-stat-grid">
        <StatTile
          label="VOTOS VÁLIDOS"
          value={vista.votosValidos.toLocaleString("es-PY")}
          sublabel={`entre ${vista.distribucion.length} listas`}
        />
        <StatTile
          label="MESAS ESCRUTADAS"
          value={`${vista.mesasEscrutadasPct.toFixed(0)}%`}
          sublabel={`${vista.totales.mesasPublicadas} de ${vista.totales.totalMesas} mesas`}
          variant="info"
        />
        <StatTile
          label="BANCAS A REPARTIR"
          value={String(vista.bancasTotales)}
          variant="positive"
        />
        <StatTile
          label="VOTOS NULOS"
          value={vista.totales.nulos.toLocaleString("es-PY")}
        />
      </div>

      <section>
        <h2>Distribución de bancas</h2>
        <SeatDistributionBar
          segments={vista.distribucion.map((d) => ({
            numLista: d.numLista,
            nombre: d.desPartido,
            color: d.colLista,
            bancas: d.bancas,
          }))}
          totalBancas={vista.bancasTotales}
        />
      </section>

      <section>
        <h2>Asignación por el método D&apos;Hondt</h2>
        <DHondtTable
          listas={vista.distribucion.map((d) => d.numLista)}
          resultado={vista.dhondt}
          maxDivisor={Math.max(...vista.distribucion.map((d) => d.bancas))}
        />
      </section>

      <section>
        <h2>Concejales electos</h2>
        <div className="esc-elected">
          {vista.listasConElectos.map((l) => (
            <ElectedList
              key={l.numLista}
              numLista={l.numLista}
              nombre={l.desPartido}
              color={l.colLista}
              bancas={l.bancas}
              electos={l.electos}
            />
          ))}
        </div>
      </section>
    </main>
  );
}
