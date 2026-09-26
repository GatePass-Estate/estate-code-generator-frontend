import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  ensureEstateEntitlements,
  fetchRecentEstateEntitlements,
  useEstateEntitlements,
} from '@/src/lib/api/entitlements';
import {
  Entitlements,
  FeatureAccess,
  PlanFeature,
  canManagePlan,
  resolveFeatureAccess,
} from '@/src/lib/plans';

const CONTACT_ADMIN_NOTICE_MS = 3000;
/** A cached "no" older than this is re-checked before it's shown, in case the plan was upgraded. */
const DENIAL_MAX_AGE_MS = 30_000;

type UpgradePromptStore = {
  feature: PlanFeature | null;
  visible: boolean;
  show: (feature: PlanFeature) => void;
  dismiss: () => void;
  reset: () => void;
};

/** Drives the single app-wide Upgrade Plan modal rendered by `PlanGuard`. */
export const useUpgradePromptStore = create<UpgradePromptStore>((set) => ({
  feature: null,
  visible: false,
  show: (feature) => set({ feature, visible: true }),
  // Keeps `feature` so the modal copy doesn't blank out while it fades away.
  dismiss: () => set({ visible: false }),
  reset: () => set({ feature: null, visible: false }),
}));

type ContactAdminNoticeStore = {
  feature: PlanFeature | null;
  visible: boolean;
  show: (feature: PlanFeature) => void;
  reset: () => void;
};

let contactAdminNoticeTimer: ReturnType<typeof setTimeout> | null = null;

/** Drives the app-wide floating "Contact Admin" notice rendered by `PlanGuard`. */
export const useContactAdminNoticeStore = create<ContactAdminNoticeStore>((set) => ({
  feature: null,
  visible: false,
  show: (feature) => {
    if (contactAdminNoticeTimer) clearTimeout(contactAdminNoticeTimer);
    set({ feature, visible: true });
    // Keeps `feature` so the copy doesn't blank out while it fades away.
    contactAdminNoticeTimer = setTimeout(() => set({ visible: false }), CONTACT_ADMIN_NOTICE_MS);
  },
  reset: () => {
    if (contactAdminNoticeTimer) clearTimeout(contactAdminNoticeTimer);
    contactAdminNoticeTimer = null;
    set({ feature: null, visible: false });
  },
}));

/** Read-only plan decision for a feature, for conditional rendering. */
export function useFeatureAccess(feature: PlanFeature): FeatureAccess {
  const { data: entitlements } = useEstateEntitlements();
  const role = useUserStore((s) => s.role);
  return resolveFeatureAccess(entitlements, role, feature);
}

function useTimedFlag(durationMs: number) {
  const [active, setActive] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  const trigger = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setActive(true);
    timerRef.current = setTimeout(() => setActive(false), durationMs);
  }, [durationMs]);

  return [active, trigger] as const;
}

type FeatureGateOptions = {
  /**
   * Where the "Contact Admin" notice appears:
   * - `inline` (default): the screen renders `<PlanNoticeSlot {...gate.noticeProps}>` above its
   *   action button.
   * - `floating`: `PlanGuard` floats it over the bottom of the screen — for actions with no button
   *   to sit above (icons, swipe actions, cards).
   */
  notice?: 'inline' | 'floating';
};

/**
 * Gate a user action behind the plan.
 *
 * `requestAccess()` returns `true` when the plan allows the feature. Otherwise it returns `false`
 * and shows the right message: the Upgrade Plan modal for the primary admin, or the "Contact Admin"
 * notice for everyone else (see `FeatureGateOptions.notice`).
 *
 * `requestAccessWhenReady()` does the same but waits for entitlements if they haven't loaded yet
 * (e.g. a tap right after sign-in), and re-checks a cached denial that's more than a few seconds
 * old, so a paid or just-upgraded estate isn't treated as free. Pass `isStillRelevant` to skip the
 * message if the user has moved on while it was checking.
 *
 * `showDenied()` shows the message without checking the cache — for when the server rejects the
 * action even though the cache allowed it.
 */
export function useFeatureGate(
  feature: PlanFeature,
  { notice = 'inline' }: FeatureGateOptions = {}
) {
  const access = useFeatureAccess(feature);
  const role = useUserStore((s) => s.role);
  const estateId = useUserStore((s) => s.estate_id);
  const showUpgradePrompt = useUpgradePromptStore((s) => s.show);
  const showFloatingNotice = useContactAdminNoticeStore((s) => s.show);
  const [noticeVisible, flashInlineNotice] = useTimedFlag(CONTACT_ADMIN_NOTICE_MS);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const promptFor = useCallback(
    (next: FeatureAccess): boolean => {
      if (next === 'granted') return true;
      if (next === 'upgrade') showUpgradePrompt(feature);
      else if (notice === 'floating') showFloatingNotice(feature);
      else flashInlineNotice();
      return false;
    },
    [feature, flashInlineNotice, notice, showFloatingNotice, showUpgradePrompt]
  );

  const requestAccess = useCallback((): boolean => promptFor(access), [access, promptFor]);

  const requestAccessWhenReady = useCallback(
    async (isStillRelevant?: () => boolean): Promise<boolean> => {
      let entitlements: Entitlements | undefined;
      if (estateId) {
        try {
          entitlements = await ensureEstateEntitlements(estateId);
          if (resolveFeatureAccess(entitlements, role, feature) !== 'granted') {
            entitlements = await fetchRecentEstateEntitlements(estateId, DENIAL_MAX_AGE_MS);
          }
        } catch {
          // Unreachable plan service: keep what we have, else the free-features-only default.
        }
      }

      const next = resolveFeatureAccess(entitlements, role, feature);
      if (next === 'granted') return true;
      if (!mountedRef.current || (isStillRelevant && !isStillRelevant())) return false;
      return promptFor(next);
    },
    [estateId, feature, promptFor, role]
  );

  const showDenied = useCallback(() => {
    promptFor(canManagePlan(role) ? 'upgrade' : 'contact_admin');
  }, [promptFor, role]);

  const noticeProps = useMemo(
    () => ({ visible: noticeVisible, feature }),
    [noticeVisible, feature]
  );

  return {
    allowed: access === 'granted',
    requestAccess,
    requestAccessWhenReady,
    showDenied,
    noticeProps,
  };
}
