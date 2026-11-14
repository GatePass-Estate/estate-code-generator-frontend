import { useMutation, useQuery } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import {
  deleteCode,
  extendCode,
  freezeCode,
  generateCode,
  getAllCodes,
  getMyCode,
  getUpcomingCodes,
  validateCode,
} from '@/src/features/access-codes/services/codes';
import { queryKeys } from '@/src/shared/services/api/queryKeys';

/** A code change also changes the access logs that list it (e.g. a deleted code is no longer active). */
function refreshCodes() {
  void queryClient.invalidateQueries({ queryKey: queryKeys.codes.all });
  void queryClient.invalidateQueries({ queryKey: queryKeys.accessLogs.all });
}

export function useActiveCodes(userId?: string | null) {
  return useQuery({
    queryKey: queryKeys.codes.active(userId ?? ''),
    queryFn: () => getAllCodes(userId as string),
    enabled: Boolean(userId),
  });
}

export function useUpcomingCodes(userId?: string | null) {
  return useQuery({
    queryKey: queryKeys.codes.upcoming(userId ?? ''),
    queryFn: () => getUpcomingCodes(userId as string),
    enabled: Boolean(userId),
  });
}

export function useMyResidentCode(userId?: string | null) {
  return useQuery({
    queryKey: queryKeys.codes.resident(userId ?? ''),
    queryFn: () => getMyCode(userId as string),
    enabled: Boolean(userId),
    retry: false,
  });
}

export function useDeleteCode() {
  return useMutation({
    mutationFn: (code: string) => deleteCode(code),
    onSuccess: refreshCodes,
  });
}

export function useFreezeCode() {
  return useMutation({
    mutationFn: ({ code, frozen }: { code: string; frozen: boolean }) => freezeCode(code, frozen),
    onSuccess: refreshCodes,
  });
}

export function useExtendCode() {
  return useMutation({
    mutationFn: (code: string) => extendCode(code),
    onSuccess: refreshCodes,
  });
}

export function useGenerateCode() {
  return useMutation({
    mutationFn: (
      input: Parameters<typeof generateCode>[0] & { receiver?: 'visitor' | 'resident' }
    ) => generateCode(input, input.receiver ?? 'visitor'),
    onSuccess: refreshCodes,
  });
}

/** A gate check is a command. It is not cached, and a valid scan refreshes anomaly data. */
export function useValidateCode() {
  return useMutation({
    mutationFn: (code: string) => validateCode(code),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: queryKeys.anomaly.all });
      void queryClient.invalidateQueries({ queryKey: queryKeys.accessLogs.all });
    },
  });
}
