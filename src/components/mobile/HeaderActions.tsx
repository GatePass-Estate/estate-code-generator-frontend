import { View } from 'react-native';
import UserIcon from '@/src/components/mobile/UserIcon';
import NotificationBell from '@/src/components/common/NotificationBell';

export default function HeaderActions() {
  return (
    <View className="flex-row items-center gap-2.5">
      <NotificationBell className="" />

      <UserIcon variant="dots" />
    </View>
  );
}
