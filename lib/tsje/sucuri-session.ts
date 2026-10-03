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

/**
 * Resolución del desafío en curso, compartida: si varias visitas encuentran
 * la cookie vencida a la vez, el proof-of-work se resuelve una sola vez (por
 * instancia del servidor) y todas esperan el mismo resultado.
 */
let cookieEnCurso: Promise<string> | null = null;

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
  signal?: AbortSignal,
): Promise<string> {
  const resChallenge = await fetchImpl(CHALLENGE_URL, {
    headers: {
      "User-Agent": USER_AGENT,
    },
    signal,
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
    signal,
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
  signal?: AbortSignal,
  fetchImpl: typeof fetch = fetch,
): Promise<string> {
  if (cookieCacheada && cookieCacheada.expiraEn > Date.now()) {
    return cookieCacheada.valor;
  }

  if (!cookieEnCurso) {
    const pedido = resolverChallengeYObtenerCoookie(fetchImpl, signal)
      .then((valor) => {
        // Solo si nadie invalidó mientras resolvíamos.
        if (cookieEnCurso === pedido) {
          cookieCacheada = { valor, expiraEn: Date.now() + MARGEN_CACHE_MS };
        }
        return valor;
      })
      .finally(() => {
        if (cookieEnCurso === pedido) {
          cookieEnCurso = null;
        }
      });
    cookieEnCurso = pedido;
  }

  return cookieEnCurso;
}

export function invalidarCookieSucuri(): void {
  cookieCacheada = null;
  cookieEnCurso = null;
}
