import type { TsjeCandidato } from "../tsje/types";

const ASUNCION_DEPARTAMENTO_ID = 0;
const ASUNCION_MUNICIPIO_ID = 0;

/**
 * Fallback cuando la respuesta del TSJE todavía no trae candidatosPref para
 * ninguna lista (ver bancasDesdeRespuesta) — no verificado contra la
 * clasificación oficial, ver spec (escrutinia-vista-general, Sección 8).
 */
export function bancasPorDefecto(departamentoId: number, municipioId: number): number {
  if (departamentoId === ASUNCION_DEPARTAMENTO_ID && municipioId === ASUNCION_MUNICIPIO_ID) {
    return 24;
  }
  return 12;
}

/**
 * El TSJE hace postular a cada lista exactamente tantos candidatos
 * (candidatosPref) como bancas hay para repartir en ese municipio —
 * confirmado inspeccionando respuestas reales (24 en Asunción, 12 en la
 * mayoría de municipios, 9 en Yguazú, etc., siempre igual entre listas de
 * un mismo municipio). Tomamos el máximo entre listas para tolerar alguna
 * lista que todavía no publicó su nómina completa; 0 si ninguna la trae.
 */
export function bancasDesdeRespuesta(candidatos: Pick<TsjeCandidato, "candidatosPref">[]): number {
  return candidatos.reduce((max, c) => Math.max(max, c.candidatosPref?.length ?? 0), 0);
}
