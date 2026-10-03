import { describe, it, expect } from "vitest";
import { validarRespuestaTsje } from "./validar";
import intendenteSample from "./__fixtures__/intendente-sample.json";
import concejalesSample from "./__fixtures__/concejales-sample.json";

function clonar<T>(v: T): T {
  return structuredClone(v);
}

describe("validarRespuestaTsje", () => {
  it("acepta una respuesta real de intendente (candidatosPref null)", () => {
    expect(validarRespuestaTsje(clonar(intendenteSample))).toBeTruthy();
  });

  it("acepta una respuesta real de concejales (con candidatosPref)", () => {
    expect(validarRespuestaTsje(clonar(concejalesSample))).toBeTruthy();
  });

  it("rechaza algo que no es un objeto (p. ej. HTML de Sucuri)", () => {
    expect(() => validarRespuestaTsje("<html>")).toThrow("formato inesperado");
    expect(() => validarRespuestaTsje(null)).toThrow("formato inesperado");
  });

  it("rechaza si faltan los totales", () => {
    const data = clonar(intendenteSample) as Record<string, unknown>;
    delete data.totales;
    expect(() => validarRespuestaTsje(data)).toThrow("totales");
  });

  it("rechaza un total que no es número", () => {
    const data = clonar(intendenteSample);
    (data.totales as Record<string, unknown>).totalVotos = "132736";
    expect(() => validarRespuestaTsje(data)).toThrow("totales.totalVotos");
  });

  it("rechaza un tipCandidatura desconocido", () => {
    const data = clonar(intendenteSample);
    (data.totales as Record<string, unknown>).tipCandidatura = 3;
    expect(() => validarRespuestaTsje(data)).toThrow("tipCandidatura");
  });

  it("rechaza un candidato sin votos", () => {
    const data = clonar(intendenteSample);
    delete (data.candidatos[0] as Record<string, unknown>).votos;
    expect(() => validarRespuestaTsje(data)).toThrow("candidatos[0].votos");
  });

  it("rechaza un candidato preferencial mal formado", () => {
    const data = clonar(concejalesSample);
    const prefs = data.candidatos[0].candidatosPref as Record<string, unknown>[];
    prefs[1].ordCandidato = null;
    expect(() => validarRespuestaTsje(data)).toThrow(
      "candidatos[0].candidatosPref[1].ordCandidato",
    );
  });

  it("rechaza si falta horaFormated", () => {
    const data = clonar(intendenteSample) as Record<string, unknown>;
    delete data.horaFormated;
    expect(() => validarRespuestaTsje(data)).toThrow("horaFormated");
  });
});
