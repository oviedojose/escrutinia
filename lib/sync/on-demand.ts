import type { TipoCandidatura, TsjeParams, TsjeRespuesta } from "../tsje/types";
import type { SnapshotRow } from "../queries/snapshots";

export const VIGENCIA_SNAPSHOT_MS = 15 * 60 * 1000;

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
  ahora?: () => Date;
}

/**
 * Si el último snapshot guardado para esta combinación se sincronizó hace
 * menos de VIGENCIA_SNAPSHOT_MS (15 minutos), lo devuelve tal cual. Si no
 * existe o ya venció, lo trae del TSJE en el momento (on-demand) y lo guarda
 * antes de devolverlo -- así una página que nunca fue sincronizada igual
 * muestra resultados reales, y durante el escrutinio los datos no quedan
 * congelados en la primera visita. Si el TSJE falla, devuelve el último
 * snapshot guardado aunque esté vencido (mejor datos viejos que ninguno), o
 * null si nunca hubo uno, y la página cae al mensaje de "sin datos".
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
  const ahora = deps.ahora?.() ?? new Date();
  const existente = await deps.obtenerSnapshotExistente(
    eleccionId,
    departamentoId,
    municipioId,
    candidatura,
  );
  if (
    existente &&
    ahora.getTime() - new Date(existente.sincronizadoEn).getTime() <
      VIGENCIA_SNAPSHOT_MS
  ) {
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
    return existente;
  }

  return deps.obtenerSnapshotExistente(
    eleccionId,
    departamentoId,
    municipioId,
    candidatura,
  );
}
