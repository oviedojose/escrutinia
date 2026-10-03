import type { DhondtResultado } from "@/lib/dhondt/calcular";

interface DHondtTableProps {
  listas: string[];
  resultado: DhondtResultado;
  maxDivisor: number;
}

export function DHondtTable({
  listas,
  resultado,
  maxDivisor,
}: DHondtTableProps) {
  const divisores = Array.from({ length: maxDivisor }, (_, i) => i + 1);

  return (
    <table className="esc-dhondt">
      <thead>
        <tr>
          <th>LISTA</th>
          {divisores.map((d) => (
            <th key={d}>÷{d}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {listas.map((listaId) => (
          <tr key={listaId}>
            <td>{listaId}</td>
            {divisores.map((d) => {
              const c = resultado.cocientes.find(
                (q) => q.listaId === listaId && q.divisor === d,
              );
              const gano = c?.orden != null;
              return (
                <td
                  key={d}
                  className={`esc-tnum${gano ? " esc-dhondt__cell--won" : ""}`}
                >
                  {gano ? (
                    <span className="esc-dhondt__seat-order">{c.orden}</span>
                  ) : null}
                  <div>
                    {c ? Math.round(c.cociente).toLocaleString("es-PY") : ""}
                  </div>
                </td>
              );
            })}
          </tr>
        ))}
      </tbody>
    </table>
  );
}
