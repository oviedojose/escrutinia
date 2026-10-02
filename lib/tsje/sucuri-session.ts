import { parseChallenge, construirCapToken } from "./sucuri";
import { USER_AGENT } from "./user-agent";

const CHALLENGE_URL =
  "https://resultados.tsje.gov.py/publicacion/dinamics/divulgacion.ajax.php";

const MARGEN_CACHE_MS = 20 * 60 * 60 * 1000;

interface CookieCacheada {
  valor: string;
  expiraEn: number;
}

let cookieCacheada: CookieCacheada | null = null;

function extraerCookieSucuri(setCookieHeaders: string[]): string | null {
  for (const header of setCookieHeaders) {
    const parNombreValor = header.split(";")[0]?.trim();
    if (parNombreValor?.startsWith("sucuricp_")) {
      return parNombreValor;
    }
  }
  return null;
}

async function resolverChallengeYObtenerCoookie(
  fetchImpl: typeof fetch,
): Promise<string> {
  const resChallenge = await fetchImpl(CHALLENGE_URL, {
    headers: {
      "User-Agent": USER_AGENT,
    },
  });

  const html = await resChallenge.text();
  const challenge = parseChallenge(html);

  if (!challenge) {
    throw new Error(
      "No se pudo interpretar el desafío de Sucuri del TSJE (¿cambió el formato, o ya no está protegido?)",
    );
  }

  const token = construirCapToken(challenge);
  const resSolve = await fetchImpl(CHALLENGE_URL, {
    method: "POST",
    headers: {
      "User-Agent": USER_AGENT,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: `cap-token=${encodeURIComponent(token)}`,
  });

  const setCookieHeaders = resSolve.headers.getSetCookie?.() ?? [];
  const cookie = extraerCookieSucuri(setCookieHeaders);

  if (!cookie) {
    throw new Error(
      "Sucuri no devolvió una cookie de sesión después de resolver el desafío",
    );
  }

  return cookie;
}

export async function obtenerCookieSucuri(
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  const ahora = Date.now();
  if (cookieCacheada && cookieCacheada.expiraEn > ahora) {
    return cookieCacheada.valor;
  }

  const valor = await resolverChallengeYObtenerCoookie(fetchImpl);

  cookieCacheada = {
    valor,
    expiraEn: ahora + MARGEN_CACHE_MS,
  };

  return valor;
}

export function invalidarCookieSucuri(): void {
  cookieCacheada = null;
}
