import { useQuery } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { getAllEstateUsers } from '@/src/lib/api/user';
import { useUserStore } from '@/src/lib/stores/userStore';
import type { AllUsers } from '@/src/types/user';

const PAGE_SIZE = 100;

export const estateUsersKeys = {
  all: ['estate-users'] as const,
  estate: (estateId: string) => ['estate-users', estateId] as const,
};

/** Every user in the estate (all pages of `GET {USER}/users/all`), with the page's role summary. */
export async function fetchAllEstateUsers(): Promise<AllUsers> {
  let items: AllUsers['items'] = [];
  let page = 1;
  let total = 0;
  let data: AllUsers;
  do {
    data = await getAllEstateUsers(page, PAGE_SIZE);
    items = [...items, ...data.items];
    total = data.total;
    page += 1;
  } while (items.length < total && data.items.length > 0);
  return { ...data, items, total };
}

/** Always hits the API and refreshes the shared cache (admin dashboard refresh/polling). */
export function fetchEstateUsersFresh(estateId: string): Promise<AllUsers> {
  return queryClient.fetchQuery({
    queryKey: estateUsersKeys.estate(estateId),
    queryFn: fetchAllEstateUsers,
    staleTime: 0,
  });
}

/** Shared estate users list: reuses what the admin dashboard already loaded when it is fresh. */
export function useEstateUsers({ enabled = true }: { enabled?: boolean } = {}) {
  const estateId = useUserStore((s) => s.estate_id);
  return useQuery({
    queryKey: estateUsersKeys.estate(estateId ?? ''),
    queryFn: fetchAllEstateUsers,
    enabled: enabled && Boolean(estateId),
  });
}

/** Drop the cached users list (on sign-out). */
export function clearEstateUsers() {
  queryClient.removeQueries({ queryKey: estateUsersKeys.all });
}
