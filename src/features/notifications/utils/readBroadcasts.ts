import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Device-local record of which broadcasts this user has read.
 *
 * Works around a backend bug: `get_read_ids` asks db-service for many
 * broadcasts using repeated `broadcast_id` query params, but that endpoint
 * declares `broadcast_id` as a single optional UUID. FastAPI keeps only the
 * last value, so the lookup resolves at most one record and every other
 * broadcast is reported as unread — even though `POST /broadcasts/{id}/read`
 * saved it correctly.
 *
 * Read state is therefore OR-ed with this cache when the list loads. Once the
 * backend accepts a list of ids, the server becomes authoritative on its own
 * and this only ever agrees with it — it never marks anything unread.
 */

const KEY_PREFIX = 'gatepass-read-broadcasts:';

function storageKey(userId?: string | null): string | null {
  return userId ? `${KEY_PREFIX}${userId}` : null;
}

export async function getLocallyReadBroadcasts(userId?: string | null): Promise<Set<string>> {
  const key = storageKey(userId);
  if (!key) return new Set();

  try {
    const raw = await AsyncStorage.getItem(key);
    if (!raw) return new Set();

    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? new Set(parsed as string[]) : new Set();
  } catch {
    return new Set();
  }
}

/** Records one or more broadcasts as read on this device. */
export async function addLocallyReadBroadcasts(
  userId: string | null | undefined,
  ids: string | string[]
): Promise<void> {
  const key = storageKey(userId);
  if (!key) return;

  const incoming = Array.isArray(ids) ? ids : [ids];
  if (incoming.length === 0) return;

  try {
    const current = await getLocallyReadBroadcasts(userId);
    incoming.forEach((id) => current.add(id));
    await AsyncStorage.setItem(key, JSON.stringify([...current]));
  } catch {
    // Losing the cache only means the row reads as unread again.
  }
}

/** Drops ids that are no longer in the user's list, so the cache cannot grow forever. */
export async function pruneLocallyReadBroadcasts(
  userId: string | null | undefined,
  liveIds: string[]
): Promise<void> {
  const key = storageKey(userId);
  if (!key) return;

  try {
    const current = await getLocallyReadBroadcasts(userId);
    const live = new Set(liveIds);
    const kept = [...current].filter((id) => live.has(id));

    if (kept.length !== current.size) {
      await AsyncStorage.setItem(key, JSON.stringify(kept));
    }
  } catch {
    // Pruning is housekeeping only.
  }
}

/**
 * Broadcasts opened on screen during this app run.
 *
 * A notification tap on a cold start routes to the message page while the
 * popup host is still fetching unread broadcasts, so the persisted cache above
 * is written too late to stop the same message popping up over its own page.
 * This in-memory signal is synchronous and lets the popup drop a broadcast even
 * after it is already showing.
 */
const openedThisRun = new Set<string>();
const openedListeners = new Set<(id: string) => void>();

export function markBroadcastOpened(id: string): void {
  if (openedThisRun.has(id)) return;
  openedThisRun.add(id);
  openedListeners.forEach((listener) => listener(id));
}

export function wasBroadcastOpened(id: string): boolean {
  return openedThisRun.has(id);
}

/** Subscribes to broadcasts being opened. Returns an unsubscribe function. */
export function onBroadcastOpened(listener: (id: string) => void): () => void {
  openedListeners.add(listener);
  return () => {
    openedListeners.delete(listener);
  };
}
