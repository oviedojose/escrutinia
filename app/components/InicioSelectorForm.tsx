"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { MunicipioSelector } from "./MunicipioSelector";
import { useFiltrosPending } from "./FiltrosPendingContext";

interface InicioSelectorFormProps {
  departamentos: { id: number; nombre: string }[];
  municipios: { id: number; departamentoId: number; nombre: string }[];
  departamentoId: number;
  municipioId: number;
}

export function InicioSelectorForm({
  departamentos,
  municipios,
  departamentoId,
  municipioId,
}: InicioSelectorFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { runTransition } = useFiltrosPending();

  // See ResultadosSelector for why this is local state, reset from props
  // during render rather than in an effect: it lets the distrito <select>
  // re-filter instantly from the already-loaded `distritos` list instead of
  // showing the previous departamento's distritos until navigation finishes.
  const [localDepartamentoId, setLocalDepartamentoId] =
    useState(departamentoId);
  const [localDistritoId, setLocalDistritoId] = useState(municipioId);
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
    setLocalDistritoId(municipioId);
  }

  return (
    <MunicipioSelector
      departamentos={departamentos}
      municipios={municipios}
      departamentoId={localDepartamentoId}
      municipioId={localDistritoId}
      onChange={(d, dist) => {
        setLocalDepartamentoId(d);
        setLocalDistritoId(dist);
        const params = new URLSearchParams(searchParams.toString());
        params.set("departamento", String(d));
        params.set("distrito", String(dist));
        runTransition(() => router.push(`/?${params.toString()}`));
      }}
    />
  );
}
