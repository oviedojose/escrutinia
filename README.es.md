# Escrutinia

_[English](README.md) · Español_

**Resultados de las elecciones municipales de Paraguay, distrito por distrito, con el reparto de bancas de concejales calculado en tiempo real.**

Escrutinia toma los datos del TREP (Transmisión de Resultados Electorales Preliminares) que publica el Tribunal Superior de Justicia Electoral (TSJE) y los presenta de una forma clara: quién va ganando la intendencia y **cómo quedarían repartidas las bancas de la Junta Municipal** según el método D'Hondt, incluyendo qué candidatos resultarían electos por voto preferencial.

El sitio oficial del TSJE muestra votos por lista, pero no calcula el reparto de bancas ni quiénes entrarían. Escrutinia hace ese cálculo y muestra el paso a paso.

---

## Capturas

### Inicio: elegir la elección, el departamento y el distrito

![Pantalla de inicio](docs/screenshots/inicio.png)

### Intendente: votos por candidato y totales del escrutinio

![Resultados de Intendente](docs/screenshots/intendente.png)

### Concejales: distribución de bancas, tabla D'Hondt y concejales electos

![Resultados de Concejales](docs/screenshots/concejales.png)

---

## Funcionalidades

- **Selector de elección, departamento y distrito.** La selección se guarda en la URL, así que cualquier vista se puede compartir o guardar como marcador.
- **Resultados de Intendente.** Votos escrutados, porcentaje de mesas procesadas, votos en blanco y nulos, y ranking de candidatos con barras proporcionales y el color de cada lista.
- **Resultados de Concejales:**
  - Cantidad de bancas a repartir, deducida de la cantidad de candidatos que presenta cada lista (24 en Asunción, 12 en la mayoría de los distritos, 9 en Yguazú, etc.).
  - Barra de distribución de bancas por lista.
  - **Tabla D'Hondt completa** con todos los cocientes (votos ÷ 1, ÷ 2, …), marcando el orden en que se asigna cada banca.
  - **Concejales electos** por lista, ordenados por voto preferencial.
- **Indicador de estado.** Cada vista muestra la hora del corte del TSJE y si los resultados siguen en escrutinio ("En vivo") o son finales pero no oficiales ("Provisorio").
- **Datos actualizados sin intervención.** Si el último dato guardado tiene más de 5 minutos, se vuelve a pedir al TSJE al abrir la página. Los resultados marcados como finales ya no se vuelven a pedir.

---

## Stack tecnológico

| Capa          | Tecnología                                          | Por qué                                                                                                                                                                                          |
| ------------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Framework     | **Next.js 16** (App Router, Turbopack)              | Los Server Components consultan la base y el TSJE directamente en el servidor, sin una API intermedia. Las páginas son `force-dynamic` porque los resultados cambian durante todo el escrutinio. |
| UI            | **React 19**                                        | Las transiciones (`useTransition`) mantienen los selectores fluidos mientras el servidor carga el distrito nuevo, y muestran un indicador de carga.                                              |
| Lenguaje      | **TypeScript**                                      | La respuesta del TSJE tiene una forma compleja (totales, candidatos, preferenciales). Tiparla (`lib/tsje/types.ts`) evita errores silenciosos en los cálculos.                                   |
| Base de datos | **PostgreSQL en Neon** (`@neondatabase/serverless`) | Postgres serverless con un plan gratuito generoso y conexión por HTTP, que encaja con el despliegue serverless de Next.js. Las respuestas del TSJE se guardan como `jsonb` sin modificar.        |
| ORM           | **Drizzle ORM + drizzle-kit**                       | Liviano, con tipos derivados del esquema y migraciones SQL versionadas en `drizzle/`. Sin runtime pesado ni generación de clientes.                                                              |
| Tests         | **Vitest + Testing Library + jsdom**                | Rápido, compatible con ESM y TypeScript sin configuración extra. Cubre la lógica crítica: D'Hondt, electos, sincronización y cliente del TSJE.                                                   |
| Calidad       | **ESLint** (`eslint-config-next`)                   | Reglas estándar de Next.js y React.                                                                                                                                                              |
| Scripts       | **tsx**                                             | Ejecuta el seed de la base directamente en TypeScript.                                                                                                                                           |

---

## Arquitectura

```
                 ┌──────────────────────────────────────┐
  Navegador ───▶ │  Next.js (Server Components)         │
                 │  app/page.tsx · intendente · concej. │
                 └───────────────┬──────────────────────┘
                                 │
                   obtenerOSincronizarSnapshot()
                                 │
      ¿snapshot final o de menos de 5 min en la base?
                 │ sí                              │ no
                 ▼                                 ▼
        ┌─────────────────┐            ┌──────────────────────┐
        │ Postgres (Neon) │◀── guarda ─│ Cliente TSJE         │
        │ resultados_     │            │ (+ firewall Sucuri)  │
        │ snapshot (jsonb)│            └──────────────────────┘
        └────────┬────────┘
                 ▼
     lib/queries → lib/dhondt → vista lista para renderizar
```

