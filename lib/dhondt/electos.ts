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
  // Art. 258 del Código Electoral: a igual cantidad de votos preferenciales
  // (incluido cero), decide el orden inicial de la lista.
  const ordenados = [...candidatos].sort(
    (a, b) => b.votos - a.votos || a.ordCandidato - b.ordCandidato,
  );

  return ordenados.map((c, idx) => ({
    ...c,
    estado: idx < bancas ? "electo" : "suplente",
    ordenSuplente: idx < bancas ? null : idx - bancas + 1,
  }));
}
