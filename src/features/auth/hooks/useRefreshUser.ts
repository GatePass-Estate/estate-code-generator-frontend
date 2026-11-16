import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchMe } from '@/src/features/auth/services/auth';
import { getValidAccessToken } from '@/src/features/auth/services/authRefresh';
import { useUserStore } from '@/src/store/userStore';
import { User } from '@/src/features/users/types/user';

export async function refreshCurrentUser() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return;

  try {
    const currentUser = (await fetchMe(accessToken)) as User;
    if (currentUser) useUserStore.getState().setUser(currentUser);
  } catch {}
}

export function useRefreshUser() {
  useFocusEffect(
    useCallback(() => {
      refreshCurrentUser();
    }, [])
  );
}
