import { useCallback, useState } from 'react';
import { showAlert } from '@/src/shared/utils/alert';
import { errorMessage } from '@/src/shared/services/api/errors';
import { emptyMarketplaceConfirm } from '@/src/features/ai/components/shared/MarketplaceConfirmModal';
import { usePaystackCheckout } from '@/src/features/billing/utils/billingCheckout';
import { useBillingAccess } from '@/src/features/billing/hooks/billing';
import {
  cancelMarketplaceSubscription,
  installAiFeature,
  rateMarketplaceFeature,
  uninstallAiFeature,
} from '@/src/features/marketplace/services/aiMarketplace';
import type {
  AiCheckoutDuration,
  MarketplaceTier,
} from '@/src/features/marketplace/types/aiMarketplace';
import {
  isAlreadyCancelledError,
  isAlreadyInstalledError,
  isAlreadyUninstalledError,
} from '@/src/features/ai/utils/aiTierState';
import type { TierBookkeeping } from '@/src/features/ai/hooks/useTierBookkeeping';

/** One in-progress tier action: which tier, and whether that kind of action is running. */
function useTierBusy() {
  const [tierKey, setTierKey] = useState<string | null>(null);
  const [active, setActive] = useState(false);
  const start = useCallback((key: string) => {
    setTierKey(key);
    setActive(true);
  }, []);
  const stop = useCallback(() => {
    setActive(false);
    setTierKey(null);
  }, []);
  return { tierKey, active, start, stop };
}

type AiTierActionsOptions = {
  /** '' when the estate is not known yet. */
  estateId: string;
  bookkeeping: TierBookkeeping;
  /** True (after prompting) when a Tier Two or Three action needs Tier One first. */
  requireTierOne: (tier: MarketplaceTier) => boolean;
  /** Anomaly also blocks uninstalling an add-on while Tier One is missing. */
  requireTierOneToUninstall: boolean;
  /**
   * Cancel must send the tier `feature_key` — `/ai-features/.../cancel` needs it
   * (empty body fails validation; anomaly already passes the key).
   */
  cancelByFeatureKey: boolean;
  /** Re-reads everything a tier change affects (entitlements, product, cached results). */
  onTierChange: () => Promise<void>;
  /** Runs after a checkout that did not error. */
  afterCheckout: () => void;
  rating: { allowed: boolean; targetId: string | undefined; refetch: () => Promise<unknown> };
};

/**
 * Install / uninstall / cancel / paid activation (Paystack checkout) / rating for an AI
 * marketplace product, shared by the Anomaly Detection and Incident Report screens.
 * Free-tier activation differs per product, so those screens build it from `runSubscribe`.
 */
