import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CopyIcon } from '@/src/assets/svgs';

type CopiedToastProps = {
  visible: boolean;
};

export function CopiedToast({ visible }: CopiedToastProps) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <View pointerEvents="none" style={[styles.container, { top: insets.top + 8 }]}>
      <View className="flex-row items-center gap-2.5 rounded-full bg-[#E5F6FF] px-4 py-2.5">
        <CopyIcon width={16} height={16} />
        <Text className="text-sm font-inter-medium text-[#113E55]">Copied</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 999,
    elevation: 999,
    alignItems: 'center',
  },
});
