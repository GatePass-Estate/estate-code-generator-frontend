import { useQuery } from '@tanstack/react-query';
import { verifyEmailActivationToken } from '@/src/features/auth/services/auth';
import { queryKeys } from '@/src/shared/services/api/queryKeys';

export function useVerifyEmailActivationToken(token: string) {
  return useQuery({
    queryKey: queryKeys.auth.verifyEmailActivationToken(token),
    queryFn: () => verifyEmailActivationToken(token),
    enabled: !!token,
  });
}
