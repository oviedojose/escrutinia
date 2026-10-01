CREATE TABLE "departamentos" (
	"id" integer PRIMARY KEY NOT NULL,
	"nombre" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "elecciones" (
	"id" serial PRIMARY KEY NOT NULL,
	"codeleccion" integer NOT NULL,
	"nombre" text NOT NULL,
	CONSTRAINT "elecciones_codeleccion_unique" UNIQUE("codeleccion")
);
--> statement-breakpoint
CREATE TABLE "municipios" (
	"id" integer NOT NULL,
	"departamento_id" integer NOT NULL,
	"nombre" text NOT NULL,
	CONSTRAINT "municipios_departamento_id_id_pk" PRIMARY KEY("departamento_id","id")
);
--> statement-breakpoint
CREATE TABLE "resultados_snapshot" (
	"id" serial PRIMARY KEY NOT NULL,
	"eleccion_id" integer NOT NULL,
	"departamento_id" integer NOT NULL,
	"municipio_id" integer NOT NULL,
	"candidatura" integer NOT NULL,
	"payload" jsonb NOT NULL,
	"hora_tsje" text NOT NULL,
	"sincronizado_en" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "municipios" ADD CONSTRAINT "municipios_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados_snapshot" ADD CONSTRAINT "resultados_snapshot_eleccion_id_elecciones_id_fk" FOREIGN KEY ("eleccion_id") REFERENCES "public"."elecciones"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados_snapshot" ADD CONSTRAINT "resultados_snapshot_departamento_id_departamentos_id_fk" FOREIGN KEY ("departamento_id") REFERENCES "public"."departamentos"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resultados_snapshot" ADD CONSTRAINT "resultados_snapshot_departamento_id_municipio_id_municipios_departamento_id_id_fk" FOREIGN KEY ("departamento_id","municipio_id") REFERENCES "public"."municipios"("departamento_id","id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "snapshot_busqueda_idx" ON "resultados_snapshot" USING btree ("eleccion_id","departamento_id","municipio_id","candidatura","sincronizado_en");