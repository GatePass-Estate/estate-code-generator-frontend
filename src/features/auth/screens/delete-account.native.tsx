import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useCallback, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import { deleteAccount } from '@/src/features/users/services/user';
import { useAuth } from '@/src/features/auth/hooks/useAuthContext';

export default function DeleteAccountScreen() {
  const { signOut } = useAuth();
  const [understood, setUnderstood] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = useCallback(async () => {
    if (!understood || deleting) return;

    setDeleting(true);
    try {
      await deleteAccount();
      // Closing the account invalidates every session, so drop local auth too.
      await signOut();
    } catch (error: unknown) {
      Alert.alert('Could not delete account', thrownMessage(error) || 'Please try again later.');
      setDeleting(false);
    }
  }, [understood, deleting, signOut]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      <View className="flex-1">
        <Text className="text-primary font-ubuntu-medium mt-[18px]" style={{ fontSize: 27 }}>
          Delete Account
        </Text>
        <Text className="text-[#3E424E] font-inter-light text-sm mt-3 leading-5">
          Are you sure you want to delete your account? This action is irreversible.
        </Text>

        <Pressable
          onPress={() => setUnderstood((value) => !value)}
          disabled={deleting}
          className="flex-row items-center gap-3 mt-7"
          hitSlop={8}
        >
          <View className="w-4 h-4 rounded-[4px] border border-[#878686] items-center justify-center">
            {understood && <View className="w-2.5 h-2.5 rounded-[2px] bg-[#E30404]" />}
          </View>
          <Text className="text-[#3E424E] font-inter-light text-sm">Yes, I understand</Text>
        </Pressable>
      </View>

      <Pressable
        onPress={handleDelete}
        disabled={!understood || deleting}
        className="bg-[#E30404] rounded-[24px] h-12 items-center justify-center mb-8"
        style={{ opacity: !understood || deleting ? 0.5 : 1 }}
      >
        {deleting ? (
          <CircleLoader size={22} tone="light" />
        ) : (
          <Text className="text-white font-ubuntu-semibold text-sm">Delete Account</Text>
        )}
      </Pressable>
    </SafeAreaView>
  );
}
