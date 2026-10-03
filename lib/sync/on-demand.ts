import type { TipoCandidatura, TsjeParams, TsjeRespuesta } from "../tsje/types";
import type { SnapshotRow } from "../queries/snapshots";

export interface DepsSincronizacionOnDemand {
  obtenerSnapshotExistente: (
    eleccionId: number,
    departamentoId: number,
    municipioId: number,
    candidatura: 1 | 2,
  ) => Promise<SnapshotRow | null>;
  fetchResultado: (params: TsjeParams) => Promise<TsjeRespuesta>;
  guardarSnapshot: (input: {
    eleccionId: number;
    departamentoId: number;
    municipioId: number;
    candidatura: 1 | 2;
    payload: TsjeRespuesta;
  }) => Promise<void>;
}

/**
 * Si ya hay un snapshot guardado para esta combinación, lo devuelve tal
 * cual. Si no, lo trae del TSJE en el momento (on-demand) y lo guarda antes
 * de devolverlo -- así una página que nunca fue sincronizada igual muestra
 * resultados reales en vez de "sin datos todavía", sin esperar a que
 * alguien corra un sync manual desde Configuración. Si el TSJE falla (o
 * genuinamente no hay datos para esa combinación), devuelve null como
 * antes y la página cae al mensaje de "sin datos".
 *
 * Sin implementación real por defecto (a propósito, mismo patrón que
 * ejecutarSync en service.ts): las deps reales viven en on-demand-deps.ts,
 * que sí importa lib/db/client.ts -- mantenerlas separadas es lo que deja
 * este archivo (y sus tests) libres de necesitar DATABASE_URL.
 */
export async function obtenerOSincronizarSnapshot(
  eleccionId: number,
  codeleccion: number,
  departamentoId: number,
  municipioId: number,
  candidatura: TipoCandidatura,
  deps: DepsSincronizacionOnDemand,
): Promise<SnapshotRow | null> {
  const existente = await deps.obtenerSnapshotExistente(
    eleccionId,
    departamentoId,
    municipioId,
    candidatura,
  );
  if (existente) {
    return existente;
  }

  try {
    const payload = await deps.fetchResultado({
      codeleccion,
      candidatura,
      departamento: departamentoId,
      municipio: municipioId,
    });
    await deps.guardarSnapshot({
      eleccionId,
      departamentoId,
      municipioId,
      candidatura,
      payload,
    });
  } catch {
    return null;
  }

  return deps.obtenerSnapshotExistente(
    eleccionId,
    departamentoId,
    municipioId,
    candidatura,
  );
}
