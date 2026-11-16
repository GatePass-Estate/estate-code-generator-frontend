import { useEffect, useMemo, useState } from 'react';
import { router, type Href } from 'expo-router';
import { useEstateSubscription } from '@/src/features/billing/hooks/billing';
import { useContactAdminNoticeStore } from '@/src/features/billing/hooks/usePlan';
import { useEstateEntitlements } from '@/src/features/billing';
import { hasEntitlement, type PlanFeature } from '@/src/features/billing/utils/plans';
import { sortMarketplaceTiers } from '@/src/features/marketplace/services/aiMarketplace';
import { useMarketplaceFeature } from '@/src/features/marketplace/hooks/useMarketplaceFeature';
import { useUserStore } from '@/src/store/userStore';
import { hasSummaryResultAccess } from '@/src/features/ai/utils/aiTierState';

type AiResultAccessOptions = {
  featureId?: string;
  nameMatch: (name: string) => boolean;
  /** Same estate argument as the product screen, so both read one cached product. */
  estateId: string | undefined;
  /** Tier Two / Three entitlements that unlock results. */
  paidTierFeatures: [PlanFeature, PlanFeature];
  /** Non-admins are sent back to the product screen with this notice. */
  contactAdminMessage: string;
  productRoute: Href;
};

/**
 * Whether the signed-in estate may open a standalone AI Result summary, from the cached
 * marketplace product plus plan and entitlements. A primary admin without access gets the
 * upgrade dialog; anyone else is sent back to the product with a "contact admin" notice.
 */
export function useAiResultAccess({
  featureId,
  nameMatch,
  estateId,
  paidTierFeatures,
  contactAdminMessage,
  productRoute,
}: AiResultAccessOptions) {
  const [upgradeModalVisible, setUpgradeModalVisible] = useState(false);
  const userRole = useUserStore((s) => s.role);
  const showContactAdminNotice = useContactAdminNoticeStore((s) => s.show);
  const { data: subscriptionData, isLoading: subLoading } = useEstateSubscription();
  const { data: entitlements, isLoading: entLoading } = useEstateEntitlements();
  const { featureDetail, isLoading } = useMarketplaceFeature({ featureId, nameMatch, estateId });

  const sortedTiers = useMemo(
    () => (featureDetail?.tiers ? sortMarketplaceTiers(featureDetail.tiers) : []),
    [featureDetail?.tiers]
  );
  const [tierTwoFeature, tierThreeFeature] = paidTierFeatures;
  const planIncludesPaidAi = useMemo(() => {
    const included = new Set(subscriptionData?.tier?.included_ai_features ?? []);
    return included.has(tierTwoFeature) || included.has(tierThreeFeature);
  }, [subscriptionData?.tier?.included_ai_features, tierTwoFeature, tierThreeFeature]);
  const hasResultAccess = hasSummaryResultAccess({
    planIncludesPaidAi,
    hasPaidTierEntitlement:
      hasEntitlement(entitlements, tierTwoFeature) ||
      hasEntitlement(entitlements, tierThreeFeature),
    sortedTiers,
  });

  const checkingAccess = isLoading || subLoading || entLoading;

  useEffect(() => {
    if (!checkingAccess && !hasResultAccess) {
      if (userRole === 'primary_admin') {
        setUpgradeModalVisible(true);
      } else {
        showContactAdminNotice(tierTwoFeature, contactAdminMessage);
        router.replace(productRoute);
      }
    }
  }, [
    checkingAccess,
    hasResultAccess,
    userRole,
    showContactAdminNotice,
    tierTwoFeature,
    contactAdminMessage,
    productRoute,
  ]);

  return {
    featureDetail,
    checkingAccess,
    hasResultAccess,
    upgradeModalVisible,
    setUpgradeModalVisible,
  };
}
