import { bancasDesdeRespuesta } from "../dhondt/bancas";
import { calcularDHondt, DhondtResultado } from "../dhondt/calcular";
import { calcularElectos, ElectoResultado } from "../dhondt/electos";
import { TsjeRespuesta } from "../tsje/types";

export interface DistribucionBanca {
  numLista: string;
  desPartido: string;
  colLista: string;
  bancas: number;
}

export interface ListaConElectos {
  numLista: string;
  desPartido: string;
  colLista: string;
  bancas: number;
  electos: ElectoResultado[];
}

export interface EmpateASortearVista {
  listas: { numLista: string; desPartido: string }[];
  bancas: number;
}

export interface VistaConcejales {
  totales: TsjeRespuesta["totales"];
  bancasTotales: number;
  votosValidos: number;
  mesasEscrutadasPct: number;
  distribucion: DistribucionBanca[];
  dhondt: DhondtResultado;
  listasConElectos: ListaConElectos[];
  empateASortear: EmpateASortearVista | null;
  horaFormated: string;
}

export function construirVistaConcejales(
  respuesta: TsjeRespuesta,
  bancasFallback: number,
): VistaConcejales {
  const { totales } = respuesta;
  const votosValidos = respuesta.candidatos.reduce(
    (sum, c) => sum + c.votos,
    0,
  );
  const bancasTotales =
    bancasDesdeRespuesta(respuesta.candidatos) || bancasFallback;

  const listasParaDHondt = respuesta.candidatos.map((c) => ({
    id: c.numLista,
    votos: c.votos,
  }));
  const dhondt = calcularDHondt(listasParaDHondt, bancasTotales);

  const distribucion: DistribucionBanca[] = respuesta.candidatos
    .map((c) => ({
      numLista: c.numLista,
      desPartido: c.desPartido,
      colLista: c.colLista,
      bancas: dhondt.bancasPorLista[c.numLista] ?? 0,
    }))
    .filter((d) => d.bancas > 0)
    .sort((a, b) => b.bancas - a.bancas);

  const listasConElectos: ListaConElectos[] = respuesta.candidatos
    .map((c) => {
      const bancas = dhondt.bancasPorLista[c.numLista] ?? 0;
      const electos = calcularElectos(c.candidatosPref ?? [], bancas);
      return {
        numLista: c.numLista,
        desPartido: c.desPartido,
        colLista: c.colLista,
        bancas,
        electos,
      };
    })
    .filter((l) => l.bancas > 0)
    .sort((a, b) => b.bancas - a.bancas);

  return {
    totales,
    bancasTotales,
    votosValidos,
    mesasEscrutadasPct:
      totales.totalMesas > 0
        ? (totales.mesasPublicadas / totales.totalMesas) * 100
        : 0,
    distribucion,
    dhondt,
    listasConElectos,
    empateASortear: dhondt.empateASortear && {
      bancas: dhondt.empateASortear.bancas,
      listas: dhondt.empateASortear.listas.map((numLista) => ({
        numLista,
        desPartido:
          respuesta.candidatos.find((c) => c.numLista === numLista)
            ?.desPartido ?? numLista,
      })),
    },
    horaFormated: respuesta.horaFormated,
  };
}
