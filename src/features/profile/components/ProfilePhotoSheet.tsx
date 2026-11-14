import { useEffect } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  Image,
  Alert,
  StyleSheet,
  Linking,
  useWindowDimensions,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CheckIcon, ProfileAvatar } from '@/src/assets/svgs';
import {
  assertDocumentUploadSize,
  documentUploadTooLargeMessage,
} from '@/src/features/profile/utils/userDocumentHelpers';

const SHEET_ANIMATION = {
  duration: 280,
  easing: Easing.out(Easing.cubic),
};

type ProfilePhotoSheetProps = {
  visible: boolean;
  photoUri?: string | null;
  onClose: () => void;
  onPhotoSelected: (uri: string) => void | Promise<void>;
  uploading?: boolean;
};

function PhotoOptionRow({
  label,
  onPress,
  disabled = false,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className="flex-row items-center justify-between rounded-[12px] bg-[#EFF1F1] p-4"
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <Text className="text-sm font-inter-light text-primary">{label}</Text>
      <View className="h-6 w-6 items-center justify-center rounded-full bg-accent">
        <CheckIcon width={10} height={10} />
      </View>
    </Pressable>
  );
}

export default function ProfilePhotoSheet({
  visible,
  photoUri,
  onClose,
  onPhotoSelected,
  uploading = false,
}: ProfilePhotoSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const sheetHeight = windowHeight * 0.6;
  const translateY = useSharedValue(sheetHeight);
  const dragStartY = useSharedValue(0);

  const closeSheet = () => {
    if (uploading) return;

    translateY.value = withTiming(sheetHeight, SHEET_ANIMATION, () => {
      // Always dismiss — interrupted close must not leave a blocking invisible Modal.
      runOnJS(onClose)();
    });
  };

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, SHEET_ANIMATION);
    } else {
      translateY.value = sheetHeight;
    }
  }, [sheetHeight, translateY, visible]);

  const panGesture = Gesture.Pan()
    .enabled(!uploading)
    .activeOffsetY(8)
    .failOffsetX([-20, 20])
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, dragStartY.value + event.translationY);
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > sheetHeight * 0.2 || event.velocityY > 800;

      if (shouldClose) {
        runOnJS(closeSheet)();
        return;
      }

      translateY.value = withTiming(0, SHEET_ANIMATION);
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(
    () => ({
      opacity: 1 - translateY.value / sheetHeight,
    }),
    [sheetHeight]
  );

  const handleChooseFromPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to choose a profile picture.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      try {
        await assertDocumentUploadSize(asset.uri, asset.fileSize);
        await onPhotoSelected(asset.uri);
      } catch (error) {
        Alert.alert(
          'File too large',
          error instanceof Error ? error.message : documentUploadTooLargeMessage()
        );
      }
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a profile picture.', [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Open Settings', onPress: () => void Linking.openSettings() },
      ]);
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      const asset = result.assets[0];
      try {
        await assertDocumentUploadSize(asset.uri, asset.fileSize);
        await onPhotoSelected(asset.uri);
      } catch (error) {
        Alert.alert(
          'File too large',
          error instanceof Error ? error.message : documentUploadTooLargeMessage()
        );
      }
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={() => {
        if (!uploading) closeSheet();
      }}
    >
      <GestureHandlerRootView style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable
            style={StyleSheet.absoluteFill}
            onPress={() => {
              if (!uploading) closeSheet();
            }}
          />
        </Animated.View>

        <Animated.View
          style={[
            styles.sheet,
            { height: sheetHeight, paddingBottom: Math.max(insets.bottom, 24) },
            sheetAnimatedStyle,
          ]}
        >
          <GestureDetector gesture={panGesture}>
            <View className="items-center pb-[65px] pt-[13px]">
              <View className="h-[7px] w-[134px] rounded-full bg-grey" />
            </View>
          </GestureDetector>

          <View className="mb-[50px] items-center">
            <View
              className="h-[120px] w-[120px] overflow-hidden rounded-full bg-[#E8F0EF]"
              style={{ position: 'relative' }}
            >
              {photoUri ? (
                <Image source={{ uri: photoUri }} className="h-full w-full" resizeMode="cover" />
              ) : (
                <View className="h-full w-full items-center justify-center bg-primary">
                  <ProfileAvatar width={120} height={120} />
                </View>
              )}

              {uploading ? (
                <View
                  pointerEvents="none"
                  style={[
                    StyleSheet.absoluteFill,
                    { alignItems: 'center', justifyContent: 'center' },
                  ]}
                >
                  <CircleLoader size={48} />
                </View>
              ) : null}
            </View>
          </View>

          <View className="gap-4 px-5">
            <PhotoOptionRow
              label="Choose from Photos"
              onPress={handleChooseFromPhotos}
              disabled={uploading}
            />
            <PhotoOptionRow label="Take a Photo" onPress={handleTakePhoto} disabled={uploading} />
          </View>
        </Animated.View>
      </GestureHandlerRootView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
  },
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    backgroundColor: '#F6F7F7',
  },
});
