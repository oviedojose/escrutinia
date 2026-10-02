export interface CandidatoPref {
  nomCandidato: string;
  votos: number;
  ordCandidato: number;
}

export interface ElectoResultado extends CandidatoPref {
  estado: "electo" | "suplente";
  ordenSuplente: number | null;
}

export function calcularElectos(candidatos: CandidatoPref[], bancas: number): ElectoResultado[] {
  const ordenados = [...candidatos].sort((a, b) => b.votos - a.votos);

  return ordenados.map((c, idx) => ({
    ...c,
    estado: idx < bancas ? "electo" : "suplente",
    ordenSuplente: idx < bancas ? null : idx - bancas + 1,
  }));
}
