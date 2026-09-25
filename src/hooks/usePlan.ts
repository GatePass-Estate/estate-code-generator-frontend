import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { create } from 'zustand';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useEstateEntitlements } from '@/src/lib/api/entitlements';
import { FeatureAccess, PlanFeature, resolveFeatureAccess } from '@/src/lib/plans';

const CONTACT_ADMIN_NOTICE_MS = 3000;

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

/**
 * Gate a user action behind the plan.
 *
 * `requestAccess()` returns `true` when the plan allows the feature. Otherwise it returns `false`
 * and shows the right message: the Upgrade Plan modal for admins, or the "Contact Admin" notice
 * for everyone else (render it with `<PlanNoticeSlot {...gate.noticeProps}>`).
 */
export function useFeatureGate(feature: PlanFeature) {
  const access = useFeatureAccess(feature);
  const showUpgradePrompt = useUpgradePromptStore((s) => s.show);
  const [noticeVisible, flashNotice] = useTimedFlag(CONTACT_ADMIN_NOTICE_MS);

  const requestAccess = useCallback((): boolean => {
    if (access === 'granted') return true;
    if (access === 'upgrade') showUpgradePrompt(feature);
    else flashNotice();
    return false;
  }, [access, feature, flashNotice, showUpgradePrompt]);

  const noticeProps = useMemo(
    () => ({ visible: noticeVisible, feature }),
    [noticeVisible, feature]
  );

  return { allowed: access === 'granted', requestAccess, noticeProps };
}
