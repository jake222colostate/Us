# Us — Full-Stack Relationship Platform

Us is a cross-platform relationship app that combines a TikTok-style discovery feed, matchmaking flows, secure messaging, and monetisation hooks. The repository is a PNPM workspace that ships both the frontend experiences (mobile + responsive web) and the Supabase-backed API/infra that power them.

This README is meant to give an AI assistant or human contributor everything required to understand the moving pieces, wire up the environment, and ship changes confidently.

---

## Architecture at a Glance

| Layer | Location | Tech | Notes |
| --- | --- | --- | --- |
| Web app | `frontend/us-side-by-side` | Vite 5 + React 18 + TypeScript + Tailwind CSS | Public-facing web UI with protected routes, matchmaking feed, chat, notifications, onboarding, and settings screens. Uses TanStack Query for data fetching and React Router for navigation. |
| Mobile app | `apps/mobile` | Expo / React Native | Cross-platform client that reuses shared packages. Not the focus of this task but included for completeness. |
| Legacy web | `apps/sideui` | Vite + React | Previous side-by-side build. Kept for reference; new web work happens in `frontend/us-side-by-side`. |
| API client | `packages/api-client` | TypeScript | REST client abstractions consumed by both mobile and web. |
| Shared UI | `packages/ui` | TypeScript / React | Reusable components (buttons, cards, etc.). |
| Shared types | `packages/types` | TypeScript | Common domain types. |
| Config helpers | `packages/config` | TypeScript | Environment loader utilities. |
| Auth utilities | `packages/auth` | TypeScript | Authentication context for native clients. |
| Infrastructure | `infra/supabase` | Supabase SQL, Edge Functions | Database schema, policies, seed scripts, and serverless functions. |

Supporting tooling lives under `tools/` (binary checks, asset seeding) and `tsup/` (build configurations).

---

## Technology Stack

- **Frontend (web)**: React 18, React Router 6, TanStack Query 5, Tailwind CSS, ShadCN component primitives, Vite 5, TypeScript 5.8.
- **Mobile**: Expo SDK 50, React Native.
- **Backend**: Supabase (PostgreSQL, Row-Level Security, Edge Functions), custom REST endpoints exposed via `packages/api-client`.
- **State/Data**: TanStack Query for async state, React Context for auth, local storage for lightweight client preferences.
- **Tooling**: PNPM workspace, ESLint 9, Prettier 3, TypeScript project references, Tailwind Merge + clsx utilities, Vitest/Jest (where available), Expo CLI for native clients.

---

## Prerequisites

- Node.js 18+
- PNPM 8+
- Optional: Supabase CLI (`pnpm dlx supabase`) for database and edge function workflows.
- Optional: Expo CLI (`npx expo`) if you plan to work on the mobile app.
- Accounts/keys for Stripe and RevenueCat if you intend to test monetisation flows end-to-end.

---

## Workspace Layout & Commands

The repository is a PNPM workspace (`package.json` + `pnpm-workspace.yaml`). Key root scripts:

- `pnpm install` – installs dependencies for every workspace.
- `pnpm dev` – starts the Vite dev server for `frontend/us-side-by-side`.
- `pnpm build` – runs the production web build for `frontend/us-side-by-side`.
- `pnpm dev:frontend` / `pnpm build:frontend` – legacy helpers that point at `frontend/` aggregate scripts.
- `pnpm web:dev` / `pnpm web:build` – start/build the historical `apps/sideui` project (rarely used now).
- `pnpm mobile:start` – launches the Expo dev client for the native app.
- `pnpm lint`, `pnpm typecheck`, `pnpm test` – standard quality gates executed recursively across the workspace.
- `pnpm migrate:dev` & `pnpm seed` – apply Supabase database migrations and seed data.
- `pnpm seed:assets` – fetches development-only imagery required by the apps.

Root tooling scripts under `tools/` help enforce the “no binary blobs in git” policy (`repo:check-binaries`, `repo:strip-binaries`, etc.).

---

## Environment Variables

### Web (Vite) – `frontend/us-side-by-side`

Create `frontend/us-side-by-side/.env` (or use `.env.local`) and populate:

```
VITE_API_BASE=<REST API base URL>
VITE_API_PROXY_TARGET=<optional proxy target for local dev>
```

