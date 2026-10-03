import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MunicipioSelector } from "./MunicipioSelector";

const departamentos = [
  { id: 1, nombre: "CONCEPCIÓN" },
  { id: 2, nombre: "SAN PEDRO" },
];

// Los ids de municipio solo son únicos dentro de su departamento. San Pedro
// a propósito no tiene un municipio con id 0 ni 1, para que no se pueda
// acertar de casualidad con un id del departamento anterior.
const municipios = [
  { id: 0, departamentoId: 1, nombre: "CONCEPCIÓN" },
  { id: 1, departamentoId: 1, nombre: "BELÉN" },
  { id: 3, departamentoId: 2, nombre: "ANTEQUERA" },
  { id: 5, departamentoId: 2, nombre: "CHORÉ" },
];

describe("MunicipioSelector", () => {
  it("al cambiar de departamento, elige el primer municipio del departamento nuevo", () => {
    const onChange = vi.fn();
    render(
      <MunicipioSelector
        departamentos={departamentos}
        municipios={municipios}
        departamentoId={1}
        municipioId={1}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Departamento"), {
      target: { value: "2" },
    });

    expect(onChange).toHaveBeenCalledWith(2, 3);
  });

  it("al cambiar de municipio, mantiene el departamento actual", () => {
    const onChange = vi.fn();
    render(
      <MunicipioSelector
        departamentos={departamentos}
        municipios={municipios}
        departamentoId={1}
        municipioId={0}
        onChange={onChange}
      />,
    );

    fireEvent.change(screen.getByLabelText("Distrito"), {
      target: { value: "1" },
    });

    expect(onChange).toHaveBeenCalledWith(1, 1);
  });

  it("solo ofrece los municipios del departamento seleccionado", () => {
    render(
      <MunicipioSelector
        departamentos={departamentos}
        municipios={municipios}
        departamentoId={2}
        municipioId={3}
        onChange={vi.fn()}
      />,
    );

    const opciones = Array.from(
      (screen.getByLabelText("Distrito") as HTMLSelectElement).options,
    ).map((o) => o.textContent);
    expect(opciones).toEqual(["ANTEQUERA", "CHORÉ"]);
  });
});
