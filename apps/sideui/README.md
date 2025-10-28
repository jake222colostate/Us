# Us Side-by-Side Web UI

The side-by-side experience is a Vite + React + Tailwind application that mirrors the Expo app while consuming the shared API client.

## Getting Started

```bash
pnpm install
pnpm web:dev
```

The dev server respects `VITE_API_BASE_URL` from your `.env` file. By default it falls back to `http://127.0.0.1:8000`.

```bash
# apps/sideui/.env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Other useful scripts:

```bash
pnpm web:build    # production bundle
pnpm web:preview  # run the production build locally
```

## Tech Stack

- Vite + React 18
- TypeScript + Tailwind CSS
- shadcn/ui component primitives
- `@tanstack/react-query` for data fetching
- Shared auth store and API client from `packages/auth` and `packages/api-client`

## API & Auth

Both mobile and web share the `@us/api-client` and `@us/auth` packages. The web app stores the session token in `localStorage`; the Expo app should provide an Expo Secure Store-backed implementation.

## Troubleshooting

- Missing data? Confirm `VITE_API_BASE_URL` points to a reachable API.
- Need to rebuild shared packages? Run `pnpm -r build` from the repo root.
- Stale auth state? Clear `localStorage` or call `logout()` from the Settings screen.
