import { Platform, View } from 'react-native';
import { Tabs, Stack, router } from 'expo-router';
import UserTabBar from '@/src/features/dashboard/components/UserTabBar';
import { menuRouteType } from '@/src/shared/types/general';

type RoleShellProps = {
  routes?: menuRouteType[];
  headerStyle?: object;
  tabBarStyle?: object;
  enableForMobile?: boolean;
};

/**
 * Role area shell (tabs for residents, stack for admin/security/shared).
 * Not Expo Router's root NavigationContainer — naming it that confused SDK 58 linking.
 */
export default function RoleShell({
  routes,
  headerStyle,
  tabBarStyle,
  enableForMobile = true,
}: RoleShellProps) {
  if (Platform.OS === 'web') {
    return (
      <>
        <Stack
          screenOptions={{
            title: 'Estate Code Generator',
            headerShown: false,
            ...headerStyle,
          }}
        ></Stack>
      </>
    );
  }

  return enableForMobile ? (
    <View style={{ flex: 1 }}>
      <Tabs
        tabBar={(props) => <UserTabBar {...props} />}
        screenOptions={{
          tabBarStyle,
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#113E55',
          tabBarInactiveTintColor: '#6F91A0',
          // PERF-17: don't keep inactive tabs fully live (timers/animations).
          lazy: true,
          freezeOnBlur: true,
          // Home is the leftmost tab: returning to it should shift in from the left.
          animation: 'shift',
        }}
      >
        {routes &&
          routes
            .filter((el) => el.for === 'native' || el.for === 'both')
            .map(({ name, title, TabIcon }) =>
              TabIcon ? (
                <Tabs.Screen
                  key={name}
                  name={name}
                  listeners={
                    name === 'history'
                      ? ({ navigation }) => ({
                          tabPress: (e) => {
                            // Only reset when History is already focused (detail → list).
                            // preventDefault on a cross-tab press blocks UserTabBar's
                            // navigate() and leaves you stuck on Home/Guests/etc.
                            if (!navigation.isFocused()) return;
                            e.preventDefault();
                            router.dismissTo('/user/history');
                          },
                        })
                      : undefined
                  }
                  options={{
                    title,
                    tabBarStyle: name === 'report' ? { display: 'none' } : tabBarStyle,
                    headerTitleStyle: {
                      color: '#113E55',
                      fontFamily: 'UbuntuSans',
                      fontWeight: 'semibold',
                    },

                    headerShown: false,
                    tabBarIcon: ({ focused }) => (TabIcon ? <TabIcon focused={focused} /> : null),
                    // Leave History → drop nested detail/invite so the next visit is the list.
                    popToTopOnBlur: name === 'history',
                  }}
                />
              ) : null
            )}
      </Tabs>
    </View>
  ) : (
    <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }} />
  );
}
