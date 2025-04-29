import { useAuth } from '@/hooks/useAuthContext';
import { Redirect, Stack } from 'expo-router';
import { useContext } from 'react';

export const unstable_settings = {
  initialRouteName: '(admin)',
};

export default function AdminLayout() {
  const authState = useAuth();
  const { user, isReady } = authState;
  console.log('AdminLayout', isReady);

  if (!isReady) {
    return null;
  }

  if (!user) {
    return <Redirect href='/login' />;
  }

  if (user.role !== 'admin') {
    return <Redirect href='./(protected)' />;
  }

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name='(admin)' options={{ headerShown: false }} />
      <Stack.Screen name='(userList)' options={{ headerShown: false }} />
      <Stack.Screen name='(userProfile)' options={{ headerShown: false }} />
      <Stack.Screen name='(adminReg)' options={{ headerShown: false }} />
    </Stack>
  );
}
