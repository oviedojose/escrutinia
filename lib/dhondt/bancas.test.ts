import { describe, it, expect } from "vitest";
import { bancasPorDefecto, bancasDesdeRespuesta } from "./bancas";

describe("bancasPorDefecto", () => {
  it("returns 24 for Asunción (departamento 0, municipio 0)", () => {
    expect(bancasPorDefecto(0, 0)).toBe(24);
  });

  it("returns 12 for any other municipio", () => {
    expect(bancasPorDefecto(11, 13)).toBe(12);
    expect(bancasPorDefecto(0, 5)).toBe(12);
  });
});

describe("bancasDesdeRespuesta", () => {
  it("reads the seat count from candidatosPref, e.g. 9 candidatos means 9 bancas (Yguazú)", () => {
    const candidatos = [
      { candidatosPref: Array(9).fill({}) },
      { candidatosPref: Array(9).fill({}) },
    ];
    expect(bancasDesdeRespuesta(candidatos)).toBe(9);
  });

  it("takes the max across listas to tolerate one lista not publishing its full nómina yet", () => {
    const candidatos = [
      { candidatosPref: Array(12).fill({}) },
      { candidatosPref: [] },
    ];
    expect(bancasDesdeRespuesta(candidatos)).toBe(12);
  });

  it("returns 0 when no lista has candidatosPref (e.g. intendente responses, where it's always null)", () => {
    const candidatos = [{ candidatosPref: null }, { candidatosPref: null }];
    expect(bancasDesdeRespuesta(candidatos)).toBe(0);
  });
});
