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
    tipoCandidatura: 1,
  },
  candidatos: [],
  horaFormated: "25-09-2026 10:00:00",
};

const AHORA = new Date("2026-10-03T12:00:00Z");
const ahora = () => AHORA;

function snapshotSincronizadoHace(minutos: number, id = 1): SnapshotRow {
  return {
    id,
    payload: respuestaFalsa,
    sincronizadoEn: new Date(AHORA.getTime() - minutos * 60 * 1000),
  } as unknown as SnapshotRow;
}

describe("obtenerOSincronizarSnapshot", () => {
  it("si el último snapshot tiene menos de 15 minutos, lo devuelve sin llamar al TSJE", async () => {
    const snapshotReciente = snapshotSincronizadoHace(14);
    const obtenerSnapshotExistente = vi.fn().mockResolvedValue(snapshotReciente);
    const fetchResultado = vi.fn();
    const guardarSnapshot = vi.fn();

    const resultado = await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, {
      obtenerSnapshotExistente,
      fetchResultado,
      guardarSnapshot,
      ahora,
    });

    expect(resultado).toBe(snapshotReciente);
    expect(fetchResultado).not.toHaveBeenCalled();
    expect(guardarSnapshot).not.toHaveBeenCalled();
  });

  it("si el último snapshot tiene 15 minutos o más, lo actualiza desde el TSJE", async () => {
    const snapshotViejo = snapshotSincronizadoHace(15);
    const snapshotNuevo = snapshotSincronizadoHace(0, 2);
    const obtenerSnapshotExistente = vi
      .fn()
      .mockResolvedValueOnce(snapshotViejo)
      .mockResolvedValueOnce(snapshotNuevo);
    const fetchResultado = vi.fn().mockResolvedValue(respuestaFalsa);
    const guardarSnapshot = vi.fn().mockResolvedValue(undefined);

    const resultado = await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, {
      obtenerSnapshotExistente,
      fetchResultado,
      guardarSnapshot,
      ahora,
    });

    expect(fetchResultado).toHaveBeenCalledTimes(1);
    expect(guardarSnapshot).toHaveBeenCalledTimes(1);
    expect(resultado).toBe(snapshotNuevo);
  });

  it("si no existe, lo trae del TSJE, lo guarda, y devuelve el snapshot recién guardado", async () => {
    const snapshotNuevo = snapshotSincronizadoHace(0);
    const obtenerSnapshotExistente = vi
      .fn()
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce(snapshotNuevo);
    const fetchResultado = vi.fn().mockResolvedValue(respuestaFalsa);
    const guardarSnapshot = vi.fn().mockResolvedValue(undefined);

    const resultado = await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, {
      obtenerSnapshotExistente,
      fetchResultado,
      guardarSnapshot,
      ahora,
    });

    expect(fetchResultado).toHaveBeenCalledWith({
      codeleccion: 44,
      candidatura: 1,
      departamento: 11,
      municipio: 13,
    });
    expect(guardarSnapshot).toHaveBeenCalledWith({
      eleccionId: 1,
      departamentoId: 11,
      municipioId: 13,
      candidatura: 1,
      payload: respuestaFalsa,
    });
    expect(obtenerSnapshotExistente).toHaveBeenCalledTimes(2);
    expect(resultado).toBe(snapshotNuevo);
  });

  it("si el snapshot está vencido y el TSJE falla, devuelve el último snapshot guardado", async () => {
    const snapshotViejo = snapshotSincronizadoHace(60);
    const obtenerSnapshotExistente = vi.fn().mockResolvedValue(snapshotViejo);
    const fetchResultado = vi.fn().mockRejectedValue(new Error("TSJE respondió 503"));
    const guardarSnapshot = vi.fn();

    const resultado = await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, {
      obtenerSnapshotExistente,
      fetchResultado,
      guardarSnapshot,
      ahora,
    });

    expect(resultado).toBe(snapshotViejo);
    expect(guardarSnapshot).not.toHaveBeenCalled();
  });

  it("si no hay snapshot y el TSJE falla, devuelve null en vez de propagar el error", async () => {
    const obtenerSnapshotExistente = vi.fn().mockResolvedValue(null);
    const fetchResultado = vi.fn().mockRejectedValue(new Error("TSJE respondió 403"));
    const guardarSnapshot = vi.fn();

    const resultado = await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, {
      obtenerSnapshotExistente,
      fetchResultado,
      guardarSnapshot,
      ahora,
    });

    expect(resultado).toBeNull();
    expect(guardarSnapshot).not.toHaveBeenCalled();
  });
});
