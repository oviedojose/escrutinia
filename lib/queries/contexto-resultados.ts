import { notFound } from "next/navigation";
import { db } from "../db/client";
import { departamentos, elecciones, municipios } from "../db/schema";
import { resolverEleccionSeleccionada } from "./eleccion-seleccionada";
import { resolverUbicacion } from "./ubicacion";

export interface ParamsResultados {
  departamento?: string | string[];
  municipio?: string | string[];
  eleccion?: string;
}

/**
 * Lo que necesita cualquier página de resultados antes de pedir un snapshot:
 * las listas para los selectores, la ubicación validada y la elección
 * elegida. Si la ubicación de la URL no existe corta con un 404, antes de
 * que la página llegue a consultar al TSJE.
 */
export async function cargarContextoResultados(params: ParamsResultados) {
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

  // municipios.id solo es único dentro de su departamento (PK compuesta).
  const municipio = todosMunicipios.find(
    (m) => m.departamentoId === departamentoId && m.id === municipioId,
  );
  const departamento = todosDepartamentos.find((d) => d.id === departamentoId);

  return {
    todosDepartamentos,
    todosMunicipios,
    todasElecciones,
    departamentoId,
    municipioId,
    nombreMunicipio: municipio?.nombre ?? "",
    nombreDepartamento: departamento?.nombre ?? "",
    eleccionSeleccionada: resolverEleccionSeleccionada(
      todasElecciones,
      params.eleccion,
    ),
  };
}

export type ContextoResultados = Awaited<
  ReturnType<typeof cargarContextoResultados>
>;

export const MENSAJE_SIN_ELECCION =
  "Todavía no hay ninguna elección cargada. Volvé a intentar más tarde.";
