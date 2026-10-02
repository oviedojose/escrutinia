import { describe, it, expect, vi, afterEach } from "vitest";
import { fetchResultadoTsje } from "./client";
import intendenteSample from "./__fixtures__/intendente-sample.json";

const cookieDePrueba = () => Promise.resolve("sucuricp_tfca_test=abc123");

describe("fetchResultadoTsje", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("builds the correct URL, sends the Sucuri cookie, and returns the parsed JSON", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: () => Promise.resolve(intendenteSample),
    });
    vi.stubGlobal("fetch", fetchMock);

    const result = await fetchResultadoTsje(
      { codeleccion: 44, candidatura: 1, departamento: 11, distrito: 13 },
      cookieDePrueba,
    );

    expect(fetchMock).toHaveBeenCalledWith(
      "https://resultados.tsje.gov.py/publicacion/dinamics/divulgacion.ajax.php?codeleccion=44&candidatura=1&departamento=11&distrito=13",
      expect.objectContaining({
        headers: expect.objectContaining({
          Cookie: "sucuricp_tfca_test=abc123",
        }),
      }),
    );
    expect(result.totales.totalVotos).toBe(132736);
    expect(result.candidatos[0].nomCandidato).toBe("Camilo Perez");
  });

  it("throws when the response is still not ok after the retry", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 500 }),
    );

    await expect(
      fetchResultadoTsje(
        { codeleccion: 44, candidatura: 1, departamento: 11, distrito: 13 },
        cookieDePrueba,
      ),
    ).rejects.toThrow("500");
  });

  it("on a 403, gets a fresh cookie and retries once before giving up", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({ ok: false, status: 403 })
      .mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: () => Promise.resolve(intendenteSample),
      });
    vi.stubGlobal("fetch", fetchMock);

    const obtenerCookieMock = vi
      .fn()
      .mockResolvedValueOnce("cookie-vieja")
      .mockResolvedValueOnce("cookie-nueva");

    const result = await fetchResultadoTsje(
      { codeleccion: 44, candidatura: 1, departamento: 11, distrito: 13 },
      obtenerCookieMock,
    );

    expect(obtenerCookieMock).toHaveBeenCalledTimes(2);
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect((fetchMock.mock.calls[1][1] as RequestInit).headers).toMatchObject({
      Cookie: "cookie-nueva",
    });
    expect(result.totales.totalVotos).toBe(132736);
  });
});
