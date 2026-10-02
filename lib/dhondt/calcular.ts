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

export interface DhondtResultado {
  bancasPorLista: Record<string, number>;
  cocientes: DHondtQuotient[];
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

    return { bancasPorLista, cocientes };
  }

  const candidatos = listas.flatMap((lista) =>
    Array.from({ length: bancas }, (_, i) => {
      const divisor = i + 1;
      return { listaId: lista.id, divisor, cociente: lista.votos / divisor };
    }),
  );

  const ordenados = [...candidatos].sort((a, b) => b.cociente - a.cociente);
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

  return { bancasPorLista, cocientes };
}
