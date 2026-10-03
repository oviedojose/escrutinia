"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFiltrosPending } from "./FiltrosPendingContext";
import { MunicipioSelector } from "./MunicipioSelector";

interface UbicacionSelectorProps {
  departamentos: { id: number; nombre: string }[];
  municipios: { id: number; departamentoId: number; nombre: string }[];
  departamentoId: number;
  municipioId: number;
}

/**
 * Selector de departamento/municipio que guarda la elección en la URL de la
 * página actual (inicio o resultados).
 */
export function UbicacionSelector({
  departamentos,
  municipios,
  departamentoId,
  municipioId,
}: UbicacionSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { runTransition } = useFiltrosPending();

  // Selección local que se actualiza al instante, para que el <select> de
  // municipios se re-filtre (con la lista ya cargada) apenas el usuario
  // elige un departamento, en lugar de mostrar los municipios del
  // departamento anterior hasta que termine la navegación. Se resetea desde
  // las props durante el render (no en un effect) para que también tome
  // navegaciones externas, como atrás/adelante del navegador o un link de
  // la NavBar.
  const [localDepartamentoId, setLocalDepartamentoId] =
    useState(departamentoId);
  const [localMunicipioId, setLocalMunicipioId] = useState(municipioId);
  const [propsDepartamentoId, setPropsDepartamentoId] =
    useState(departamentoId);
  const [propsMunicipioId, setPropsMunicipioId] = useState(municipioId);

  if (
    departamentoId !== propsDepartamentoId ||
    municipioId !== propsMunicipioId
  ) {
    setPropsDepartamentoId(departamentoId);
    setPropsMunicipioId(municipioId);
    setLocalDepartamentoId(departamentoId);
    setLocalMunicipioId(municipioId);
  }

  return (
    <MunicipioSelector
      departamentos={departamentos}
      municipios={municipios}
      departamentoId={localDepartamentoId}
      municipioId={localMunicipioId}
      onChange={(d, muni) => {
        setLocalDepartamentoId(d);
        setLocalMunicipioId(muni);
        const params = new URLSearchParams(searchParams.toString());
        params.set("departamento", String(d));
        params.set("municipio", String(muni));
        runTransition(() => router.push(`${pathname}?${params.toString()}`));
      }}
    />
  );
}
