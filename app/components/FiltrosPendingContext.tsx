"use client";

import { createContext, useContext, useTransition, ReactNode } from "react";

interface FiltrosPendingContextValue {
  pending: boolean;
  runTransition: (fn: () => void) => void;
}

const FiltrosPendingContext = createContext<FiltrosPendingContextValue | null>(
  null,
);

export function FiltrosPendingProvider({ children }: { children: ReactNode }) {
  const [pending, startTransition] = useTransition();

  return (
    <FiltrosPendingContext.Provider
      value={{ pending, runTransition: startTransition }}
    >
      {children}
    </FiltrosPendingContext.Provider>
  );
}

export function useFiltrosPending(): FiltrosPendingContextValue {
  const ctx = useContext(FiltrosPendingContext);
  if (!ctx) {
    throw new Error(
      "useFiltrosPending debe usarse dentro de un FiltrosPendingProvider",
    );
  }
  return ctx;
}
