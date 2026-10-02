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
  tipoCandidatura: TipoCandidatura;
};

export type TsjeCandidatoPref = {
  id: number;
  nombre: string;
  votos: number;
};

export type TsjeCandidato = {
  id: number;
  nombre: string;
  siglas: string;
  votos: number;
  candidatosPref: TsjeCandidatoPref[];
};

export type TsjeParams = {
  codeleccion: number;
  candidatura: TipoCandidatura;
  departamento: number;
  distrito: number;
};
