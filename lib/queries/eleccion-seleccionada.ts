interface EleccionConCodigo {
  codeleccion: number;
  activa: boolean;
}

/**
 * Las páginas de resultados pueden pedir ver una elección puntual vía
 * ?eleccion=<codeleccion> (ver EleccionSelector) sin cambiar cuál está
 * marcada "activa" en Configuración -- esa sigue siendo la que usa el sync.
 * Si el parámetro no viene o no matchea ninguna elección conocida, se cae
 * a la activa.
 */
export function resolverEleccionSeleccionada<T extends EleccionConCodigo>(
  elecciones: T[],
  codeleccionParam?: string,
): T | undefined {
  if (codeleccionParam) {
    const porParam = elecciones.find(
      (e) => e.codeleccion === Number(codeleccionParam),
    );
    if (porParam) {
      return porParam;
    }
  }
  return elecciones.find((e) => e.activa);
}
