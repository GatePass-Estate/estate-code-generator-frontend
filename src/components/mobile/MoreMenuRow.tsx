import { Pressable, Text, View } from 'react-native';
import type { ReactNode } from 'react';
import { NavigateNextIcon } from '@/src/assets/svgs';

/** Uppercase group heading used between the More menu sections. */
export function SectionTitle({ children, first = false }: { children: string; first?: boolean }) {
  return (
    <Text className="mb-2 text-[10px] font-inter-regular uppercase  text-[#113E55]">
      {children}
    </Text>
  );
}

/** Bordered More-menu row: leading icon + label, optional trailing chevron. */
export function MoreMenuRow({
  icon,
  label,
  onPress,
  showNavigateNext = true,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  showNavigateNext?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-[8px] border-[0.5px] border-[#CEE5ED]  px-4 py-[18px]"
    >
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-sm font-inter-light text-primary">{label}</Text>
      </View>
      {showNavigateNext ? <NavigateNextIcon /> : null}
    </Pressable>
  );
}
