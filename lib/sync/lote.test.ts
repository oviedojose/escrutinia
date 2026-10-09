import { describe, it, expect, vi } from "vitest";
import { ordenarObjetivos, sincronizarEnLote, type ObjetivoSync } from "./lote";

const OPCIONES = { pausaMs: 100, pausaTrasFalloMs: 1000, maxFallosSeguidos: 3 };

function objetivos(n: number): ObjetivoSync[] {
  return Array.from({ length: n }, (_, i) => ({
    departamentoId: 1,
    municipioId: i,
    candidatura: 1 as const,
  }));
}

describe("ordenarObjetivos", () => {
  it("pone primero Capital, Central y Alto Paraná, y después el resto por id", () => {
    const orden = ordenarObjetivos([
      { departamentoId: 2, id: 1 },
      { departamentoId: 10, id: 3 },
      { departamentoId: 1, id: 1 },
      { departamentoId: 11, id: 2 },
      { departamentoId: 0, id: 0 },
      { departamentoId: 10, id: 1 },
    ]).filter((o) => o.candidatura === 1);

    expect(orden.map((o) => [o.departamentoId, o.municipioId])).toEqual([
      [0, 0],
      [11, 2],
      [10, 1],
      [10, 3],
      [1, 1],
      [2, 1],
    ]);
  });

  it("deja intendente y junta de un mismo municipio juntos", () => {
    const orden = ordenarObjetivos([
      { departamentoId: 0, id: 0 },
      { departamentoId: 11, id: 1 },
    ]);

    expect(orden.map((o) => [o.departamentoId, o.candidatura])).toEqual([
      [0, 1],
      [0, 2],
      [11, 1],
      [11, 2],
    ]);
  });
});

describe("sincronizarEnLote", () => {
  it("sincroniza en serie, con pausa entre pedidos y no antes del primero", async () => {
    const esperar = vi.fn().mockResolvedValue(undefined);
    const sincronizar = vi
      .fn()
      .mockResolvedValueOnce("nuevo")
      .mockResolvedValueOnce("igual")
      .mockResolvedValueOnce("nuevo");

    const resultado = await sincronizarEnLote(
      objetivos(3),
      { esFinal: async () => false, sincronizar, esperar },
      OPCIONES,
    );

    expect(sincronizar).toHaveBeenCalledTimes(3);
    expect(esperar).toHaveBeenCalledTimes(2);
    expect(esperar).toHaveBeenCalledWith(100);
    expect(resultado).toMatchObject({ nuevos: 2, iguales: 1, cortado: false });
  });

  it("omite los finales sin pedirlos ni esperar", async () => {
    const esperar = vi.fn().mockResolvedValue(undefined);
    const sincronizar = vi.fn().mockResolvedValue("nuevo");

    const resultado = await sincronizarEnLote(
      objetivos(3),
      {
        esFinal: async (o) => o.municipioId !== 1,
        sincronizar,
        esperar,
      },
      OPCIONES,
    );

    expect(sincronizar).toHaveBeenCalledTimes(1);
    expect(esperar).not.toHaveBeenCalled();
    expect(resultado.omitidos).toBe(2);
  });

  it("después de un fallo espera más, y sigue con el siguiente", async () => {
    const esperar = vi.fn().mockResolvedValue(undefined);
    const sincronizar = vi
      .fn()
      .mockRejectedValueOnce(new Error("TSJE respondió 503"))
      .mockResolvedValueOnce("nuevo");

    const resultado = await sincronizarEnLote(
      objetivos(2),
      { esFinal: async () => false, sincronizar, esperar },
      OPCIONES,
    );

    expect(esperar).toHaveBeenCalledWith(1000);
    expect(resultado.fallidos).toHaveLength(1);
    expect(resultado.fallidos[0].error).toBe("TSJE respondió 503");
    expect(resultado.nuevos).toBe(1);
  });

  it("corta el lote tras varios fallos seguidos", async () => {
    const sincronizar = vi.fn().mockRejectedValue(new Error("timeout"));

    const resultado = await sincronizarEnLote(
      objetivos(10),
      {
        esFinal: async () => false,
        sincronizar,
        esperar: vi.fn().mockResolvedValue(undefined),
      },
      OPCIONES,
    );

    expect(sincronizar).toHaveBeenCalledTimes(3);
    expect(resultado.cortado).toBe(true);
  });
});
