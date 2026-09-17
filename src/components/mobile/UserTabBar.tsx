import { Platform, Pressable, StyleSheet, View } from 'react-native';
import type { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { APP_TAB_BAR_COLOR, TAB_BAR_BASE_HEIGHT, TAB_BAR_FAB_OVERHANG } from '@/src/theme/styles';

const FAB_WIDTH = 89;
const FAB_HEIGHT = 88;

function isAddRoute(name: string) {
  return name.includes('guests/add');
}

function isTabBarHidden(style: unknown) {
  if (!style) return false;
  const flattened = StyleSheet.flatten(style as object);
  return flattened?.display === 'none';
}

export default function UserTabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const focusedOptions = descriptors[state.routes[state.index].key].options;

  // Android: float above the system nav (3-button / gesture inset).
  const androidBottom = Platform.OS === 'android' ? (insets.bottom > 0 ? insets.bottom : 48) : 0;

  // iOS: only pad when a home indicator exists. SE / 8 / etc. get 0 — bar sits flush, no empty gap.
  const iosHomeIndicator = Platform.OS === 'ios' ? insets.bottom : 0;

  if (isTabBarHidden(focusedOptions.tabBarStyle)) {
    return null;
  }

  const addRoute = state.routes.find((route) => isAddRoute(route.name));

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.wrap,
        {
          bottom: androidBottom,
          // Teal extends through the home-indicator zone so there’s no grey “gap of nothing”.
          // When iosHomeIndicator === 0, this is just the 49px bar flush to the bottom edge.
          paddingBottom: iosHomeIndicator,
          backgroundColor: APP_TAB_BAR_COLOR,
        },
      ]}
    >
      <View style={styles.bar}>
        {state.routes.map((route, index) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;
          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });

            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name, route.params);
            }
          };

          if (isAddRoute(route.name)) {
            return <View key={route.key} style={styles.item} />;
          }

          return (
            <Pressable
              key={route.key}
              accessibilityRole="button"
              accessibilityState={focused ? { selected: true } : {}}
              accessibilityLabel={options.title}
              onPress={onPress}
              style={styles.item}
            >
              {options.tabBarIcon?.({
                focused,
                color: focused ? '#113E55' : '#6F91A0',
                size: 20,
              })}
            </Pressable>
          );
        })}
      </View>

      {addRoute ? (
        <View pointerEvents="box-none" style={styles.fabRow}>
          <Pressable
            accessibilityRole="button"
            accessibilityState={
              state.routes[state.index].key === addRoute.key ? { selected: true } : {}
            }
            accessibilityLabel={descriptors[addRoute.key].options.title}
            onPress={() => {
              const focused = state.routes[state.index].key === addRoute.key;
              const event = navigation.emit({
                type: 'tabPress',
                target: addRoute.key,
                canPreventDefault: true,
              });

              if (!focused && !event.defaultPrevented) {
                navigation.navigate(addRoute.name, addRoute.params);
              }
            }}
            style={styles.fabHit}
          >
            {descriptors[addRoute.key].options.tabBarIcon?.({
              focused: state.routes[state.index].key === addRoute.key,
              color: '#6F91A0',
              size: 16,
            })}
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    overflow: 'visible',
    zIndex: 100,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderTopWidth: 0.5,
    borderTopColor: '#F6F7F7',
  },
  /** Figma 5074:5421 — icon row only; safe-area is handled on `wrap`. */
  bar: {
    height: TAB_BAR_BASE_HEIGHT,
    paddingTop: 7,
    paddingBottom: 7,
    paddingLeft: 20,
    paddingRight: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  item: {
    flex: 1,
    alignItems: 'center',
  },
  fabRow: {
    position: 'absolute',
    top: -TAB_BAR_FAB_OVERHANG,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fabHit: {
    width: FAB_WIDTH,
    height: FAB_HEIGHT,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
});
