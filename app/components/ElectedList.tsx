import type { ElectoResultado } from "@/lib/dhondt/electos";

interface ElectedListProps {
  numLista: string;
  nombre: string;
  color: string;
  bancas: number;
  electos: ElectoResultado[];
}

function CheckIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 8.5L6.5 12L13 4.5"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function ElectedList({
  numLista,
  nombre,
  color,
  bancas,
  electos,
}: ElectedListProps) {
  const soloElectos = electos.filter((e) => e.estado === "electo");

  return (
    <div className="esc-elected-group">
      <div className="esc-elected-header">
        <span
          className="esc-elected-header__dot"
          style={{ background: `rgb(${color})` }}
        />
        <span className="esc-elected-header__list">{numLista}</span>
        <span className="esc-elected-header__name">{nombre}</span>
        <span className="esc-elected-header__count">{bancas} bancas</span>
      </div>
      <div className="esc-elected-rows">
        {soloElectos.map((e, idx) => (
          <div
            key={e.nomCandidato}
            className="esc-elected-row esc-elected-row--elected"
          >
            <span className="esc-elected-row__rank">{idx + 1}</span>
            <span>{e.nomCandidato}</span>
            <span className="esc-elected-row__tag">
              <CheckIcon />
            </span>
            <span className="esc-elected-row__votes">
              {e.votos.toLocaleString("es-PY")}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
