export type EleccionesJson = Record<string, string>;

export type EleccionRow = {
  codeleccion: number;
  nombre: string;
};

export function parseElecciones(eleccionesJson: EleccionesJson) {
  return Object.entries(eleccionesJson).map(([codeleccion, nombre]) => ({
    codeleccion: Number(codeleccion),
    nombre,
    activa: false,
  }));
}
