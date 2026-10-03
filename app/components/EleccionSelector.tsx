"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFiltrosPending } from "./FiltrosPendingContext";

interface Eleccion {
  id: number;
  codeleccion: number;
  nombre: string;
  activa: boolean;
}

interface EleccionSelectorProps {
  elecciones: Eleccion[];
  codeleccionActual: number;
}

export function EleccionSelector({
  elecciones,
  codeleccionActual,
}: EleccionSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { runTransition } = useFiltrosPending();

  return (
    <label className="esc-eleccion-selector">
      Elección
      <select
        value={codeleccionActual}
        onChange={(e) => {
          const params = new URLSearchParams(searchParams.toString());
          params.set("eleccion", e.target.value);
          runTransition(() => router.push(`${pathname}?${params.toString()}`));
        }}
      >
        {elecciones.map((el) => (
          <option key={el.id} value={el.codeleccion}>
            {el.nombre}
            {el.activa ? " · activa" : ""}
          </option>
        ))}
      </select>
    </label>
  );
}
