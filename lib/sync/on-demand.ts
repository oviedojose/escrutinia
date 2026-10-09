import type { TipoCandidatura, TsjeParams, TsjeRespuesta } from "../tsje/types";
import type { SnapshotRow } from "../queries/snapshots";
import { mismosResultados } from "./mismos-resultados";

export const VIGENCIA_SNAPSHOT_MS = 5 * 60 * 1000;

/**
 * Pedidos al TSJE en curso, por combinación. Vive en memoria, así que solo
 * deduplica dentro de una misma instancia del servidor: en Vercel cada
 * instancia tiene el suyo. Alcanza para absorber la mayoría de las visitas
 * simultáneas; eliminarlas del todo entre instancias requeriría un lock en
 * Postgres.
 */
const sincronizacionesEnCurso = new Map<string, Promise<SnapshotRow | null>>();

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
  /** Marca el snapshot como recién sincronizado, sin tocar su payload. */
  renovarSnapshot: (snapshotId: number) => Promise<void>;
  ahora?: () => Date;
}

/**
 * Si el último snapshot es final (ver resultadosSnapshot.final), lo devuelve
 * siempre sin consultar al TSJE.
 *
 * Si el último snapshot guardado para esta combinación se sincronizó hace
 * menos de VIGENCIA_SNAPSHOT_MS (5 minutos), lo devuelve tal cual. Si no
 * existe o ya venció, lo trae del TSJE en el momento (on-demand) y lo guarda
 * antes de devolverlo -- así una página que nunca fue sincronizada igual
 * muestra resultados reales, y durante el escrutinio los datos no quedan
 * congelados en la primera visita. Si el TSJE falla, devuelve el último
 * snapshot guardado aunque esté vencido (mejor datos viejos que ninguno), o
 * null si nunca hubo uno, y la página cae al mensaje de "sin datos".
 *
 * Si el TSJE devuelve los mismos resultados que el último snapshot, no se
 * inserta una fila nueva: solo se renueva su fecha de sincronización, para
 * que siga valiendo como caché sin hacer crecer la tabla.
 *
 * Visitas simultáneas a la misma combinación con el snapshot vencido
 * comparten un único pedido al TSJE (ver sincronizacionesEnCurso), en vez de
 * disparar cada una su propio fetch e INSERT.
 *
 * Sin implementación real por defecto (a propósito): las deps reales viven
 * en on-demand-deps.ts, que sí importa lib/db/client.ts -- mantenerlas
 * separadas es lo que deja este archivo (y sus tests) libres de necesitar
 * DATABASE_URL.
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
    (existente.final ||
      ahora.getTime() - new Date(existente.sincronizadoEn).getTime() <
        VIGENCIA_SNAPSHOT_MS)
  ) {
    return existente;
  }

  const clave = `${eleccionId}:${departamentoId}:${municipioId}:${candidatura}`;
  let enCurso = sincronizacionesEnCurso.get(clave);
  if (!enCurso) {
    enCurso = sincronizarDesdeTsje(
      eleccionId,
      codeleccion,
      departamentoId,
      municipioId,
      candidatura,
      existente,
      deps,
    ).finally(() => sincronizacionesEnCurso.delete(clave));
    sincronizacionesEnCurso.set(clave, enCurso);
  }
  return enCurso;
}

async function sincronizarDesdeTsje(
  eleccionId: number,
  codeleccion: number,
  departamentoId: number,
  municipioId: number,
  candidatura: TipoCandidatura,
  existente: SnapshotRow | null,
  deps: DepsSincronizacionOnDemand,
): Promise<SnapshotRow | null> {
  try {
    const payload = await deps.fetchResultado({
      codeleccion,
      candidatura,
      departamento: departamentoId,
      municipio: municipioId,
    });
    if (existente && mismosResultados(existente.payload, payload)) {
      await deps.renovarSnapshot(existente.id);
    } else {
      await deps.guardarSnapshot({
        eleccionId,
        departamentoId,
        municipioId,
        candidatura,
        payload,
      });
    }
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
