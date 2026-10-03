import { db } from "@/lib/db/client";
import { departamentos, elecciones, municipios } from "@/lib/db/schema";
import { resolverEleccionSeleccionada } from "@/lib/queries/eleccion-seleccionada";
import { resolverUbicacion } from "@/lib/queries/ubicacion";
import { UbicacionSelector } from "./components/UbicacionSelector";
import { FiltrosPendingProvider } from "./components/FiltrosPendingContext";
import { EleccionSelector } from "./components/EleccionSelector";
import { FiltrosPendingIndicator } from "./components/FiltrosPendingIndicator";

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

  // En el inicio una ubicación inválida no es un error: se cae a Asunción.
  const { departamentoId, municipioId } = resolverUbicacion(
    params,
    todosMunicipios,
  ) ?? { departamentoId: 0, municipioId: 0 };

  const eleccionSeleccionada = resolverEleccionSeleccionada(
    todasElecciones,
    params.eleccion,
  );

  const eleccionQuery = eleccionSeleccionada
    ? `eleccion=${eleccionSeleccionada.codeleccion}`
    : "";

  const query = `?departamento=${departamentoId}&municipio=${municipioId}&${eleccionQuery}`;

  return (
    <main className="esc-inicio">
      <h1>Elecciones Municipales</h1>
      <p>
        Elegí un departamento y un distrito para ver quién va ganando en
        Intendente y cómo quedarían las bancas de Concejales.
      </p>

      <FiltrosPendingProvider>
        {todasElecciones.length > 0 && eleccionSeleccionada && (
          <EleccionSelector
            elecciones={todasElecciones}
            codeleccionActual={eleccionSeleccionada.codeleccion}
          />
        )}

        <UbicacionSelector
          departamentos={todosDepartamentos}
          municipios={todosMunicipios}
          departamentoId={departamentoId}
          municipioId={municipioId}
        />
        <FiltrosPendingIndicator />
      </FiltrosPendingProvider>

      <nav>
        <a href={`/intendente${query}`}>Ver resultados de Intendente</a>
        <a href={`/concejales${query}`}>Ver resultados de Concejales</a>
      </nav>
    </main>
  );
}
