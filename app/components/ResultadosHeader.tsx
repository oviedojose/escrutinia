import type { ContextoResultados } from "@/lib/queries/contexto-resultados";
import { NavBar } from "./NavBar";
import { FiltrosPendingProvider } from "./FiltrosPendingContext";
import { EleccionSelector } from "./EleccionSelector";
import { UbicacionSelector } from "./UbicacionSelector";
import { FiltrosPendingIndicator } from "./FiltrosPendingIndicator";

interface ResultadosHeaderProps {
  active: "intendente" | "concejales";
  contexto: ContextoResultados & {
    eleccionSeleccionada: NonNullable<ContextoResultados["eleccionSeleccionada"]>;
  };
  statusTimestamp?: string;
}

/** NavBar + filtros de elección y ubicación, comunes a las páginas de resultados. */
export function ResultadosHeader({
  active,
  contexto,
  statusTimestamp,
}: ResultadosHeaderProps) {
  return (
    <>
      <NavBar
        active={active}
        statusTimestamp={statusTimestamp}
        departamentoId={contexto.departamentoId}
        municipioId={contexto.municipioId}
        codeleccion={contexto.eleccionSeleccionada.codeleccion}
      />
      <FiltrosPendingProvider>
        <div className="esc-filtros">
          <EleccionSelector
            elecciones={contexto.todasElecciones}
            codeleccionActual={contexto.eleccionSeleccionada.codeleccion}
          />
          <UbicacionSelector
            departamentos={contexto.todosDepartamentos}
            municipios={contexto.todosMunicipios}
            departamentoId={contexto.departamentoId}
            municipioId={contexto.municipioId}
          />
        </div>
        <FiltrosPendingIndicator />
      </FiltrosPendingProvider>
    </>
  );
}
