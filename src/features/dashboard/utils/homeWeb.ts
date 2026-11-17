import { Guest } from '@/src/features/visitors/types/index';

/** Guests whose name or relationship contains the query (case-insensitive). */
export function searchGuests(guests: Guest[], query: string): Guest[] {
  const q = query.toLowerCase();
  return guests.filter(
    (guest) =>
      guest.guest_name.toLowerCase().includes(q) || guest.relationship?.toLowerCase().includes(q)
  );
}

/** Number of pages for `total` items; an empty list still has one page. */
export function pageCount(total: number, pageSize: number): number {
  return total > 0 ? Math.ceil(total / pageSize) : 1;
}

/** Items on a 1-based page. */
export function pageSlice<T>(items: T[], page: number, pageSize: number): T[] {
  return items.slice((page - 1) * pageSize, page * pageSize);
}
