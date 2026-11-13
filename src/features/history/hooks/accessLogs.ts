import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import {
  getEstateResidentLogByCode,
  getEstateResidentLogs,
  getEstateVisitorLogByCode,
  getEstateVisitorLogs,
  getMyResidentAccessLogByCode,
  getMyResidentAccessLogs,
  getMyVisitorAccessLogByCode,
  getMyVisitorAccessLogs,
} from '@/src/features/history/services/accessLogs';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { getUserById, getUserByIdAdmin } from '@/src/features/users/services/user';
import { AccessLogHistoryParams } from '@/src/features/history/types/accessLogs';
import { nextLogPage } from '@/src/features/history/utils/logPagination';

export function useMyVisitorAccessLogs(params?: AccessLogHistoryParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.accessLogs.myVisitor(params),
    queryFn: () => getMyVisitorAccessLogs(params),
    enabled,
  });
}

/** Resident's guest visit history, paged by the response ``total`` (History → Past). */
export function useMyVisitorAccessLogsInfinite(limit: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.accessLogs.myVisitor({ infinite: true, limit }),
    queryFn: ({ pageParam }) => getMyVisitorAccessLogs({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: nextLogPage,
    enabled,
  });
}

export function useMyResidentAccessLogs(params?: AccessLogHistoryParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.accessLogs.myResident(params),
    queryFn: () => getMyResidentAccessLogs(params),
    enabled,
  });
}

export function useMyVisitorAccessLogByCode(
  code: string,
  params?: AccessLogHistoryParams,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.accessLogs.myVisitorCode(code, params),
    queryFn: () => getMyVisitorAccessLogByCode(code, params),
    enabled: enabled && code.length > 0,
  });
}

/** Every visit for one guest code, paged by the response ``total``. */
export function useMyVisitorAccessLogByCodeInfinite(code: string, limit: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.accessLogs.myVisitorCode(code, { infinite: true, limit }),
    queryFn: ({ pageParam }) => getMyVisitorAccessLogByCode(code, { page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: nextLogPage,
    enabled: enabled && code.length > 0,
  });
}

export function useMyResidentAccessLogByCode(
  code: string,
  params?: AccessLogHistoryParams,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.accessLogs.myResidentCode(code, params),
    queryFn: () => getMyResidentAccessLogByCode(code, params),
    enabled: enabled && code.length > 0,
  });
}

export function useEstateVisitorLogs(params?: AccessLogHistoryParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.accessLogs.estateVisitor(params),
    queryFn: () => getEstateVisitorLogs(params),
    enabled,
  });
}

/** Security guest history, one page at a time. The first page renders before later pages load. */
export function useEstateVisitorLogsInfinite(limit: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.accessLogs.estateVisitor({ infinite: true, limit }),
    queryFn: ({ pageParam }) => getEstateVisitorLogs({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: nextLogPage,
    enabled,
  });
}

export function useEstateResidentLogs(params?: AccessLogHistoryParams, enabled = true) {
  return useQuery({
    queryKey: queryKeys.accessLogs.estateResident(params),
    queryFn: () => getEstateResidentLogs(params),
    enabled,
  });
}

/** Security resident history, one page at a time. */
export function useEstateResidentLogsInfinite(limit: number, enabled = true) {
  return useInfiniteQuery({
    queryKey: queryKeys.accessLogs.estateResident({ infinite: true, limit }),
    queryFn: ({ pageParam }) => getEstateResidentLogs({ page: pageParam, limit }),
    initialPageParam: 1,
    getNextPageParam: nextLogPage,
    enabled,
  });
}

export function useEstateVisitorLogByCode(
  code: string,
  params?: AccessLogHistoryParams,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.accessLogs.estateVisitorCode(code, params),
    queryFn: () => getEstateVisitorLogByCode(code, params),
    enabled: enabled && code.length > 0,
  });
}

export function useEstateResidentLogByCode(
  code: string,
  params?: AccessLogHistoryParams,
  enabled = true
) {
  return useQuery({
    queryKey: queryKeys.accessLogs.estateResidentCode(code, params),
    queryFn: () => getEstateResidentLogByCode(code, params),
    enabled: enabled && code.length > 0,
  });
}

export function fetchCachedUser(userId: string) {
  return queryClient.fetchQuery({
    queryKey: queryKeys.users.byId(userId),
    queryFn: () => getUserById(userId),
  });
}

export function fetchCachedAdminUser(userId: string) {
  return queryClient.fetchQuery({
    queryKey: queryKeys.users.byIdAdmin(userId),
    queryFn: () => getUserByIdAdmin(userId),
  });
}
