# Changelog

## Unreleased

- Stabilised the Vite dev server (React SWC plugin, strict port 8000, optional API proxy) and added a `/__client-log` middleware for terminal error mirroring.
- Normalised `clsx` usage and updated shared UI utilities.
- Rebuilt authentication, feed, matches, chat, notifications, likes, onboarding, and profile flows to consume the RunPod backend via `VITE_API_BASE`.
- Added robust React Query hooks, session management with automatic 401 handling, and server health banner.
- Refreshed documentation, added a repeatable verification script, and ensured HTML metadata avoids quirks mode warnings.
