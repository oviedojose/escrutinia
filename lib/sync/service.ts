import type { TipoCandidatura, TsjeParams, TsjeRespuesta } from "../tsje/types";

export interface SyncTarget {
  departamentoId: number;
  municipioId: number;
  candidatura: TipoCandidatura;
}

export interface SyncDeps {
  fetchResultado: (params: TsjeParams) => Promise<TsjeRespuesta>;
  guardarSnapshot: (input: {
    eleccionId: number;
    departamentoId: number;
    municipioId: number;
    candidatura: TipoCandidatura;
    payload: TsjeRespuesta;
  }) => Promise<void>;
  concurrency?: number;
}

export interface SyncResultado {
  exitosos: number;
  fallidos: { target: SyncTarget; error: string }[];
}

export async function ejecutarSync(
  eleccionId: number,
  codeleccion: number,
  targets: SyncTarget[],
  deps: SyncDeps,
): Promise<SyncResultado> {
  const concurrency = deps.concurrency ?? 5;
  const fallidos: SyncResultado["fallidos"] = [];
  let exitosos = 0;

  for (let i = 0; i < targets.length; i += concurrency) {
    const batch = targets.slice(i, i + concurrency);
    await Promise.all(
      batch.map(async (target) => {
        try {
          const payload = await deps.fetchResultado({
            codeleccion,
            candidatura: target.candidatura,
            departamento: target.departamentoId,
            municipio: target.municipioId,
          });
          await deps.guardarSnapshot({
            eleccionId,
            departamentoId: target.departamentoId,
            municipioId: target.municipioId,
            candidatura: target.candidatura,
            payload,
          });
          exitosos++;
        } catch (err) {
          fallidos.push({
            target,
            error: err instanceof Error ? err.message : String(err),
          });
        }
      }),
    );
  }

  return { exitosos, fallidos };
}
