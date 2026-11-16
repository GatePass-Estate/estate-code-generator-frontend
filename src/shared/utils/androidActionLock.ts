import { Platform } from 'react-native';
import { router } from 'expo-router';

/** Two onPress events on Android often land within this window. */
const LOCK_MS = 700;

const lastAllowedAt = new Map<string, number>();

function hrefKey(href: unknown): string {
  if (typeof href === 'string') return href;
  try {
    return JSON.stringify(href);
  } catch {
    return String(href);
  }
}

/** `true` when this tap should run. Same key within `windowMs` is ignored on Android. */
export function allowAndroidAction(key: string, windowMs = LOCK_MS): boolean {
  if (Platform.OS !== 'android') return true;
  const now = Date.now();
  const previous = lastAllowedAt.get(key) ?? 0;
  if (now - previous < windowMs) return false;
  lastAllowedAt.set(key, now);
  return true;
}

function wrapNav<T extends (href: never, options?: never) => unknown>(fn: T, name: string): T {
  const wrapped = ((href: never, options?: never) => {
    if (!allowAndroidAction(`${name}:${hrefKey(href)}`)) return;
    return fn(href, options);
  }) as T;
  (wrapped as T & { __androidLocked?: boolean }).__androidLocked = true;
  return wrapped;
}

function wrapRouterObject(nav: {
  push?: (href: never, options?: never) => unknown;
  replace?: (href: never, options?: never) => unknown;
  navigate?: (href: never, options?: never) => unknown;
}) {
  if (
    typeof nav.push === 'function' &&
    !(nav.push as { __androidLocked?: boolean }).__androidLocked
  ) {
    nav.push = wrapNav(nav.push.bind(nav), 'push');
  }
  if (
    typeof nav.replace === 'function' &&
    !(nav.replace as { __androidLocked?: boolean }).__androidLocked
  ) {
    nav.replace = wrapNav(nav.replace.bind(nav), 'replace');
  }
  if (
    typeof nav.navigate === 'function' &&
    !(nav.navigate as { __androidLocked?: boolean }).__androidLocked
  ) {
    nav.navigate = wrapNav(nav.navigate.bind(nav), 'navigate');
  }
}

function patchCreateImperativeRouter() {
  try {
    // Same module instance Expo Router uses for `useRouter()` and the `router` singleton.
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const routerMod = require('expo-router/build/global-state/router') as {
      createImperativeRouter: ((
        enqueue: unknown,
        setTransitionMode: unknown
      ) => {
        push: (href: never, options?: never) => unknown;
        replace: (href: never, options?: never) => unknown;
        navigate: (href: never, options?: never) => unknown;
      }) & { __androidLocked?: boolean };
    };
    if (routerMod.createImperativeRouter.__androidLocked) return;
    const original = routerMod.createImperativeRouter;
    const patched = ((enqueue: unknown, setTransitionMode: unknown) => {
      const created = original(enqueue, setTransitionMode);
      wrapRouterObject(created);
      return created;
    }) as typeof routerMod.createImperativeRouter;
    patched.__androidLocked = true;
    routerMod.createImperativeRouter = patched;
  } catch {
    // Expo Router internals moved; the singleton wrap below is still applied.
  }
}

/** Drops a duplicate Android tap that would push/open the same route twice. */
export function patchAndroidDoubleNavigation() {
  if (Platform.OS !== 'android') return;
  patchCreateImperativeRouter();
  wrapRouterObject(router as unknown as Parameters<typeof wrapRouterObject>[0]);
}
