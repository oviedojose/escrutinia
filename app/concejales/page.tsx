import { db } from "@/lib/db/client";
import { elecciones, departamentos, municipios } from "@/lib/db/schema";
import { obtenerOSincronizarSnapshot } from "@/lib/sync/on-demand";
import { depsSincronizacionOnDemandReales } from "@/lib/sync/on-demand-deps";
import { construirVistaConcejales } from "@/lib/queries/concejales";
import { resolverEleccionSeleccionada } from "@/lib/queries/eleccion-seleccionada";
import { bancasPorDefecto } from "@/lib/dhondt/bancas";
import { NavBar } from "../components/NavBar";
import { FiltrosPendingProvider } from "../components/FiltrosPendingContext";
import { EleccionSelector } from "../components/EleccionSelector";
import { ResultadosSelector } from "../components/ResultadosSelector";
import { FiltrosPendingIndicator } from "../components/FiltrosPendingIndicator";
import { StatTile } from "../components/StatTile";
import { SeatDistributionBar } from "../components/SeatDistributionBar";
import { DHondtTable } from "../components/DHondtTable";
import { ElectedList } from "../components/ElectedList";

export const dynamic = "force-dynamic";

export default async function ConcejalesPage({
  searchParams,
}: {
  searchParams: Promise<{
    departamento?: string;
    municipio?: string;
    eleccion?: string;
  }>;
}) {
  const params = await searchParams;
  const departamentoId = Number(params.departamento ?? 0);
  const municipioId = Number(params.municipio ?? 0);

  const [todasElecciones, todosDepartamentos, todosMunicipios] =
    await Promise.all([
      db.select().from(elecciones),
      db.select().from(departamentos),
      db.select().from(municipios),
    ]);
  const eleccionSeleccionada = resolverEleccionSeleccionada(
    todasElecciones,
    params.eleccion,
  );
  // distritos.id is only unique WITHIN a departamentoId (composite PK) -- match both.
  const municipio = todosMunicipios.find(
    (m) => m.departamentoId === departamentoId && m.id === municipioId,
  );
  const departamento = todosDepartamentos.find((d) => d.id === departamentoId);

  if (!eleccionSeleccionada) {
    return <main>No hay ninguna elección configurada.</main>;
  }

  const snapshot = await obtenerOSincronizarSnapshot(
    eleccionSeleccionada.id,
    eleccionSeleccionada.codeleccion,
    departamentoId,
    municipioId,
    2,
    depsSincronizacionOnDemandReales,
  );

  if (!snapshot) {
    return (
      <main className="esc-page">
        <NavBar
          active="concejales"
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

  const vista = construirVistaConcejales(
    snapshot.payload,
    bancasPorDefecto(departamentoId, municipioId),
  );

  return (
    <main className="esc-page">
      <NavBar
        active="concejales"
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
      <h1>Resultados de Concejales</h1>
      <p>
        {municipio?.nombre}, {departamento?.nombre} —{" "}
        {eleccionSeleccionada.nombre}
      </p>
      <p className="esc-disclaimer">
        Bancas a repartir: {vista.bancasTotales} (calculado según la cantidad de
        candidatos postulados por lista y la distribución se calcula en base a
        los votos escrutados del TREP mediante el método D&apos;Hondt).
      </p>

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
