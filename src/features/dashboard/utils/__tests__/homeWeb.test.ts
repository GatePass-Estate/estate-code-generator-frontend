import { pageCount, pageSlice, searchGuests } from '@/src/features/dashboard/utils/homeWeb';
import { Guest } from '@/src/features/visitors/types/index';

const guest = (guest_name: string, relationship: Guest['relationship']) =>
  ({ id: guest_name, guest_name, relationship }) as Guest;

describe('home web helpers', () => {
  it('searches names and relationships case-insensitively', () => {
    const list = [guest('Ada', 'friend'), guest('Bola', 'family')];
    expect(searchGuests(list, 'ADA').map((g) => g.id)).toEqual(['Ada']);
    expect(searchGuests(list, 'fam').map((g) => g.id)).toEqual(['Bola']);
    expect(searchGuests(list, '')).toHaveLength(2);
  });

  it('always has at least one page', () => {
    expect(pageCount(0, 3)).toBe(1);
    expect(pageCount(7, 3)).toBe(3);
  });

  it('slices 1-based pages', () => {
    expect(pageSlice([1, 2, 3, 4, 5], 2, 2)).toEqual([3, 4]);
  });
});
