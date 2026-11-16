import { useCallback, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { deleteAccount } from '@/src/features/users/services/user';
import { useAuth } from '@/src/features/auth/hooks/useAuthContext';

/**
 * Delete Account, shared by web and native: the "Yes, I understand" tick and the delete
 * command. Each platform shows a failure its own way (`onError`, or the returned `error`).
 */
export function useDeleteAccount({ onError }: { onError?: (error: unknown) => void } = {}) {
  const { signOut } = useAuth();
  const [understood, setUnderstood] = useState(false);

  const {
    mutate,
    isPending: deleting,
    error,
  } = useMutation({
    mutationFn: async () => {
      await deleteAccount();
      // Closing the account invalidates every session, so drop local auth too.
      await signOut();
    },
    onError,
  });

  const handleDelete = useCallback(() => {
    if (!understood || deleting) return;
    mutate();
  }, [understood, deleting, mutate]);

  const toggleUnderstood = useCallback(() => setUnderstood((value) => !value), []);

  return { understood, setUnderstood, toggleUnderstood, deleting, error, handleDelete };
}
