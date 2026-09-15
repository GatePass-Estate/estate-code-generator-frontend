import { useCallback, useState } from 'react';
import { Image, Pressable, Share, Text, View } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import * as Haptics from 'expo-haptics';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import AccessCodeRing from './AccessCodeRing';
import CodeActionsSheet from './CodeActionsSheet';
import { CarbonAddFilledIcon } from '@/src/assets/svgs';
import images from '@/src/constants/images';
import { deleteCode } from '@/src/lib/api/codes';
import { Codes } from '@/src/types/codes';

const ACTION_WIDTH = 68;
const OPEN_THRESHOLD = 34;
const SPRING = { damping: 20, stiffness: 220 };

type ActiveCodeCardProps = {
  item: Codes;
  guestName: string;
  code: string;
  expiresAt: number;
  startAt: number | null;
  frozen: boolean;
  onToggleFreeze: () => void;
  onDeleted: () => void;
  onCopied: () => void;
  onOpenHistory: () => void;
  onExtend: () => void;
};

export default function ActiveCodeCard({
  item,
  guestName,
  code,
  expiresAt,
  startAt,
  frozen,
  onToggleFreeze,
  onDeleted,
  onCopied,
  onOpenHistory,
  onExtend,
}: ActiveCodeCardProps) {
  const translateX = useSharedValue(0);
  const [sheetVisible, setSheetVisible] = useState(false);
  const [sheetView, setSheetView] = useState<'menu' | 'confirmDelete'>('menu');
  const [deleting, setDeleting] = useState(false);

  const closeSwipe = useCallback(() => {
    translateX.value = withSpring(0, SPRING);
  }, [translateX]);

  const handleCopy = useCallback(async () => {
    await Clipboard.setStringAsync(code);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    onCopied();
  }, [code, onCopied]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Access code for ${guestName}: ${code}`,
      });
    } catch {
      // user dismissed the share sheet
    }
  }, [code, guestName]);

  const handleDelete = useCallback(async () => {
    setDeleting(true);
    try {
      await deleteCode(item.hashed_code);
      setSheetVisible(false);
      onDeleted();
    } finally {
      setDeleting(false);
    }
  }, [item.hashed_code, onDeleted]);

  const openMenu = useCallback(() => {
    setSheetView('menu');
    setSheetVisible(true);
  }, []);

  const openDeleteConfirm = useCallback(() => {
    closeSwipe();
    setSheetView('confirmDelete');
    setSheetVisible(true);
  }, [closeSwipe]);

  const pan = Gesture.Pan()
    .enabled(!frozen)
    .activeOffsetX([-10, 10])
    .failOffsetY([-12, 12])
    .onUpdate((e) => {
      translateX.value = Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, e.translationX));
    })
    .onEnd(() => {
      if (translateX.value > OPEN_THRESHOLD) {
        translateX.value = withSpring(ACTION_WIDTH, SPRING);
      } else if (translateX.value < -OPEN_THRESHOLD) {
        translateX.value = withSpring(-ACTION_WIDTH, SPRING);
      } else {
        translateX.value = withSpring(0, SPRING);
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const sheet = (
    <CodeActionsSheet
      visible={sheetVisible}
      frozen={frozen}
      initialView={sheetView}
      deleting={deleting}
      onClose={() => setSheetVisible(false)}
      onFreezeToggle={() => {
        setSheetVisible(false);
        closeSwipe();
        onToggleFreeze();
      }}
      onExtend={() => {
        setSheetVisible(false);
        onExtend();
      }}
      onShare={() => {
        setSheetVisible(false);
        handleShare();
      }}
      onHistory={() => {
        setSheetVisible(false);
        onOpenHistory();
      }}
      onConfirmDelete={handleDelete}
    />
  );

  if (frozen) {
    return (
      <View className="overflow-hidden rounded-2xl">
        <Image
          source={images.frozenCodeCard}
          resizeMode="cover"
          style={{ position: 'absolute', width: '100%', height: '100%' }}
        />
        <Pressable
          onLongPress={handleCopy}
          delayLongPress={450}
          className="flex-row items-center justify-between px-4 py-3"
        >
          <View>
            <Text className="text-[11.2px] font-inter-regular text-[rgba(241,248,251,0.6)]">
              {guestName}
            </Text>
            <Text className="text-[27px] font-ubuntu-medium text-[rgba(241,248,251,0.6)]">
              {code}
            </Text>
          </View>
          <View className="flex-row items-center gap-2.5">
            <AccessCodeRing expiresAt={expiresAt} startAt={startAt} dimmed />
            <Pressable onPress={openMenu} hitSlop={10}>
              <CarbonAddFilledIcon color="rgba(241,248,251,0.6)" />
            </Pressable>
          </View>
        </Pressable>

        {sheet}
      </View>
    );
  }

  return (
    <View className="overflow-hidden rounded-2xl">
      <View className="absolute inset-y-0 left-0 w-[68px] items-center justify-center rounded-l-lg bg-[#1F62A6]">
        <Pressable
          onPress={() => {
            closeSwipe();
            onToggleFreeze();
          }}
          className="h-full w-full items-center justify-center"
        >
          <Text className="text-xs font-inter-semibold text-[#F6F7F7]">Freeze</Text>
        </Pressable>
      </View>

      <View className="absolute inset-y-0 right-0 w-[68px] items-center justify-center rounded-r-lg bg-tertiary">
        <Pressable
          onPress={openDeleteConfirm}
          className="h-full w-full items-center justify-center"
        >
          <Text className="text-xs font-inter-semibold text-[#F6F7F7]">Delete</Text>
        </Pressable>
      </View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            cardStyle,
            { backgroundColor: '#F6F7F7', borderWidth: 0.5, borderColor: '#CEE5ED' },
          ]}
          className="rounded-2xl"
        >
          <Pressable
            onLongPress={handleCopy}
            delayLongPress={450}
            className="flex-row items-center justify-between px-4 py-3"
          >
            <View>
              <Text className="text-[11.2px] font-inter-regular text-[#9B9797]">{guestName}</Text>
              <Text className="text-[27px] font-ubuntu-medium text-tertiary">{code}</Text>
            </View>
            <View className="flex-row items-center gap-2.5">
              <AccessCodeRing expiresAt={expiresAt} startAt={startAt} />
              <Pressable onPress={openMenu} hitSlop={10}>
                <CarbonAddFilledIcon />
              </Pressable>
            </View>
          </Pressable>
        </Animated.View>
      </GestureDetector>

      {sheet}
    </View>
  );
}
