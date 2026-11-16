import { useCallback } from 'react';
import { Pressable, ScrollView, Share, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useRecoveryCodes } from '@/src/features/auth/hooks/useRecoveryCodes';

export default function RecoveryCodesScreen() {
  const { codes, codesText, copied, copyCodes, acknowledged, toggleAcknowledged } =
    useRecoveryCodes();

  const handleShare = useCallback(async () => {
    try {
      await Share.share({ message: `GatePass recovery codes\n\n${codesText}` });
    } catch {
      // The user dismissing the share sheet is not an error worth surfacing.
    }
  }, [codesText]);

  const handleDone = useCallback(() => {
    // Pop back to the Account Security screen already in the stack. A
    // `replace` here pushed a second copy of it, so pressing back afterwards
    // landed on Account Security again. `dismissTo` falls back to navigating
    // when that screen is not in the stack (e.g. a deep link).
    router.dismissTo('/account-security');
  }, []);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder onPress={handleDone} />

      <Text className="mt-3 font-ubuntu-medium text-primary" style={{ fontSize: 27 }}>
        Save Your Recovery{'\n'}Codes
      </Text>
      <Text className="text-[#0A1F29] font-inter-light text-sm mt-3 leading-5">
        Each code can be used once to sign in if you lose your authenticator app. Store them
        somewhere safe — this is the only time they are shown.
      </Text>

      {codes.length === 0 ? (
        <View className="py-10">
          <Text className="text-[#878686] font-inter-regular text-sm text-center">
            These codes have already been shown. You can generate a new set from Account Security.
          </Text>
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} className="mt-6">
          <View className="bg-light-teal rounded-[8px] px-5 py-4">
            {codes.map((code) => (
              <Text
                key={code}
                className="text-primary font-roboto-regular text-base tracking-[2px] py-1.5"
              >
                {code}
              </Text>
            ))}
          </View>

          <View className="flex-row gap-3 mt-5">
            <Pressable
              onPress={copyCodes}
              className="flex-1 flex-row items-center justify-center gap-2 border border-accent rounded-[8px] h-11"
            >
              <MaterialCommunityIcons
                name={copied ? 'check' : 'content-copy'}
                size={16}
                color="#113E55"
              />
              <Text className="text-primary font-ubuntu-regular text-xs">
                {copied ? 'Copied' : 'Copy'}
              </Text>
            </Pressable>

            <Pressable
              onPress={handleShare}
              className="flex-1 flex-row items-center justify-center gap-2 border border-accent rounded-[8px] h-11"
            >
              <MaterialCommunityIcons name="share-variant" size={16} color="#113E55" />
              <Text className="text-primary font-ubuntu-regular text-xs">Share</Text>
            </Pressable>
          </View>

          <Pressable onPress={toggleAcknowledged} className="flex-row items-center gap-3 mt-8">
            <View
              className="w-4 h-4 rounded-[4px] border border-[#878686] items-center justify-center"
              style={{ backgroundColor: acknowledged ? '#113E55' : 'transparent' }}
            >
              {acknowledged && <MaterialCommunityIcons name="check" size={12} color="#FFFFFF" />}
            </View>
            <Text className="text-[#3E424E] font-inter-light text-sm">
              I have saved these codes
            </Text>
          </Pressable>

          <Pressable
            onPress={handleDone}
            disabled={!acknowledged}
            className="bg-primary rounded-full h-11 items-center justify-center mt-8 mb-8"
            style={{ opacity: acknowledged ? 1 : 0.5 }}
          >
            <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">Done</Text>
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}
