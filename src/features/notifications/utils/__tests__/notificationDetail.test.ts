import { describe, expect, it } from '@jest/globals';
import {
  anomalyPredictionId,
  anomalyRoute,
  isPlanChangeNotification,
  metadataRows,
} from '@/src/features/notifications/utils/notificationDetail';

const PREDICTION_ID = '6f1c2a9e-4b7d-4c1a-9e2f-3a5b7c9d1e2f';
const LIST_ROUTE = '/(protected)/(shared-screens)/ai-store/anomaly-detection';

describe('anomalyRoute', () => {
  it('opens the flagged prediction when the notification names it', () => {
    expect(anomalyRoute({ prediction_result_id: PREDICTION_ID, anomaly_type: 'guest' })).toBe(
      `${LIST_ROUTE}/user/${PREDICTION_ID}`
    );
  });

  it('falls back to the anomaly results list without an id', () => {
    const list = { pathname: LIST_ROUTE, params: { tab: 'Result' } };
    expect(anomalyRoute({ anomaly_type: 'guest' })).toEqual(list);
    expect(anomalyRoute(null)).toEqual(list);
    // Push data is stringified server-side, so a missing id can arrive as "None".
    expect(anomalyRoute({ prediction_result_id: 'None' })).toEqual(list);
    expect(anomalyRoute({ prediction_result_id: '  ' })).toEqual(list);
  });
});

describe('anomalyPredictionId', () => {
  it('reads the id from in-app metadata and push data alike', () => {
    expect(anomalyPredictionId({ prediction_result_id: PREDICTION_ID })).toBe(PREDICTION_ID);
    expect(anomalyPredictionId({ prediction_result_id: ` ${PREDICTION_ID} ` })).toBe(PREDICTION_ID);
  });

  it('treats stringified nulls as missing', () => {
    for (const value of [null, undefined, '', 'None', 'null', 'undefined']) {
      expect(anomalyPredictionId({ prediction_result_id: value })).toBeNull();
    }
  });
});

describe('metadataRows for an anomaly notification', () => {
  it('never shows the prediction id or other internal ids', () => {
    const rows = metadataRows({
      prediction_result_id: PREDICTION_ID,
      anomaly_type: 'guest',
      estate_id: 'e7fb4d3b-6418-4729-9454-d34c7f069968',
      hashed_code: 'abc123',
    });
    expect(rows.some((row) => row.value.includes(PREDICTION_ID))).toBe(false);
    expect(rows).toEqual([]);
  });
});

describe('isPlanChangeNotification', () => {
  it('matches the subscription and AI-grant lifecycle types', () => {
    for (const type of [
      'SUBSCRIPTION_PAYMENT_FAILED',
      'SUBSCRIPTION_GRACE_PERIOD',
      'SUBSCRIPTION_GRACE_PERIOD_ADMIN',
      'SUBSCRIPTION_EXPIRED',
      'SUBSCRIPTION_RENEWAL_REMINDER',
      'AI_GRANT_EXPIRED',
      'ESTATE_REACTIVATED',
      'ESTATE_DEACTIVATED',
    ]) {
      expect(isPlanChangeNotification(type)).toBe(true);
    }
  });

  it('ignores everything else', () => {
    for (const type of ['SPATIAL_ANOMALY_DETECTED', 'BROADCAST_HIGH', 'LOGIN_NEW_DEVICE', '']) {
      expect(isPlanChangeNotification(type)).toBe(false);
    }
    expect(isPlanChangeNotification(undefined)).toBe(false);
  });
});
