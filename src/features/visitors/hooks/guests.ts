import { useInfiniteQuery, useMutation, useQuery, type InfiniteData } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import {
  createGuest,
  deleteMyGuest,
  getMyGuests,
  getSingleGuest,
} from '@/src/features/visitors/services/guests';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import {
  nextGuestPage,
  removeGuestFromList,
  removeGuestFromPages,
} from '@/src/features/visitors/utils/filterGuests';
import { GuestApiResponse } from '@/src/features/visitors/types/guests';

const GUEST_LIST_PAGE = 1;
const GUEST_LIST_LIMIT = 6;

export function useMyGuests(page = GUEST_LIST_PAGE, limit = GUEST_LIST_LIMIT) {
  return useQuery({
    queryKey: queryKeys.guests.list(page, limit),
    queryFn: () => getMyGuests(page, limit),
  });
}

/** Every saved guest, loaded a page at a time (mobile list with infinite scroll). */
export function useMyGuestsInfinite(limit = GUEST_LIST_LIMIT) {
  return useInfiniteQuery({
    queryKey: queryKeys.guests.infinite(limit),
    queryFn: ({ pageParam }) => getMyGuests(pageParam, limit),
    initialPageParam: GUEST_LIST_PAGE,
    getNextPageParam: nextGuestPage,
  });
}

export function useGuest(id: string) {
  return useQuery({
    queryKey: queryKeys.guests.detail(id),
    queryFn: () => getSingleGuest(id),
    enabled: id.length > 0,
  });
}

export function useDeleteGuest() {
  return useMutation({
    mutationFn: (id: string) => deleteMyGuest(id),
    onSuccess: (_data, id) => {
      queryClient.setQueryData<GuestApiResponse>(
        queryKeys.guests.list(GUEST_LIST_PAGE, GUEST_LIST_LIMIT),
        (current) => removeGuestFromList(current, id)
      );
      queryClient.setQueriesData<InfiniteData<GuestApiResponse, number>>(
        { queryKey: [...queryKeys.guests.all, 'infinite'] },
        (current) => removeGuestFromPages(current, id)
      );
      void queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
    },
  });
}

export function useCreateGuest() {
  return useMutation({
    mutationFn: createGuest,
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.guests.all });
    },
  });
}