During development the Vite server proxies `/api` to `VITE_API_PROXY_TARGET` when provided. Authentication flows rely on Supabase endpoints exposed through that API.

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

1. **Install Supabase CLI**: `pnpm dlx supabase init` (run once).
2. **Provision local stack**: `supabase start` spins up Postgres + edge function emulators.
3. **Apply schema**: `pnpm migrate:dev` executes SQL migrations located in `infra/supabase/migrations`.
4. **Seed data**: `pnpm seed` loads baseline data so feeds, matches, and profiles have content.
5. **Run edge functions**: `supabase functions serve --env-file infra/supabase/.env.dev` to test serverless logic locally.

The API client (`packages/api-client`) communicates with Supabase via REST endpoints and expects bearer tokens returned from Supabase auth.

---

## Frontend Setup (Vite + React)

1. Install dependencies: `pnpm install` at the repository root.
2. Provide env vars (`frontend/us-side-by-side/.env`).
3. Start the dev server: `pnpm dev` (aliases to `pnpm --filter frontend/us-side-by-side dev`). The app runs on <http://localhost:5173> by default and proxies API requests if `VITE_API_PROXY_TARGET` is set.
4. For local Supabase integration, ensure the backend is running (see previous section) so `/api` responses succeed.
5. Storybook is not configured; UI components live under `src/components` and use ShadCN primitives with Tailwind classes.

Key frontend directories:

- `src/App.tsx` – route tree and providers (React Router, TanStack Query, theming, auth context).
- `src/main.tsx` – React entry point using `createRoot` and optional client error reporter in dev.
- `src/components/` – UI modules (navigation, cards, modal, protected route, etc.).
- `src/hooks/` – Custom hooks for auth, feed, onboarding, chat, etc.
- `src/lib/` – API clients, data utilities, and the `cn` helper that wraps `clsx` + `tailwind-merge` safely.
- `src/pages/` – Route components covering feed, likes, matches, chat, onboarding, settings, help, etc.

The routing layer is namespace-imported (`import * as RRD from "react-router-dom"`) to avoid brittle ESM export differences across tooling.

### Production Build

Run `pnpm build` from the repo root. This executes `vite build` in `frontend/us-side-by-side` and outputs `frontend/us-side-by-side/dist`. Deploy the contents of that directory to a static host or serve locally with `pnpm --filter frontend/us-side-by-side preview`.

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

- **Linting**: `pnpm lint` (ESLint 9 with React, hooks, import rules, Prettier integration).
- **Type Checking**: `pnpm typecheck` runs `tsc --noEmit` across all packages via workspace recursion.
- **Tests**: `pnpm test` executes package-level test suites (Vitest/Jest depending on the workspace).

Run these before opening a PR to maintain repository health.

---

## Asset & Binary Policy

Binary artefacts (images, audio, compiled outputs, signing keys) must not be committed. Instead:

1. Remove staged binaries: `pnpm repo:unstage-binaries`.
2. Strip binaries from history (if needed): `pnpm repo:strip-binaries`.
3. Validate the tree: `pnpm repo:check-binaries`.
4. Use `pnpm seed:assets` to populate development-only imagery locally.

---

## Troubleshooting & Tips

- **React/Router import errors**: All components use namespace imports (`import * as React` / `import * as RRD`) to avoid named export mismatches when bundling with Vite or TS config variations.
- **Tailwind merge issues**: `src/lib/utils.ts` exposes a resilient `cn` helper that resolves both default and named exports from `clsx` and `tailwind-merge`.
- **Auth redirects**: `src/hooks/useAuth.tsx` centralises auth state, handles token refresh, and manually syncs navigation history to keep React Router aware of redirects.
- **API calls**: Check `src/lib/api/client.ts` and `src/lib/api/endpoints.ts` for request wrappers, interceptors, and error handling (including 401 hooks).
- **Protected routes**: `src/components/ProtectedRoute.tsx` gates authenticated pages and shows loading/errors gracefully.

---

## Release Checklist

1. `pnpm install`
2. `pnpm lint && pnpm typecheck && pnpm test`
3. `pnpm build`
4. Deploy `frontend/us-side-by-side/dist` to your hosting provider.
5. For backend changes, apply migrations (`pnpm migrate:dev`) and redeploy Supabase functions.

With these steps documented, an AI assistant or new contributor should be able to understand the entire stack, bootstrap the environment, and push changes without guesswork.
