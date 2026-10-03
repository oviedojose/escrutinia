import { describe, it, expect, vi } from "vitest";
import { obtenerOSincronizarSnapshot } from "./on-demand";
import type { TsjeRespuesta } from "../tsje/types";
import type { SnapshotRow } from "../queries/snapshots";

const respuestaFalsa: TsjeRespuesta = {
  totales: {
    totalMesas: 10,
    mesasPublicadas: 5,
    blancos: 10,
    nulos: 5,
    totalVotos: 500,
    canElectores: 1000,
    canElectoresPublicados: 1000,
    nocomputados: 0,
    tipCandidatura: 1,
  },
  candidatos: [],
  horaFormated: "25-09-2026 10:00:00",
};

const snapshotGuardado = { id: 1, payload: respuestaFalsa } as unknown as SnapshotRow;

describe("obtenerOSincronizarSnapshot", () => {
  it("si ya existe un snapshot, lo devuelve sin llamar al TSJE", async () => {
    const obtenerSnapshotExistente = vi.fn().mockResolvedValue(snapshotGuardado);
    const fetchResultado = vi.fn();
    const guardarSnapshot = vi.fn();

    const resultado = await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, {
      obtenerSnapshotExistente,
      fetchResultado,
      guardarSnapshot,
    });

    expect(resultado).toBe(snapshotGuardado);
    expect(fetchResultado).not.toHaveBeenCalled();
    expect(guardarSnapshot).not.toHaveBeenCalled();
  });

  it("si no existe, lo trae del TSJE, lo guarda, y devuelve el snapshot recién guardado", async () => {
    const obtenerSnapshotExistente = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(snapshotGuardado);
    const fetchResultado = vi.fn().mockResolvedValue(respuestaFalsa);
    const guardarSnapshot = vi.fn().mockResolvedValue(undefined);

    const resultado = await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, {
      obtenerSnapshotExistente,
      fetchResultado,
      guardarSnapshot,
    });

    expect(fetchResultado).toHaveBeenCalledWith({ codeleccion: 44, candidatura: 1, departamento: 11, distrito: 13 });
    expect(guardarSnapshot).toHaveBeenCalledWith({
      eleccionId: 1,
      departamentoId: 11,
      distritoId: 13,
      candidatura: 1,
      payload: respuestaFalsa,
    });
    expect(obtenerSnapshotExistente).toHaveBeenCalledTimes(2);
    expect(resultado).toBe(snapshotGuardado);
  });

  it("si el TSJE falla, devuelve null en vez de propagar el error", async () => {
    const obtenerSnapshotExistente = vi.fn().mockResolvedValue(null);
    const fetchResultado = vi.fn().mockRejectedValue(new Error("TSJE respondió 403"));
    const guardarSnapshot = vi.fn();

    const resultado = await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, {
      obtenerSnapshotExistente,
      fetchResultado,
      guardarSnapshot,
    });

    expect(resultado).toBeNull();
    expect(guardarSnapshot).not.toHaveBeenCalled();
  });
});
