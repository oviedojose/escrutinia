"use client";

import { useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useFiltrosPending } from "./FiltrosPendingContext";
import { MunicipioSelector } from "./MunicipioSelector";

interface ResultadosSelectorProps {
  departamentos: { id: number; nombre: string }[];
  municipios: { id: number; departamentoId: number; nombre: string }[];
  departamentoId: number;
  municipioId: number;
}

export function ResultadosSelector({
  departamentos,
  municipios,
  departamentoId,
  municipioId,
}: ResultadosSelectorProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { runTransition } = useFiltrosPending();

  // Local, immediately-updated selection so the distrito <select> re-filters
  // its options (from the already-loaded `distritos` list) as soon as the
  // user picks a departamento, instead of showing the previous departamento's
  // distritos until the navigation triggered below finishes. Resetting it
  // from new props happens during render (not an effect) so it also picks
  // up external navigation, e.g. browser back/forward or a NavBar link.
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
