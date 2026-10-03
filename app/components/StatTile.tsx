interface StatTileProps {
  label: string;
  value: string;
  sublabel?: string;
  variant?: "default" | "info" | "warning" | "positive";
}

export function StatTile({
  label,
  value,
  sublabel,
  variant = "default",
}: StatTileProps) {
  const variantClass =
    variant !== "default" ? ` esc-stat-tile--${variant}` : "";
  return (
    <div className={`esc-stat-tile${variantClass}`}>
      <span className="esc-stat-tile__label esc-eyebrow">{label}</span>
      <span className="esc-stat-tile__value esc-tnum">{value}</span>
      {sublabel && <span className="esc-stat-tile__sublabel">{sublabel}</span>}
    </div>
  );
}
