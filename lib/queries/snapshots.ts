import { and, desc, eq, sql } from "drizzle-orm";
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

export async function obtenerUltimosSnapshotsPorEleccion(
  eleccionId: number,
  candidatura: TipoCandidatura,
): Promise<SnapshotRow[]> {
  const result = await db.execute(sql`
    SELECT DISTINCT ON (departamento_id, municipio_id)
      id,
      eleccion_id AS "eleccionId",
      departamento_id AS "departamentoId",
      municipio_id AS "municipioId",
      candidatura,
      payload,
      hora_tsje AS "horaTsje",
      sincronizado_en AS "sincronizadoEn"
    FROM resultados_snapshot
    WHERE eleccion_id = ${eleccionId} AND candidatura = ${candidatura}
    ORDER BY departamento_id, municipio_id, sincronizado_en DESC
  `);

  return result.rows as unknown as SnapshotRow[];
}
