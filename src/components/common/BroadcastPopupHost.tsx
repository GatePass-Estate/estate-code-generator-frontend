import { useCallback, useEffect, useState } from 'react';
import { listBroadcasts, markBroadcastRead } from '@/src/lib/api/broadcast';
import { useNotificationStore } from '@/src/lib/stores/notificationStore';
import { useUserStore } from '@/src/lib/stores/userStore';
import BroadcastPopup from './BroadcastPopup';
import type { BroadcastItem } from '@/src/types/broadcast';

/**
 * Session-scoped suppression.
 *
 * Closing with the X hides the popup for the rest of this app run only. It is
 * module state on purpose — a cold start clears it, so an unacknowledged
 * broadcast comes back the next time the app is opened, exactly as specified.
 * Acknowledging ("Got it!") marks the broadcast read on the server instead, so
 * it never returns.
 */
let suppressedForSession = false;

/** Called on sign-out so the next account sees its own announcements. */
export function resetBroadcastPopupSuppression(): void {
  suppressedForSession = false;
}

/**
 * Loads unread broadcasts once the user is signed in and presents them as a
 * blocking announcement. Renders nothing when there is nothing to show.
 */
export default function BroadcastPopupHost() {
  const user_id = useUserStore((state) => state.user_id);
  const setBroadcastUnread = useNotificationStore((state) => state.setBroadcastUnread);

  const [pending, setPending] = useState<BroadcastItem[]>([]);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadUnread() {
      if (!user_id || suppressedForSession) return;

      try {
        const response = await listBroadcasts(1, 20);
        if (cancelled) return;

        const unread = (response?.items ?? []).filter((item) => !item.is_read);
        setPending(unread);
        setVisible(unread.length > 0);
      } catch {
        // An announcement failing to load must never block the app.
      }
    }

    loadUnread();
    return () => {
      cancelled = true;
    };
  }, [user_id]);

  const handleAcknowledge = useCallback(
    async (id: string) => {
      try {
        await markBroadcastRead(id);
      } catch {
        // Still drop it from the queue: retrying on every launch would trap the
        // user behind a card they cannot clear.
      }
      // Computed outside the updater: calling another store setter inside one
      // would run as a side effect during render.
      const next = pending.filter((item) => item.id !== id);
      setPending(next);
      setBroadcastUnread(next.length);
    },
    [pending, setBroadcastUnread]
  );

  const handleClose = useCallback(() => {
    // Left unread on the server, so it returns on the next cold start.
    suppressedForSession = true;
    setVisible(false);
  }, []);

  if (!visible || pending.length === 0) return null;

  return (
    <BroadcastPopup broadcasts={pending} onAcknowledge={handleAcknowledge} onClose={handleClose} />
  );
}
