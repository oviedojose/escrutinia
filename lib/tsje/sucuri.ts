import { createHash } from "node:crypto";

export interface ChallengeSucuri {
  cs: string;
  cd: number;
  ce: number;
  cg: string;
}

/**
 * The TSJE site is behind a Sucuri firewall that, when a request is made
 * without a valid session cookie, returns a "proof-of-work" challenge: you
 * must find an n such that sha256(cs + n) starts with `cd` zero bits in
 * hexadecimal.
 * Solving it and sending it back (see sucuri-session.ts) makes Sucuri issue
 * a valid session cookie for ~24 hours.
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
