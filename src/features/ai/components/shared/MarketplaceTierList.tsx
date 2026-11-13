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
  subscribingTierKey,
  cancelTierKey,
  uninstallingTierKey,
  installingTierKey,
  actionsLocked,
  onActivate,
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
        const isSubscribed =
          tier.status === 'active' ||
          tier.status === 'purchased' ||
          tier.status === 'subscribed' ||
          tier.status === 'installed' ||
          !!tier.purchased;

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
              tierLabel={formatTierLabel(tierKey)}
              subtitle={tier.name?.trim() || formatTierSubtitle(tier)}
              subtitleUppercase={false}
              description={tier.description?.trim() || ''}
              benefits={benefits}
              expanded={expandedTier === tierKey}
              onToggle={() => onToggle(tierKey)}
              onActivate={() => onActivate(tier)}
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
              isCancelledLocally={!!justCancelledTiers[tierKey]}
              cancelLockedMessage={
                tier.payment_mode === 'subscription'
                  ? 'This feature is included in your estate subscription plan and cannot be cancelled separately.'
                  : undefined
              }
              isFree={!!tier.is_free}
              isInstalled={!!tier.is_installed && !justPurchasedTiers[tierKey]}
              isSubscribed={isSubscribed}
            />
          </View>
        );
      })}
    </View>
  );
}
