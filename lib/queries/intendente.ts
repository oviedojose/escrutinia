import { TsjeRespuesta } from "../tsje/types";

export interface CandidatoIntendenteVista {
  numLista: string;
  nomCandidato: string;
  desPartido: string;
  colLista: string;
  votos: number;
  pctVotos: number;
  esGanador: boolean;
}

export interface VistaIntendente {
  totales: TsjeRespuesta["totales"];
  mesasEscrutadasPct: number;
  candidatos: CandidatoIntendenteVista[];
  horaFormated: string;
}

export function construirVistaIntendente(
  respuesta: TsjeRespuesta,
): VistaIntendente {
  const { totales } = respuesta;
  const totalVotosValidos = respuesta.candidatos.reduce(
    (sum, c) => sum + c.votos,
    0,
  );

  const candidatos = [...respuesta.candidatos]
    .sort((a, b) => b.votos - a.votos)
    .map((c, idx) => ({
      numLista: c.numLista,
      nomCandidato: c.nomCandidato,
      desPartido: c.desPartido,
      colLista: c.colLista,
      votos: c.votos,
      pctVotos: totalVotosValidos > 0 ? (c.votos / totalVotosValidos) * 100 : 0,
      esGanador: idx === 0 && totalVotosValidos > 0,
    }));

  return {
    totales,
    mesasEscrutadasPct:
      totales.totalMesas > 0
        ? (totales.mesasPublicadas / totales.totalMesas) * 100
        : 0,
    candidatos,
    horaFormated: respuesta.horaFormated,
  };
}
