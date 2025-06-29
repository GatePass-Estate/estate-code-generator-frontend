import { useAuth } from '@/hooks/useAuthContext';
import { Redirect, Stack } from 'expo-router';
import { useContext } from 'react';

export const unstable_settings = {
  initialRouteName: '(security)',
};

export default function AdminLayout() {
  const authState = useAuth();
  const { user, isReady } = authState;
  console.log('SecurityLayout', isReady);

  if (!isReady) {
    return null;
  }

  if (!user) {
    return <Redirect href='/login' />;
  }

  if (user.role !== 'security') {
    return <Redirect href='./(protected)' />;
  }

  return (
    <Stack screenOptions={{ headerShown: false, title: "Incoming Guest" }}>
      <Stack.Screen name='(security)' options={{ headerShown: false,  }} />
      <Stack.Screen name='(validationResult)' options={{ headerShown: false}} />

    </Stack>
  );
}
