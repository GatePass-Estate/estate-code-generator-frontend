import { useNotificationStore } from '@/src/features/notifications/store/notificationStore';
import { getUnreadBroadcastCount } from '@/src/features/notifications/services/broadcast';
import { getUnreadNotificationCount } from '@/src/features/notifications/services/notifications';

jest.mock('@/src/features/notifications/services/broadcast', () => ({
  getUnreadBroadcastCount: jest.fn(),
}));
jest.mock('@/src/features/notifications/services/notifications', () => ({
  getUnreadNotificationCount: jest.fn(),
}));

const broadcastCount = getUnreadBroadcastCount as jest.Mock;
const activityCount = getUnreadNotificationCount as jest.Mock;

function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((r) => (resolve = r));
  return { promise, resolve };
}

describe('notificationStore.refreshCounts', () => {
  beforeEach(() => {
    useNotificationStore.getState().clear();
    broadcastCount.mockReset();
    activityCount.mockReset();
  });

  it('applies only the latest response when responses arrive out of order', async () => {
    const olderBroadcasts = deferred<{ count: number }>();
    const olderActivity = deferred<{ count: number }>();
    broadcastCount.mockReturnValueOnce(olderBroadcasts.promise).mockResolvedValueOnce({ count: 1 });
    activityCount.mockReturnValueOnce(olderActivity.promise).mockResolvedValueOnce({ count: 2 });

    const older = useNotificationStore.getState().refreshCounts();
    await useNotificationStore.getState().refreshCounts();
    expect(useNotificationStore.getState()).toMatchObject({
      broadcastUnread: 1,
      activityUnread: 2,
    });

    olderBroadcasts.resolve({ count: 9 });
    olderActivity.resolve({ count: 9 });
    await older;
    expect(useNotificationStore.getState()).toMatchObject({
      broadcastUnread: 1,
      activityUnread: 2,
    });
  });

  it('does not let an in-flight refresh overwrite a newer local write', async () => {
    const pending = deferred<{ count: number }>();
    broadcastCount.mockReturnValueOnce(pending.promise);
    activityCount.mockResolvedValueOnce({ count: 4 });

    const refresh = useNotificationStore.getState().refreshCounts();
    useNotificationStore.getState().setBroadcastUnread(0);
    pending.resolve({ count: 5 });
    await refresh;
    expect(useNotificationStore.getState().broadcastUnread).toBe(0);
  });

  it('keeps the last known value when one endpoint fails', async () => {
    useNotificationStore.getState().setActivityUnread(3);
    broadcastCount.mockResolvedValueOnce({ count: 2 });
    activityCount.mockRejectedValueOnce(new Error('offline'));

    await useNotificationStore.getState().refreshCounts();
    expect(useNotificationStore.getState()).toMatchObject({
      broadcastUnread: 2,
      activityUnread: 3,
      loaded: true,
    });
  });

  it('floors local writes at zero', () => {
    useNotificationStore.getState().setBroadcastUnread(-1);
    expect(useNotificationStore.getState().broadcastUnread).toBe(0);
  });
});
