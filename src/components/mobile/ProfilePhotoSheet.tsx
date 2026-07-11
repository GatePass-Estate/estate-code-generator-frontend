import { useEffect } from 'react';
import { Modal, Pressable, View, Text, Image, Alert, Dimensions, StyleSheet, ActivityIndicator } from 'react-native';
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

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;
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
      <Text className="text-sm font-inter-light text-[#113E55]">{label}</Text>
      <View className="h-6 w-6 items-center justify-center rounded-full bg-[#CEE5ED]">
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
  const translateY = useSharedValue(SHEET_HEIGHT);
  const dragStartY = useSharedValue(0);

  const closeSheet = () => {
    if (uploading) return;

    translateY.value = withTiming(SHEET_HEIGHT, SHEET_ANIMATION, (finished) => {
      if (finished) {
        runOnJS(onClose)();
      }
    });
  };

  useEffect(() => {
    if (visible) {
      translateY.value = withTiming(0, SHEET_ANIMATION);
    } else {
      translateY.value = SHEET_HEIGHT;
    }
  }, [translateY, visible]);

  const panGesture = Gesture.Pan()
    .enabled(!uploading)
    .onBegin(() => {
      dragStartY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateY.value = Math.max(0, dragStartY.value + event.translationY);
    })
    .onEnd((event) => {
      const shouldClose = event.translationY > SHEET_HEIGHT * 0.2 || event.velocityY > 800;

      if (shouldClose) {
        runOnJS(closeSheet)();
        return;
      }

      translateY.value = withTiming(0, SHEET_ANIMATION);
    });

  const sheetAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  const backdropAnimatedStyle = useAnimatedStyle(() => ({
    opacity: 1 - translateY.value / SHEET_HEIGHT,
  }));

  const handleChooseFromPhotos = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow photo library access to choose a profile picture.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await onPhotoSelected(result.assets[0].uri);
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Allow camera access to take a profile picture.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await onPhotoSelected(result.assets[0].uri);
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
            style={StyleSheet.absoluteFillObject}
            onPress={() => {
              if (!uploading) closeSheet();
            }}
          />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { height: SHEET_HEIGHT, paddingBottom: Math.max(insets.bottom, 24) },
              sheetAnimatedStyle,
            ]}
          >
            <View className="items-center pb-[65px] pt-[13px]">
              <View className="h-[7px] w-[134px] rounded-full bg-[#9B9797]" />
            </View>

            <View className="mb-[50px] items-center">
              <View
                className="h-[120px] w-[120px] overflow-hidden rounded-full bg-[#E8F0EF]"
                style={{ position: 'relative' }}
              >
                {photoUri ? (
                  <Image source={{ uri: photoUri }} className="h-full w-full" resizeMode="cover" />
                ) : (
                  <View className="h-full w-full items-center justify-center bg-[#113E55]">
                    <ProfileAvatar width={120} height={120} />
                  </View>
                )}

                {uploading ? (
                  <View
                    pointerEvents="none"
                    style={[
                      StyleSheet.absoluteFillObject,
                      { alignItems: 'center', justifyContent: 'center' },
                    ]}
                  >
                    <ActivityIndicator color="#113E55" size="large" />
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
        </GestureDetector>
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
    ...StyleSheet.absoluteFillObject,
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
