import type { TsjeParams, TsjeRespuesta } from "./types";
import { obtenerCookieSucuri, invalidarCookieSucuri } from "./sucuri-session";
import { USER_AGENT } from "./user-agent";
import { validarRespuestaTsje } from "./validar";

const BASE_URL =
  "https://resultados.tsje.gov.py/publicacion/dinamics/divulgacion.ajax.php";

export async function fetchResultadoTsje(
  params: TsjeParams,
  obtenerCookie: () => Promise<string> = obtenerCookieSucuri,
): Promise<TsjeRespuesta> {
  const url = `${BASE_URL}?codeleccion=${params.codeleccion}&candidatura=${params.candidatura}&departamento=${params.departamento}&municipio=${params.municipio}`;

  const cookie = await obtenerCookie();

  let res = await fetch(url, {
    headers: { "User-Agent": USER_AGENT, Cookie: cookie },
  });

  if (res.status === 403) {
    invalidarCookieSucuri();
    const cookieNueva = await obtenerCookie();
    res = await fetch(url, {
      headers: { "User-Agent": USER_AGENT, Cookie: cookieNueva },
    });
  }

  if (!res.ok) {
    throw new Error(`TSJE respondió ${res.status} para ${url}`);
  }

  return validarRespuestaTsje(await res.json());
}
