import { Text, View, type View as RNView } from 'react-native';
import type { RefObject } from 'react';
import SubscriptionTierCard from '@/src/features/ai/components/shared/SubscriptionTierCard';
import {
  formatTierLabel,
  formatTierSubtitle,
} from '@/src/features/marketplace/services/aiMarketplace';
import type {
  MarketplaceDetailResponse,
  MarketplaceTier,
} from '@/src/features/marketplace/types/aiMarketplace';
import {
  resolveTierInstalled,
  tierCardButtons,
  tierPurchaseState,
} from '@/src/features/ai/utils/aiTierState';

const tierNumber = (tier: string) => tier.replace(/\D/g, '') || tier;
export const tierOrder = (tier: MarketplaceTier) =>
  Number.parseInt(tier.tier.replace(/\D/g, ''), 10) || 0;

export default function MarketplaceTierList({
  feature,
  tiers,
  expandedTier,
  onToggle,
  tierOneRef,
  onTierCardRef,
  justPurchasedTiers,
  justCancelledTiers,
  installOverrides = {},
  subscribingTierKey,
  cancelTierKey,
  uninstallingTierKey,
  installingTierKey,
  actionsLocked,
  onActivate,
  onReactivate,
  onCancel,
  onUninstall,
  onInstall,
}: {
  feature: MarketplaceDetailResponse | null;
  tiers: MarketplaceTier[];
  expandedTier: string | null;
  onToggle: (tierKey: string) => void;
  tierOneRef?: RefObject<RNView | null>;
  /** Lets the screen scroll a tier into view (Tier One for Result, Tier Two for AI Summary). */
  onTierCardRef?: (order: number, node: RNView | null) => void;
  justPurchasedTiers: Record<string, boolean>;
  justCancelledTiers: Record<string, boolean>;
  /** Optimistic Install/Uninstall until detail refetch. */
  installOverrides?: Record<string, boolean>;
  subscribingTierKey: string | null;
  cancelTierKey: string | null;
  uninstallingTierKey: string | null;
  installingTierKey: string | null;
  actionsLocked: {
    subscribe: boolean;
    cancel: boolean;
    install: boolean;
    uninstall: boolean;
  };
  onActivate: (tier: MarketplaceTier) => void;
  /** Cancelled → reactivate API. past_due keeps `onActivate` (checkout). */
  onReactivate?: (tier: MarketplaceTier) => void;
  onCancel: (tier: MarketplaceTier) => void;
  onUninstall: (tier: MarketplaceTier) => void;
  onInstall: (tier: MarketplaceTier) => void;
}) {
  if (tiers.length === 0) {
    return (
      <Text className="text-center text-caption font-inter-regular text-[#878686]">
        No subscription tiers returned for this product.
      </Text>
    );
  }

  return (
    <View className="flex-col gap-6">
      {tiers.map((tier) => {
        const tierKey = tier.tier;
        const benefits = tier.benefits?.length
          ? tier.benefits
          : (feature?.tier_benefits?.find((group) => tierNumber(group.tier) === tierNumber(tierKey))
              ?.benefits ?? []);
        const purchase = tierPurchaseState(tier, justCancelledTiers);
        const isInstalled = resolveTierInstalled(tier, justPurchasedTiers, installOverrides);
        const buttons = tierCardButtons(purchase, isInstalled, !!tier.is_free);

        return (
          <View
            key={tier.ai_feature_id || tierKey}
            ref={(node) => {
              const order = tierOrder(tier);
              if (order === 1 && tierOneRef) tierOneRef.current = node;
              onTierCardRef?.(order, node);
            }}
            collapsable={false}
          >
            <SubscriptionTierCard
              tierLabel={tier.name?.trim() || formatTierLabel(tierKey)}
              subtitle={formatTierSubtitle(tier)}
              subtitleUppercase={false}
              description={tier.description?.trim() || ''}
              benefits={benefits}
              expanded={expandedTier === tierKey}
              onToggle={() => onToggle(tierKey)}
              onActivate={() => {
                // cancelled → reactivate endpoint; past_due / Activate → checkout (or free install).
                if (purchase === 'cancelled' && onReactivate) onReactivate(tier);
                else onActivate(tier);
              }}
              onCancelSubscription={() => onCancel(tier)}
              onUninstall={() => onUninstall(tier)}
              onInstall={() => onInstall(tier)}
              isSubscribing={subscribingTierKey === tierKey}
              isCanceling={cancelTierKey === tierKey}
              isUninstalling={uninstallingTierKey === tierKey}
              isInstalling={installingTierKey === tierKey}
              subscribeDisabled={actionsLocked.subscribe}
              cancelDisabled={actionsLocked.cancel}
              installDisabled={actionsLocked.install}
              uninstallDisabled={actionsLocked.uninstall}
              cancelLockedMessage={
                tier.payment_mode === 'subscription'
                  ? 'This feature is included in your estate subscription plan and cannot be cancelled separately.'
                  : undefined
              }
              isInstalled={isInstalled}
              buttons={buttons}
            />
          </View>
        );
      })}
    </View>
  );
}
