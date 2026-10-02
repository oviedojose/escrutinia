import { describe, it, expect } from "vitest";
import { calcularDHondt } from "./calcular";

describe("calcularDHondt", () => {
  it("matches the worked example from the design mockup (Lambaré, 12 bancas, 4 listas)", () => {
    const listas = [
      { id: "HONOR COLORADO A", votos: 18420 },
      { id: "PLRA", votos: 14110 },
      { id: "HONOR COLORADO P", votos: 6870 },
      { id: "MOVIMIENTO INDEPENDIENTE", votos: 3210 },
    ];

    const resultado = calcularDHondt(listas, 12);

    expect(resultado.bancasPorLista).toEqual({
      "HONOR COLORADO A": 5,
      PLRA: 4,
      "HONOR COLORADO P": 2,
      "MOVIMIENTO INDEPENDIENTE": 1,
    });
  });

  it("assigns quotient rank (orden) matching the mockup's D'Hondt table", () => {
    const listas = [
      { id: "A", votos: 18420 },
      { id: "PLRA", votos: 14110 },
      { id: "P", votos: 6870 },
      { id: "IND", votos: 3210 },
    ];

    const resultado = calcularDHondt(listas, 12);
    const ordenPorListaYDivisor = (listaId: string, divisor: number) =>
      resultado.cocientes.find((c) => c.listaId === listaId && c.divisor === divisor)?.orden;

    expect(ordenPorListaYDivisor("A", 1)).toBe(1);
    expect(ordenPorListaYDivisor("PLRA", 1)).toBe(2);
    expect(ordenPorListaYDivisor("A", 2)).toBe(3);
    expect(ordenPorListaYDivisor("IND", 1)).toBe(12);
    expect(ordenPorListaYDivisor("A", 6)).toBeNull();
  });

  it("throws when bancas is less than 1", () => {
    expect(() => calcularDHondt([{ id: "A", votos: 100 }], 0)).toThrow();
  });

  it("awards no seats when every lista has 0 votos (first sync, before any votes are counted)", () => {
    const listas = [
      { id: "A", votos: 0 },
      { id: "B", votos: 0 },
    ];

    const resultado = calcularDHondt(listas, 5);

    expect(resultado.bancasPorLista).toEqual({ A: 0, B: 0 });
    expect(resultado.cocientes.every((c) => c.orden === null)).toBe(true);
  });
});
