import { Link, Redirect, Stack } from 'expo-router';

import 'react-native-reanimated';

import { useColorScheme } from '@/lib/useColorScheme';
import { NAV_THEME } from '@/theme';
import { Pressable, View } from 'react-native';
import { cn } from '@/lib/cn';
import { Icon } from '@roninoss/icons';
import { ThemeToggle } from '@/components/ThemeToggle';
import { useAuth } from '@/hooks/useAuthContext';

export const unstable_home_settings = {
  initialRouteName: '(tabs)',
};

export default function ProtectedLayout() {
  const { user, isReady } = useAuth();

  if (!isReady) {
    return null;
  }

  if (!user) {
    return <Redirect href='/login' />;
  }

  if (user.role === 'admin') {
    return <Redirect href='/(admin)' />;
  }

  return (
    <Stack>
      <Stack.Screen name='(tabs)' options={{ headerShown: false }} />
    </Stack>
  );
}
