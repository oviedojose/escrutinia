"use client";

import { useFiltrosPending } from "./FiltrosPendingContext";

export function FiltrosPendingIndicator() {
  const { pending } = useFiltrosPending();

  if (!pending) {
    return null;
  }

  return (
    <span className="esc-filtros__pending" role="status">
      <span className="esc-filtros__spinner" aria-hidden="true" />
      Obteniendo resultados…
    </span>
  );
}
