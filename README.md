This README is meant to give an AI assistant or human contributor everything required to understand the moving pieces, wire up the environment, and ship changes confidently.

---

## Architecture at a Glance

| Layer | Location | Tech | Notes |
| --- | --- | --- | --- |
| Web app | `apps/sideui` | Vite 5 + React 18 + TypeScript | Lightweight customer-facing UI. Uses a small set of locally defined components and plain CSS so it can be installed offline without pulling third-party UI kits. |
| Mobile app | `apps/mobile` | Expo SDK 50 / React Native | Cross-platform client that reuses the shared packages. Focused on core matchmaking and messaging flows. |
| API client | `packages/api-client` | TypeScript | REST client abstractions consumed by both mobile and web. |
| Shared UI | `packages/ui` | TypeScript / React | Reusable primitives for the mobile app. |
| Shared types | `packages/types` | TypeScript | Common domain types. |
| Config helpers | `packages/config` | TypeScript | Environment loader utilities. |
| Auth utilities | `packages/auth` | TypeScript | Authentication context for native clients. |
| Infrastructure | `infra/supabase` | Supabase SQL & edge functions | Database schema, policies, seed scripts, and serverless functions. Requires the Supabase CLI (install separately). |

Supporting tooling lives under `tools/` (binary checks, asset seeding) and `tsup/` (build configurations).

---

## Technology Stack

- **Web**: React 18, React Router, TanStack Query, Vite 5, TypeScript 5.3. Styling is plain CSS so that installs work offline.
- **Mobile**: Expo SDK 50, React Native 0.73, TanStack Query, Zustand.
- **Backend**: Supabase (PostgreSQL, Row-Level Security, Edge Functions) accessed through the shared API client.
- **Tooling**: PNPM workspaces, ESLint 8, Prettier 3, Vitest, TypeScript project references.

---

## Prerequisites

- Node.js 18+
- PNPM 8+
- Optional: Supabase CLI (`npm install -g supabase` or `pnpm dlx supabase`) for database and edge-function workflows.
- Optional: Expo CLI (`npx expo`) if you plan to work on the mobile app.

> The Supabase CLI is no longer bundled as a workspace dependency. Install it globally if you need the database tooling.

---

## Workspace Layout & Commands

The repository is a PNPM workspace (`package.json` + `pnpm-workspace.yaml`). Key root scripts:

- `pnpm install` – installs dependencies for every workspace. Works fully offline after the first checkout.
- `pnpm dev` – starts the Vite dev server for `apps/sideui` (http://localhost:5173).
- `pnpm build` – runs the production web build for `apps/sideui`.
- `pnpm web:dev` / `pnpm web:build` – shorthand aliases for the same `apps/sideui` commands.
- `pnpm mobile:start` – launches the Expo dev client for the native app.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` – standard quality gates executed recursively across the workspace.
- `pnpm migrate:dev` & `pnpm seed` – apply Supabase database migrations and seed data (Supabase CLI required).
- `pnpm seed:assets` – fetches development-only imagery required by the apps.

Root tooling scripts under `tools/` help enforce the “no binary blobs in git” policy (`repo:check-binaries`, `repo:strip-binaries`, etc.).

### Offline install

A fresh clone can bootstrap without internet access once the repository is checked out:

```bash
pnpm install --offline
```

All third-party packages required by the remaining workspaces are vendored in the repository cache, so no registry access is needed.

---

## Environment Variables

### Web (Vite) – `apps/sideui`

The current UI only depends on API endpoints configured in the shared `packages/config` package. If you need custom values, create `apps/sideui/.env` and add variables that your code reads via `import.meta.env`.

### Mobile (Expo) – `apps/mobile`

Set Expo public env vars via `.env` or `app.config.ts`:

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_BILLING_MODE=stripe_only | auto
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
EXPO_PUBLIC_REVENUECAT_SDK_KEY
EXPO_PUBLIC_BIGHEART_PRICE_USD=3.99
```

### Supabase / Edge Functions – `infra/supabase`

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EXPO_ACCESS_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
REVENUECAT_SECRET # optional
```

Copy `.env.example` in that folder to `.env.dev` and fill in the values. CLI commands (`supabase start`, `supabase functions serve`, etc.) respect this file.

---

## Backend Setup (Supabase)

1. **Install Supabase CLI** globally (`npm install -g supabase`).
2. **Provision local stack**: `supabase start` spins up Postgres + edge-function emulators.
3. **Apply schema**: `pnpm migrate:dev` executes SQL migrations located in `infra/supabase/migrations`.
4. **Seed data**: `pnpm seed` loads baseline data so feeds, matches, and profiles have content.
5. **Run edge functions**: `supabase functions serve --env-file infra/supabase/.env.dev` to test serverless logic locally.

The API client (`packages/api-client`) communicates with Supabase via REST endpoints and expects bearer tokens returned from Supabase auth.

---

## Frontend Setup (Vite + React)

1. Install dependencies: `pnpm install` (use `--offline` if you are in an isolated environment).
2. Start the dev server: `pnpm dev` (aliased to `pnpm --filter sideui dev`). The app runs on <http://localhost:5173>.
3. Adjust configuration in `apps/sideui/src/config.ts` if you need to point at different API URLs.
4. Run a production build with `pnpm build`. Artifacts are emitted to `apps/sideui/dist`.

Key directories:

- `apps/sideui/src/App.tsx` – React entry point.
- `apps/sideui/src/pages/` – Route components (feed, likes, chat, onboarding, etc.).
- `apps/sideui/src/components/` – UI building blocks used across pages.
- `apps/sideui/src/lib/` – Lightweight utilities for data shaping and demo data.

---

## Mobile App Workflow (Optional)

The Expo app reuses shared packages and mirrors core functionality:

```bash
pnpm install
pnpm seed:assets  # fetch dev imagery/icons
pnpm mobile:start # launches Expo start (Metro bundler)
```

Use the Expo Go app or device simulators to preview. Avoid committing generated native projects; run `pnpm --filter app-mobile expo prebuild` if you need a native workspace locally.

---

## Quality Gates

- **Linting**: `pnpm lint` (ESLint 8 with React, hooks, import rules, Prettier integration).
- **Type Checking**: `pnpm typecheck` runs `tsc --noEmit` across all packages via workspace recursion.
- **Testing**: `pnpm test` executes Vitest suites across packages. Mobile tests now focus on pure helpers so they run entirely in Node without Metro.

---

## Troubleshooting

- **Supabase CLI missing**: install it globally (`npm install -g supabase`) because the workspace no longer downloads the binary during `pnpm install`.
- **Peer warning for `react-native`**: the repository pins React 18.3.1 for the web while Expo SDK 50 expects 18.2.0. This mismatch is benign for the web build; the mobile app brings its own React runtime when you run it through Expo.
- **Offline installation**: if `pnpm install` complains about missing tarballs, ensure you are using `pnpm install --offline`. The repository vendors the required store contents under `node_modules/.pnpm`.

