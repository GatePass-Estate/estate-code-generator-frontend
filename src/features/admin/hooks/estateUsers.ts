import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { getAllEstateUsers } from '@/src/features/users/services/user';
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
 * Matches All Users chips/search against a row.
 * `/users/all` only filters by activation status; role + name are applied here.
 */
export function userMatchesListFilters(user: User, filters: EstateUsersListFilters): boolean {
  const search = filters.search?.trim().toLowerCase() ?? '';
  if (search) {
    const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim().toLowerCase();
    const email = (user.email ?? '').toLowerCase();
    const address = (user.home_address ?? '').toLowerCase();
    if (!name.includes(search) && !email.includes(search) && !address.includes(search)) {
      return false;
    }
  }

  const role = filters.role ?? null;
  if (role === 'admins') {
    if (!['admin', 'primary_admin'].includes(user.role as string)) return false;
  } else if (role && user.role !== role) {
    return false;
  }

  if (filters.validated !== null && filters.validated !== undefined) {
    if (user.status !== filters.validated) return false;
  }

  return true;
}

/**
 * All Users: page via `GET /users/all` (estate-scoped; status on the wire).
 * Role + search are filtered client-side — the search API uses exact string equality,
 * which made role/search chips look broken (same first page every time).
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
  const statusParam: 'all' | 'true' | 'false' =
    normalized.validated === true ? 'true' : normalized.validated === false ? 'false' : 'all';

  const infinite = useInfiniteQuery({
    // `/users/all` only understands status — cache by that. Role/search filter in memory
    // so chip switches update immediately without re-downloading the same pages.
    // Estate comes from the JWT on the server; don't block the list if zustand estate_id
    // hasn't hydrated yet (that left All Users empty / looking broken after the audit pass).
    queryKey: estateUsersKeys.infinite(estateId || 'session', { validated: normalized.validated }),
    queryFn: ({ pageParam }) =>
      getAllEstateUsers(pageParam, ESTATE_USERS_LIST_PAGE_SIZE, statusParam),
    initialPageParam: 1,
    getNextPageParam: nextUsersPage,
    enabled,
  });

  const seen = new Set<string>();
  const items: User[] = [];
  for (const user of infinite.data?.pages.flatMap((page) => page.items) ?? []) {
    const key = user.id ?? user.user_id;
    if (!key || seen.has(key)) continue;
    if (!userMatchesListFilters(user, normalized)) continue;
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
