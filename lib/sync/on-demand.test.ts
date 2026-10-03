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

  describe("visitas simultáneas", () => {
    function pedidoPendiente<T>() {
      let resolver!: (v: T) => void;
      let rechazar!: (e: unknown) => void;
      const promesa = new Promise<T>((res, rej) => {
        resolver = res;
        rechazar = rej;
      });
      return { promesa, resolver, rechazar };
    }

    it("dos visitas con el snapshot vencido comparten un único pedido al TSJE", async () => {
      const snapshotViejo = snapshotSincronizadoHace(30);
      const snapshotNuevo = snapshotSincronizadoHace(0, 2);
      const obtenerSnapshotExistente = vi
        .fn()
        .mockResolvedValueOnce(snapshotViejo)
        .mockResolvedValueOnce(snapshotViejo)
        .mockResolvedValue(snapshotNuevo);
      const tsje = pedidoPendiente<TsjeRespuesta>();
      const fetchResultado = vi.fn().mockReturnValue(tsje.promesa);
      const guardarSnapshot = vi.fn().mockResolvedValue(undefined);
      const deps = { obtenerSnapshotExistente, fetchResultado, guardarSnapshot, ahora };

      const visitaA = obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, deps);
      const visitaB = obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, deps);
      tsje.resolver(respuestaFalsa);

      expect(await visitaA).toBe(snapshotNuevo);
      expect(await visitaB).toBe(snapshotNuevo);
      expect(fetchResultado).toHaveBeenCalledTimes(1);
      expect(guardarSnapshot).toHaveBeenCalledTimes(1);
    });

    it("combinaciones distintas no comparten el pedido", async () => {
      const obtenerSnapshotExistente = vi.fn().mockResolvedValue(null);
      const fetchResultado = vi.fn().mockResolvedValue(respuestaFalsa);
      const guardarSnapshot = vi.fn().mockResolvedValue(undefined);
      const deps = { obtenerSnapshotExistente, fetchResultado, guardarSnapshot, ahora };

      await Promise.all([
        obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, deps),
        obtenerOSincronizarSnapshot(1, 44, 11, 13, 2, deps),
      ]);

      expect(fetchResultado).toHaveBeenCalledTimes(2);
    });

    it("al terminar el pedido se libera: la siguiente visita con snapshot vencido vuelve a consultar", async () => {
      const snapshotViejo = snapshotSincronizadoHace(30);
      const obtenerSnapshotExistente = vi.fn().mockResolvedValue(snapshotViejo);
      const fetchResultado = vi.fn().mockResolvedValue(respuestaFalsa);
      const guardarSnapshot = vi.fn().mockResolvedValue(undefined);
      const deps = { obtenerSnapshotExistente, fetchResultado, guardarSnapshot, ahora };

      await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, deps);
      await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, deps);

      expect(fetchResultado).toHaveBeenCalledTimes(2);
    });

    it("si el pedido compartido falla, ambas visitas reciben el snapshot viejo y el pedido se libera", async () => {
      const snapshotViejo = snapshotSincronizadoHace(30);
      const obtenerSnapshotExistente = vi.fn().mockResolvedValue(snapshotViejo);
      const tsje = pedidoPendiente<TsjeRespuesta>();
      const fetchResultado = vi
        .fn()
        .mockReturnValueOnce(tsje.promesa)
        .mockResolvedValue(respuestaFalsa);
      const guardarSnapshot = vi.fn().mockResolvedValue(undefined);
      const deps = { obtenerSnapshotExistente, fetchResultado, guardarSnapshot, ahora };

      const visitaA = obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, deps);
      const visitaB = obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, deps);
      tsje.rechazar(new Error("TSJE timeout"));

      expect(await visitaA).toBe(snapshotViejo);
      expect(await visitaB).toBe(snapshotViejo);
      expect(fetchResultado).toHaveBeenCalledTimes(1);

      await obtenerOSincronizarSnapshot(1, 44, 11, 13, 1, deps);
      expect(fetchResultado).toHaveBeenCalledTimes(2);
    });
  });
});
