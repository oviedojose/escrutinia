type Status = "live" | "provisional" | "official";

const LABELS: Record<Status, string> = {
  live: "En vivo",
  provisional: "Provisorio",
  official: "Oficial",
};

interface StatusBadgeProps {
  status: Status;
  timestamp: string;
}

export function StatusBadge({ status, timestamp }: StatusBadgeProps) {
  return (
    <span className={`esc-status-badge esc-status-badge--${status}`}>
      <span className="esc-status-badge__dot" />
      {LABELS[status]} · {timestamp}
    </span>
  );
}
