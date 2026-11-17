import type { InfiniteData } from '@tanstack/react-query';
import { Guest, GuestApiResponse } from '@/src/features/visitors/types/guests';

/** Same match the guests list used inline: name is lowercased, relationship is not. */
export function filterGuests(guests: Guest[], searchQuery: string): Guest[] {
  const query = searchQuery.toLowerCase();
  return guests.filter(
    (guest) => guest.guest_name.toLowerCase().includes(query) || guest.relationship?.includes(query)
  );
}

export function removeGuestFromList(
  current: GuestApiResponse | undefined,
  id: string
): GuestApiResponse | undefined {
  if (!current) return current;
  return {
    ...current,
    items: current.items.filter((guest) => guest.id !== id),
    total: Math.max(0, current.total - 1),
  };
}

/** Remove a deleted guest from every loaded page of the infinite guests list. */
export function removeGuestFromPages(
  current: InfiniteData<GuestApiResponse, number> | undefined,
  id: string
): InfiniteData<GuestApiResponse, number> | undefined {
  if (!current) return current;
  return {
    ...current,
    pages: current.pages.map((page) => removeGuestFromList(page, id) ?? page),
  };
}

/** Next page to request while fewer guests are loaded than the response ``total``. */
export function nextGuestPage(
  lastPage: Pick<GuestApiResponse, 'total' | 'items'>,
  allPages: Pick<GuestApiResponse, 'items'>[]
): number | undefined {
  const loaded = allPages.reduce((sum, page) => sum + page.items.length, 0);
  if (lastPage.items.length === 0 || loaded >= lastPage.total) return undefined;
  return allPages.length + 1;
}
