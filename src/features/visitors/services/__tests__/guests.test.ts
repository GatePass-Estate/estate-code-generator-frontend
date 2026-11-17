import { createGuest, deleteMyGuest, getMyGuests } from '@/src/features/visitors/services/guests';
import Api from '@/src/shared/services/api/client';

jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

jest.mock('expo-secure-store', () => ({
  getItemAsync: jest.fn(async () => null),
  setItemAsync: jest.fn(async () => undefined),
  deleteItemAsync: jest.fn(async () => undefined),
}));

jest.mock('@/src/shared/services/api/client', () => ({
  __esModule: true,
  default: jest.fn(),
}));

const api = Api as jest.MockedFunction<typeof Api>;

describe('guest API', () => {
  beforeEach(() => {
    api.mockReset();
  });

  it('loads the saved-guest page from the user service', async () => {
    const get = jest.fn().mockResolvedValue({
      data: { items: [], total: 0, page: 1, limit: 6 },
    });
    api.mockReturnValue({ get } as never);

    await expect(getMyGuests()).resolves.toEqual({ items: [], total: 0, page: 1, limit: 6 });
    expect(api).toHaveBeenCalledWith();
    expect(get).toHaveBeenCalledWith('/users/guest?page=1&limit=6');
  });

  it('deletes by guest id', async () => {
    const del = jest.fn().mockResolvedValue({ data: { is_deleted: true, deleted_at: 'now' } });
    api.mockReturnValue({ delete: del } as never);

    await deleteMyGuest('guest-1');
    expect(del).toHaveBeenCalledWith('/users/guest/guest-1');
  });

  it('registers a guest on the existing endpoint', async () => {
    const post = jest.fn().mockResolvedValue({ data: { id: 'guest-2', created_at: 'now' } });
    api.mockReturnValue({ post } as never);

    const payload = {
      resident_id: 'resident-1',
      guest_name: 'Ada',
      gender: 'female' as const,
      relationship: 'family' as const,
    };

    await expect(createGuest(payload)).resolves.toEqual({ id: 'guest-2', created_at: 'now' });
    expect(post).toHaveBeenCalledWith('/users/guest/register', payload);
  });
});
