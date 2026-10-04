import { useUserStore } from '@/src/lib/stores/userStore';
import { useRouter } from 'expo-router';
import { View, Text, Pressable, Platform } from 'react-native';
import { MoreDotsIcon } from '@/src/assets/svgs';

export default function UserIcon({ variant = 'initials' }: { variant?: 'initials' | 'dots' }) {
  const first_name = useUserStore((state) => state.first_name);
  const last_name = useUserStore((state) => state.last_name);
  const role = useUserStore((state) => state.role);
  const router = useRouter();

  const isMobile = Platform.OS !== 'web';
  const initials = `${first_name?.charAt(0) ?? ''}${last_name?.charAt(0) ?? ''}`;
  const morePath = role === 'security' ? '/security/more' : '/settings';

  return (
    <View className={`${isMobile && variant !== 'dots' ? 'mr-5' : ''}`}>
      <Pressable onPress={() => router.push(morePath)} className="flex-row items-center gap-2">
        {variant === 'dots' ? (
          <View className="h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6FCFF]">
            <MoreDotsIcon width={18} height={4} />
          </View>
        ) : (
          <View
            className={`${Platform.OS === 'web' ? 'w-12 h-12' : 'w-9 h-9'} rounded-full border border-teal justify-center items-center`}
          >
            <Text className="uppercase text-teal font-light font-ubuntu text-xl">{initials}</Text>
          </View>
        )}
      </Pressable>
    </View>
  );
}
