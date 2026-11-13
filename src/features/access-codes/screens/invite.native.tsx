import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { View, Text, Share, Alert, Image, Pressable, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Back from '@/src/shared/components/navigation/Back';
import { sharedStyles } from '@/src/shared/theme/styles';
import icons from '@/src/shared/constants/icons';
import { useDeleteCode } from '@/src/features/access-codes/hooks/codes';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/shared/components/Button';
import BrandedQRCode from '@/src/shared/components/BrandedQRCode';
import { useState } from 'react';
import { logger } from '@/src/shared/utils/logger';

function DetailRow({
  label,
  value,
  truncate = false,
}: {
  label: string;
  value: string | null | undefined;
  truncate?: boolean;
}) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
      <Text className="text-sm font-inter-medium text-[#878686]">{label}</Text>
      <Text
        className={`${truncate ? 'max-w-[65%]' : ''} text-right text-sm font-inter-light text-[#878686]`}
        numberOfLines={truncate ? 1 : 2}
        ellipsizeMode={truncate ? 'tail' : undefined}
      >
        {value ?? ''}
      </Text>
    </View>
  );
}

export default function InvitePage() {
  const goBack = useGoBack();
  let { name, code, date, timeframe, address, from } = useLocalSearchParams();
  const [cancelText, setCancelText] = useState('Cancel Invite');
  const deleteCodeMutation = useDeleteCode();

  code = Array.isArray(code) ? code.join('') : (code ?? '');
  code = code.replace(/\s+/g, '');
  const fromScreen = Array.isArray(from) ? from[0] : from;
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (fromScreen === 'home' && router.canGoBack()) {
      goBack();
      return;
    }
    router.replace({
      pathname: '/user/history',
      params: { tab: 'upcoming' },
    });
  };

  const copyToClipboard = async () => {
    await Clipboard.setStringAsync(code);
  };

  const handleShare = async () => {
    try {
      await Share.share({
        message: `You're invited!\n\nName: ${name}\nAddress: ${address}\nDate: ${date}\nTime: ${timeframe}\nCode: ${code}`,
      });
    } catch {
      Alert.alert('Failed to share');
    }
  };

  const performRemoveCode = async (code: string) => {
    if (deleteCodeMutation.isPending) return;
    try {
      setCancelText('Removing...');
      await deleteCodeMutation.mutateAsync(code);
      // Leave only once the server has revoked it: on failure the code still opens the gate.
      handleBack();
    } catch (error) {
      logger.error('Could not remove code', error);
      setCancelText('Cancel Invite');
      Alert.alert(
        'Could not cancel invite',
        'The code is still active. Check your connection and try again.'
      );
    }
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Stack.Screen
        options={{
          headerShown: false,
          headerShadowVisible: false,
        }}
      />

      <Back type="short-arrow" onPress={handleBack} />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BUTTON_MARGIN_BOTTOM + insets.bottom }}
      >
        <View className="items-center mt-8 gap-4">
          <BrandedQRCode
            value={code}
            size={220}
            backgroundColor="#F6F7F7"
            accessibilityLabel="Guest invite QR code"
          />

          <View className="flex-row items-center gap-1">
            <Text className="text-[23.04px] font-ubuntu-extrabold text-primary tracking-[10px] ">
              {code.toUpperCase()}
            </Text>
            <Pressable onPress={copyToClipboard} hitSlop={8}>
              <Image source={icons.copyIcon} style={{ width: 16, height: 16 }} />
            </Pressable>
          </View>
        </View>

        <View className="mt-10 mx-[17px] h-px bg-orange opacity-40" />

        <View className="mt-[17.5px] gap-1.5">
          <DetailRow label="Name" value={name as string} />
          <DetailRow label="Address" value={address as string} truncate />
          <DetailRow label="Date" value={date as string} />
          <DetailRow label="Time" value={timeframe as string} />
          <DetailRow label="Access Code" value={code.toUpperCase()} />
        </View>

        <View className="mt-11 items-center gap-2">
          <Button label="Share Invite" size="lg" onPress={handleShare} />
          <Button
            label={cancelText}
            variant="secondary"
            size="lg"
            onPress={() => performRemoveCode(code)}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
