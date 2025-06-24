import { useAuth } from '@/hooks/useAuthContext';
import { Redirect, Stack } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
import { Link } from 'expo-router';
import { Text } from '@/components/nativewindui/Text';

export default function SecurityLayout() {
  const { user, isReady } = useAuth();
  console.log('SecurityLayout', isReady);

  if (!isReady) return null;

  if (!user) return <Redirect href="/login" />;
  if (user.role !== 'security') return <Redirect href="/(protected)" />;

  function SettingsIcon() {
    return (
      <Link href="/profile" asChild>
        <Pressable className="opacity-80">
          <View style={styles.profileCircle}>
            <Text style={styles.profileInitials}>GD</Text>
          </View>
        </Pressable>
      </Link>
    );
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        title: 'Incoming Guest',
        headerRight: () => <SettingsIcon />,
      }}
    >
      <Stack.Screen name="(security)/index" options={{ headerShown: false }} />
      <Stack.Screen name="index" options={{ headerShown: true }} />
      <Stack.Screen name="(validationResult)/index" options={{ headerShown: false }} />
      {/* <Stack.Screen name="(security)/index" options={{ headerShown: true }} /> */}
      
    </Stack>
  );
}

const styles = StyleSheet.create({
  profileCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#113E55',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  profileInitials: {
    color: '#113E55',
    fontWeight: '600',
  },
});
