import Link from "next/link";
import { StatusBadge } from "./StatusBadge";

interface NavBarProps {
  active: "intendente" | "concejales";
  statusTimestamp?: string;
  /** Resultado final (no oficial): se muestra como Provisorio en vez de En vivo. */
  statusFinal?: boolean;
  departamentoId?: number;
  municipioId?: number;
  codeleccion?: number;
}

function buildQuery(...parts: (string | undefined)[]): string {
  const nonEmpty = parts.filter((p): p is string => Boolean(p));
  return nonEmpty.length > 0 ? `?${nonEmpty.join("&")}` : "";
}

export function NavBar({
  active,
  statusTimestamp,
  statusFinal = false,
  departamentoId,
  municipioId,
  codeleccion,
}: NavBarProps) {
  const municipioQuery =
    departamentoId != null && municipioId != null
      ? `departamento=${departamentoId}&municipio=${municipioId}`
      : undefined;

  const eleccionQuery =
    codeleccion != null ? `eleccion=${codeleccion}` : undefined;

  const links = [
    {
      href: `/intendente${buildQuery(municipioQuery, eleccionQuery)}`,
      key: "intendente",
      label: "Intendente",
    },
    {
      href: `/concejales${buildQuery(municipioQuery, eleccionQuery)}`,
      key: "concejales",
      label: "Concejales",
    },
  ] as const;

  return (
    <nav className="esc-navbar">
      <Link href="/">← Inicio</Link>
      <span className="esc-navbar__brand">Escrutinia</span>
      {links.map((link) => (
        <Link
          key={link.key}
          href={link.href}
          aria-current={active === link.key ? "page" : undefined}
        >
          {link.label}
        </Link>
      ))}
      {statusTimestamp && (
        <StatusBadge
          status={statusFinal ? "provisional" : "live"}
          timestamp={statusTimestamp}
        />
      )}
    </nav>
  );
}
