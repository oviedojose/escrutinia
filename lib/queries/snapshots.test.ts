import "../db/load-env";
import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { db } from "../db/client";
import { elecciones, resultadosSnapshot } from "../db/schema";
import { eq } from "drizzle-orm";
import { obtenerUltimoSnapshot } from "./snapshots";

describe("snapshot queries", () => {
  let eleccionId: number;

  beforeAll(async () => {
    const [row] = await db
      .insert(elecciones)
      .values({ codeleccion: 999999, nombre: "TEST FIXTURE", activa: false })
      .returning();
    eleccionId = row.id;

    // Inserted as two sequential statements (not a single batched `.values([...])`
    // array) so each row gets its own `sincronizado_en` (Postgres `now()` is
    // transaction-start time, and neon-http's driver runs each awaited query as
    // its own transaction/round trip). A single batched insert gives both rows
    // an identical timestamp, which makes "most recently inserted" undecidable
    // and the ORDER BY ... DESC LIMIT 1 below nondeterministic — confirmed by
    // running it against the real DB.
    await db.insert(resultadosSnapshot).values({
      eleccionId,
      departamentoId: 11,
      municipioId: 13,
      candidatura: 1,
      payload: {
        totales: { totalVotos: 100 },
        candidatos: [],
        horaFormated: "16-06-2026 10:00:00",
      },
      horaTsje: "16-06-2026 10:00:00",
    });

    await db.insert(resultadosSnapshot).values({
      eleccionId,
      departamentoId: 11,
      municipioId: 13,
      candidatura: 1,
      payload: {
        totales: { totalVotos: 200 },
        candidatos: [],
        horaFormated: "16-06-2026 11:00:00",
      },
      horaTsje: "16-06-2026 11:00:00",
    });
  });

  afterAll(async () => {
    await db
      .delete(resultadosSnapshot)
      .where(eq(resultadosSnapshot.eleccionId, eleccionId));
    await db.delete(elecciones).where(eq(elecciones.id, eleccionId));
  });

  it("obtenerUltimoSnapshot returns the most recently inserted row", async () => {
    const snapshot = await obtenerUltimoSnapshot(eleccionId, 11, 13, 1);
    expect(snapshot?.payload.totales.totalVotos).toBe(200);
  });

  it("obtenerUltimoSnapshot returns null when there is no data", async () => {
    const snapshot = await obtenerUltimoSnapshot(eleccionId, 99, 99, 1);
    expect(snapshot).toBeNull();
  });
});
