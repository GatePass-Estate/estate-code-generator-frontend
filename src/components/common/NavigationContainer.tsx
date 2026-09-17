import { Platform, Pressable, View, StyleSheet } from 'react-native';
import { Tabs, Stack, router } from 'expo-router';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
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
  const { systemBottom, tabBarHeight } = useAndroidBottomInset();

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
        screenOptions={{
          tabBarStyle: [
            { ...tabBarStyle },
            Platform.OS === 'android' && {
              bottom: systemBottom,
              height: tabBarHeight,
            },
          ],
          tabBarShowLabel: false,
          tabBarActiveTintColor: '#113E55',
          tabBarInactiveTintColor: '#113E55',
          tabBarLabelStyle: { display: 'none', fontFamily: 'UbuntuSans' },
          tabBarButton: (props: any) => <Pressable {...props} android_ripple={null} />,
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

const styles = StyleSheet.create({});
