# Escrutinia

_English · [Español](README.es.md)_

**Results of Paraguay's municipal elections, district by district, with the allocation of council seats calculated in real time.**

Escrutinia takes the TREP data (Transmisión de Resultados Electorales Preliminares, the preliminary results transmission) published by the Superior Tribunal of Electoral Justice (TSJE) and presents it clearly: who is winning the mayor's office and **how the seats of the Municipal Council would be allocated** under the D'Hondt method, including which candidates would be elected by preferential vote.

The official TSJE site shows votes per list, but it does not calculate the seat allocation or who would get in. Escrutinia does that calculation and shows it step by step.

---

## Screenshots

The app is built for a Paraguayan audience, so the interface is in Spanish.

### Home: choose the election, department and district

![Home screen](docs/screenshots/inicio.png)

### Mayor (Intendente): votes per candidate and vote-count totals

![Mayor results](docs/screenshots/intendente.png)

### Councilors (Concejales): seat distribution, D'Hondt table and elected councilors

![Councilor results](docs/screenshots/concejales.png)

---

## Features

- **Election, department and district selector.** The selection is stored in the URL, so any view can be shared or bookmarked.
- **Mayor results.** Votes counted, percentage of polling stations processed, blank and null votes, and a ranking of candidates with proportional bars and each list's color.
- **Councilor results:**
  - Number of seats up for allocation, inferred from the number of candidates each list fields (24 in Asunción, 12 in most districts, 9 in Yguazú, etc.).
  - Seat distribution bar per list.
  - **Full D'Hondt table** with every quotient (votes ÷ 1, ÷ 2, …), marking the order in which each seat is assigned.
  - **Elected councilors** per list, ranked by preferential vote.
- **Status indicator.** Each view shows the time of the TSJE's cut-off and whether the results are still being counted ("En vivo", live) or are final but unofficial ("Provisorio", provisional).
- **Data kept up to date without intervention.** If the last stored data is more than 5 minutes old, it is requested again from the TSJE when the page is opened. Results marked as final are no longer requested.

---

## Tech stack

| Layer     | Technology                                          | Why                                                                                                                                                                             |
| --------- | --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Framework | **Next.js 16** (App Router, Turbopack)              | Server Components query the database and the TSJE directly on the server, with no intermediate API. Pages are `force-dynamic` because results change throughout the vote count. |
| UI        | **React 19**                                        | Transitions (`useTransition`) keep the selectors responsive while the server loads the new district, and show a loading indicator.                                              |
| Language  | **TypeScript**                                      | The TSJE response has a complex shape (totals, candidates, preferential votes). Typing it (`lib/tsje/types.ts`) prevents silent errors in the calculations.                     |
| Database  | **PostgreSQL on Neon** (`@neondatabase/serverless`) | Serverless Postgres with a generous free tier and an HTTP connection, which fits Next.js's serverless deployment. TSJE responses are stored unmodified as `jsonb`.              |
| ORM       | **Drizzle ORM + drizzle-kit**                       | Lightweight, with types derived from the schema and versioned SQL migrations in `drizzle/`. No heavy runtime or client generation.                                              |
| Tests     | **Vitest + Testing Library + jsdom**                | Fast, works with ESM and TypeScript without extra configuration. Covers the critical logic: D'Hondt, elected candidates, synchronization and the TSJE client.                   |
| Quality   | **ESLint** (`eslint-config-next`)                   | Standard Next.js and React rules.                                                                                                                                               |
| Scripts   | **tsx**                                             | Runs the database seed directly in TypeScript.                                                                                                                                  |

---

## Architecture

```
                 ┌──────────────────────────────────────┐
  Browser ─────▶ │  Next.js (Server Components)         │
                 │  app/page.tsx · intendente · concej. │
                 └───────────────┬──────────────────────┘
                                 │
                   obtenerOSincronizarSnapshot()
                                 │
      final snapshot, or under 5 min old, in the database?
                 │ yes                             │ no
                 ▼                                 ▼
        ┌─────────────────┐            ┌──────────────────────┐
        │ Postgres (Neon) │◀── saves ──│ TSJE client          │
        │ resultados_     │            │ (+ Sucuri firewall)  │
        │ snapshot (jsonb)│            └──────────────────────┘
        └────────┬────────┘
                 ▼
     lib/queries → lib/dhondt → view ready to render
```

