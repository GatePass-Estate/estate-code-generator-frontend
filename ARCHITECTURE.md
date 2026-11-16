# GatePass architecture

Expo Router stays in the root `app/` directory. Those files are route definitions. Screen implementation, services, hooks, and feature UI live under `src/features/`.

## Layout

```text
src/
├── features/
│   ├── access-codes/
│   ├── admin/
│   ├── ai/            # anomaly detection and incident reports (AI Store tools)
│   ├── auth/
│   ├── billing/
│   ├── dashboard/     # home screen, tab bar / sidebar, menu routes
│   ├── history/
│   ├── marketplace/
│   ├── notifications/
│   ├── profile/
│   ├── scanner/
│   ├── support/
│   ├── users/
│   └── visitors/
├── shared/
│   ├── components/
│   ├── constants/
│   ├── hooks/
│   ├── services/api/
│   ├── services/storage/
│   ├── theme/
│   ├── types/
│   └── utils/
└── store/
```

Each feature folder owns the code for that domain: `services/` for API calls, `hooks/` for TanStack Query, `components/`, `screens/`, `types/`, and `utils/` when that feature has them. `index.ts` is the public entry for the feature.

Not every feature needs every folder:

- **Shell** features (`dashboard`) own navigation chrome (`RoleShell`, tab bar, sidebar, menu routes). They may omit `services/`.
- **Data** features (`users`) own types, services, and query hooks for a domain used by other features’ screens. They may omit `screens/`.
- **Scanner** validates codes through `access-codes` services/hooks; it owns scan UI and warning utils, not a second copy of the code API.

Query hooks for a domain live with the domain that owns the API. Example: estate user list hooks live in `users/hooks/`, not `admin/` — admin and billing both consume them.

`src/shared/` is only for code used across features: the Axios client, typed errors, query keys, storage/device helpers, design tokens, and generic UI.

`src/store/` holds the signed-in profile (`useUserStore`). Auth, notification, and profile-document stores stay in their features.

## Dependency rules

- `app/` imports from `src/`; `src/` never imports from `app/`. Navigation config used by both a
  layout and screens (tab/sidebar entries) lives in `src/features/dashboard/components/menuRoutes.tsx`.
- `src/shared/` does not import from features (the API client's use of the auth session is the one
  exception, because every request needs it).
- A feature may import another feature's `hooks/`, `components/`, `services/`, `types/`, `utils/` and
  `store/`, but never its `screens/` (ESLint `no-restricted-imports`, generated per feature in
  `eslint.config.js`). Importing through `index.ts` is not required: several features depend on each
  other both ways, and barrels would create require cycles.

## Screens

Screens are layout. State, data loading and handlers live in a hook in the feature's `hooks/`.
A screen with `.native.tsx` and `.web.tsx` variants shares that one hook, so both platforms follow
the same rules; only layout and genuinely platform-specific calls (Alert vs `window.confirm`,
BackHandler, Share) differ. Lists use `ListPlaceholder` / `ListFooter` from
`src/shared/components/lists/ListStates.tsx` for loading, error-with-retry, empty and next-page states.
Back navigation uses `useGoBack()` (or `<Back />`), not `router.back()`.

## Routes

`app/` keeps the existing URLs, groups, and layouts. Each route is one file that re-exports a screen. Screen files live in `src/features/<feature>/screens/` and are grouped by the screen, not by the `app/` route groups. Do not move `_layout` files out of `app/`.

## API and state

Services call `Api()` from `src/shared/services/api/client.ts`. Query hooks live next to the feature that owns the data. Shared cache keys stay in `src/shared/services/api/queryKeys.ts` so one feature can invalidate another feature's list without duplicating key strings.

TanStack Query is the server cache. Every cached response belongs to the signed-in account:
sign-out (and adopting another account's session from another tab) calls `clearQueryCache()`.
Queries retry only network errors, timeouts, 408, 429 and 5xx (`shouldRetryQuery`). On native,
`installReactQueryNativeManagers()` refetches stale queries when the app returns to the foreground and
pauses queries while the device is offline (NetInfo), resuming them on reconnect. Polling uses
`refetchInterval` gated on screen focus, not hand-rolled `setInterval`. Zustand is for client state that is not server data. Login, two-factor, password reset, activation, and password changes stay service calls. They are not cached queries.

## Adding a feature

1. Add `src/features/<feature>/services/` and throw `raiseApiError`.
2. Add keys to `src/shared/services/api/queryKeys.ts`.
3. Add hooks in `src/features/<feature>/hooks/`.
4. Put the screen in `src/features/<feature>/screens/` and re-export it from the existing `app/` route.
