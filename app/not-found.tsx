import Link from "next/link";

export default function NotFound() {
  return (
    <main className="esc-inicio">
      <h1>Distrito no encontrado</h1>
      <p>
        El departamento o distrito de la dirección no existe. Elegí uno desde
        el inicio para ver sus resultados.
      </p>
      <nav>
        <Link href="/">Volver al inicio</Link>
      </nav>
    </main>
  );
}
