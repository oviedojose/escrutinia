import { describe, it, expect, vi } from "vitest";
import { ejecutarSync } from "./service";
import type { TsjeRespuesta } from "../tsje/types";

const fakeRespuesta = (votos: number): TsjeRespuesta => ({
  totales: {
    totalMesas: 1,
    mesasPublicadas: 1,
    blancos: 0,
    nulos: 0,
    totalVotos: votos,
    canElectores: votos,
    canElectoresPublicados: votos,
    nocomputados: 0,
    tipCandidatura: 1,
  },
  candidatos: [],
  horaFormated: "16-06-2026 15:40:03",
});

describe("ejecutarSync", () => {
  it("fetches every target and stores a snapshot for each", async () => {
    const fetchResultado = vi.fn().mockResolvedValue(fakeRespuesta(100));
    const guardarSnapshot = vi.fn().mockResolvedValue(undefined);

    const targets = [
      { departamentoId: 0, municipioId: 0, candidatura: 1 as const },
      { departamentoId: 11, municipioId: 13, candidatura: 2 as const },
    ];

    const resultado = await ejecutarSync(1, 44, targets, {
      fetchResultado,
      guardarSnapshot,
    });

    expect(resultado.exitosos).toBe(2);
    expect(resultado.fallidos).toEqual([]);
    expect(fetchResultado).toHaveBeenCalledWith({
      codeleccion: 44,
      candidatura: 1,
      departamento: 0,
      municipio: 0,
    });
    expect(guardarSnapshot).toHaveBeenCalledWith(
      expect.objectContaining({
        eleccionId: 1,
        departamentoId: 0,
        municipioId: 0,
        candidatura: 1,
      }),
    );
  });

  it("collects failures without stopping the rest of the batch", async () => {
    const fetchResultado = vi
      .fn()
      .mockResolvedValueOnce(fakeRespuesta(100))
      .mockRejectedValueOnce(new Error("timeout"));
    const guardarSnapshot = vi.fn().mockResolvedValue(undefined);

    const targets = [
      { departamentoId: 0, municipioId: 0, candidatura: 1 as const },
      { departamentoId: 0, municipioId: 1, candidatura: 1 as const },
    ];

    const resultado = await ejecutarSync(1, 44, targets, {
      fetchResultado,
      guardarSnapshot,
    });

    expect(resultado.exitosos).toBe(1);
    expect(resultado.fallidos).toHaveLength(1);
    expect(resultado.fallidos[0].error).toBe("timeout");
  });

  it("respects the concurrency limit by batching", async () => {
    let enVuelo = 0;
    let maxEnVuelo = 0;
    const fetchResultado = vi.fn().mockImplementation(async () => {
      enVuelo++;
      maxEnVuelo = Math.max(maxEnVuelo, enVuelo);
      await new Promise((r) => setTimeout(r, 5));
      enVuelo--;
      return fakeRespuesta(1);
    });
    const guardarSnapshot = vi.fn().mockResolvedValue(undefined);

    const targets = Array.from({ length: 10 }, (_, i) => ({
      departamentoId: 0,
      municipioId: i,
      candidatura: 1 as const,
    }));

    await ejecutarSync(1, 44, targets, {
      fetchResultado,
      guardarSnapshot,
      concurrency: 3,
    });

    expect(maxEnVuelo).toBeLessThanOrEqual(3);
  });
});
