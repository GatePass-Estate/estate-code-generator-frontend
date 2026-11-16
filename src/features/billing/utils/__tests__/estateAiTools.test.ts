import { describe, expect, it } from '@jest/globals';
import {
  aiToolPurchaseLabel,
  buildStandaloneAiTools,
  isStandaloneAiGrant,
  tierLabelFromFeatureKey,
  toolDisplayName,
} from '@/src/features/billing/utils/estateAiTools';
import type { AiFeatureGrant } from '@/src/features/billing/types/billing';

const NOW = new Date('2026-06-01T00:00:00Z').getTime();

function grant(overrides: Partial<AiFeatureGrant>): AiFeatureGrant {
  return {
    id: 'g1',
    ai_feature_id: 'f1',
    feature_key: 'anomaly_detection',
    source: 'standalone_purchase',
    status: 'active',
    is_installed: true,
    is_free: false,
    auto_renew: true,
    starts_at: '2026-05-01T00:00:00Z',
    expires_at: '2026-07-01T00:00:00Z',
    catalog_deleted: false,
    created_at: '2026-05-01T00:00:00Z',
    ...overrides,
  };
}

describe('isStandaloneAiGrant', () => {
  it('keeps marketplace standalone purchases', () => {
    expect(isStandaloneAiGrant({ source: 'standalone_purchase', is_free: false })).toBe(true);
    expect(isStandaloneAiGrant({ source: 'STANDALONE_PURCHASE', is_free: false })).toBe(true);
    expect(isStandaloneAiGrant({ source: 'standalone', is_free: false })).toBe(true);
  });

  it('leaves out plan-included tools and free installs', () => {
    expect(isStandaloneAiGrant({ source: 'subscription_tier', is_free: false })).toBe(false);
    expect(isStandaloneAiGrant({ source: 'free_install', is_free: true })).toBe(false);
  });

  it('treats paid grants with missing source as standalone (OpenAPI leaves source untyped)', () => {
    expect(isStandaloneAiGrant({ source: '', is_free: false })).toBe(true);
    expect(isStandaloneAiGrant({ source: '', is_free: true })).toBe(false);
  });
});

describe('buildStandaloneAiTools', () => {
  const products = [
    { id: 'p1', name: 'Anomaly Detection', ai_feature_ids: ['f1', 'f1b', 'f1c'] },
    { id: 'p2', name: 'Incident Reports', ai_feature_ids: ['f2'] },
  ];

  it('lists only standalone subscriptions', () => {
    const tools = buildStandaloneAiTools(
      [
        grant({ id: 'a', ai_feature_id: 'f1', source: 'standalone_purchase' }),
        grant({ id: 'b', ai_feature_id: 'f2', source: 'subscription_tier' }),
        grant({
          id: 'c',
          ai_feature_id: 'f3',
          feature_key: 'smart_alerts',
          source: 'free_install',
          is_free: true,
          expires_at: null,
        }),
      ],
      products,
      NOW
    );
    expect(tools).toHaveLength(1);
    expect(tools[0].featureKey).toBe('anomaly_detection');
  });

  it('is empty when every grant comes with the plan', () => {
    expect(
      buildStandaloneAiTools(
        [
          grant({ source: 'subscription_tier' }),
          grant({ id: 'x', ai_feature_id: 'f2', source: 'subscription_tier' }),
        ],
        products,
        NOW
      )
    ).toEqual([]);
  });

  it('prefers grant catalog name from entitlement endpoints', () => {
    const tools = buildStandaloneAiTools(
      [
        grant({
          id: 't1',
          feature_key: 'anomaly_detection_tier_1',
          name: 'Anomaly Insights',
          status: 'cancelled',
        }),
        grant({
          id: 't2',
          ai_feature_id: 'f1b',
          feature_key: 'anomaly_detection_tier_2',
          name: 'Anomaly In house',
          status: 'purchased',
        }),
        grant({
          id: 't3',
          ai_feature_id: 'f1c',
          feature_key: 'anomaly_detection_tier_3',
          name: 'Anomaly Third Party',
          status: 'purchased',
        }),
        grant({
          id: 't4',
          ai_feature_id: 'f2',
          feature_key: 'incident_report_tier_1',
          name: 'Incident Base Scan',
          status: 'past_due',
        }),
      ],
      undefined,
      NOW
    );
    expect(tools.map((tool) => tool.name)).toEqual([
      'Anomaly Insights',
      'Anomaly In house',
      'Anomaly Third Party',
      'Incident Base Scan',
    ]);
  });

  it('falls back to revenue label, then product · Tier N from feature_key', () => {
    expect(tierLabelFromFeatureKey('anomaly_detection_tier_2')).toBe('Tier Two');
    expect(
      toolDisplayName(
        { ai_feature_id: 'f1b', feature_key: 'anomaly_detection_tier_2' },
        { id: 'p1', name: 'Anomaly Detection' },
        'Anomaly AI Review'
      )
    ).toBe('Anomaly AI Review');
    expect(
      toolDisplayName(
        { ai_feature_id: 'f1b', feature_key: 'anomaly_detection_tier_2' },
        { id: 'p1', name: 'Anomaly Detection' }
      )
    ).toBe('Anomaly Detection · Tier Two');
  });

  it('drops an active/purchased grant past its end date (expired → not_purchased)', () => {
    expect(
      buildStandaloneAiTools([grant({ expires_at: '2026-05-15T00:00:00Z' })], products, NOW)
    ).toEqual([]);
  });

  it('carries purchase and install state from the grant', () => {
    const [tool] = buildStandaloneAiTools(
      [grant({ status: 'cancelled', is_installed: false })],
      products,
      NOW
    );
    expect(tool.purchaseLabel).toBe('Cancelled');
    expect(tool.isInstalled).toBe(false);
  });
});

describe('aiToolPurchaseLabel', () => {
  it('maps grant status to the Purchase State tag', () => {
    expect(aiToolPurchaseLabel('purchased')).toBe('Purchased');
    expect(aiToolPurchaseLabel('active')).toBe('Purchased');
    expect(aiToolPurchaseLabel('cancelled')).toBe('Cancelled');
    expect(aiToolPurchaseLabel('past_due')).toBe('Expired');
    expect(aiToolPurchaseLabel('not_purchased')).toBe('Expired');
  });
});
