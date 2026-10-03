interface Departamento {
  id: number;
  nombre: string;
}

interface Municipio {
  id: number;
  departamentoId: number;
  nombre: string;
}

interface MunicipioSelectorProps {
  departamentos: Departamento[];
  municipios: Municipio[];
  departamentoId: number;
  municipioId: number;
  onChange: (departamentoId: number, municipioId: number) => void;
}

export function MunicipioSelector({
  departamentos,
  municipios,
  departamentoId,
  municipioId,
  onChange,
}: MunicipioSelectorProps) {
  const municipiosDelDepartamento = municipios.filter(
    (m) => m.departamentoId === departamentoId,
  );

  return (
    <div className="esc-distrito-selector">
      <label>
        Departamento
        <select
          value={departamentoId}
          onChange={(e) => {
            const nuevoDepartamentoId = Number(e.target.value);
            const primerMunicipio = municipios.find(
              (m) => m.departamentoId === departamentoId,
            );
            onChange(nuevoDepartamentoId, primerMunicipio?.id ?? 0);
          }}
        >
          {departamentos.map((d) => (
            <option key={d.id} value={d.id}>
              {d.nombre}
            </option>
          ))}
        </select>
      </label>
      <label>
        Distrito
        <select
          aria-label="Distrito"
          value={municipioId}
          onChange={(e) => onChange(departamentoId, Number(e.target.value))}
        >
          {municipiosDelDepartamento.map((m) => (
            <option key={m.id} value={m.id}>
              {m.nombre}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
