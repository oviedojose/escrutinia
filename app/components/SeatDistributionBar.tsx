interface SeatSegment {
  numLista: string;
  nombre: string;
  color: string;
  bancas: number;
}

interface SeatDistributionBarProps {
  segments: SeatSegment[];
  totalBancas: number;
}

export function SeatDistributionBar({
  segments,
  totalBancas,
}: SeatDistributionBarProps) {
  return (
    <div className="esc-seat-bar">
      <div className="esc-seat-bar__track">
        {segments.map((seg) => (
          <div
            key={seg.numLista}
            className="esc-seat-bar__seg"
            style={{
              width: `${(seg.bancas / totalBancas) * 100}%`,
              background: `rgb(${seg.color})`,
            }}
          />
        ))}
      </div>
      <div className="esc-seat-bar__legend">
        {segments.map((seg) => (
          <span key={seg.numLista} className="esc-seat-bar__legend-item">
            <span
              className="esc-seat-bar__legend-dot"
              style={{ background: `rgb(${seg.color})` }}
            />
            {seg.nombre}{" "}
            <span className="esc-seat-bar__legend-count">
              {seg.bancas} {seg.bancas === 1 ? "banca" : "bancas"}
            </span>
          </span>
        ))}
      </div>
    </div>
  );
}
