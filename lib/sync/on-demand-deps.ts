import { db } from "../db/client";
import { resultadosSnapshot } from "../db/schema";
import { obtenerUltimoSnapshot } from "../queries/snapshots";
import { fetchResultadoTsje } from "../tsje/client";
import type { DepsSincronizacionOnDemand } from "./on-demand";

export const depsSincronizacionOnDemandReales: DepsSincronizacionOnDemand = {
  obtenerSnapshotExistente: obtenerUltimoSnapshot,
  fetchResultado: fetchResultadoTsje,
  guardarSnapshot: async (input) => {
    await db.insert(resultadosSnapshot).values({
      eleccionId: input.eleccionId,
      departamentoId: input.departamentoId,
      municipioId: input.municipioId,
      candidatura: input.candidatura,
      payload: input.payload,
      horaTsje: input.payload.horaFormated,
    });
  },
};
