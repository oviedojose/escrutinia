import {
  pgTable,
  integer,
  text,
  serial,
  timestamp,
  boolean,
  jsonb,
  primaryKey,
  foreignKey,
  index,
} from "drizzle-orm/pg-core";

export const departamentos = pgTable("departamentos", {
  id: integer("id").primaryKey(),
  nombre: text("nombre").notNull(),
});

export const municipios = pgTable(
  "municipios",
  {
    id: integer("id").notNull(),
    departamentoId: integer("departamento_id")
      .notNull()
      .references(() => departamentos.id),
    nombre: text("nombre").notNull(),
  },
  (t) => [primaryKey({ columns: [t.departamentoId, t.id] })],
);

export const elecciones = pgTable("elecciones", {
  id: serial("id").primaryKey(),
  codeleccion: integer("codeleccion").notNull().unique(),
  nombre: text("nombre").notNull(),
  activa: boolean("activa").notNull().default(false),
});

export const resultadosSnapshot = pgTable(
  "resultados_snapshot",
  {
    id: serial("id").primaryKey(),
    eleccionId: integer("eleccion_id")
      .notNull()
      .references(() => elecciones.id),
    departamentoId: integer("departamento_id")
      .notNull()
      .references(() => departamentos.id),
    municipioId: integer("municipio_id").notNull(),
    candidatura: integer("candidatura").notNull(),
    payload: jsonb("payload").notNull(),
    horaTsje: text("hora_tsje").notNull(),
    sincronizadoEn: timestamp("sincronizado_en", {
      withTimezone: true,
    })
      .notNull()
      .defaultNow(),
  },
  (t) => [
    foreignKey({
      columns: [t.departamentoId, t.municipioId],
      foreignColumns: [municipios.departamentoId, municipios.id],
    }),
    index("snapshot_busqueda_idx").on(
      t.eleccionId,
      t.departamentoId,
      t.municipioId,
      t.candidatura,
      t.sincronizadoEn,
    ),
  ],
);
