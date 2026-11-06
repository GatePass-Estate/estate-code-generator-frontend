import { View, Text, Share, Alert, Image, Pressable, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';
import { deleteCode } from '@/src/lib/api/codes';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import BrandedQRCode from '@/src/components/common/BrandedQRCode';
import { useState } from 'react';

function DetailRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <View className="flex-row items-center justify-between rounded-2xl bg-white px-4 py-3">
      <Text className="text-sm font-inter-medium text-[#878686]">{label}</Text>
      <Text className="text-sm font-inter-light text-[#878686] text-right" numberOfLines={2}>
        {value ?? ''}
      </Text>
    </View>
  );
}

export default function InvitePage() {
  let { name, code, date, timeframe, address, from } = useLocalSearchParams();
  const [cancelText, setCancelText] = useState('Cancel Invite');

  code = Array.isArray(code) ? code.join('') : (code ?? '');
  code = code.replace(/\s+/g, '');
  const fromScreen = Array.isArray(from) ? from[0] : from;
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    if (fromScreen === 'home' && router.canGoBack()) {
      router.back();
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
    } catch (error) {
      Alert.alert('Failed to share');
    }
  };

  const performRemoveCode = async (code: string) => {
    try {
      setCancelText('Removing...');
      await deleteCode(code);
    } catch (error) {
      console.error('Remove code failed:', error);
    } finally {
      handleBack();
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

      <Pressable
        onPress={handleBack}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BUTTON_MARGIN_BOTTOM + insets.bottom }}
      >
        <View className="items-center mt-8 gap-4">
          <View
            className="rounded-[28px] bg-tertiary p-3"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: -1, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 12.9,
              elevation: 3,
            }}
          >
            <View className="rounded-[16px] bg-[#F6F7F7] p-3">
              <BrandedQRCode
                value={code}
                size={176}
                backgroundColor="#F6F7F7"
                accessibilityLabel="Guest invite QR code"
              />
            </View>
          </View>

          <View className="flex-row items-center gap-1">
            <Text className="text-[23.04px] font-ubuntu-extrabold text-primary tracking-[10px] ">
              {code.toUpperCase()}
            </Text>
            <Pressable onPress={copyToClipboard} hitSlop={8}>
              <Image source={icons.copyIcon} style={{ width: 16, height: 16 }} />
            </Pressable>
          </View>
        </View>

        <View className="mt-10 mx-[17px] h-px bg-[#F46036] opacity-40" />

        <View className="mt-[17.5px] gap-1.5">
          <DetailRow label="Name" value={name as string} />
          <DetailRow label="Address" value={address as string} />
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
