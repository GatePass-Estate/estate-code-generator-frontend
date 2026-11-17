import {
  nextPushTargetStep,
  requestedInfoBoardTab,
  type PushTargetState,
} from '@/src/features/notifications/utils/pushTarget';

jest.mock('@/src/features/notifications/hooks/useInfoBoard', () => ({}));

describe('requestedInfoBoardTab', () => {
  it('accepts only real tabs', () => {
    expect(requestedInfoBoardTab('message')).toBe('message');
    expect(requestedInfoBoardTab('activities')).toBe('activities');
    expect(requestedInfoBoardTab('other')).toBeUndefined();
    expect(requestedInfoBoardTab(undefined)).toBeUndefined();
  });
});

describe('nextPushTargetStep', () => {
  const fresh = (id: string): PushTargetState => ({ id, refetched: false, done: false });

  it('opens the item when it is already listed', () => {
    const state = fresh('b');
    const step = nextPushTargetStep(state, [{ id: 'a' }, { id: 'b' }]);
    expect(step).toEqual({ kind: 'open', item: { id: 'b' } });
    expect(state.done).toBe(true);
    expect(nextPushTargetStep(state, [{ id: 'b' }])).toEqual({ kind: 'wait' });
  });

  it('refetches once, then gives up', () => {
    const state = fresh('x');
    expect(nextPushTargetStep(state, [{ id: 'a' }])).toEqual({ kind: 'refetch' });
    expect(nextPushTargetStep(state, [{ id: 'a' }])).toEqual({ kind: 'give-up' });
    expect(nextPushTargetStep(state, [{ id: 'x' }])).toEqual({ kind: 'wait' });
  });

  it('opens the item when the refetch brings it in', () => {
    const state = fresh('x');
    nextPushTargetStep(state, []);
    expect(nextPushTargetStep(state, [{ id: 'x' }])).toEqual({ kind: 'open', item: { id: 'x' } });
  });
});
