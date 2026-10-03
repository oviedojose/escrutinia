interface VoteBarRow {
  rank: number;
  numLista: string;
  nombre: string;
  color: string;
  votos: number;
  pct: number;
  esGanador: boolean;
}

interface VoteBarProps {
  rows: VoteBarRow[];
}

export function VoteBar({ rows }: VoteBarProps) {
  return (
    <div className="esc-vote-bar">
      {rows.map((row) => (
        <div
          key={row.numLista}
          className={`esc-vote-bar__row${row.esGanador ? " esc-vote-bar__row--winner" : ""}`}
        >
          <span className="esc-vote-bar__rank">{row.rank}</span>
          <div className="esc-vote-bar__track">
            <div
              className="esc-vote-bar__fill"
              style={{ width: `${row.pct}%`, background: `rgb(${row.color})` }}
            />
            <div className="esc-vote-bar__meta">
              <span
                className="esc-party-chip__dot"
                style={{ background: `rgb(${row.color})` }}
              />
              {row.nombre}
              {row.esGanador && (
                <span className="esc-vote-bar__winner-icon">✓</span>
              )}
            </div>
          </div>
          <div className="esc-vote-bar__votes">
            <span className="esc-tnum">
              {row.votos.toLocaleString("es-PY")}
            </span>
            <span className="esc-vote-bar__pct">{row.pct.toFixed(1)}%</span>
          </div>
        </div>
      ))}
    </div>
  );
}
