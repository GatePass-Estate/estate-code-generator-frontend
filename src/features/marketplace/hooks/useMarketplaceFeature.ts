import { useQuery } from '@tanstack/react-query';
import { prefetchAiQuotes } from '@/src/features/ai/components/shared/ActivationQuoteModal';
import {
  getMarketplaceFeatureById,
  resolveMarketplaceFeatureId,
} from '@/src/features/marketplace/services/aiMarketplace';
import type { MarketplaceDetailResponse } from '@/src/features/marketplace/types/aiMarketplace';
import { userFacingError } from '@/src/shared/services/api/errors';
import { queryKeys } from '@/src/shared/services/api/queryKeys';

const FEATURE_LOAD_ERROR = 'Could not load this feature.';

/** Keeps a nameless anomaly load from sharing a cache entry with incident. */
function fallbackFeatureKey(nameMatch: (name: string) => boolean) {
  if (nameMatch('anomaly')) return 'anomaly';
  if (nameMatch('incident')) return 'incident';
  return 'feature';
}

/** CQ-01: one cached marketplace product for the plan screens. */
export function useMarketplaceFeature({
  featureId,
  nameMatch,
  estateId,
}: {
  featureId?: string;
  nameMatch: (name: string) => boolean;
  estateId?: string;
}) {
  const query = useQuery({
    queryKey: [
      ...queryKeys.marketplace.detail(featureId || fallbackFeatureKey(nameMatch)),
      estateId ?? '',
    ],
    queryFn: async (): Promise<MarketplaceDetailResponse | null> => {
      const targetId = await resolveMarketplaceFeatureId(featureId, nameMatch);
      if (!targetId) return null;
      const detail = await getMarketplaceFeatureById(targetId);
      if (estateId) {
        const paidKeys = (detail.tiers ?? []).flatMap((tier) =>
          tier.feature_key && !tier.is_free ? [tier.feature_key] : []
        );
        if (paidKeys.length > 0) {
          void Promise.all(paidKeys.map((featureKey) => prefetchAiQuotes(estateId, featureKey)));
        }
      }
      return detail;
    },
  });

  const featureDetail = query.data ?? null;

  return {
    featureDetail,
    // No detail yet, including a retry after a failed first load. A refresh that already has
    // data stays quiet so the plan list does not flash back to the spinner.
    isLoading: !query.data && (query.isPending || query.isFetching),
    loadError:
      query.isError && !query.isFetching ? userFacingError(query.error, FEATURE_LOAD_ERROR) : '',
    refetch: query.refetch,
  };
}
