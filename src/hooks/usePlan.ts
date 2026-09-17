import { useCallback, useMemo } from 'react';
import { create } from 'zustand';
import { useUserStore } from '@/src/lib/stores/userStore';
import {
  PlanFeature,
  PlanTier,
  canManagePlan,
  canUsePlanFeature,
  planDisplayName,
  resolvePlanTier,
} from '@/src/lib/plans';

type PlanLockStore = {
  lockedFeature: PlanFeature | null;
  setLockedFeature: (feature: PlanFeature | null) => void;
};

export const usePlanLockStore = create<PlanLockStore>((set) => ({
  lockedFeature: null,
  setLockedFeature: (feature) => set({ lockedFeature: feature }),
}));

type RequestFeatureOptions = {
  /** When false, only checks access and does not open PlanGuard. Default true. */
  present?: boolean;
};

export function usePlan() {
  const role = useUserStore((s) => s.role);
  const plan = useUserStore((s) => s.plan);
  const subscription_plan = useUserStore((s) => s.subscription_plan);
  const tierField = useUserStore((s) => s.tier);
  const plan_name = useUserStore((s) => s.plan_name);
  const lockedFeature = usePlanLockStore((s) => s.lockedFeature);
  const setLockedFeature = usePlanLockStore((s) => s.setLockedFeature);

  const tier: PlanTier = useMemo(
    () => resolvePlanTier({ plan, subscription_plan, tier: tierField, plan_name }),
    [plan, plan_name, subscription_plan, tierField]
  );

  const label = useMemo(
    () => planDisplayName({ plan, subscription_plan, tier: tierField, plan_name }, tier),
    [plan, plan_name, subscription_plan, tier, tierField]
  );

  const isAdmin = canManagePlan(role);

  const canUse = useCallback((feature: PlanFeature) => canUsePlanFeature(tier, feature), [tier]);

  const requestFeature = useCallback(
    (feature: PlanFeature, options?: RequestFeatureOptions): boolean => {
      if (canUsePlanFeature(tier, feature)) return true;
      const shouldPresent = options?.present ?? isAdmin;
      if (shouldPresent) setLockedFeature(feature);
      return false;
    },
    [isAdmin, setLockedFeature, tier]
  );

  const clearLock = useCallback(() => setLockedFeature(null), [setLockedFeature]);

  return {
    tier,
    label,
    isAdmin,
    isFree: tier === 'free',
    lockedFeature,
    canUse,
    requestFeature,
    clearLock,
  };
}

/** Wrap any handler: runs it only if the catalogue feature is allowed, otherwise PlanGuard opens. */
export function useRequirePlan(feature: PlanFeature) {
  const { requestFeature } = usePlan();

  return useCallback(
    <T extends unknown[]>(action: (...args: T) => void) =>
      (...args: T) => {
        if (!requestFeature(feature)) return;
        action(...args);
      },
    [feature, requestFeature]
  );
}
