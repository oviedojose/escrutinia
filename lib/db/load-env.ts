// Carga .env.local solo para los tests que tocan la base.
//
// La mayoría de los tests del repo son puros (no importan la base), así que
// vitest.setup.ts a propósito NO carga .env.local de forma global: se probó
// y se revirtió para mantener la lógica pura desacoplada de
// lib/db/client.ts. Los pocos tests de integración (p. ej.
// lib/queries/snapshots.test.ts) sí necesitan DATABASE_URL para correr con
// `npm test`. Esos archivos importan este módulo primero, antes de cualquier
// cosa que cargue lib/db/client.ts, para que la variable exista antes del
// chequeo que client.ts hace al importarse.
//
// Nunca se loguea ningún valor de credenciales.
import { existsSync } from "node:fs";
import { resolve } from "node:path";

if (!process.env.DATABASE_URL) {
  const envPath = resolve(process.cwd(), ".env.local");
  if (existsSync(envPath)) {
    process.loadEnvFile(envPath);
  }
}
