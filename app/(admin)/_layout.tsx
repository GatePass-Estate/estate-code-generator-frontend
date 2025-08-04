import { useAuth } from '@/hooks/useAuthContext';
import { Redirect, Stack } from 'expo-router';

export const unstable_settings = {
  initialRouteName: 'dashboard', // Default admin screen
};

export default function AdminLayout() {
  const { user, isReady } = useAuth();

  // Ensure auth state is fully loaded
  if (!isReady) return null;

  // Redirect unauthenticated users
  if (!user) {
    return <Redirect href="/login" />;
  }

  // Restrict access to only primary_admin and root roles
  const isAuthorizedAdmin = ['primary_admin', 'root'].includes(user.role);

  if (!isAuthorizedAdmin) {
    return <Redirect href="/(protected)" />;
  }

  // Render admin-only stack
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="dashboard" />
      <Stack.Screen name="userList" />
      <Stack.Screen name="userProfile" />
      <Stack.Screen name="adminReg" />
    </Stack>
  );
}
