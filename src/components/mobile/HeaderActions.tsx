import { Image, Pressable, View } from 'react-native';
import icons from '@/src/constants/icons';
import UserIcon from '@/src/components/mobile/UserIcon';

export default function HeaderActions() {
  return (
    <View className="flex-row items-center gap-2.5">
      <Pressable className="h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6FCFF]">
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
