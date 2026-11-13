import {
  buildBroadcastPayload,
  toCreateBroadcastPayload,
} from '@/src/features/notifications/utils/broadcastForm';
import type { BroadcastFormData } from '@/src/features/notifications/types/broadcast';

describe('buildBroadcastPayload', () => {
  it('maps the web single-select form and the native multi-select form to the same body', () => {
    const native: BroadcastFormData = {
      userType: ['admins'],
      priorityLevel: 'high',
      duration: '24_hours',
      subjectLine: ' Gate closed ',
      bodyText: ' Use the side gate. ',
    };

    const fromNative = toCreateBroadcastPayload(native);
    const fromWeb = buildBroadcastPayload({
      title: ' Gate closed ',
      message: ' Use the side gate. ',
      audience: 'admins',
      priority: 'high',
      duration: '24_hours',
    });

    const { expires_at: webExpiry, ...webRest } = fromWeb;
    const { expires_at: nativeExpiry, ...nativeRest } = fromNative;
    expect(webRest).toEqual(nativeRest);
    expect(Math.abs(Date.parse(webExpiry) - Date.parse(nativeExpiry))).toBeLessThan(1000);
    expect(fromWeb.audience).toEqual(['primary_admin', 'admin']);
    expect(fromWeb.priority).toBe('HIGH');
    expect(fromWeb.title).toBe('Gate closed');
    expect(fromWeb.message).toBe('Use the side gate.');
  });
});
