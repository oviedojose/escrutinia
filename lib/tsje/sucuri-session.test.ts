import { describe, it, expect, vi, beforeEach } from "vitest";
import { obtenerCookieSucuri, invalidarCookieSucuri } from "./sucuri-session";

// Desafío con dificultad 1 (un solo cero hexadecimal): el proof-of-work se
// resuelve en unas pocas iteraciones.
const HTML_DESAFIO = `<script>var _cs = "abc123"; var _cd = 1; var _ce = 42; var _cg = "xyz";</script>`;

function fetchSucuriFalso() {
  return vi.fn<typeof fetch>((_input, init) => {
    if (init?.method === "POST") {
      return Promise.resolve({
        headers: {
          getSetCookie: () => ["sucuricp_tfca_test=valor123; path=/; HttpOnly"],
        },
      } as unknown as Response);
    }
    return Promise.resolve({
      text: () => Promise.resolve(HTML_DESAFIO),
    } as unknown as Response);
  });
}

describe("obtenerCookieSucuri", () => {
  beforeEach(() => {
    invalidarCookieSucuri();
  });

  it("resuelve el desafío y devuelve la cookie de sesión", async () => {
    const fetchMock = fetchSucuriFalso();

    const cookie = await obtenerCookieSucuri(undefined, fetchMock);

    expect(cookie).toBe("sucuricp_tfca_test=valor123");
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("visitas simultáneas comparten una única resolución del desafío", async () => {
    const fetchMock = fetchSucuriFalso();

    const cookies = await Promise.all([
      obtenerCookieSucuri(undefined, fetchMock),
      obtenerCookieSucuri(undefined, fetchMock),
      obtenerCookieSucuri(undefined, fetchMock),
    ]);

    expect(new Set(cookies)).toEqual(new Set(["sucuricp_tfca_test=valor123"]));
    expect(fetchMock).toHaveBeenCalledTimes(2); // un GET + un POST, no 6
  });

  it("después de resolverla, usa la cookie cacheada sin volver a pedirla", async () => {
    const fetchMock = fetchSucuriFalso();

    await obtenerCookieSucuri(undefined, fetchMock);
    await obtenerCookieSucuri(undefined, fetchMock);

    expect(fetchMock).toHaveBeenCalledTimes(2);
  });

  it("si la resolución falla, la siguiente llamada vuelve a intentar", async () => {
    const fetchFalla = vi.fn().mockRejectedValue(new Error("red caída"));
    await expect(obtenerCookieSucuri(undefined, fetchFalla)).rejects.toThrow(
      "red caída",
    );

    const fetchMock = fetchSucuriFalso();
    await expect(obtenerCookieSucuri(undefined, fetchMock)).resolves.toBe(
      "sucuricp_tfca_test=valor123",
    );
  });

  it("pasa la señal de timeout a los requests del desafío", async () => {
    const fetchMock = fetchSucuriFalso();
    const signal = AbortSignal.timeout(5_000);

    await obtenerCookieSucuri(signal, fetchMock);

    for (const [, init] of fetchMock.mock.calls) {
      expect(init?.signal).toBe(signal);
    }
  });
});
