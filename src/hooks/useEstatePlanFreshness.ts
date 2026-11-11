import { useEffect, useRef } from 'react';
import { AppState, Platform } from 'react-native';
import { useUserStore } from '@/src/lib/stores/userStore';
import { PLAN_STALE_MS, refreshEstateEntitlementsIfOlderThan } from '@/src/lib/api/entitlements';

/**
 * How often the plan is re-checked while the app stays open. The backend sends no push when the
 * paying admin changes the plan, so this is how an account left open on one screen picks it up.
 */
export const PLAN_POLL_MS = 2 * 60_000;

/**
 * Keeps the estate plan (tier + entitlements) current across devices: when the app comes back to
 * the foreground — or the browser tab becomes visible on web — and every `PLAN_POLL_MS` while it
 * stays in the foreground, refetch whichever is older than `PLAN_STALE_MS` (at most once per that
 * interval). Without this, an upgrade made by the paying admin never reaches the other estate
 * accounts until they sign in again.
 *
 * Mount once, inside the signed-in layout.
 */
export function useEstatePlanFreshness() {
  const estateId = useUserStore((s) => s.estate_id);
  const lastCheckRef = useRef(0);

  useEffect(() => {
    if (!estateId) return;

    const refresh = () => {
      const now = Date.now();
      if (now - lastCheckRef.current < PLAN_STALE_MS) return;
      lastCheckRef.current = now;
      refreshEstateEntitlementsIfOlderThan(estateId, PLAN_STALE_MS);
    };

    if (Platform.OS === 'web') {
      if (typeof document === 'undefined') return;
      const onVisibilityChange = () => {
        if (document.visibilityState === 'visible') refresh();
      };
      document.addEventListener('visibilitychange', onVisibilityChange);
      return () => document.removeEventListener('visibilitychange', onVisibilityChange);
    }

    let timer: ReturnType<typeof setInterval> | null = null;
    const stopPolling = () => {
      if (timer) clearInterval(timer);
      timer = null;
    };
    const startPolling = () => {
      stopPolling();
      timer = setInterval(refresh, PLAN_POLL_MS);
    };

    if (AppState.currentState === 'active') startPolling();

    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        refresh();
        startPolling();
      } else {
        stopPolling();
      }
    });
    return () => {
      subscription.remove();
      stopPolling();
    };
  }, [estateId]);
}
