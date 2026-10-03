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

  it("si dos candidatos empatan en votos, gana el mejor ubicado en la lista original (art. 258)", () => {
    const candidatos = [
      { nomCandidato: "Tercero en la lista", votos: 500, ordCandidato: 3 },
      { nomCandidato: "Primero en la lista", votos: 500, ordCandidato: 1 },
      { nomCandidato: "Más votado", votos: 900, ordCandidato: 2 },
    ];

    const resultado = calcularElectos(candidatos, 2);

    expect(resultado.map((r) => r.nomCandidato)).toEqual([
      "Más votado",
      "Primero en la lista",
      "Tercero en la lista",
    ]);
    expect(resultado[2].estado).toBe("suplente");
  });

  it("candidatos sin votos preferenciales quedan en el orden original de la lista", () => {
    const candidatos = [
      { nomCandidato: "C", votos: 0, ordCandidato: 3 },
      { nomCandidato: "A", votos: 0, ordCandidato: 1 },
      { nomCandidato: "B", votos: 0, ordCandidato: 2 },
    ];

    const resultado = calcularElectos(candidatos, 3);

    expect(resultado.map((r) => r.nomCandidato)).toEqual(["A", "B", "C"]);
  });
});

