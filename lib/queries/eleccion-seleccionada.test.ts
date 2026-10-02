import { describe, it, expect } from "vitest";
import { resolverEleccionSeleccionada } from "./eleccion-seleccionada";

const elecciones = [
  { codeleccion: 44, activa: true },
  { codeleccion: 45, activa: false },
];

describe("resolverEleccionSeleccionada", () => {
  it("devuelve la elección pedida por el parámetro si existe", () => {
    expect(resolverEleccionSeleccionada(elecciones, "45")).toEqual({ codeleccion: 45, activa: false });
  });

  it("cae a la elección activa si no se pasa parámetro", () => {
    expect(resolverEleccionSeleccionada(elecciones, undefined)).toEqual({ codeleccion: 44, activa: true });
  });

  it("cae a la elección activa si el parámetro no matchea ninguna", () => {
    expect(resolverEleccionSeleccionada(elecciones, "999")).toEqual({ codeleccion: 44, activa: true });
  });

  it("devuelve undefined si no hay elecciones ni activa", () => {
    expect(resolverEleccionSeleccionada([], "44")).toBeUndefined();
  });
});
