import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import {
  getAllEstateUsers,
  searchEstateUsers,
  searchTextToUserFilters,
  type SearchEstateUsersParams,
} from '@/src/features/users/services/user';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { useUserStore } from '@/src/store/userStore';
import type { AllUsers, User } from '@/src/features/users/types/user';

const PAGE_SIZE = 100;
/** Dashboard poll only needs role_summary + a short preview list, not every resident. */
const DASHBOARD_PAGE_SIZE = 30;
/** All Users list page size — load more as the admin scrolls. */
export const ESTATE_USERS_LIST_PAGE_SIZE = 40;

export const estateUsersKeys = queryKeys.estateUsers;

export type EstateUsersListFilters = {
  search?: string;
  role?: 'resident' | 'security' | 'admin' | 'primary_admin' | 'admins' | null;
  validated?: boolean | null;
};

function apiRoleForFilter(role: EstateUsersListFilters['role']): SearchEstateUsersParams['role'] {
  if (role === 'resident' || role === 'security' || role === 'admin' || role === 'primary_admin') {
    return role;
  }
  // `admins` is a UI chip — backend Role enum is one value, handled in fetchListPage.
  return null;
}

/**
 * All Users page via `GET /users/` — search, role, and status are filtered on the server.
 * The Admins chip requests both `admin` and `primary_admin` (no combined Role enum value).
 */
async function fetchEstateUsersListPage(
  page: number,
  filters: EstateUsersListFilters
): Promise<AllUsers> {
  const text = searchTextToUserFilters(filters.search ?? '');
  const status = filters.validated ?? null;
  const base = {
    page,
    limit: ESTATE_USERS_LIST_PAGE_SIZE,
    ...text,
    status,
  } satisfies SearchEstateUsersParams;

  if (filters.role === 'admins') {
    const [adminPage, primaryPage] = await Promise.all([
      searchEstateUsers({ ...base, role: 'admin' }),
      // Primary admins are few — pull them on page 1 only so they always show under Admins.
      page === 1
        ? searchEstateUsers({ ...base, page: 1, limit: 20, role: 'primary_admin' })
        : Promise.resolve(null),
    ]);
    if (!primaryPage) return adminPage;
    const seen = new Set(
      adminPage.items.map((user) => user.id ?? user.user_id).filter(Boolean) as string[]
    );
    const extras = primaryPage.items.filter((user) => {
      const id = user.id ?? user.user_id;
      return !!id && !seen.has(id);
    });
    return {
      ...adminPage,
      items: [...extras, ...adminPage.items],
      total: adminPage.total + primaryPage.total,
    };
  }

  return searchEstateUsers({
    ...base,
    role: apiRoleForFilter(filters.role),
  });
}

/** Every user in the estate (all pages). Prefer `useEstateUsersInfinite` for list UIs. */
export async function fetchAllEstateUsers(): Promise<AllUsers> {
  let items: AllUsers['items'] = [];
  let page = 1;
  let total = 0;
  let data: AllUsers;
  do {
    data = await getAllEstateUsers(page, PAGE_SIZE, 'all');
    items = [...items, ...data.items];
    total = data.total;
    page += 1;
  } while (items.length < total && data.items.length > 0);
  return { ...data, items, total };
}

/**
 * First page + role_summary. Enough for seat counts and the admin home preview; avoids
 * re-downloading the full estate on every 30s poll (PERF-03).
 */
export async function fetchEstateUsersPage(): Promise<AllUsers> {
  return getAllEstateUsers(1, DASHBOARD_PAGE_SIZE, 'all');
}

/** Always hits the API and refreshes the dashboard page cache (admin home refresh/polling). */
export function fetchEstateUsersFresh(estateId: string): Promise<AllUsers> {
  return queryClient.fetchQuery({
    queryKey: estateUsersKeys.estatePage(estateId),
    queryFn: fetchEstateUsersPage,
    staleTime: 0,
  });
}

/** Shared full estate users list — avoid for All Users; use infinite query instead. */
export function useEstateUsers({ enabled = true }: { enabled?: boolean } = {}) {
  const estateId = useUserStore((s) => s.estate_id);
  return useQuery({
    queryKey: estateUsersKeys.estate(estateId || 'session'),
    queryFn: fetchAllEstateUsers,
    enabled,
  });
}

/**
 * First page + role_summary only — enough for seat occupancy on billing screens
 * without downloading every resident (PERF-03).
 */
export function useEstateUsersSummary({ enabled = true }: { enabled?: boolean } = {}) {
  const estateId = useUserStore((s) => s.estate_id);
  return useQuery({
    queryKey: estateUsersKeys.estatePage(estateId || 'session'),
    queryFn: fetchEstateUsersPage,
    enabled,
  });
}

function nextUsersPage(lastPage: AllUsers): number | undefined {
  const loaded = lastPage.page * lastPage.limit;
  if (lastPage.items.length === 0) return undefined;
  if (loaded >= lastPage.total) return undefined;
  return lastPage.page + 1;
}

/**
 * All Users: page via `GET /users/` with search, role, and status on the wire.
 * Estate scope comes from the JWT — do not block the list if zustand estate_id
 * has not hydrated yet.
 */
export function useEstateUsersInfinite(
  filters: EstateUsersListFilters = {},
  { enabled = true }: { enabled?: boolean } = {}
) {
  const estateId = useUserStore((s) => s.estate_id);
  const normalized: EstateUsersListFilters = {
    search: filters.search?.trim() || '',
    role: filters.role ?? null,
    validated: filters.validated ?? null,
  };

  const infinite = useInfiniteQuery({
    queryKey: estateUsersKeys.infinite(estateId || 'session', normalized),
    queryFn: ({ pageParam }) => fetchEstateUsersListPage(pageParam, normalized),
    initialPageParam: 1,
    getNextPageParam: nextUsersPage,
    enabled,
  });

  const seen = new Set<string>();
  const items: User[] = [];
  for (const user of infinite.data?.pages.flatMap((page) => page.items) ?? []) {
    const key = user.id ?? user.user_id;
    if (!key || seen.has(key)) continue;
    seen.add(key);
    items.push(user);
  }

  return {
    ...infinite,
    items,
    primaryAdminsLoading: false,
  };
}

/** Drop the cached users list (on sign-out). */
export function clearEstateUsers() {
  queryClient.removeQueries({ queryKey: estateUsersKeys.all });
}
