import { View, Text, Share, Alert, Image, Pressable, ScrollView, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import Svg, { Path } from 'react-native-svg';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';
import { deleteCode } from '@/src/lib/api/codes';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import { useState } from 'react';

const QR_FRAME_W = 184;
const QR_FRAME_H = 176;
const QR_FRAME_RADIUS = 8;
const QR_FRAME_STROKE = 2;
const QR_FRAME_GAP = 80;

function QrDashFrame() {
  const inset = QR_FRAME_STROKE / 2;
  const x0 = inset;
  const y0 = inset;
  const x1 = QR_FRAME_W - inset;
  const y1 = QR_FRAME_H - inset;
  const r = QR_FRAME_RADIUS;
  const armW = (QR_FRAME_W - QR_FRAME_STROKE - 2 * r - QR_FRAME_GAP) / 2;
  const armH = (QR_FRAME_H - QR_FRAME_STROKE - 2 * r - QR_FRAME_GAP) / 2;

  const corners = [
    `M ${x0 + r + armW} ${y0} H ${x0 + r} A ${r} ${r} 0 0 0 ${x0} ${y0 + r} V ${y0 + r + armH}`,
    `M ${x1 - r - armW} ${y0} H ${x1 - r} A ${r} ${r} 0 0 1 ${x1} ${y0 + r} V ${y0 + r + armH}`,
    `M ${x1} ${y1 - r - armH} V ${y1 - r} A ${r} ${r} 0 0 1 ${x1 - r} ${y1} H ${x1 - r - armW}`,
    `M ${x0} ${y1 - r - armH} V ${y1 - r} A ${r} ${r} 0 0 0 ${x0 + r} ${y1} H ${x0 + r + armW}`,
  ];

  return (
    <Svg
      width={QR_FRAME_W}
      height={QR_FRAME_H}
      style={StyleSheet.absoluteFill}
      pointerEvents="none"
    >
      {corners.map((d) => (
        <Path
          key={d}
          d={d}
          fill="none"
          stroke="#F6F7F7"
          strokeWidth={QR_FRAME_STROKE}
          strokeLinecap="butt"
        />
      ))}
    </Svg>
  );
}

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
            className="h-[201px] w-[210px] items-center justify-center rounded-lg bg-tertiary"
            style={{
              shadowColor: '#000',
              shadowOffset: { width: -1, height: 1 },
              shadowOpacity: 0.06,
              shadowRadius: 12.9,
              elevation: 3,
            }}
          >
            <View
              style={{
                width: QR_FRAME_W,
                height: QR_FRAME_H,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <QrDashFrame />
              <QRCode value={code} size={124} backgroundColor="transparent" color="#F6F7F7" />
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
