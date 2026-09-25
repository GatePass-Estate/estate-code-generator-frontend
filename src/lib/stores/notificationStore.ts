import { create, StateCreator } from 'zustand';
import { getUnreadBroadcastCount } from '@/src/lib/api/broadcast';
import { getUnreadNotificationCount } from '@/src/lib/api/notifications';

type State = {
  broadcastUnread: number;
  activityUnread: number;
  loaded: boolean;
};

type Actions = {
  /** Re-reads both unread counts. Failures leave the last known values alone. */
  refreshCounts: () => Promise<void>;
  setBroadcastUnread: (count: number) => void;
  setActivityUnread: (count: number) => void;
  clear: () => void;
};

const initialState: State = {
  broadcastUnread: 0,
  activityUnread: 0,
  loaded: false,
};

const creator: StateCreator<State & Actions> = (set) => ({
  ...initialState,
  refreshCounts: async () => {
    // Settled rather than all: one failing endpoint should not blank the other
    // badge, and an unauthenticated call during sign-out must not throw.
    const [broadcasts, activity] = await Promise.allSettled([
      getUnreadBroadcastCount(),
      getUnreadNotificationCount(),
    ]);

    set((state) => ({
      broadcastUnread:
        broadcasts.status === 'fulfilled' ? (broadcasts.value?.count ?? 0) : state.broadcastUnread,
      activityUnread:
        activity.status === 'fulfilled' ? (activity.value?.count ?? 0) : state.activityUnread,
      loaded: true,
    }));
  },
  setBroadcastUnread: (count: number) => set({ broadcastUnread: Math.max(0, count) }),
  setActivityUnread: (count: number) => set({ activityUnread: Math.max(0, count) }),
  clear: () => set(initialState),
});

export const useNotificationStore = create<State & Actions>(creator);

/** True when either tab has something unread — drives the bell's red dot. */
export function selectHasUnread(state: State): boolean {
  return state.broadcastUnread > 0 || state.activityUnread > 0;
}
