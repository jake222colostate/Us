# Us Side-by-Side Frontend

A Vite + React application for the Us dating experience. This project consumes backend services deployed on RunPod and focuses on responsive, mobile-first flows for feed browsing, matches, chat, and onboarding.

## Prerequisites

- Node.js v20+
- pnpm v8+

Install dependencies with:

```sh
pnpm install
```

## Environment configuration

Create a `.env.local` (or `.env.development`) file to configure backend targets:

```ini
VITE_API_BASE=https://your-backend.example.com
# Optional: enables vite dev proxy /api -> backend
VITE_API_PROXY_TARGET=http://localhost:4000
```

Only keys prefixed with `VITE_` are exposed to the client. `VITE_API_BASE` should include the protocol and host; it is trimmed of trailing slashes automatically.

## Available scripts

```sh
pnpm dev --host --port 8000  # start the dev server (strict port)
pnpm build                   # production build
pnpm preview                 # preview the production build
```

The dev server runs on port **8000** with `strictPort: true`. If you need to point `/api/*` traffic to a local backend, supply `VITE_API_PROXY_TARGET` when starting dev mode:

```sh
VITE_API_PROXY_TARGET=http://127.0.0.1:4000 pnpm dev --host --port 8000
```

## Client error logging in dev

During development the app installs a lightweight middleware at `POST /__client-log`. Browser runtime errors and unhandled promise rejections are forwarded to that endpoint and printed to the Vite terminal log. This provides actionable stack traces without relying solely on DevTools.

## API integration overview

Key features rely on the following endpoints (all relative to `VITE_API_BASE` or the dev proxy):

| Feature | Method & Path |
| --- | --- |
| Session | `GET /api/auth/session`, `POST /api/auth/login`, `POST /api/auth/signup`, `POST /api/auth/logout`, `POST /api/auth/refresh` |
| Feed | `GET /api/feed`, `POST /api/feed/:postId/like`, `POST /api/feed/:postId/dislike` |
| Matches | `GET /api/matches`, `POST /api/matches` |
| Chat | `GET /api/chat/conversations`, `GET /api/chat/conversations/:id`, `GET /api/chat/conversations/:id/messages`, `POST /api/chat/conversations/:id/messages` |
| Likes | `GET /api/likes` |
| Notifications | `GET /api/notifications` |
| Profile | `GET /api/profile`, `PUT /api/profile`, `POST /api/profile/avatar` |
| Other users | `GET /api/users/:id` |
| Onboarding | `GET /api/onboarding`, `POST /api/onboarding` |
| Health | `GET /api/health`, `GET /api/ready` |

All requests are issued with `credentials: 'include'` to support cookie-based sessions. `401` responses automatically clear session state and redirect to `/auth`.

## Troubleshooting

- Ensure no custom scripts import `/@vite/client`; HMR is handled by Vite automatically.
- `clsx` must always be imported via `import { clsx } from 'clsx'` and never aliased.
- If the dev server logs repeated client errors, check the terminal for the mirrored stack trace emitted via `/__client-log`.
- Verify `VITE_API_BASE` or the dev proxy is reachable by running the included verification script (`./scripts/verify-dev.sh`).

## Verification script

Run the script before handing off changes to confirm the dev workflow:

```sh
./scripts/verify-dev.sh
```

The script clears Vite caches, ensures port 8000 is free, boots the dev server, probes `/` and `/@vite/client`, and prints the detected toolchain versions.

## Changelog

Recent updates are tracked in [`CHANGELOG.md`](CHANGELOG.md).
