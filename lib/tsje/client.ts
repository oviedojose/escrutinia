import type { TsjeParams, TsjeRespuesta } from "./types";
import { obtenerCookieSucuri, invalidarCookieSucuri } from "./sucuri-session";
import { USER_AGENT } from "./user-agent";
import { validarRespuestaTsje } from "./validar";

const BASE_URL =
  "https://resultados.tsje.gov.py/publicacion/dinamics/divulgacion.ajax.php";

/**
 * Presupuesto total para toda la operación, no por request: entre el desafío
 * de Sucuri (GET + POST), el dato y el reintento ante un 403 pueden ser hasta
 * 5 requests en serie. Si se vence, fetch lanza TimeoutError y on-demand
 * muestra el último snapshot guardado en lugar de dejar la página colgada.
 */
export const TIMEOUT_TSJE_MS = 8_000;

export async function fetchResultadoTsje(
  params: TsjeParams,
  obtenerCookie: (signal: AbortSignal) => Promise<string> = obtenerCookieSucuri,
  timeoutMs: number = TIMEOUT_TSJE_MS,
): Promise<TsjeRespuesta> {
  const url = `${BASE_URL}?codeleccion=${params.codeleccion}&candidatura=${params.candidatura}&departamento=${params.departamento}&municipio=${params.municipio}`;
  const signal = AbortSignal.timeout(timeoutMs);

  const cookie = await obtenerCookie(signal);

  let res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Cookie: cookie },
    signal,
  });

  if (res.status === 403) {
    invalidarCookieSucuri();
    const cookieNueva = await obtenerCookie(signal);
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Cookie: cookieNueva },
      signal,
    });
  }

  if (!res.ok) {
    throw new Error(`TSJE respondió ${res.status} para ${url}`);
  }

  return validarRespuestaTsje(await res.json());
}
