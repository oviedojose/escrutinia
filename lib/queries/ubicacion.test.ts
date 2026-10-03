import { describe, it, expect } from "vitest";
import { parsearId, resolverUbicacion } from "./ubicacion";

const municipios = [
  { id: 0, departamentoId: 0 },
  { id: 0, departamentoId: 11 },
  { id: 13, departamentoId: 11 },
];

describe("parsearId", () => {
  it("acepta enteros no negativos", () => {
    expect(parsearId("0")).toBe(0);
    expect(parsearId("13")).toBe(13);
  });

  it("rechaza valores que Number() dejaría pasar como NaN o decimales", () => {
    for (const valor of ["abc", "1.5", "-1", "", " 1", "1e3", "0x10"]) {
      expect(parsearId(valor)).toBeNull();
    }
  });

  it("rechaza parámetros repetidos (array) y ausentes", () => {
    expect(parsearId(["1", "2"])).toBeNull();
    expect(parsearId(undefined)).toBeNull();
  });
});

describe("resolverUbicacion", () => {
  it("resuelve una combinación existente", () => {
    expect(
      resolverUbicacion({ departamento: "11", municipio: "13" }, municipios),
    ).toEqual({ departamentoId: 11, municipioId: 13 });
  });

  it("usa Asunción (0/0) si no vienen parámetros", () => {
    expect(resolverUbicacion({}, municipios)).toEqual({
      departamentoId: 0,
      municipioId: 0,
    });
  });

  it("devuelve null si algún parámetro es inválido", () => {
    expect(
      resolverUbicacion({ departamento: "11", municipio: "abc" }, municipios),
    ).toBeNull();
  });

  it("devuelve null si la combinación no existe", () => {
    expect(
      resolverUbicacion({ departamento: "99", municipio: "99" }, municipios),
    ).toBeNull();
    // el id 13 existe, pero no dentro del departamento 0
    expect(
      resolverUbicacion({ departamento: "0", municipio: "13" }, municipios),
    ).toBeNull();
  });
});
