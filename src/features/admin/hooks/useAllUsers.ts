import { useCallback, useDeferredValue, useEffect, useState } from 'react';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { userFacingError } from '@/src/shared/services/api/errors';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import type { User } from '@/src/features/users/types/user';
import {
  useEstateUsersInfinite,
  type EstateUserRoleFilter,
} from '@/src/features/users/hooks/estateUsers';
import {
  roleFiltersFromParam,
  toggleRoleFilter,
  toggleValidationStatus,
} from '@/src/features/admin/utils/allUsersFilters';

/**
 * All Users (every breakpoint): server-side search + role/validation chips over the infinite
 * estate-users query, pull-to-refresh, refetch when stale on refocus, and opening a profile.
 */
export function useAllUsers() {
  const { role } = useLocalSearchParams<{ role?: string }>();
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearch = useDeferredValue(searchQuery.trim());
  const [selectedFilters, setSelectedFilters] = useState<EstateUserRoleFilter[]>(
    () => roleFiltersFromParam(role) ?? []
  );
  /** Multi-select: true = validated, false = non-validated. Both or neither = everyone. */
  const [validationStatuses, setValidationStatuses] = useState<boolean[]>([]);
  const [filterVisible, setFilterVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const fromParam = roleFiltersFromParam(role);
    if (fromParam) setSelectedFilters(fromParam);
  }, [role]);

  // Role + validation chips OR together; search still combines with them.
  const usersQuery = useEstateUsersInfinite({
    search: deferredSearch,
    roles: selectedFilters,
    validatedStatuses: validationStatuses,
  });

  const loading = usersQuery.isLoading || (usersQuery.isFetching && !usersQuery.isFetched);
  const error = usersQuery.isError
    ? userFacingError(usersQuery.error, 'Could not load users.')
    : '';
  // Both validation chips on = no status filter (same as none) — don't mark the icon active.
  const validationFilterActive = validationStatuses.length === 1;
  const hasActiveAdvancedFilter = validationFilterActive || selectedFilters.length > 0;
  const { isFetched, isStale, refetch } = usersQuery;

  useFocusEffect(
    useCallback(() => {
      if (isFetched && isStale) void refetch();
    }, [isFetched, isStale, refetch])
  );

  const refreshUsers = async () => {
    setRefreshing(true);
    await usersQuery.refetch();
    setRefreshing(false);
  };

  const loadMore = () => {
    if (!usersQuery.hasNextPage || usersQuery.isFetchingNextPage) return;
    void usersQuery.fetchNextPage();
  };

  const openUser = (user: User) => {
    const userId = user.id ?? user.user_id;
    if (!userId) return;

    // Profile API 404s inactive users — keep the list row so detail can still open.
    queryClient.setQueryData(queryKeys.users.byIdAdmin(userId), {
      ...user,
      user_id: user.user_id || userId,
      id: userId,
    });

    router.push({
      pathname: '/admin/users/[userId]',
      params: { userId },
    });
  };

  return {
    searchQuery,
    setSearchQuery,
    deferredSearch,
    selectedFilters,
    onRoleChange: (value: EstateUserRoleFilter | null) =>
      setSelectedFilters((current) => toggleRoleFilter(current, value)),
    validationStatuses,
    onValidationChange: (value: boolean) =>
      setValidationStatuses((current) => toggleValidationStatus(current, value)),
    hasActiveAdvancedFilter,
    filterVisible,
    setFilterVisible,
    users: usersQuery.items,
    loading,
    error,
    retry: () => {
      void usersQuery.refetch();
    },
    fetchingMore: usersQuery.isFetchingNextPage,
    hasNextPage: usersQuery.hasNextPage,
    refreshing,
    refreshUsers,
    loadMore,
    openUser,
  };
}
