# GatePass (estate-code-generator-frontend)

Expo / React Native app for GatePass estate access codes, admin tools, security scanning, billing, and AI marketplace features.

## Stack

- Expo Router (file-based routes in `app/`)
- React Native + web
- TanStack Query, Zustand
- EAS Build (`eas.json`)

## Setup

1. Use Node 22 (`nvm use` reads `.nvmrc`).
2. Copy `.env.local.example` → `.env.local` and set HTTPS service URLs.
3. Install and start:

```bash
npm install
npx expo start
```

Native rebuilds: `npx expo run:ios` / `npx expo run:android`.

## Environment

| Variable                              | Purpose                               |
| ------------------------------------- | ------------------------------------- |
| `EXPO_PUBLIC_USER_SERVICE_API_URL`    | Auth / users API                      |
| `EXPO_PUBLIC_CODE_SERVICE_API_URL`    | Access codes API                      |
| `EXPO_PUBLIC_AI_SERVICE_API_URL`      | AI marketplace / insights             |
| `EXPO_PUBLIC_REVENUE_SERVICE_API_URL` | Billing / Paystack                    |
| `EXPO_PUBLIC_WIDTH_BREAKPOINT`        | Web layout breakpoint (default `768`) |

Set the same keys as **EAS secrets/env** for `preview` and `production` builds (HTTPS only).

## Web deploy

`vercel.json` rewrites all paths to `/` for the SPA. Build with Expo web (`npx expo export -p web` or your CI export step) and point Vercel at the export output. Configure the `EXPO_PUBLIC_*` env vars in the Vercel project.

## EAS / OTA / store submit

- Config lives in `app.config.ts` (APNs: `development` for non-production profiles, `production` for production).
- OTA: `expo-updates` + EAS `channel` per profile (`development` / `preview` / `production`).
- Submit: set `submit.production.ios.ascAppId` in `eas.json`, place `google-play-service-account.json` locally (gitignored), then `eas submit --platform all`.

## Scripts

| Script                    | Purpose                 |
| ------------------------- | ----------------------- |
| `npm start`               | Expo dev server         |
| `npm run test:ci`         | Unit tests (CI)         |
| `npm run lint`            | ESLint + Prettier check |
| `npm run android` / `ios` | Native run              |

## Notes

- Firebase / Google service files are gitignored — copy from local secrets; do not commit real keys.
- GitHub Actions are pinned by commit SHA under `.github/workflows/`.
