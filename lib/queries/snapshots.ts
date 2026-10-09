import { and, desc, eq } from "drizzle-orm";
import { resultadosSnapshot } from "../db/schema";
import { db } from "../db/client";
import { TipoCandidatura, TsjeRespuesta } from "../tsje/types";

export interface SnapshotRow {
  id: number;
  eleccionId: number;
  departamentoId: number;
  municipioId: number;
  candidatura: number;
  payload: TsjeRespuesta;
  horaTsje: string;
  sincronizadoEn: Date;
  final: boolean;
}

export async function obtenerUltimoSnapshot(
  eleccionId: number,
  departamentoId: number,
  municipioId: number,
  candidatura: TipoCandidatura,
): Promise<SnapshotRow | null> {
  const rows = await db
    .select()
    .from(resultadosSnapshot)
    .where(
      and(
        eq(resultadosSnapshot.eleccionId, eleccionId),
        eq(resultadosSnapshot.departamentoId, departamentoId),
        eq(resultadosSnapshot.municipioId, municipioId),
        eq(resultadosSnapshot.candidatura, candidatura),
      ),
    )
    .orderBy(desc(resultadosSnapshot.sincronizadoEn))
    .limit(1);

  return (rows[0] as SnapshotRow) ?? null;
}
