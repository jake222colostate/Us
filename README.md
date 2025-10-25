# Us — Cross-Platform Dating App

Us is a production-ready, Expo-powered dating experience with an IG/TikTok-inspired vertical feed, Big Heart monetisation, and a collaborative "Us Photo" composer with mirror support.

## Monorepo Layout

```
/apps/mobile        Expo application (iOS, Android, web)
/infra/supabase     Database schema, RLS, seeds, edge functions
/packages/ui        Shared component system
/packages/types     Shared TypeScript interfaces
/packages/config    Environment loader utilities
```

## Requirements

- Node 18+
- pnpm 8+
- Supabase CLI (`pnpm dlx supabase`)
- Expo CLI (`npx expo`) for local testing
- Stripe test account (web Big Heart flow)
- RevenueCat account (native Big Heart flow)

## Environment Variables

Mobile app (`apps/mobile/app.config.ts` expects Expo public env):

```
EXPO_PUBLIC_SUPABASE_URL
EXPO_PUBLIC_SUPABASE_ANON_KEY
EXPO_PUBLIC_BILLING_MODE=auto | stripe_only
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY
EXPO_PUBLIC_REVENUECAT_SDK_KEY
EXPO_PUBLIC_BIGHEART_PRICE_USD=3.99
```

Edge functions (`infra/supabase/functions`):

```
SUPABASE_URL
SUPABASE_SERVICE_ROLE_KEY
EXPO_ACCESS_TOKEN
STRIPE_SECRET_KEY
STRIPE_WEBHOOK_SECRET
REVENUECAT_SECRET (optional)
```

## Getting Started

```bash
pnpm install
pnpm migrate:dev    # applies SQL schema to local Supabase
pnpm seed           # optional sample data
```

## No Binary Files in Git

This repo intentionally excludes binaries (images, audio, video, Pods, build artefacts, and signing files). Use the development seeding workflow instead of committing binary blobs.

### First run

```bash
pnpm install
pnpm seed:assets
pnpm dev:web   # RunPod-friendly
```

`pnpm seed:assets` downloads development-only photos **and** the Expo icon/adaptive icon/favicon into `apps/mobile/assets/dev/`. Run it before starting the app so the build pipeline can pick up the required artwork without committing binaries to git.

### If your push is blocked: "Binary files are not supported"

1. Drop currently staged binaries:

   ```bash
   pnpm repo:unstage-binaries
   ```

2. If the remote still rejects past commits, rewrite history (coordinate with your team before running):

   ```bash
   pnpm repo:strip-binaries
   git push -u origin main --force
   ```

3. Validate the repository is binary-free before opening a PR:

   ```bash
   pnpm repo:check-binaries || node tools/check_binaries.mjs
   ```

   The check scans tracked, staged, and untracked files so you can catch stray assets before they ever hit git history. It fails on tracked or staged offenders and prints a warning for any untracked binaries still lingering in your working tree. The fallback `node` invocation runs automatically if `pnpm` is unavailable (e.g., offline or blocked registries), and you can call it directly when scripting your own hooks.

### Running on Web / RunPod

```bash
export EXPO_PUBLIC_BILLING_MODE=stripe_only
export EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
export EXPO_PUBLIC_SUPABASE_URL=...
export EXPO_PUBLIC_SUPABASE_ANON_KEY=...
pnpm dev:web -- --port 8080
```

### Running on Native

```bash
export EXPO_PUBLIC_SUPABASE_URL=...
export EXPO_PUBLIC_SUPABASE_ANON_KEY=...
export EXPO_PUBLIC_REVENUECAT_SDK_KEY=public_sdk_key
pnpm --filter app-mobile dev:native
```

Build with EAS (after configuring `eas.json` and credentials):

```bash
eas build -p ios
# or
eas build -p android
```

#### Generate native projects locally (no binaries in git)

The repo intentionally tracks source only—do **not** commit build artefacts, Pods, keystores, or signing files. Generate platform
projects on-demand:

```bash
pnpm --filter app-mobile expo prebuild -p ios -p android
# then, on macOS
cd ios && pod install && open Us.xcworkspace
```

Signing assets (`.p12`, `.mobileprovision`, `.keystore`, etc.) should live outside git and be managed via EAS credentials. Assets
are loaded from URLs in the seed script; if you need local placeholders, add them under `apps/mobile/assets/`.

## Supabase

1. Install the CLI: `pnpm dlx supabase init`
2. Copy `.env.example` to `infra/supabase/.env.dev` and fill in Supabase keys.
3. Run `pnpm migrate:dev` then `pnpm seed`.
4. Deploy edge functions: `supabase functions deploy on-heart --project-ref <ref>` etc.

## Tests & Linting

```bash
pnpm lint
pnpm typecheck
pnpm test
```

- Unit/UI tests (Vitest + React Native Testing Library) cover `FeedCard`, `BigHeartButton`, `ComposeScreen` mirror toggle, and `DistanceSlider`.
- Detox E2E scaffolding lives in `apps/mobile/detox.config.js` and `apps/mobile/e2e`. Configure builds and run `detox test`.

## Features

- Infinite-scrolling, full-bleed feed interleaved via PostGIS RPC to avoid consecutive posts by the same user.
- Normal Hearts flow through `send_free_heart` RPC, enforce a 125-per-day limit, and coalesced pushes via `on-heart` edge function.
- Big Hearts verify purchases (Stripe on web, RevenueCat-native) via `on-big-heart` and webhook consumption.
- Likes view aggregates multiple hearts per admirer with counts, pinned Big Hearts, and expandable post detail rows.
- Side-by-side "Us Photo" composer supports mirror toggle, aspect ratios (1:1, 4:5, 3:4), swap, export to camera roll, and optional private upload.
- Safety toolset: block/report, 18+ gate, content guidelines copy, account deletion self-service, legal copy, data export guidance.

## CI/CD

GitHub Actions workflow (`.github/workflows/ci.yml`) installs dependencies, lints, typechecks, and runs tests. Configure EAS Build integration on `main` branch as needed.

## Billing Notes

- Native: configure RevenueCat offering `big_heart_oneoff` and set `EXPO_PUBLIC_REVENUECAT_SDK_KEY`.
- Web: Stripe Checkout session created via Supabase edge function `create-checkout-session`; webhook updates `purchases` table.

## Data Safety & Privacy

- RLS ensures profile/heart ownership.
- Account deletion removes user-generated data and signs out.
- Legal view summarises terms, privacy, and data export contact.

## Contributing

1. Create a feature branch.
2. Update relevant tests.
3. Run `pnpm lint && pnpm typecheck && pnpm test`.
4. Submit a PR describing the change set.
