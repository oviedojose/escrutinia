import { describe, it, expect } from "vitest";
import { calcularElectos } from "./electos";

describe("calcularElectos", () => {
  it("ranks by votos and marks the first N as electo, the rest as suplente", () => {
    const candidatos = [
      { nomCandidato: "Diego Cabrera", votos: 3200, ordCandidato: 1 },
      { nomCandidato: "Laura Benítez", votos: 2870, ordCandidato: 2 },
      { nomCandidato: "Hugo Duarte", votos: 2450, ordCandidato: 3 },
      { nomCandidato: "Silvia Rolón", votos: 2100, ordCandidato: 4 },
      { nomCandidato: "Pedro Aquino", votos: 1980, ordCandidato: 5 },
      { nomCandidato: "Norma Chávez", votos: 1500, ordCandidato: 6 },
    ];

    const resultado = calcularElectos(candidatos, 5);

    expect(resultado.slice(0, 5).every((r) => r.estado === "electo")).toBe(true);
    expect(resultado[5]).toEqual({
      nomCandidato: "Norma Chávez",
      votos: 1500,
      ordCandidato: 6,
      estado: "suplente",
      ordenSuplente: 1,
    });
  });

  it("sorts by votos even if input is not pre-sorted", () => {
    const candidatos = [
      { nomCandidato: "B", votos: 100, ordCandidato: 2 },
      { nomCandidato: "A", votos: 500, ordCandidato: 1 },
    ];

    const resultado = calcularElectos(candidatos, 1);

    expect(resultado[0].nomCandidato).toBe("A");
    expect(resultado[0].estado).toBe("electo");
    expect(resultado[1].nomCandidato).toBe("B");
    expect(resultado[1].ordenSuplente).toBe(1);
  });
});
