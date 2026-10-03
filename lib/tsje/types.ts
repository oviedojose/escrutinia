export type TipoCandidatura = 1 | 2; // 1 = Intendencia, 2 = Junta Municipal

export type TsjeTotales = {
  totalMesas: number;
  mesasPublicadas: number;
  blancos: number;
  nulos: number;
  totalVotos: number;
  canElectores: number;
  canElectoresPublicados: number;
  nocomputados: number;
  tipCandidatura: TipoCandidatura;
};

export type TsjeCandidatoPref = {
  orden: number;
  numLista: string;
  nomCandidato: string;
  desPartido: string;
  colLista: string;
  votos: number;
  ordCandidato: number;
};

export type TsjeCandidato = {
  orden: number;
  numLista: string;
  nomCandidato: string;
  desPartido: string;
  colLista: string;
  votos: number;
  imgCandidato: string;
  candidatosPref: TsjeCandidatoPref[] | null;
};

export type TsjeParams = {
  codeleccion: number;
  candidatura: TipoCandidatura;
  departamento: number;
  municipio: number;
};

export type TsjeRespuesta = {
  totales: TsjeTotales;
  candidatos: TsjeCandidato[];
  horaFormated: string;
};
