import type { TsjeRespuesta } from "../tsje/types";

/**
 * True si dos respuestas del TSJE traen los mismos resultados (totales y
 * candidatos). Ignora la hora de la respuesta, que puede cambiar aunque los
 * datos no, y el orden de las claves de los objetos, porque Postgres las
 * reordena al guardar el payload como jsonb.
 */
export function mismosResultados(a: TsjeRespuesta, b: TsjeRespuesta): boolean {
  return (
    serializarOrdenado({ totales: a.totales, candidatos: a.candidatos }) ===
    serializarOrdenado({ totales: b.totales, candidatos: b.candidatos })
  );
}

function serializarOrdenado(valor: unknown): string {
  return JSON.stringify(valor, (_clave, v) =>
    v !== null && typeof v === "object" && !Array.isArray(v)
      ? Object.fromEntries(
          Object.entries(v).sort(([x], [y]) => (x < y ? -1 : x > y ? 1 : 0)),
        )
      : v,
  );
}