### Decisiones de diseño

- **Snapshots con caché de 5 minutos.** Cada combinación de elección, distrito y tipo de candidatura se guarda como snapshot en Postgres. Si el TSJE devuelve los mismos resultados que el último snapshot, no se inserta una fila nueva: solo se renueva su fecha. Si el TSJE falla o está lento, se muestra el último dato disponible: es preferible un dato algo viejo a una pantalla vacía. Una vez que un snapshot se marca como final (resultado final, no oficial), ya no se vuelve a pedir al TSJE.
- **Sincronización a demanda y en lote.** `lib/sync/on-demand.ts` actualiza el distrito que se está viendo. `lib/sync/lote.ts` (se ejecuta con `npm run sync:general`) sincroniza todos los distritos de la elección activa de a un pedido por vez, con pausa entre pedidos para no sobrecargar al TSJE, empezando por Capital, Central y Alto Paraná. Al terminar, marca los resultados sincronizados como finales.
- **Inyección de dependencias en la lógica de sync.** Las funciones reciben sus dependencias (fetch, base de datos, reloj), así que los tests corren sin `DATABASE_URL` ni red.
- **Firewall Sucuri.** El sitio del TSJE está detrás de Sucuri, que plantea un desafío _proof-of-work_ (SHA-256). `lib/tsje/sucuri.ts` lo resuelve, obtiene la cookie de sesión y la renueva cuando el TSJE responde 403.
- **Cálculo puro y testeado.** `lib/dhondt/` contiene funciones puras: `calcularDHondt` reparte las bancas, `calcularElectos` ordena por voto preferencial y `bancasDesdeRespuesta` deduce cuántas bancas hay en el distrito.
- **Clave geográfica compuesta.** El id de un distrito solo es único dentro de su departamento, por eso `municipios` usa la clave primaria compuesta `(departamento_id, id)`.

---

## Estructura del proyecto

```
app/
  page.tsx               # Inicio: selector de elección / departamento / distrito
  intendente/page.tsx    # Resultados de Intendente
  concejales/page.tsx    # Resultados de Concejales + D'Hondt
  components/            # NavBar, selectores, DHondtTable, SeatDistributionBar, ...
lib/
  tsje/                  # Cliente HTTP del TSJE, solver de Sucuri y tipos de la respuesta
  db/                    # Esquema Drizzle, cliente Neon y seed de geografía/elecciones
  sync/                  # Sincronización on-demand y en lote de snapshots
  queries/               # Transforman un snapshot en la vista de cada página
  dhondt/                # Método D'Hondt, cálculo de bancas y electos
drizzle/                 # Migraciones SQL generadas por drizzle-kit
docs/                    # Diseño (pantallas, design system), JSON de referencia y capturas
```

---

## Puesta en marcha

### Requisitos

- Node.js 20 o superior
- Una base PostgreSQL (recomendado: un proyecto gratuito en [Neon](https://neon.tech))

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar variables de entorno

```bash
cp .env.local.example .env.local
```

Completar `DATABASE_URL` con la cadena de conexión de Postgres:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### 3. Crear las tablas y cargar los datos base

```bash
npx drizzle-kit migrate   # aplica las migraciones de drizzle/
npm run db:seed           # carga departamentos, distritos y elecciones
```

### 4. Levantar la app

```bash
npm run dev
```

Abrir [http://localhost:3000](http://localhost:3000). La primera vez que se abre un distrito, la app pide los resultados al TSJE y los guarda.

---

## Scripts

| Comando                | Descripción                                                                              |
| ---------------------- | ---------------------------------------------------------------------------------------- |
| `npm run dev`          | Servidor de desarrollo (Turbopack)                                                       |
| `npm run build`        | Build de producción                                                                      |
| `npm run start`        | Sirve el build de producción                                                             |
| `npm run lint`         | ESLint                                                                                   |
| `npm test`             | Corre la suite de tests con Vitest                                                       |
| `npm run db:seed`      | Carga geografía y elecciones en la base                                                  |
| `npm run sync:general` | Sincroniza todos los distritos de la elección activa y marca los resultados como finales |

---

## Cómo se reparten las bancas (método D'Hondt)

1. Los votos de cada lista se dividen por 1, 2, 3, … hasta la cantidad de bancas en juego.
2. Se ordenan todos los cocientes de mayor a menor.
3. Los _N_ cocientes más altos ganan una banca cada uno (_N_ = bancas del distrito).
4. Dentro de cada lista, las bancas van a los candidatos con más votos preferenciales.

La tabla "Asignación por el método D'Hondt" de la pantalla de Concejales muestra cada cociente y el número de orden de la banca que obtuvo.

---

## Aviso

Escrutinia es un proyecto independiente y **no está afiliado al TSJE**. Los datos provienen del TREP, que es **preliminar y no oficial**: los resultados definitivos son los del juzgamiento oficial del TSJE. El reparto de bancas es una proyección hecha con los votos escrutados hasta el momento.
