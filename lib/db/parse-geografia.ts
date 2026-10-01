export type DepartamentoJson = Record<string, string>;
export type MunicipioJson = Record<string, Record<string, string>>;

export type DepartamentoRow = {
  id: number;
  nombre: string;
};

export type MunicipioRow = {
  id: number;
  departamentoId: number;
  nombre: string;
};

export function parseGeografia(
  departamentosJson: DepartamentoJson,
  municipiosJson: MunicipioJson,
): { departamentos: DepartamentoRow[]; municipios: MunicipioRow[] } {
  const departamentos = Object.entries(departamentosJson).map(
    ([id, nombre]) => ({
      id: Number(id),
      nombre,
    }),
  );

  const municipios = Object.entries(municipiosJson).flatMap(
    ([departamentoId, municipios]) =>
      Object.entries(municipios).map(([id, nombre]) => ({
        id: Number(id),
        departamentoId: Number(departamentoId),
        nombre,
      })),
  );

  return { departamentos, municipios };
}
