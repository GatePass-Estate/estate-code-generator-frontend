import { describe, expect, it } from '@jest/globals';
import {
  buildStandaloneAiTools,
  isStandaloneAiGrant,
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
  it('keeps AI tools subscribed to on their own in the marketplace', () => {
    expect(isStandaloneAiGrant({ source: 'standalone_purchase' })).toBe(true);
    expect(isStandaloneAiGrant({ source: 'STANDALONE_PURCHASE' })).toBe(true);
  });

  it('leaves out plan-included tools, free installs and unknown sources', () => {
    expect(isStandaloneAiGrant({ source: 'subscription_tier' })).toBe(false);
    expect(isStandaloneAiGrant({ source: 'free_install' })).toBe(false);
    expect(isStandaloneAiGrant({ source: 'admin_grant' })).toBe(false);
    expect(isStandaloneAiGrant({ source: '' })).toBe(false);
  });
});

describe('buildStandaloneAiTools', () => {
  const products = [
    { id: 'p1', name: 'Anomaly Detection', ai_feature_ids: ['f1', 'f1b'] },
    { id: 'p2', name: 'Incident Reports', ai_feature_ids: ['f2'] },
  ];

  it('lists only standalone subscriptions, named from the marketplace', () => {
    const tools = buildStandaloneAiTools(
      [
        grant({ id: 'a', ai_feature_id: 'f1', source: 'standalone_purchase' }),
        grant({ id: 'b', ai_feature_id: 'f2', source: 'subscription_tier' }),
        grant({
          id: 'c',
          ai_feature_id: 'f3',
          feature_key: 'smart_alerts',
          source: 'free_install',
          expires_at: null,
        }),
      ],
      products,
      NOW
    );
    expect(tools.map((tool) => tool.name)).toEqual(['Anomaly Detection']);
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

  it('groups a product into one row, keeping the active grant', () => {
    const tools = buildStandaloneAiTools(
      [
        grant({ id: 'old', ai_feature_id: 'f1', status: 'cancelled' }),
        grant({ id: 'new', ai_feature_id: 'f1b', status: 'active' }),
      ],
      products,
      NOW
    );
    expect(tools).toHaveLength(1);
    expect(tools[0].status).toBe('active');
  });

  it('treats an active grant past its end date as expired', () => {
    const [tool] = buildStandaloneAiTools(
      [grant({ expires_at: '2026-05-15T00:00:00Z' })],
      products,
      NOW
    );
    expect(tool.status).toBe('expired');
  });
});
