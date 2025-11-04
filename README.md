# Us – Full-stack dating experience

This repository contains **Us**, a Supabase-backed dating experience with an Expo mobile app and a Vite web client. The goal of this README is to explain **every feature, tool, and workflow** so that someone with no prior knowledge of the codebase can operate it confidently.

## Table of contents
- [What you can do in the app](#what-you-can-do-in-the-app)
  - [Accounts & authentication](#accounts--authentication)
  - [Profiles & identity](#profiles--identity)
  - [Discovery feed & reactions](#discovery-feed--reactions)
  - [Likes, matches, and chat](#likes-matches-and-chat)
  - [Photos & storage](#photos--storage)
  - [Verification flows](#verification-flows)
  - [Web vs. mobile experiences](#web-vs-mobile-experiences)
- [Architecture at a glance](#architecture-at-a-glance)
- [Prerequisites](#prerequisites)
- [Environment variables](#environment-variables)
- [Step-by-step: running the stack](#step-by-step-running-the-stack)
  - [Quickstart in a remote/container environment](#quickstart-in-a-remotecontainer-environment)
  - [Local Supabase database & storage](#local-supabase-database--storage)
  - [Web client workflow](#web-client-workflow)
  - [Mobile (Expo) workflow](#mobile-expo-workflow)
- [Developer tools & quality gates](#developer-tools--quality-gates)
- [Database schema & storage buckets](#database-schema--storage-buckets)
- [Troubleshooting](#troubleshooting)

---

## What you can do in the app
The project ships with working user flows on both platforms. If Supabase is not configured yet, the clients seamlessly fall back to bundled demo data so the interfaces still work.

### Accounts & authentication
- **Email + password sign up / sign in** powered by Supabase Auth. The web client exposes sign-in and sign-up forms (`apps/sideui/src/auth.tsx`) and persists sessions automatically via Supabase’s JS client.
- **Session persistence** keeps you logged in between refreshes on web and across launches on mobile. Expo uses `@react-native-async-storage/async-storage` to cache Supabase tokens (`apps/mobile/src/api/supabase.ts`).
- **Sign out** from either client revokes the Supabase session and clears cached state. The profile screens expose the sign-out controls.

### Profiles & identity
- **Automatic profile creation**: during onboarding the clients create a `profiles` row with bio, display name, dating preferences, discovery radius, and interests (`apps/sideui/src/hooks/useProfile.tsx`, `apps/mobile/src/state/authStore.ts`).
- **Profile editing**: update display name, bio, “looking for” filter, and radius from the web Edit Profile page (`apps/sideui/src/pages/EditProfile.tsx`) or from the mobile profile screen, which also lets you edit interests inline (`apps/mobile/src/screens/profile/ProfileScreen.tsx`).
- **Settings inside profile**: discovery radius, communication preferences, and safe-mode toggles live under Settings (`apps/sideui/src/pages/Settings.tsx`; `apps/mobile/src/screens/settings/SettingsScreen.tsx`).
- **Soft delete**: the mobile profile settings expose a delete-account action (currently a guarded preview), modelling the flow for eventual account retirement.

### Discovery feed & reactions
- **Personalised feed** pulls nearby creatives from Supabase (`apps/sideui/src/api/feed.ts`) or from bundled demo posts if the backend is offline (`apps/sideui/src/hooks/useFeed.ts`).
- **Endless scrolling** with “Load more” for additional cards and an explicit refresh option.
- **Reactions**: pass, like, or big-like from either client. Web calls the Supabase RPCs (`apps/sideui/src/api/feed.ts`), while mobile updates the shared state store and queues API writes via `packages/api-client`.
- **Compare view** (mobile) lets you evaluate two photos side by side or stacked, with layout toggles optimized for phone screens (`apps/mobile/src/screens/compare/ComparePhotosScreen.tsx`).

### Likes, matches, and chat
- **Likes inbox**: see people who liked you and promote them to matches (`apps/sideui/src/pages/Likes.tsx`; `apps/mobile/src/screens/matches/IncomingLikesScreen.tsx`).
- **Match list**: the Matches tab surfaces mutual likes, badge copy, and compatibility hints (`apps/sideui/src/pages/Matches.tsx`; `apps/mobile/src/screens/matches/MatchesScreen.tsx`).
- **Chat threads**: the web Chat page loads conversations, displays unread counts, and lets you compose new messages (`apps/sideui/src/pages/Chat.tsx`). When Supabase is offline the UI falls back to seeded demo threads so the interface stays functional (`apps/sideui/src/hooks/useChat.ts`).

### Photos & storage
- **Photo library**: both clients read from the `user_photos` Supabase table, which stores canonical URLs, storage paths, and whether the photo is primary or a verification asset (`packages/types/src/index.ts`).
- **Uploads from mobile**: the mobile profile screen uses Expo Image Picker to grab photos from the camera or library and uploads them via Supabase Storage, with moderation helpers and retry options (`apps/mobile/src/hooks/usePhotoModeration.ts`, `apps/mobile/src/screens/profile/ProfileScreen.tsx`).
- **Uploads from web**: verification flows reuse the shared `uploadProfilePhoto` helper to push files into Supabase Storage (`apps/sideui/src/api/photos.ts`).
- **Primary photo selection** and moderation status are surfaced in the mobile UI (`apps/mobile/src/hooks/usePhotoModeration.ts`).

### Verification flows
- **Photo verification**: start a selfie challenge, upload proof shots, and create a `verifications` record with status `pending` (`apps/sideui/src/api/verification.ts`; `apps/mobile/src/hooks/usePhotoModeration.ts`).
- **Identity verification**: the mobile verification screen launches a hosted verification session (deep link via Expo WebBrowser) and polls Supabase for status updates (`apps/mobile/src/hooks/useIdentityVerification.ts`, `apps/mobile/src/screens/verification/VerifyIdentityScreen.tsx`).
- **Status badges**: once approved, both clients surface a “Verified” badge on profile headers and discovery cards (`apps/mobile/src/screens/profile/ProfileScreen.tsx`; `apps/sideui/src/components/FeedCard.tsx`).
- **Admin review**: mark trusted reviewers by toggling `profiles.is_admin` in Supabase. Admins can approve or reject verification submissions directly in the Supabase dashboard or via SQL, which triggers the `touch_verification_status` trigger to update the linked profile (`infra/supabase/migrations/0005_user_core.sql`).

### Web vs. mobile experiences
- **Web (`apps/sideui`)** focuses on moderation and desktop workflows: quick access to Likes, Matches, Chat, Settings, and profile management with toast notifications for every action.
- **Mobile (`apps/mobile`)** optimises for on-the-go usage: bottom-tab navigation (Feed, Matches, Profile), in-app verification hub, gesture-friendly photo comparison, and offline-friendly seed data so preview builds stay interactive before the backend is wired up.

---

## Architecture at a glance

| Layer | Location | Tech | Notes |
| --- | --- | --- | --- |
| Web app | `apps/sideui` | Vite 5 + React 18 + TypeScript | Desktop-optimised UI with TanStack Query for data fetching and toast-driven feedback. |
| Mobile app | `apps/mobile` | Expo SDK 50 / React Native 0.73 | Shares types and API client, persists Supabase auth, and supports camera/library uploads. |
| API client | `packages/api-client` | TypeScript | REST abstractions that both clients share for Supabase edge-function calls. |
| Shared UI | `packages/ui` | TypeScript / React | Primitive components consumed by the mobile experience. |
| Shared types | `packages/types` | TypeScript | Domain models for profiles, photos, matches, likes, chat threads, and verification records. |
| Config helpers | `packages/config` | TypeScript | Environment loader utilities for both runtime and build-time usage. |
| Infrastructure | `infra/supabase` | Supabase SQL & edge functions | Schema migrations, storage bucket automation, and helper functions/triggers. |

Supporting tooling lives under `tools/` (binary checks, asset seeding) and `tsup/` (build configurations).

## Backend & Data: Supabase (Auth, DB, Storage, Verification)

### Why Supabase
Supabase gives the project a single source of truth for auth, relational data, file storage, and row-level security. The Expo mobile client speaks directly to Supabase via `@supabase/supabase-js`, so sessions, storage uploads, and RLS checks all run in the same SDK without a bespoke backend.

### Account & pricing snapshot
A free Supabase project is enough for local development and early dogfooding. As you scale you will pay for Postgres row count, bandwidth/egress, and storage. Review the current [Supabase pricing page](https://supabase.com/pricing) before enabling production traffic.

### Setup checklist
1. **Create a Supabase project** (free tier works) and note the Project URL and anon key from the dashboard.
2. **Populate mobile env vars** – copy `apps/mobile/.env.example` to `apps/mobile/.env` and fill in:
   ```bash
   EXPO_PUBLIC_SUPABASE_URL=
   EXPO_PUBLIC_SUPABASE_ANON_KEY=
   EXPO_PUBLIC_VERIFICATION_MODE=mock
   ```
   The `.env` file is already gitignored.
3. **Run the migration** – execute the SQL in `supabase/migrations/20240506120000_init_us_app.sql` via the Supabase SQL editor or `supabase db push`. It creates the core tables (`profiles`, `photos`, `likes`, `matches`, `verification_sessions`), RLS policies, and helper functions.
4. **Create the storage bucket** – from the Supabase dashboard run `profile-photos` as a private bucket. The migration adds policies so owners can manage their own objects and everyone else only sees approved images via signed URLs.
5. (Optional) **Hook up serverless cleanup** – the migration includes `queue_profile_photo_removal(photo_id uuid)` to help edge functions delete storage objects when rows are removed so no orphaned files are left behind.

### Running everything locally
1. Install dependencies at the repo root: `pnpm install`.
2. Configure Expo: `cd apps/mobile && cp .env.example .env`, then fill in the Supabase URL/anon key and keep `EXPO_PUBLIC_VERIFICATION_MODE=mock` for the built-in simulation.
3. Launch Expo: `pnpm expo start --tunnel` inside `apps/mobile`. Sign up with email/password, upload a photo, and run through the mock verification flow to see the happy path.
4. The mobile app reads approved photos from Supabase, writes uploads to the `profile-photos` bucket, and persists likes/matches in the new tables.

### Switching from mock to a real verification provider
1. Set `EXPO_PUBLIC_VERIFICATION_MODE=provider` in `apps/mobile/.env`.
2. Stand up backend endpoints (`POST /verification/start`, `GET /verification/status`) and provider webhooks. The mobile hook at `apps/mobile/src/hooks/useIdentityVerification.ts` already calls these when provider mode is enabled.
3. Inject provider API keys on the server side (never ship them to the client). The Expo app only needs the public base URL via `EXPO_PUBLIC_API_BASE_URL`.
4. Use Supabase Edge Functions or your own backend to update `verification_sessions` and `profiles.verification_status` when webhook callbacks arrive.

### Security & RLS quick tour
- `profiles`: owners can insert/update/select their own row. An additional policy exposes read-only access to profiles that have at least one approved photo so the feed can display names/bios without leaking pending content.
- `photos`: owners have full CRUD; other users can only select rows with `status = 'approved'`.
- `likes`: only the actor (`from_user`) can insert/update/delete their likes.
- `matches`: participants can insert/update/delete/select matches where they are `user_a` or `user_b`.
- `verification_sessions`: only the owner can create or inspect their verification runs.
- Storage (`profile-photos`): owners manage their folder (`<user_id>/…`), and the public read policy only authorises objects linked to approved photos. Signed URLs are generated client-side for display (`apps/mobile/src/lib/photos.ts`).

### Mock verification vs. production
- Mock mode (`EXPO_PUBLIC_VERIFICATION_MODE=mock`) inserts a `verification_sessions` row, marks the profile as `pending`, opens a placeholder browser session, and flips to `verified` after a short delay.
- Production mode calls your `/verification/start` and `/verification/status` endpoints. Provide real provider URLs, and update the session in Supabase according to webhook callbacks.

### Troubleshooting cheat sheet
- **“No photos in feed”** → ensure photos have `status = 'approved'` or use the mock moderation toggle on the profile screen.
- **“Auth not persisting”** → confirm Supabase URL/key are present and `apps/mobile/src/api/supabase.ts` isn’t warning about missing env vars.
- **“Storage permission denied”** → double-check the user is signed in (Supabase JWT present) and the storage policies from the migration were applied.
- **“Verification stuck on pending”** → hit `Refresh status` on the profile screen to re-query `profiles.verification_status`. In provider mode, confirm your backend endpoints return `verified`/`rejected`.

---

## Prerequisites
- Node.js 18+
- PNPM 8+
- Optional: Supabase CLI (`npm install -g supabase` or `pnpm dlx supabase`) for database and edge-function workflows.
- Optional: Expo CLI (`npx expo`) if you plan to run the mobile app locally.

> The Supabase CLI is not bundled as a workspace dependency. Install it globally when you need database tooling.

---

## Environment variables
Each surface reads environment variables from `.env` files so you can keep secrets out of version control.

### Web (Vite) – `apps/sideui`
Create `apps/sideui/.env` for local overrides. These values are read via `import.meta.env`:
```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_SUPABASE_STORAGE_BUCKET=profile-photos
VITE_SUPABASE_SERVICE_ROLE_KEY= # optional, only for server-side admin tools
```

### Mobile (Expo) – `apps/mobile`
Expo public env vars live in `.env` or can be baked into `app.config.ts`:
```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_ANON_KEY=
EXPO_PUBLIC_SUPABASE_STORAGE_BUCKET=profile-photos
EXPO_PUBLIC_API_BASE_URL= # optional proxy for edge functions
EXPO_PUBLIC_BILLING_MODE=stripe_only | auto
EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY=
EXPO_PUBLIC_REVENUECAT_SDK_KEY=
EXPO_PUBLIC_BIGHEART_PRICE_USD=3.99
```

### Supabase / Edge Functions – `infra/supabase`
```
SUPABASE_URL=
SUPABASE_SERVICE_ROLE_KEY=
EXPO_ACCESS_TOKEN=
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
REVENUECAT_SECRET= # optional
```
Copy `.env.example` within that folder to `.env.dev` and fill in the values. CLI commands (`supabase start`, `supabase functions serve`, etc.) read from this file.

After configuring the database, ensure the storage bucket listed above exists:
```
supabase storage create-bucket profile-photos --public
```

---

## Step-by-step: running the stack
Follow these steps sequentially. Commands prefixed with `$` should be run in a terminal from the repository root.

1. **Install dependencies**
   ```bash
   $ pnpm install
   ```
   Add `--offline` if you are in an isolated environment. The repo vendors the PNPM store under `node_modules/.pnpm` so follow-up installs work without network access.

2. **Seed optional demo assets** (stock imagery for offline demos)
   ```bash
   $ pnpm seed:assets
   ```

### Quickstart in a remote/container environment
- Launch the web app with a single command:
  ```bash
  $ pnpm dev
  ```
  Vite binds to `0.0.0.0:5173`, so in RunPod/Gitpod-style environments the forwarded URL will just work. Use the provided proxy URL instead of `localhost` when accessing via browser.
- For Expo preview in the browser (no native simulators required):
  ```bash
  $ pnpm dev:web:mobile
  ```
  This runs `expo start --web`, again binding to `0.0.0.0` so the remote preview opens inside your container-friendly browser.

### Local Supabase database & storage
1. Install the Supabase CLI (`npm install -g supabase`).
2. Start the local stack:
   ```bash
   $ supabase start
   ```
3. Apply schema migrations:
   ```bash
   $ pnpm migrate:dev
   ```
   This executes SQL files under `infra/supabase/migrations`, creating tables for profiles, photos, likes, matches, and verifications with row-level security policies.
4. Seed baseline content:
   ```bash
   $ pnpm seed
   ```
5. (Optional) Serve edge functions:
   ```bash
   $ supabase functions serve --env-file infra/supabase/.env.dev
   ```
   The shared API client expects bearer tokens returned from Supabase auth.

### Web client workflow
1. Start the dev server:
   ```bash
   $ pnpm web:dev
   ```
   Navigate to <http://localhost:5173> (or the forwarded URL). Sign up with an email/password; Supabase will create the auth + profile rows automatically.
2. Explore the app:
   - Finish onboarding to populate your profile.
   - Visit **Feed** to browse suggestions and react with like/super-like/pass.
   - Open **Likes** to promote admirers into matches.
   - Enter **Matches** to jump into conversations.
   - Use **Profile → Edit profile** to update bio, preferences, and discovery radius.
   - Upload verification photos from the verification actions; once an admin approves them in Supabase you’ll see the badge instantly.
3. Build for production when ready:
   ```bash
   $ pnpm web:build
   ```
   Artifacts land in `apps/sideui/dist`.

### Mobile (Expo) workflow
1. Prepare Expo assets:
   ```bash
   $ pnpm mobile:start
   ```
   This runs the Metro bundler. Scan the QR code with Expo Go or open the provided web preview.
2. Inside the app:
   - **Feed tab**: swipe through cards and jump to the compare experience.
   - **Matches tab**: view existing matches and like requests.
   - **Profile tab**: update bio/interests, open settings, manage verification, and upload new photos from the camera roll.
   - **Verification screen**: launch identity verification via the hosted flow; status automatically refreshes afterward.
3. Sessions persist between runs thanks to AsyncStorage. Use the Profile settings to sign out or trigger the delete-account preview.

### Monetisation & Rewards APIs

The Supabase Edge Functions under `infra/supabase/functions` implement the business rules for paid unlocks and the daily spin wheel:

| Function | Purpose | Method |
| --- | --- | --- |
| `profile-access` | Returns profile data along with `can_view_full_profile` and unlock reason. | `POST` |
| `profile-unlock` | Charges (Stripe if configured, otherwise stub) and grants profile access. | `POST` |
| `rewards-status` | Reports free-spin availability, last rewards, and active bonuses. | `GET` |
| `rewards-spin` | Performs the free daily spin, enforcing the 24h cooldown. | `POST` |
| `rewards-spin-paid` | Processes a paid spin and records the reward. | `POST` |

Each function expects a valid Supabase session bearer token in the `Authorization` header. When Stripe keys are present the billing functions create PaymentIntents; in local/demo mode the flows fall back to stubbed unlocks so the UI remains testable offline.

The migration `0005_engagement_features.sql` adds the supporting tables:

- `profile_unlocks` for paid/unlocked profile relationships.
- `reward_spins` to audit spin history.
- `user_bonuses` to track active boosts/highlights/extra likes.
- `profiles.visibility_score` and `profiles.verification_status` to improve feed ordering and verification UI.

Run `pnpm migrate:dev` after pulling to ensure the new tables exist.

---

## Developer tools & quality gates
Common commands are centralised in the root `package.json`:

| Command | What it does |
| --- | --- |
| `pnpm dev` | Alias for `pnpm --filter sideui dev`; starts the Vite web dev server bound to `0.0.0.0:5173`. |
| `pnpm build` / `pnpm web:build` | Production build for the web client. |
| `pnpm web:preview` | Serves the static build at `0.0.0.0:5173` for smoke tests. |
| `pnpm mobile:start` | Boots the Expo dev server for the native app (Metro). |
| `pnpm dev:web` / `pnpm dev:web:mobile` | Launch Expo’s web preview for the mobile app. |
| `pnpm lint` | Runs ESLint across the monorepo (`pnpm lint:root` + `pnpm lint:mobile`). |
| `pnpm typecheck` | Executes `tsc --noEmit` in every workspace via PNPM recursion. |
| `pnpm test` | Runs Vitest suites wherever they exist. Mobile unit tests target pure helpers so they run in Node. |
| `pnpm migrate:dev` | Applies Supabase SQL migrations. Requires the CLI running against a project. |
| `pnpm seed` | Loads baseline Supabase data for feeds, matches, and demo profiles. |
| `pnpm seed:assets` | Downloads development-only imagery so offline demos have visuals. |
| `pnpm repo:check-binaries` / `pnpm repo:strip-binaries` | Tooling in `tools/` that prevents binary blobs from sneaking into git history. |
| `pnpm format` | Runs Prettier across the repo. |

You can safely run `pnpm install --offline` after the first checkout; all tarballs are cached.

### Testing unlocks and the daily spin

- Visit the **Profile** page to try the daily spin widget. The UI calls the rewards edge functions, shows cooldowns, and lists active bonuses (boosts/highlights) returned by Supabase.
- Browse to another user’s profile from the feed to exercise the profile access flow. When the profile is locked the page shows an unlock call-to-action that invokes `profile-unlock`.
- The feed’s “Compare photos” button now checks access before opening the side-by-side modal. If the profile is locked you can unlock from the toast inline.
- In demo/offline mode (`VITE_ENABLE_DEMO=true`) the UI falls back to deterministic rewards/unlock responses so the flows remain usable without Supabase.

---

## Database schema & storage buckets
The Supabase migration `infra/supabase/migrations/0005_user_core.sql` provisions everything required for production flows:

- **profiles**: core identity fields (email, handle, bio, gender, location text, verification status, interests, admin flag). Unique indexes enforce handle/email uniqueness.
- **user_photos**: stores gallery and verification photos with URLs, storage paths, and flags for primary/verification shots. Row-level security allows owners and admins to manage their photos.
- **verifications**: tracks pending/approved/rejected submissions, stores asset paths, timestamps, reviewer metadata, and automatically updates the linked profile’s `verification_status` via the `touch_verification_status` trigger.
- **likes**: captures reactions from one user to another with uniqueness constraints to prevent duplicates.
- **matches**: extends mutual-like records with timestamps and `last_message_at` for chat ordering.

Buckets: create a public `profile-photos` bucket to store uploads. The `uploadProfilePhoto` helper writes to that bucket and stores the resulting path + URL in `user_photos` so it’s easy to render across clients.

Admins can approve verifications directly inside the Supabase dashboard or via SQL:
```sql
update verifications set status = 'approved', reviewed_at = now(), reviewer_id = '<admin-user-id>' where id = '<verification-id>';
```
The trigger will promote the user’s `verification_status` to `verified` immediately.

---

## Troubleshooting
- **Supabase CLI missing**: install it globally (`npm install -g supabase`) because the workspace does not download the binary during `pnpm install`.
- **React version warnings**: the web pins React 18.3.1 while Expo SDK 50 bundles React 18.2.0. This mismatch is safe; Expo provides its own React runtime.
- **Offline installation errors**: run `pnpm install --offline` to leverage the vendored PNPM store.
- **Supabase unavailable**: both clients display helpful error banners and fall back to demo data so you can continue exploring while the backend is offline. Configure the env vars listed above to unlock full functionality.

---

Happy shipping! If you discover gaps or missing documentation, update this README so future contributors stay on the same page.
