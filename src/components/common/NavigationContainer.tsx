import { Platform, View } from 'react-native';
import { Tabs, Stack, router } from 'expo-router';
import UserTabBar from '@/src/components/mobile/UserTabBar';
import { menuRouteType } from '@/src/types/general';

type NavigationContainerProps = {
  routes?: menuRouteType[];
  headerStyle?: object;
  tabBarStyle?: object;
  enableForMobile?: boolean;
};

export default function NavigationContainer({
  routes,
  headerStyle,
  tabBarStyle,
  enableForMobile = true,
}: NavigationContainerProps) {
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
        }}
      >
        {routes &&
          routes
            .filter((el) => el.for == 'native' || el.for == 'both')
            .map(({ name, title, TabIcon }) =>
              TabIcon ? (
                <Tabs.Screen
                  key={name}
                  name={name}
                  listeners={
                    name === 'history'
                      ? {
                          tabPress: () => {
                            router.dismissTo('/user/history');
                          },
                        }
                      : undefined
                  }
                  options={{
                    title,
                    headerTitleStyle: {
                      color: '#113E55',
                      fontFamily: 'UbuntuSans',
                      fontWeight: 'semibold',
                    },

                    headerShown: false,
                    tabBarIcon: ({ focused }) => (TabIcon ? <TabIcon focused={focused} /> : null),
                    popToTopOnBlur: name === 'history',
                  }}
                />
              ) : null
            )}
      </Tabs>
    </View>
  ) : (
    <Stack screenOptions={{ headerShown: false }} />
  );
}
