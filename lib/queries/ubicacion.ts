type ParamUrl = string | string[] | undefined;

interface MunicipioConDepartamento {
  id: number;
  departamentoId: number;
}

export interface Ubicacion {
  departamentoId: number;
  municipioId: number;
}

/**
 * Interpreta un parámetro de la URL como id entero no negativo. Devuelve null
 * para cualquier otra cosa ("abc", "1.5", "-1", "", repetido como array) --
 * a diferencia de Number(), que deja pasar NaN o decimales hasta Postgres.
 */
export function parsearId(valor: ParamUrl): number | null {
  if (typeof valor !== "string" || !/^\d+$/.test(valor)) {
    return null;
  }
  return Number(valor);
}

/**
 * Resuelve el departamento/municipio pedido en la URL contra la lista de
 * municipios conocidos. Si no vienen en la URL se usa Asunción (0/0), igual
 * que antes. Si vienen pero son inválidos o la combinación no existe devuelve
 * null, para que la página corte con un 404 antes de pegarle al TSJE -- si no,
 * cualquier URL inventada dispararía un request al TSJE en cada visita.
 */
export function resolverUbicacion(
  params: { departamento?: ParamUrl; municipio?: ParamUrl },
  municipios: MunicipioConDepartamento[],
): Ubicacion | null {
  const departamentoId =
    params.departamento === undefined ? 0 : parsearId(params.departamento);
  const municipioId =
    params.municipio === undefined ? 0 : parsearId(params.municipio);

  if (departamentoId === null || municipioId === null) {
    return null;
  }

  // municipios.id solo es único dentro de su departamento (PK compuesta).
  const existe = municipios.some(
    (m) => m.departamentoId === departamentoId && m.id === municipioId,
  );

  return existe ? { departamentoId, municipioId } : null;
}
