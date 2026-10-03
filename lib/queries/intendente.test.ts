import { describe, it, expect } from "vitest";
import { construirVistaIntendente } from "./intendente";
import type { TsjeRespuesta } from "../tsje/types";

const respuesta: TsjeRespuesta = {
  totales: {
    totalMesas: 220,
    mesasPublicadas: 191,
    blancos: 612,
    nulos: 88,
    totalVotos: 45230,
    canElectores: 66150,
    canElectoresPublicados: 66150,
    nocomputados: 0,
    tipCandidatura: 1,
  },
  candidatos: [
    {
      orden: 1,
      numLista: "2",
      nomCandidato: "Marta Insfrán",
      desPartido: "HONOR COLORADO",
      colLista: "220, 20, 60",
      votos: 18420,
      imgCandidato: "",
      candidatosPref: null,
    },
    {
      orden: 2,
      numLista: "3",
      nomCandidato: "Rubén Fariña",
      desPartido: "PLRA",
      colLista: "30, 60, 150",
      votos: 14110,
      imgCandidato: "",
      candidatosPref: null,
    },
    {
      orden: 3,
      numLista: "17",
      nomCandidato: "Celso Ayala",
      desPartido: "MOVIMIENTO INDEPENDIENTE",
      colLista: "150, 100, 200",
      votos: 3210,
      imgCandidato: "",
      candidatosPref: null,
    },
  ],
  horaFormated: "16-06-2026 15:40:03",
};

describe("construirVistaIntendente", () => {
  it("computes mesas percentage and orders candidatos by votos descending", () => {
    const vista = construirVistaIntendente(respuesta);

    expect(vista.mesasEscrutadasPct).toBeCloseTo(86.8, 1);
    expect(vista.candidatos[0].nomCandidato).toBe("Marta Insfrán");
    expect(vista.candidatos[0].pctVotos).toBeCloseTo(51.5, 1);
    expect(vista.candidatos[0].esGanador).toBe(true);
    expect(vista.candidatos[1].esGanador).toBe(false);
  });

  it("does not flag any candidato as esGanador when all candidatos have 0 votos (first sync)", () => {
    const respuestaSinVotos: TsjeRespuesta = {
      ...respuesta,
      candidatos: respuesta.candidatos.map((c) => ({ ...c, votos: 0 })),
    };

    const vista = construirVistaIntendente(respuestaSinVotos);

    expect(vista.candidatos.every((c) => !c.esGanador)).toBe(true);
  });
});
