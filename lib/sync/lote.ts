import type { TipoCandidatura } from "../tsje/types";

export interface ObjetivoSync {
  departamentoId: number;
  municipioId: number;
  candidatura: TipoCandidatura;
}

/** Capital, Central y Alto Paraná, en ese orden; el resto va después por id. */
export const DEPARTAMENTOS_PRIORITARIOS = [0, 11, 10];

/**
 * Todas las combinaciones municipio × candidatura, primero las de los
 * departamentos prioritarios. Intendente y Junta de un mismo municipio quedan
 * juntos, así un corte a mitad de camino deja municipios completos.
 */
export function ordenarObjetivos(
  municipios: { departamentoId: number; id: number }[],
): ObjetivoSync[] {
  const prioridad = (departamentoId: number) => {
    const i = DEPARTAMENTOS_PRIORITARIOS.indexOf(departamentoId);
    return i === -1 ? DEPARTAMENTOS_PRIORITARIOS.length : i;
  };
  return [...municipios]
    .sort(
      (a, b) =>
        prioridad(a.departamentoId) - prioridad(b.departamentoId) ||
        a.departamentoId - b.departamentoId ||
        a.id - b.id,
    )
    .flatMap((m) =>
      ([1, 2] as const).map((candidatura) => ({
        departamentoId: m.departamentoId,
        municipioId: m.id,
        candidatura,
      })),
    );
}

export interface DepsLote {
  /** True si el último snapshot ya es final: no hace falta pedirlo de nuevo. */
  esFinal: (objetivo: ObjetivoSync) => Promise<boolean>;
  /** Trae el resultado del TSJE y lo guarda. Lanza si el TSJE falla. */
  sincronizar: (objetivo: ObjetivoSync) => Promise<"nuevo" | "igual">;
  esperar: (ms: number) => Promise<void>;
  log?: (mensaje: string) => void;
}

export interface OpcionesLote {
  /** Pausa entre un pedido al TSJE y el siguiente. */
  pausaMs: number;
  /** Pausa más larga después de un fallo, por si el TSJE está saturado. */
  pausaTrasFalloMs: number;
  /** Fallos seguidos tras los que se corta el lote para no insistir. */
  maxFallosSeguidos: number;
}

export interface ResultadoLote {
  nuevos: number;
  iguales: number;
  omitidos: number;
  fallidos: { objetivo: ObjetivoSync; error: string }[];
  cortado: boolean;
}

/**
 * Sincroniza los objetivos de a uno, en serie y con pausa entre pedidos, para
 * no cargar al TSJE. Omite los que ya son finales, así se puede volver a
 * correr después de un corte sin repetir pedidos.
 */
export async function sincronizarEnLote(
  objetivos: ObjetivoSync[],
  deps: DepsLote,
  opciones: OpcionesLote,
): Promise<ResultadoLote> {
  const log = deps.log ?? (() => {});
  const resultado: ResultadoLote = {
    nuevos: 0,
    iguales: 0,
    omitidos: 0,
    fallidos: [],
    cortado: false,
  };
  let fallosSeguidos = 0;
  let huboPedido = false;

  for (const [i, objetivo] of objetivos.entries()) {
    const etiqueta = `[${i + 1}/${objetivos.length}] dpto ${objetivo.departamentoId} muni ${objetivo.municipioId} cand ${objetivo.candidatura}`;

    if (await deps.esFinal(objetivo)) {
      resultado.omitidos++;
      continue;
    }

    if (huboPedido) {
      await deps.esperar(
        fallosSeguidos > 0 ? opciones.pausaTrasFalloMs : opciones.pausaMs,
      );
    }
    huboPedido = true;

    try {
      const estado = await deps.sincronizar(objetivo);
      if (estado === "nuevo") resultado.nuevos++;
      else resultado.iguales++;
      fallosSeguidos = 0;
      log(`${etiqueta} ${estado}`);
    } catch (err) {
      const error = err instanceof Error ? err.message : String(err);
      resultado.fallidos.push({ objetivo, error });
      fallosSeguidos++;
      log(`${etiqueta} FALLÓ: ${error}`);
      if (fallosSeguidos >= opciones.maxFallosSeguidos) {
        resultado.cortado = true;
        log(`${fallosSeguidos} fallos seguidos: se corta el lote.`);
        break;
      }
    }
  }

  return resultado;
}
