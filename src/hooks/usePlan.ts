import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  EntitlementsDeniedError,
  ensureEstateEntitlements,
  refreshEstateEntitlementsIfOlderThan,
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
/** A cached "no" older than this is refreshed in the background, in case the plan was upgraded. */
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
  /** Replaces the feature's "Contact Admin" copy — the server's reason for a `blocked` check. */
  message: string | null;
  visible: boolean;
  show: (feature: PlanFeature, message?: string | null) => void;
  reset: () => void;
};

let contactAdminNoticeTimer: ReturnType<typeof setTimeout> | null = null;

/** Drives the app-wide floating "Contact Admin" notice rendered by `PlanGuard`. */
export const useContactAdminNoticeStore = create<ContactAdminNoticeStore>((set) => ({
  feature: null,
  message: null,
  visible: false,
  show: (feature, message = null) => {
    if (contactAdminNoticeTimer) clearTimeout(contactAdminNoticeTimer);
    set({ feature, message, visible: true });
    // Keeps `feature` and `message` so the copy doesn't blank out while it fades away.
    contactAdminNoticeTimer = setTimeout(() => set({ visible: false }), CONTACT_ADMIN_NOTICE_MS);
  },
  reset: () => {
    if (contactAdminNoticeTimer) clearTimeout(contactAdminNoticeTimer);
    contactAdminNoticeTimer = null;
    set({ feature: null, message: null, visible: false });
  },
}));

/** The server's reason when it refused to share the estate's plan with this user. */
function deniedReason(error: unknown): string | null {
  return error instanceof EntitlementsDeniedError ? error.message : null;
}

function useFeatureAccessWithReason(feature: PlanFeature) {
  const { data: entitlements, error } = useEstateEntitlements();
  const role = useUserStore((s) => s.role);
  const reason = deniedReason(error);
  return { access: resolveFeatureAccess(entitlements, role, feature, reason), reason };
}

/** Read-only plan decision for a feature, for conditional rendering. */
export function useFeatureAccess(feature: PlanFeature): FeatureAccess {
  return useFeatureAccessWithReason(feature).access;
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
 * notice for everyone else (see `FeatureGateOptions.notice`). If the server refused to share the
 * plan at all (e.g. the user's ID isn't approved yet), that notice shows the server's reason
 * instead, for every role.
 *
 * `requestAccessWhenReady()` does the same but, if entitlements haven't loaded yet (e.g. a tap right
 * after sign-in), waits for them instead of treating the estate as free. Once cached it answers
 * instantly; a cached "no" that's more than a few seconds old is also refreshed in the background
 * so the next tap reflects a recent upgrade. Pass `isStillRelevant` to skip the message if the
 * user has moved on while it was waiting.
 *
 * `showDenied()` shows the message without checking the cache — for when the server rejects the
 * action even though the cache allowed it.
 */
export function useFeatureGate(
  feature: PlanFeature,
  { notice = 'inline' }: FeatureGateOptions = {}
) {
  const { access, reason } = useFeatureAccessWithReason(feature);
  const role = useUserStore((s) => s.role);
  const estateId = useUserStore((s) => s.estate_id);
  const showUpgradePrompt = useUpgradePromptStore((s) => s.show);
  const showFloatingNotice = useContactAdminNoticeStore((s) => s.show);
  const [noticeVisible, flashInlineNotice] = useTimedFlag(CONTACT_ADMIN_NOTICE_MS);
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
    };
  }, []);

  const promptFor = useCallback(
    (next: FeatureAccess, blockedReason: string | null = null): boolean => {
      if (next === 'granted') return true;
      if (next === 'upgrade') {
        showUpgradePrompt(feature);
        return false;
      }
      // `contact_admin` shows the feature's copy; `blocked` shows the server's reason instead.
      const message = next === 'blocked' ? blockedReason : null;
      if (notice === 'floating') {
        showFloatingNotice(feature, message);
      } else {
        setNoticeMessage(message);
        flashInlineNotice();
      }
      return false;
    },
    [feature, flashInlineNotice, notice, showFloatingNotice, showUpgradePrompt]
  );

  const requestAccess = useCallback(
    (): boolean => promptFor(access, reason),
    [access, promptFor, reason]
  );

  const requestAccessWhenReady = useCallback(
    async (isStillRelevant?: () => boolean): Promise<boolean> => {
      let entitlements: Entitlements | undefined;
      let blockedReason: string | null = null;
      if (estateId) {
        try {
          // Instant when cached; only waits on the network if nothing is cached yet.
          entitlements = await ensureEstateEntitlements(estateId);
          if (resolveFeatureAccess(entitlements, role, feature) !== 'granted') {
            refreshEstateEntitlementsIfOlderThan(estateId, DENIAL_MAX_AGE_MS);
          }
        } catch (error) {
          // A refusal (e.g. ID not approved) is reported as-is. Otherwise the plan service is
          // unreachable: keep what we have, else the free-features-only default.
          blockedReason = deniedReason(error);
        }
      }

      const next = resolveFeatureAccess(entitlements, role, feature, blockedReason);
      if (next === 'granted') return true;
      if (!mountedRef.current || (isStillRelevant && !isStillRelevant())) return false;
      return promptFor(next, blockedReason);
    },
    [estateId, feature, promptFor, role]
  );

  const showDenied = useCallback(() => {
    promptFor(canManagePlan(role) ? 'upgrade' : 'contact_admin');
  }, [promptFor, role]);

  const noticeProps = useMemo(
    () => ({ visible: noticeVisible, feature, message: noticeMessage }),
    [noticeVisible, feature, noticeMessage]
  );

  return {
    allowed: access === 'granted',
    requestAccess,
    requestAccessWhenReady,
    showDenied,
    noticeProps,
  };
}
