import { View } from 'react-native';
import UserIcon from '@/src/components/mobile/UserIcon';

export default function HeaderActions() {
  return (
    <View className="flex-row items-center gap-2.5">
      <UserIcon variant="dots" />
    </View>
  );
}
