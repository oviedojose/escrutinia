export interface DHondtLista {
  id: string;
  votos: number;
}

export interface DHondtQuotient {
  listaId: string;
  divisor: number;
  cociente: number;
  orden: number | null;
}

/**
 * Empate total (mismo cociente y mismos votos) que cruza el corte de la
 * última banca: la ley lo resuelve por sorteo, que la app no puede hacer.
 * `bancas` es cuántas de esas bancas están en disputa entre `listas`; la
 * asignación que aparece en bancasPorLista para ellas es provisoria.
 */
export interface EmpateASortear {
  listas: string[];
  bancas: number;
}

export interface DhondtResultado {
  bancasPorLista: Record<string, number>;
  cocientes: DHondtQuotient[];
  empateASortear: EmpateASortear | null;
}

export function calcularDHondt(
  listas: DHondtLista[],
  bancas: number,
): DhondtResultado {
  if (bancas < 1) {
    throw new Error("bancas debe ser mayor a 0");
  }

  const totalVotos = listas.reduce((sum, l) => sum + l.votos, 0);

  if (totalVotos === 0) {
    const bancasPorLista: Record<string, number> = Object.fromEntries(
      listas.map((l) => [l.id, 0]),
    );

    const cocientes: DHondtQuotient[] = listas.flatMap((lista) =>
      Array.from({ length: bancas }, (_, i) => ({
        listaId: lista.id,
        divisor: i + 1,
        cociente: 0,
        orden: null,
      })),
    );

    return { bancasPorLista, cocientes, empateASortear: null };
  }

  const candidatos = listas.flatMap((lista) =>
    Array.from({ length: bancas }, (_, i) => {
      const divisor = i + 1;
      return {
        listaId: lista.id,
        divisor,
        cociente: lista.votos / divisor,
        votosLista: lista.votos,
      };
    }),
  );

  // Art. 258 del Código Electoral: si dos cocientes de distintas listas
  // coinciden, la banca va a la que obtuvo más votos; si aun así empatan,
  // se sortea (ver detectarEmpateASortear).
  const ordenados = [...candidatos].sort(
    (a, b) => b.cociente - a.cociente || b.votosLista - a.votosLista,
  );
  const ganadores = ordenados.slice(0, bancas);

  const ordenPorClave = new Map<string, number>();
  const bancasPorLista: Record<string, number> = Object.fromEntries(
    listas.map((l) => [l.id, 0]),
  );

  ganadores.forEach((g, idx) => {
    ordenPorClave.set(`${g.listaId}:${g.divisor}`, idx + 1);
    bancasPorLista[g.listaId] += 1;
  });

  const cocientes: DHondtQuotient[] = candidatos.map((c) => ({
    listaId: c.listaId,
    divisor: c.divisor,
    cociente: c.cociente,
    orden: ordenPorClave.get(`${c.listaId}:${c.divisor}`) ?? null,
  }));

  return {
    bancasPorLista,
    cocientes,
    empateASortear: detectarEmpateASortear(ordenados, bancas),
  };
}

function detectarEmpateASortear(
  ordenados: { listaId: string; cociente: number; votosLista: number }[],
  bancas: number,
): EmpateASortear | null {
  const ultimoGanador = ordenados[bancas - 1];
  const primerPerdedor = ordenados[bancas];
  const empatan = (c: { cociente: number; votosLista: number }) =>
    c.cociente === ultimoGanador.cociente &&
    c.votosLista === ultimoGanador.votosLista;

  if (!primerPerdedor || !empatan(primerPerdedor)) {
    return null;
  }

  const enDisputa = ordenados.filter(empatan);
  return {
    listas: enDisputa.map((c) => c.listaId),
    bancas: ordenados.slice(0, bancas).filter(empatan).length,
  };
}
