import {
  cargarContextoResultados,
  MENSAJE_SIN_ELECCION,
  type ParamsResultados,
} from "@/lib/queries/contexto-resultados";
import { obtenerOSincronizarSnapshot } from "@/lib/sync/on-demand";
import { depsSincronizacionOnDemandReales } from "@/lib/sync/on-demand-deps";
import { ResultadosHeader } from "../components/ResultadosHeader";
import { construirVistaIntendente } from "@/lib/queries/intendente";
import { StatTile } from "../components/StatTile";
import { VoteBar } from "../components/VoteBar";
import { PartyChip } from "../components/PartyChip";

export const dynamic = "force-dynamic";

export default async function IntendentePage({
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
    1,
    depsSincronizacionOnDemandReales,
  );

  if (!snapshot) {
    return (
      <main className="esc-page">
        <ResultadosHeader active="intendente" contexto={contextoConEleccion} />
        <p>
          Sin datos todavía para {contexto.nombreMunicipio},{" "}
          {contexto.nombreDepartamento} en {eleccionSeleccionada.nombre}.
        </p>
      </main>
    );
  }

  const vista = construirVistaIntendente(snapshot.payload);

  return (
    <main className="esc-page">
      <ResultadosHeader
        active="intendente"
        contexto={contextoConEleccion}
        statusTimestamp={vista.horaFormated}
        statusFinal={snapshot.final}
      />
      <h1>Resultados de Intendente</h1>
      <p>
        {contexto.nombreMunicipio}, {contexto.nombreDepartamento} —{" "}
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