### Design decisions

- **Snapshots with a 5-minute cache.** Each combination of election, district and candidacy type is stored as a snapshot in Postgres. If the TSJE returns the same results as the last snapshot, no new row is inserted: only its timestamp is renewed. If the TSJE fails or is slow, the latest available data is shown: slightly old data is better than an empty screen. Once a snapshot is marked as final (final but unofficial results), it is no longer requested from the TSJE.
- **On-demand and batch synchronization.** `lib/sync/on-demand.ts` updates the district being viewed. `lib/sync/lote.ts` (run with `npm run sync:general`) syncs every district of the active election one request at a time, pausing between requests so as not to overload the TSJE, starting with Capital, Central and Alto Paraná. It then marks the synced results as final.
- **Dependency injection in the sync logic.** Functions receive their dependencies (fetch, database, clock), so tests run without `DATABASE_URL` or network access.
- **Sucuri firewall.** The TSJE site sits behind Sucuri, which poses a _proof-of-work_ challenge (SHA-256). `lib/tsje/sucuri.ts` solves it, obtains the session cookie and renews it when the TSJE responds with 403.
- **Pure, tested calculations.** `lib/dhondt/` contains pure functions: `calcularDHondt` allocates the seats, `calcularElectos` ranks by preferential vote and `bancasDesdeRespuesta` infers how many seats the district has.
- **Composite geographic key.** A district's id is only unique within its department, so `municipios` uses the composite primary key `(departamento_id, id)`.

---

## Project structure

```
app/
  page.tsx               # Home: election / department / district selector
  intendente/page.tsx    # Mayor results
  concejales/page.tsx    # Councilor results + D'Hondt
  components/            # NavBar, selectors, DHondtTable, SeatDistributionBar, ...
lib/
  tsje/                  # TSJE HTTP client, Sucuri solver and response types
  db/                    # Drizzle schema, Neon client and geography/elections seed
  sync/                  # On-demand and batch snapshot synchronization
  queries/               # Turn a snapshot into each page's view
  dhondt/                # D'Hondt method, seat count and elected candidates
drizzle/                 # SQL migrations generated by drizzle-kit
docs/                    # Design (screens, design system), reference JSON and screenshots
```

---

## Getting started

### Requirements

- Node.js 20 or later
- A PostgreSQL database (recommended: a free project on [Neon](https://neon.tech))

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment variables

```bash
cp .env.local.example .env.local
```

Fill in `DATABASE_URL` with the Postgres connection string:

```env
DATABASE_URL="postgresql://user:password@host/dbname?sslmode=require"
```

### 3. Create the tables and load the base data

```bash
npx drizzle-kit migrate   # applies the migrations in drizzle/
npm run db:seed           # loads departments, districts and elections
```

### 4. Start the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The first time a district is opened, the app requests the results from the TSJE and stores them.

---

## Scripts

| Command                | Description                                                                |
| ---------------------- | -------------------------------------------------------------------------- |
| `npm run dev`          | Development server (Turbopack)                                             |
| `npm run build`        | Production build                                                           |
| `npm run start`        | Serves the production build                                                |
| `npm run lint`         | ESLint                                                                     |
| `npm test`             | Runs the test suite with Vitest                                            |
| `npm run db:seed`      | Loads geography and elections into the database                            |
| `npm run sync:general` | Syncs every district of the active election and marks the results as final |

---

## How seats are allocated (D'Hondt method)

1. Each list's votes are divided by 1, 2, 3, … up to the number of seats at stake.
2. All quotients are sorted from highest to lowest.
3. The _N_ highest quotients win one seat each (_N_ = the district's seats).
4. Within each list, seats go to the candidates with the most preferential votes.

The "Asignación por el método D'Hondt" (D'Hondt allocation) table on the Councilors screen shows each quotient and the order number of the seat it won.

---

## Disclaimer

Escrutinia is an independent project and is **not affiliated with the TSJE**. The data comes from the TREP, which is **preliminary and unofficial**: the final results are those of the TSJE's official adjudication. The seat allocation is a projection based on the votes counted so far.
