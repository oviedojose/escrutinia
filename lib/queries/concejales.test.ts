import { describe, it, expect } from "vitest";
import { construirVistaConcejales } from "./concejales";
import type { TsjeRespuesta } from "../tsje/types";

const respuesta: TsjeRespuesta = {
  totales: {
    totalMesas: 220, mesasPublicadas: 191, blancos: 0, nulos: 96,
    totalVotos: 42610, canElectores: 66150, canElectoresPublicados: 66150,
    nocomputados: 0, tipCandidatura: 2,
  },
  candidatos: [
    {
      orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "", desPartido: "HONOR COLORADO A",
      colLista: "220,20,60", votos: 18420, imgCandidato: "",
      candidatosPref: [
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Diego Cabrera", desPartido: "", colLista: "", votos: 3200, ordCandidato: 1 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Laura Benítez", desPartido: "", colLista: "", votos: 2870, ordCandidato: 2 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Hugo Duarte", desPartido: "", colLista: "", votos: 2450, ordCandidato: 3 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Silvia Rolón", desPartido: "", colLista: "", votos: 2100, ordCandidato: 4 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Pedro Aquino", desPartido: "", colLista: "", votos: 1980, ordCandidato: 5 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Norma Chávez", desPartido: "", colLista: "", votos: 1500, ordCandidato: 6 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Suplente 2", desPartido: "", colLista: "", votos: 1200, ordCandidato: 7 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Suplente 3", desPartido: "", colLista: "", votos: 1000, ordCandidato: 8 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Suplente 4", desPartido: "", colLista: "", votos: 800, ordCandidato: 9 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Suplente 5", desPartido: "", colLista: "", votos: 600, ordCandidato: 10 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Suplente 6", desPartido: "", colLista: "", votos: 400, ordCandidato: 11 },
        { orden: 1, numLista: "HONOR COLORADO A", nomCandidato: "Suplente 7", desPartido: "", colLista: "", votos: 200, ordCandidato: 12 },
      ],
    },
    { orden: 2, numLista: "PLRA", nomCandidato: "", desPartido: "PLRA", colLista: "30,60,150", votos: 14110, imgCandidato: "", candidatosPref: [] },
    { orden: 3, numLista: "HONOR COLORADO P", nomCandidato: "", desPartido: "HONOR COLORADO P", colLista: "128,128,0", votos: 6870, imgCandidato: "", candidatosPref: [] },
    { orden: 4, numLista: "MOVIMIENTO INDEPENDIENTE", nomCandidato: "", desPartido: "MOVIMIENTO INDEPENDIENTE", colLista: "150,100,200", votos: 3210, imgCandidato: "", candidatosPref: [] },
  ],
  horaFormated: "16-06-2026 15:40:03",
};

describe("construirVistaConcejales", () => {
  it("derives bancasTotales from candidatosPref.length, ignoring the fallback when the response has real data", () => {
    const vista = construirVistaConcejales(respuesta, 99);

    expect(vista.bancasTotales).toBe(12);
  });

  it("falls back to the given value when no lista has candidatosPref (e.g. an incomplete/legacy snapshot)", () => {
    const respuestaSinPref: TsjeRespuesta = {
      ...respuesta,
      candidatos: respuesta.candidatos.map((c) => ({ ...c, candidatosPref: null })),
    };

    const vista = construirVistaConcejales(respuestaSinPref, 9);

    expect(vista.bancasTotales).toBe(9);
  });

  it("reproduces the mockup's seat distribution and electos", () => {
    const vista = construirVistaConcejales(respuesta, 12);

    expect(vista.distribucion).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ numLista: "HONOR COLORADO A", bancas: 5 }),
        expect.objectContaining({ numLista: "PLRA", bancas: 4 }),
        expect.objectContaining({ numLista: "HONOR COLORADO P", bancas: 2 }),
        expect.objectContaining({ numLista: "MOVIMIENTO INDEPENDIENTE", bancas: 1 }),
      ]),
    );

    const listaA = vista.listasConElectos.find((l) => l.numLista === "HONOR COLORADO A");
    expect(listaA?.electos.filter((e) => e.estado === "electo")).toHaveLength(5);
    expect(listaA?.electos.find((e) => e.nomCandidato === "Norma Chávez")).toEqual(
      expect.objectContaining({ estado: "suplente", ordenSuplente: 1 }),
    );
  });

  it("computes votosValidos as the sum of candidato votes, not totales.totalVotos", () => {
    const vista = construirVistaConcejales(respuesta, 12);

    expect(vista.votosValidos).toBe(18420 + 14110 + 6870 + 3210);
  });

  it("computes votosValidos from candidatos even when it differs from totales.totalVotos (e.g. totalVotos also includes blancos/nulos)", () => {
    const respuestaConBlancosYNulos: TsjeRespuesta = {
      ...respuesta,
      totales: { ...respuesta.totales, blancos: 500, nulos: 300, totalVotos: 42610 + 500 + 300 },
    };

    const vista = construirVistaConcejales(respuestaConBlancosYNulos, 12);

    expect(vista.votosValidos).toBe(18420 + 14110 + 6870 + 3210);
    expect(vista.votosValidos).not.toBe(vista.totales.totalVotos);
  });

  it("no informa empate cuando no lo hay", () => {
    expect(construirVistaConcejales(respuesta, 12).empateASortear).toBeNull();
  });

  it("informa un empate a sortear con el nombre del partido de cada lista", () => {
    const respuestaEmpatada: TsjeRespuesta = {
      ...respuesta,
      candidatos: [
        { orden: 1, numLista: "2", nomCandidato: "", desPartido: "PARTIDO A", colLista: "0,0,0", votos: 300, imgCandidato: "", candidatosPref: null },
        { orden: 2, numLista: "7", nomCandidato: "", desPartido: "PARTIDO B", colLista: "0,0,0", votos: 300, imgCandidato: "", candidatosPref: null },
      ],
    };

    const vista = construirVistaConcejales(respuestaEmpatada, 3);

    expect(vista.empateASortear).toEqual({
      bancas: 1,
      listas: [
        { numLista: "2", desPartido: "PARTIDO A" },
        { numLista: "7", desPartido: "PARTIDO B" },
      ],
    });
  });
});

