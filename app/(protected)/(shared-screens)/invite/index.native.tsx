import { View, Text, TouchableOpacity, Share, Alert, Image, Pressable, ScrollView } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { sharedStyles } from '@/src/theme/styles';
import icons from '@/src/constants/icons';
import { deleteCode } from '@/src/lib/api/codes';
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
  let { name, code, date, timeframe, address } = useLocalSearchParams();
  const [cancelText, setCancelText] = useState('Cancel Invite');

  code = Array.isArray(code) ? code.join('') : (code ?? '');
  code = code.replace(/\s+/g, '');

  const handleBack = () => {
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

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 40 }}>
        <View className="items-center mt-8 gap-4">
          <View className="h-[201px] w-[210px] items-center justify-center rounded-lg bg-tertiary">
            <View className="h-[176px] w-[184px] items-center justify-center rounded-lg border-2 border-dashed border-[#F6F7F7]">
              <QRCode value={code} size={124} backgroundColor="transparent" color="#F6F7F7" />
            </View>
          </View>

          <View className="flex-row items-center gap-1.5">
            <Text className="text-[23px] font-ubuntu-extrabold text-primary tracking-[10px]">
              {code}
            </Text>
            <Pressable onPress={copyToClipboard}>
              <Image source={icons.copyIcon} style={{ width: 16, height: 16 }} />
            </Pressable>
          </View>
        </View>

        <View className="mt-9 h-px bg-[#D9D9D9]" />

        <View className="mt-6 gap-1.5">
          <DetailRow label="Name" value={name as string} />
          <DetailRow label="Address" value={address as string} />
          <DetailRow label="Date" value={date as string} />
          <DetailRow label="Time" value={timeframe as string} />
          <DetailRow label="Access Code" value={code as string} />
        </View>

        <View className="mt-10 items-center gap-3">
          <TouchableOpacity
            className="h-11 w-[278px] items-center justify-center rounded-full bg-primary"
            onPress={handleShare}
          >
            <Text className="text-sm font-ubuntu-semibold text-white">Share Invite</Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-11 w-[278px] items-center justify-center rounded-full bg-[#E5F6FF]"
            onPress={() => performRemoveCode(code)}
          >
            <Text className="text-sm font-ubuntu-semibold text-primary">{cancelText}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
