import { Ionicons } from '@expo/vector-icons';
import { Pressable, View } from 'react-native';
import Animated, { LayoutAnimationConfig, ZoomInRotate } from 'react-native-reanimated';

import { cn } from '@/src/lib/cn';
import { useColorScheme } from '@/src/hooks/useColorScheme';
import { COLORS } from '@/src/theme/colors';

export function ThemeToggle() {
  const { colorScheme, toggleColorScheme } = useColorScheme();
  return (
    <LayoutAnimationConfig skipEntering>
      <Animated.View
        className="items-center justify-center"
        key={`toggle-${colorScheme}`}
        entering={ZoomInRotate}
      >
        <Pressable onPress={toggleColorScheme} className="opacity-80">
          {colorScheme === 'dark'
            ? ({ pressed }) => (
                <View className={cn('px-0.5', pressed && 'opacity-50')}>
                  <Ionicons name="moon-outline" color={COLORS.white} size={24} />
                </View>
              )
            : ({ pressed }) => (
                <View className={cn('px-0.5', pressed && 'opacity-50')}>
                  <Ionicons name="sunny-outline" color={COLORS.black} size={24} />
                </View>
              )}
        </Pressable>
      </Animated.View>
    </LayoutAnimationConfig>
  );
}