export function useAiTierActions({
  estateId,
  bookkeeping,
  requireTierOne,
  requireTierOneToUninstall,
  cancelByFeatureKey,
  onTierChange,
  afterCheckout,
  rating,
}: AiTierActionsOptions) {
  const { denyIfUnauthorized, notifyActionError } = useBillingAccess();
  const { markTierPurchased, markTierCancelled, markTierInstallState } = bookkeeping;

  const subscribing = useTierBusy();
  const uninstalling = useTierBusy();
  const installing = useTierBusy();
  const canceling = useTierBusy();

  const [activationModalVisible, setActivationModalVisible] = useState(false);
  const [selectedTierForActivation, setSelectedTierForActivation] =
    useState<MarketplaceTier | null>(null);
  // Shared Paystack checkout: one lifecycle (idempotent start, resume after cancel, verification)
  // for plan, seat and AI purchases, and it also works on web (redirect), unlike an embedded WebView.
  const { startCheckout, isRunning: checkoutRunning, checkoutSheet } = usePaystackCheckout();

  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [confirmModalConfig, setConfirmModalConfig] = useState(emptyMarketplaceConfirm);

  /** Runs a subscribe/activate step with that tier's button busy. */
  const runSubscribe = async (tierKey: string, task: () => Promise<void>) => {
    subscribing.start(tierKey);
    try {
      await task();
    } finally {
      subscribing.stop();
    }
  };

  /** Paid tier: pick a duration and see the price before Paystack. */
  const openActivation = (tier: MarketplaceTier) => {
    setSelectedTierForActivation(tier);
    setActivationModalVisible(true);
  };

  const handleConfirmActivation = async (duration: AiCheckoutDuration) => {
    if (denyIfUnauthorized()) return;
    const tier = selectedTierForActivation;
    if (!tier?.feature_key) {
      showAlert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setActivationModalVisible(false);
    const outcome = await startCheckout({
      checkout_kind: 'ai_only',
      ai_feature_keys: [tier.feature_key],
      period_months: duration,
    });
    if (outcome === 'error') return;

    if (outcome === 'paid' && estateId) {
      installing.start(tier.tier);
      try {
        await installAiFeature(estateId, tier.feature_key);
        markTierInstallState(tier.tier, true);
      } catch (err: unknown) {
        const message = errorMessage(err) || '';
        if (isAlreadyInstalledError(message)) {
          markTierInstallState(tier.tier, true);
        } else {
          markTierPurchased(tier.tier, true);
          notifyActionError(
            'Install Failed',
            { message },
            'Payment succeeded, but the feature could not be installed. Tap Install to try again.'
          );
        }
      } finally {
        installing.stop();
      }
    }

    // Bought again after cancelling: no longer "just cancelled".
    if (outcome === 'paid' || outcome === 'pending') markTierCancelled(tier.tier, false);
    afterCheckout();
  };

  const handleCancelSubscription = (tier: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    setConfirmModalConfig({
      title: 'Cancel Subscription',
      message: 'Are you sure you want to cancel your subscription to this AI feature?',
      cancelText: 'No',
      confirmText: 'Yes, Cancel',
      confirmStyle: 'destructive',
      onConfirm: async () => {
        setConfirmModalVisible(false);
        canceling.start(tier.tier);
        let shouldRefresh = false;
        try {
          const featureKey = cancelByFeatureKey ? tier.feature_key || undefined : undefined;
          if (cancelByFeatureKey && !featureKey) {
            showAlert(
              'Cancellation Failed',
              'This tier is missing a feature key, so it cannot be cancelled yet.'
            );
            return;
          }
          await cancelMarketplaceSubscription(estateId, featureKey);
          markTierCancelled(tier.tier, true);
          showAlert('Success', 'Subscription cancelled successfully.');
          shouldRefresh = true;
        } catch (err: unknown) {
          const cancelMessage = errorMessage(err) || 'Failed to cancel subscription.';
          // Paystack rejects disabling a subscription that is already cancelled.
          if (isAlreadyCancelledError(cancelMessage)) {
            markTierCancelled(tier.tier, true);
            showAlert('Already Cancelled', 'Your subscription has already been cancelled.');
            shouldRefresh = true;
          } else {
            showAlert('Cancellation Failed', cancelMessage);
          }
        } finally {
          canceling.stop();
        }
        if (shouldRefresh) void onTierChange();
      },
    });
    setConfirmModalVisible(true);
  };

  const handleUninstall = (tier: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOneToUninstall && requireTierOne(tier)) return;
    if (!estateId) {
      showAlert('Error', 'Estate ID not found');
      return;
    }
    const featureKey = tier.feature_key;
    if (!featureKey) {
      showAlert('Error', 'Feature key is missing for this tier.');
      return;
    }

    setConfirmModalConfig({
      title: 'Uninstall Feature',
      message: 'Are you sure you want to uninstall this feature?',
      cancelText: 'Cancel',
      confirmText: 'Uninstall',
      confirmStyle: 'destructive',
      onConfirm: async () => {
        setConfirmModalVisible(false);
        uninstalling.start(tier.tier);
        let shouldRefresh = false;
        try {
          await uninstallAiFeature(estateId, featureKey);
          markTierInstallState(tier.tier, false);
          showAlert('Success', 'Feature uninstalled successfully.');
          shouldRefresh = true;
        } catch (err: unknown) {
          const message = errorMessage(err) || '';
          if (isAlreadyUninstalledError(message)) {
            markTierInstallState(tier.tier, false);
            showAlert('Already Uninstalled', 'This feature is already uninstalled.');
            shouldRefresh = true;
          } else {
            notifyActionError('Uninstall Failed', { message }, 'Failed to uninstall feature.');
          }
        } finally {
          uninstalling.stop();
        }
        if (shouldRefresh) void onTierChange();
      },
    });
    setConfirmModalVisible(true);
  };

  const handleInstall = async (tier: MarketplaceTier) => {
    if (denyIfUnauthorized()) return;
    if (requireTierOne(tier)) return;
    if (!estateId) {
      showAlert('Error', 'Estate ID not found');
      return;
    }
    if (!tier.feature_key) {
      showAlert('Error', 'Feature key is missing for this tier.');
      return;
    }

    installing.start(tier.tier);
    let shouldRefresh = false;
    try {
      await installAiFeature(estateId, tier.feature_key);
      markTierInstallState(tier.tier, true);
      showAlert('Success', 'Feature installed successfully.');
      shouldRefresh = true;
    } catch (err: unknown) {
      const message = errorMessage(err) || '';
      if (isAlreadyInstalledError(message)) {
        markTierInstallState(tier.tier, true);
        showAlert('Already Installed', 'This feature is already installed.');
        shouldRefresh = true;
      } else {
        notifyActionError('Install Failed', { message }, 'Failed to install feature.');
      }
    } finally {
      installing.stop();
    }
    if (shouldRefresh) void onTierChange();
  };

  const handleRate = async (score: number) => {
    if (!rating.allowed) {
      showAlert(
        'Rating Unavailable',
        'You need an active subscription or entitlement to this AI feature before you can rate it.'
      );
      return;
    }
    if (!rating.targetId) return;
    try {
      await rateMarketplaceFeature(rating.targetId, { score });
      await rating.refetch();
      showAlert('Success', 'Rating submitted successfully');
    } catch (err: unknown) {
      showAlert('Error', errorMessage(err) || 'Failed to submit rating');
      throw err;
    }
  };

  return {
    denyIfUnauthorized,
    notifyActionError,
    runSubscribe,
    /** Busy keys and locks, as `MarketplaceTierList` takes them. */
    tierListBusy: {
      subscribingTierKey: subscribing.tierKey,
      cancelTierKey: canceling.tierKey,
      uninstallingTierKey: uninstalling.tierKey,
      installingTierKey: installing.tierKey,
      actionsLocked: {
        subscribe: subscribing.active,
        cancel: canceling.active,
        install: installing.active,
        uninstall: uninstalling.active,
      },
    },
    handleInstall,
    handleUninstall,
    handleCancelSubscription,
    handleRate,
    activation: {
      visible: activationModalVisible,
      tier: selectedTierForActivation,
      open: openActivation,
      close: () => setActivationModalVisible(false),
      confirm: handleConfirmActivation,
      isConfirming: checkoutRunning,
    },
    checkoutSheet,
    confirmModal: {
      visible: confirmModalVisible,
      config: confirmModalConfig,
      close: () => setConfirmModalVisible(false),
    },
  };
}
