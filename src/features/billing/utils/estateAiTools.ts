import { humaniseFeatureKey } from '@/src/features/billing/utils/billing';
import type {
  AiFeatureGrant,
  AiFeatureGrantStatus,
  EstateAiTool,
} from '@/src/features/billing/types/billing';

/** The marketplace product fields used to name a grant. */
export type AiToolProduct = { id: string; name: string; ai_feature_ids?: string[] };

/**
 * Grant source of an AI tool subscribed to on its own in the AI marketplace (revenue_service
 * ai_grant_sync `activate_standalone_ai_grant`). The other sources are not subscriptions:
 * `subscription_tier` comes with the estate plan, and `free_install` is a free tier switched on
 * in the marketplace. Only standalone purchases can be cancelled there (`cancel_ai_feature`).
 */
const STANDALONE_SUBSCRIPTION_SOURCE = 'standalone_purchase';

/**
 * True only for an AI tool the estate subscribed to separately from the estate plan, which is
 * what Billing's "Active AI Tools" lists. Plan-included tools and free installs are left out, as
 * are grants with a missing or unknown source.
 */
export function isStandaloneAiGrant(grant: Pick<AiFeatureGrant, 'source'>): boolean {
  return (grant.source ?? '').toLowerCase() === STANDALONE_SUBSCRIPTION_SOURCE;
}

/**
 * The API can leave a grant `active` after its `expires_at` (e.g. plan-included AI tools after the
 * plan dropped back to Access), so treat a lapsed end date as expired.
 */
function effectiveGrantStatus(
  status: AiFeatureGrantStatus,
  expiresAt: string | null,
  now: number
): AiFeatureGrantStatus {
  if (status !== 'active' || !expiresAt) return status;
  const end = new Date(expiresAt).getTime();
  return Number.isFinite(end) && end <= now ? 'expired' : status;
}

function isMoreRelevantGrant(candidate: EstateAiTool, current: EstateAiTool): boolean {
  const candidateActive = candidate.status === 'active';
  if (candidateActive !== (current.status === 'active')) return candidateActive;
  // A missing expiry means a free install that never expires.
  const expiry = (tool: EstateAiTool) =>
    tool.expiresAt ? new Date(tool.expiresAt).getTime() : Number.POSITIVE_INFINITY;
  return expiry(candidate) > expiry(current);
}

/**
 * The estate's standalone AI subscriptions (plan-included tools and free installs left out), named
 * via the AI marketplace
 * (fallback: humanised feature key). One row per tool: a product's tiers are separate grants, so
 * they are grouped and the most relevant grant is kept (active first, then latest expiry).
 */
export function buildStandaloneAiTools(
  grants: AiFeatureGrant[] | undefined,
  products: AiToolProduct[] | undefined,
  now: number = Date.now()
): EstateAiTool[] {
  const productByFeatureId = new Map<string, { id: string; name: string }>();
  for (const product of products ?? []) {
    for (const featureId of product.ai_feature_ids ?? [])
      productByFeatureId.set(featureId, { id: product.id, name: product.name });
  }
  const byTool = new Map<string, EstateAiTool>();
  for (const grant of grants ?? []) {
    if (!isStandaloneAiGrant(grant)) continue;
    const product = productByFeatureId.get(grant.ai_feature_id);
    const name = product?.name || humaniseFeatureKey(grant.feature_key) || 'AI tool';
    const tool: EstateAiTool = {
      featureKey: grant.feature_key ?? '',
      name,
      status: effectiveGrantStatus(grant.status, grant.expires_at, now),
      startsAt: grant.starts_at,
      expiresAt: grant.expires_at,
    };
    const groupKey = product?.id ?? name;
    const existing = byTool.get(groupKey);
    if (!existing || isMoreRelevantGrant(tool, existing)) byTool.set(groupKey, tool);
  }
  return Array.from(byTool.values());
}
