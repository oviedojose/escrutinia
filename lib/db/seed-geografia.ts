import { readFileSync } from "node:fs";
import { db } from "./client";
import { departamentos, municipios } from "./schema";
import { parseGeografia } from "./parse-geografia";

export async function seedGeografia() {
  const departamentosJson = JSON.parse(
    readFileSync("./docs/departamentos.json", "utf-8"),
  );
  const municipiosJson = JSON.parse(
    readFileSync("./docs/municipios.json", "utf-8"),
  );

  const rows = parseGeografia(departamentosJson, municipiosJson);

  await db
    .insert(departamentos)
    .values(rows.departamentos)
    .onConflictDoNothing();
  await db.insert(municipios).values(rows.municipios).onConflictDoNothing();
}
