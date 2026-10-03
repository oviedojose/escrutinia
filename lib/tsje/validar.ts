import type { TsjeRespuesta } from "./types";

/**
 * Valida en runtime que la respuesta del TSJE tenga la forma de TsjeRespuesta
 * antes de guardarla como snapshot. Si el TSJE cambia el formato (o Sucuri
 * devuelve otra cosa con 200), preferimos que falle acá -- on-demand lo trata
 * como un error del TSJE y sigue mostrando el último snapshot válido -- en
 * lugar de persistir un payload roto que explote recién al renderizar.
 */
export function validarRespuestaTsje(data: unknown): TsjeRespuesta {
  if (!esObjeto(data)) {
    throw errorFormato("la respuesta no es un objeto");
  }

  const { totales, candidatos, horaFormated } = data;

  if (!esObjeto(totales)) {
    throw errorFormato("falta `totales`");
  }
  for (const campo of [
    "totalMesas",
    "mesasPublicadas",
    "blancos",
    "nulos",
    "totalVotos",
    "canElectores",
    "canElectoresPublicados",
    "nocomputados",
  ]) {
    if (!esNumero(totales[campo])) {
      throw errorFormato(`totales.${campo} no es un número`);
    }
  }
  if (totales.tipCandidatura !== 1 && totales.tipCandidatura !== 2) {
    throw errorFormato("totales.tipCandidatura no es 1 ni 2");
  }

  if (!Array.isArray(candidatos)) {
    throw errorFormato("`candidatos` no es un array");
  }
  candidatos.forEach((c, i) => validarCandidato(c, `candidatos[${i}]`));

  if (typeof horaFormated !== "string") {
    throw errorFormato("`horaFormated` no es un string");
  }

  return data as TsjeRespuesta;
}

function validarCandidato(c: unknown, ruta: string): void {
  if (!esObjeto(c)) {
    throw errorFormato(`${ruta} no es un objeto`);
  }
  for (const campo of [
    "numLista",
    "nomCandidato",
    "desPartido",
    "colLista",
    "imgCandidato",
  ]) {
    if (typeof c[campo] !== "string") {
      throw errorFormato(`${ruta}.${campo} no es un string`);
    }
  }
  for (const campo of ["orden", "votos"]) {
    if (!esNumero(c[campo])) {
      throw errorFormato(`${ruta}.${campo} no es un número`);
    }
  }

  const prefs = c.candidatosPref;
  if (prefs === null) {
    return;
  }
  if (!Array.isArray(prefs)) {
    throw errorFormato(`${ruta}.candidatosPref no es un array ni null`);
  }
  prefs.forEach((p, i) => {
    const rutaPref = `${ruta}.candidatosPref[${i}]`;
    if (!esObjeto(p)) {
      throw errorFormato(`${rutaPref} no es un objeto`);
    }
    if (typeof p.nomCandidato !== "string") {
      throw errorFormato(`${rutaPref}.nomCandidato no es un string`);
    }
    for (const campo of ["votos", "ordCandidato"]) {
      if (!esNumero(p[campo])) {
        throw errorFormato(`${rutaPref}.${campo} no es un número`);
      }
    }
  });
}

function esObjeto(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function esNumero(v: unknown): v is number {
  return typeof v === "number" && Number.isFinite(v);
}

function errorFormato(detalle: string): Error {
  return new Error(`Respuesta del TSJE con formato inesperado: ${detalle}`);
}
