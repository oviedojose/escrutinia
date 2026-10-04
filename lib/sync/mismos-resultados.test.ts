import { describe, it, expect } from "vitest";
import { mismosResultados } from "./mismos-resultados";
import type { TsjeRespuesta } from "../tsje/types";
import concejalesSample from "../tsje/__fixtures__/concejales-sample.json";

const base = concejalesSample as unknown as TsjeRespuesta;

function clonar(): TsjeRespuesta {
  return structuredClone(base);
}

/** Copia profunda con las claves de cada objeto en orden inverso. */
function invertirClaves<T>(valor: T): T {
  if (Array.isArray(valor)) {
    return valor.map(invertirClaves) as T;
  }
  if (valor !== null && typeof valor === "object") {
    return Object.fromEntries(
      Object.entries(valor)
        .reverse()
        .map(([k, v]) => [k, invertirClaves(v)]),
    ) as T;
  }
  return valor;
}

describe("mismosResultados", () => {
  it("considera iguales dos respuestas idénticas", () => {
    expect(mismosResultados(base, clonar())).toBe(true);
  });

  it("ignora el orden de las claves (Postgres lo reordena en jsonb)", () => {
    expect(mismosResultados(base, invertirClaves(clonar()))).toBe(true);
  });

  it("ignora la hora de la respuesta", () => {
    const otra = clonar();
    otra.horaFormated = "16-06-2026 23:59:59";
    expect(mismosResultados(base, otra)).toBe(true);
  });

  it("detecta un cambio en los totales", () => {
    const otra = clonar();
    otra.totales.mesasPublicadas -= 1;
    expect(mismosResultados(base, otra)).toBe(false);
  });

  it("detecta un cambio en los votos de una lista", () => {
    const otra = clonar();
    otra.candidatos[0].votos += 1;
    expect(mismosResultados(base, otra)).toBe(false);
  });

  it("detecta un cambio en los votos preferenciales", () => {
    const otra = clonar();
    otra.candidatos[0].candidatosPref![0].votos += 1;
    expect(mismosResultados(base, otra)).toBe(false);
  });
});
