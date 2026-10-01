import { readFileSync } from "node:fs";
import { db } from "./client";
import { elecciones } from "./schema";
import { parseElecciones } from "./parse-elecciones";

export async function seedElecciones() {
  const eleccionesJson = JSON.parse(
    readFileSync("./docs/elecciones.json", "utf-8"),
  );
  const rows = parseElecciones(eleccionesJson);

  await db.insert(elecciones).values(rows).onConflictDoNothing();
}
