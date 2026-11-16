import { humaniseFeatureKey } from '@/src/features/billing/utils/billing';
import type {
  AiFeatureGrant,
  AiFeatureGrantStatus,
  AiToolPurchaseLabel,
  BillingTier,
  EstateAiTool,
} from '@/src/features/billing/types/billing';

/** Marketplace product (+ optional tier catalog) used as a name fallback. */
export type AiToolProduct = {
  id: string;
  name: string;
  ai_feature_ids?: string[];
  /** From GET /ai-marketplace/{id} — tier.name is the real label (e.g. In house). */
  tiers?: {
    ai_feature_id?: string;
    feature_key?: string | null;
    name?: string | null;
  }[];
};

/** Collect `feature_key → label` from GET /subscriptions/tiers (`paid_ai_features`). */
export function revenueAiFeatureLabels(tiers: BillingTier[] | undefined): Map<string, string> {
  const labels = new Map<string, string>();
  for (const tier of tiers ?? []) {
    for (const group of [tier.paid_ai_features?.available, tier.paid_ai_features?.unavailable]) {
      for (const feature of group ?? []) {
        const key = feature.feature_key?.trim();
        const label = feature.label?.trim();
        if (key && label && !labels.has(key)) labels.set(key, label);
      }
    }
  }
  return labels;
}

/**
 * Plan-included and free marketplace installs are not standalone subscriptions.
 * Revenue cancel docs: cancel applies to standalone AI feature subscriptions only.
 */
const EXCLUDED_SOURCES = new Set(['subscription_tier', 'free_install']);

/**
 * True for AI tools bought on their own in the marketplace (GET /ai-features/estate/{id}).
 * Excludes plan-included (`subscription_tier`) and free installs. OpenAPI leaves grant `source`
 * untyped — accept `standalone_purchase` / `standalone`, and paid grants when source is missing.
 */
export function isStandaloneAiGrant(grant: Pick<AiFeatureGrant, 'source' | 'is_free'>): boolean {
  const source = (grant.source ?? '').toLowerCase().trim();
  if (EXCLUDED_SOURCES.has(source)) return false;
  if (source.includes('standalone')) return true;
  if (!source) return !grant.is_free;
  return !grant.is_free;
}

const PURCHASED_GRANT_STATUSES = new Set(['purchased', 'active']);

/**
 * Normalize grant status to the standardized set. Legacy `active` past `expires_at` →
 * `not_purchased` (marketplace maps expired → not_purchased).
 */
function effectiveGrantStatus(
  status: AiFeatureGrantStatus,
  expiresAt: string | null,
  now: number
): AiFeatureGrantStatus {
  const normalized = (status ?? '').toLowerCase() as AiFeatureGrantStatus;
  if (PURCHASED_GRANT_STATUSES.has(normalized) && expiresAt) {
    const end = new Date(expiresAt).getTime();
    if (Number.isFinite(end) && end <= now) return 'not_purchased';
  }
  if (normalized === 'expired') return 'not_purchased';
  if (normalized === 'active') return 'purchased';
  return normalized;
}

/** Grant `status` → Purchase State tag (audit matrix). */
export function aiToolPurchaseLabel(status: AiFeatureGrantStatus | string): AiToolPurchaseLabel {
  const normalized = (status ?? '').toLowerCase();
  if (normalized === 'cancelled') return 'Cancelled';
  if (normalized === 'past_due' || normalized === 'expired' || normalized === 'not_purchased') {
    return 'Expired';
  }
  return 'Purchased';
}

const TIER_WORDS = [
  '',
  'One',
  'Two',
  'Three',
  'Four',
  'Five',
  'Six',
  'Seven',
  'Eight',
  'Nine',
  'Ten',
];

