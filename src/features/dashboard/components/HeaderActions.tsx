import { View } from 'react-native';
import UserIcon from '@/src/shared/components/UserIcon';
import NotificationBell from '@/src/features/notifications/components/NotificationBell';

export default function HeaderActions() {
  return (
    <View className="flex-row items-center gap-2.5">
      <NotificationBell className="" />

      <UserIcon variant="dots" />
    </View>
  );
}
