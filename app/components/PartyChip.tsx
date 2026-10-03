interface PartyChipProps {
  numLista: string;
  nombre: string;
  color: string;
  compact?: boolean;
}

export function PartyChip({
  numLista,
  nombre,
  color,
  compact = false,
}: PartyChipProps) {
  return (
    <span
      className={`esc-party-chip${compact ? " esc-party-chip--compact" : ""}`}
    >
      <span
        className="esc-party-chip__dot"
        style={{ background: `rgb(${color})` }}
      />
      <span className="esc-party-chip__list">{numLista}</span>
      <span className="esc-party-chip__name">{nombre}</span>
    </span>
  );
}