/** `…_tier_2` / `…tier2` → "Tier Two" when marketplace / revenue labels are missing. */
export function tierLabelFromFeatureKey(featureKey: string | null | undefined): string {
  if (!featureKey) return '';
  const match = /tier[_-]?(\d+)\s*$/i.exec(featureKey);
  if (!match) return '';
  const num = Number.parseInt(match[1], 10);
  if (!Number.isFinite(num) || num <= 0) return '';
  return `Tier ${TIER_WORDS[num] ?? num}`;
}

/** Match a grant to its marketplace child tier (detail `tiers[]`). */
export function matchMarketplaceTier(
  grant: Pick<AiFeatureGrant, 'ai_feature_id' | 'feature_key'>,
  product: AiToolProduct | undefined
) {
  const tiers = product?.tiers ?? [];
  return (
    tiers.find((tier) => grant.ai_feature_id && tier.ai_feature_id === grant.ai_feature_id) ||
    tiers.find((tier) => grant.feature_key && tier.feature_key === grant.feature_key)
  );
}

/**
 * Card title: prefer revenue catalog `name` on the grant, then marketplace / revenue
 * label fallbacks when an older payload omits `name`.
 */
export function toolDisplayName(
  grant: Pick<AiFeatureGrant, 'ai_feature_id' | 'feature_key' | 'name'>,
  product?: AiToolProduct | undefined,
  revenueLabel?: string | null
): string {
  const grantName = grant.name?.trim() || '';
  if (grantName) return grantName;

  const tierName = matchMarketplaceTier(grant, product)?.name?.trim() || '';
  const productName = product?.name?.trim() || '';
  const catalogLabel = revenueLabel?.trim() || '';

  if (productName && tierName) return `${productName} · ${tierName}`;
  if (tierName) return tierName;
  if (catalogLabel) return catalogLabel;
  if (productName) {
    const invented = tierLabelFromFeatureKey(grant.feature_key);
    return invented ? `${productName} · ${invented}` : productName;
  }
  return humaniseFeatureKey(grant.feature_key) || 'AI tool';
}

/**
 * Standalone AI grants from GET /ai-features/estate/{estate_id}.
 * One card per grant (each purchased tier). Names come from grant `name` when present.
 *
 * `revenueLabels` / `products` are optional fallbacks for older payloads without `name`.
 */
export function buildStandaloneAiTools(
  grants: AiFeatureGrant[] | undefined,
  products: AiToolProduct[] | undefined = undefined,
  now: number = Date.now(),
  revenueLabels?: ReadonlyMap<string, string>
): EstateAiTool[] {
  const productByFeatureId = new Map<string, AiToolProduct>();
  const productByFeatureKey = new Map<string, AiToolProduct>();
  for (const product of products ?? []) {
    for (const featureId of product.ai_feature_ids ?? []) {
      productByFeatureId.set(featureId, product);
    }
    for (const tier of product.tiers ?? []) {
      if (tier.ai_feature_id) productByFeatureId.set(tier.ai_feature_id, product);
      if (tier.feature_key) productByFeatureKey.set(tier.feature_key, product);
    }
  }

  const tools: EstateAiTool[] = [];
  for (const grant of grants ?? []) {
    if (!isStandaloneAiGrant(grant)) continue;
    const status = effectiveGrantStatus(grant.status, grant.expires_at, now);
    // Fully ended grants are not "active AI tools".
    if (status === 'not_purchased') continue;
    const product =
      productByFeatureId.get(grant.ai_feature_id) ||
      (grant.feature_key ? productByFeatureKey.get(grant.feature_key) : undefined);
    const revenueLabel = grant.feature_key ? revenueLabels?.get(grant.feature_key) : undefined;
    tools.push({
      featureKey: grant.feature_key ?? grant.ai_feature_id ?? grant.id,
      name: toolDisplayName(grant, product, revenueLabel),
      status,
      purchaseLabel: aiToolPurchaseLabel(status),
      isInstalled: !!grant.is_installed,
      startsAt: grant.starts_at,
      expiresAt: grant.expires_at,
    });
  }
  return tools;
}
