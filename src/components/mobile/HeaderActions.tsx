import { Image, Pressable, View } from 'react-native';
import icons from '@/src/constants/icons';
import UserIcon from '@/src/components/mobile/UserIcon';

export default function HeaderActions({ hasUnread = true }: { hasUnread?: boolean }) {
  return (
    <View className="flex-row items-center gap-2.5">
      <Pressable className="relative h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6FCFF]">
        {hasUnread ? (
          <View className="absolute right-[3px] top-[-2px] h-[9px] w-[9px] rounded-full bg-[#E30404]" />
        ) : null}
        <Image
          source={icons.notificationBellIcon}
          style={{ width: 20, height: 20 }}
          resizeMode="contain"
        />
      </Pressable>

      <UserIcon variant="dots" />
    </View>
  );
}
