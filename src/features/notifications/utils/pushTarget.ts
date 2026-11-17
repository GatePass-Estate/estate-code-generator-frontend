import type { InfoBoardTab } from '@/src/features/notifications/hooks/useInfoBoard';

/** Tab named by a push-notification tap, if it is a real tab. */
export function requestedInfoBoardTab(tab: string | undefined): InfoBoardTab | undefined {
  return tab === 'activities' || tab === 'message' ? tab : undefined;
}

export type PushTargetState = { id: string; refetched: boolean; done: boolean };

export type PushTargetStep<T> =
  | { kind: 'wait' }
  | { kind: 'open'; item: T }
  | { kind: 'refetch' }
  | { kind: 'give-up' };

/**
 * Decides what to do for a push-tapped activity once the list has loaded: open it when it
 * is in the list; otherwise refetch once (the list may predate the push), then give up.
 * Mutates `state` to record the step taken.
 */
export function nextPushTargetStep<T extends { id: string }>(
  state: PushTargetState,
  items: T[]
): PushTargetStep<T> {
  if (state.done) return { kind: 'wait' };
  const item = items.find((candidate) => candidate.id === state.id);
  if (item) {
    state.done = true;
    return { kind: 'open', item };
  }
  if (!state.refetched) {
    state.refetched = true;
    return { kind: 'refetch' };
  }
  state.done = true;
  return { kind: 'give-up' };
}
