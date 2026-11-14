import {
  filterGuests,
  nextGuestPage,
  removeGuestFromList,
  removeGuestFromPages,
} from '@/src/features/visitors/utils/filterGuests';
import { Guest, GuestApiResponse } from '@/src/features/visitors/types/guests';

const guests: Guest[] = [
  {
    id: '1',
    resident_id: 'r1',
    guest_name: 'Ada Lovelace',
    gender: 'female',
    guest_phone_number: null,
    relationship: 'family',
    created_at: '',
    updated_at: '',
    is_deleted: false,
  },
  {
    id: '2',
    resident_id: 'r1',
    guest_name: 'Alan Turing',
    gender: 'male',
    guest_phone_number: null,
    relationship: 'friend',
    created_at: '',
    updated_at: '',
    is_deleted: false,
  },
];

describe('filterGuests', () => {
  it('matches a lowercased name', () => {
    expect(filterGuests(guests, 'ADA').map((guest) => guest.id)).toEqual(['1']);
  });

  it('lowercases the query before comparing the stored relationship', () => {
    expect(filterGuests(guests, 'Friend').map((guest) => guest.id)).toEqual(['2']);
    expect(
      filterGuests([{ ...guests[1], relationship: 'Friend' as Guest['relationship'] }], 'friend')
    ).toEqual([]);
  });
});

describe('removeGuestFromList', () => {
  const page: GuestApiResponse = { items: guests, total: 2, page: 1, limit: 6 };

  it('drops the deleted guest and the total', () => {
    expect(removeGuestFromList(page, '1')).toEqual({
      ...page,
      items: [guests[1]],
      total: 1,
    });
  });

  it('leaves a missing cache alone', () => {
    expect(removeGuestFromList(undefined, '1')).toBeUndefined();
  });
});

describe('removeGuestFromPages', () => {
  it('drops the deleted guest from every loaded page', () => {
    const pages = {
      pages: [
        { items: [guests[0]], total: 2, page: 1, limit: 1 },
        { items: [guests[1]], total: 2, page: 2, limit: 1 },
      ],
      pageParams: [1, 2],
    };
    const result = removeGuestFromPages(pages, '2');
    expect(result?.pages.map((page) => page.items.map((guest) => guest.id))).toEqual([['1'], []]);
    expect(result?.pageParams).toEqual([1, 2]);
  });

  it('leaves a missing cache alone', () => {
    expect(removeGuestFromPages(undefined, '1')).toBeUndefined();
  });
});

describe('nextGuestPage', () => {
  it('requests the next page until total guests are loaded', () => {
    const first = { items: guests, total: 3 };
    expect(nextGuestPage(first, [first])).toBe(2);
    const second = { items: [guests[0]], total: 3 };
    expect(nextGuestPage(second, [first, second])).toBeUndefined();
  });

  it('stops on an empty page', () => {
    const empty = { items: [], total: 10 };
    expect(nextGuestPage(empty, [{ items: guests }, empty])).toBeUndefined();
  });
});
