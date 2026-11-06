import { useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import { fetchMe } from '@/src/lib/api/auth';
import { getValidAccessToken } from '@/src/lib/authRefresh';
import { useUserStore } from '@/src/lib/stores/userStore';
import { User } from '@/src/types/user';

export async function refreshCurrentUser() {
  const accessToken = await getValidAccessToken();
  if (!accessToken) return;

  try {
    const currentUser = (await fetchMe(accessToken)) as User;
    if (currentUser) useUserStore.getState().setUser(currentUser);
  } catch (error) {
    console.log('Failed to refresh user profile', error);
  }
}

export function useRefreshUser() {
  useFocusEffect(
    useCallback(() => {
      refreshCurrentUser();
    }, [])
  );
}
