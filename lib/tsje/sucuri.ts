import { createHash } from "node:crypto";

export interface ChallengeSucuri {
  cs: string;
  cd: number;
  ce: number;
  cg: string;
}

/**
 * El sitio del TSJE está detrás de un firewall Sucuri que, ante un request
 * sin cookie de sesión válida, devuelve un desafío de "proof-of-work": hay
 * que encontrar un n tal que sha256(cs + n) empiece con `cd` ceros
 * hexadecimales.
 * Resolverlo y enviarlo de vuelta (ver sucuri-session.ts) hace que Sucuri
 * entregue una cookie de sesión válida por ~24 horas.
 */

export function resolveProofOfWork(cs: string, cd: number): number {
  const prefijo = "0".repeat(cd);
  let n = 0;
  while (true) {
    const hash = createHash("sha256")
      .update(cs + n)
      .digest("hex");
    if (hash.startsWith(prefijo)) {
      return n;
    }
    n++;
  }
}

export function parseChallenge(html: string): ChallengeSucuri | null {
  const cs = html.match(/_cs\s*=\s*"([^"]+)"/)?.[1];
  const cd = html.match(/_cd\s*=\s*(\d+)/)?.[1];
  const ce = html.match(/_ce\s*=\s*(\d+)/)?.[1];
  const cg = html.match(/_cg\s*=\s*"([^"]+)"/)?.[1];

  if (!cs || !cd || !ce || !cg) {
    return null;
  }

  return { cs, cd: Number(cd), ce: Number(ce), cg };
}

export function construirCapToken(challenge: ChallengeSucuri): string {
  const n = resolveProofOfWork(challenge.cs, challenge.cd);
  return `${challenge.cs}:${challenge.cd}:${challenge.ce}:${challenge.cg}:${n}`;
}
