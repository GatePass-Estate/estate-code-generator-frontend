import { useEffect } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  Image,
  Alert,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CheckIcon } from '@/src/assets/svgs';
// @ts-ignore
import uploadIdIcon from '@/src/assets/images/upload-id.png';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;
const SHEET_ANIMATION = {
  duration: 280,
  easing: Easing.out(Easing.cubic),
};

type IdentificationSheetProps = {
  visible: boolean;
  identificationUri?: string | null;
  onClose: () => void;
  onIdentificationSelected: (uri: string) => void | Promise<void>;
  uploading?: boolean;
};

function IdentificationOptionRow({
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
      className="flex-row items-center justify-between rounded-[16px] bg-[#EFF1F1] p-4"
      style={{ opacity: disabled ? 0.6 : 1 }}
    >
      <Text className="text-sm font-inter-light text-[#113E55]">{label}</Text>
      <View className="h-6 w-6 items-center justify-center rounded-full bg-[#CEE5ED]">
        <CheckIcon width={10} height={10} />
      </View>
    </Pressable>
  );
}

export default function IdentificationSheet({
  visible,
  identificationUri,
  onClose,
  onIdentificationSelected,
  uploading = false,
}: IdentificationSheetProps) {
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

  const handleChooseFromDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets[0]?.uri) {
        await onIdentificationSelected(result.assets[0].uri);
      }
    } catch {
      Alert.alert('Could not open documents', 'Please try again.');
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(
        'Permission needed',
        'Allow camera access to take a photo of your identification.'
      );
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]?.uri) {
      await onIdentificationSelected(result.assets[0].uri);
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
                className="h-[120px] w-[120px] items-center justify-center"
                style={{ position: 'relative' }}
              >
                {identificationUri ? (
                  <View className="h-[120px] w-[120px] overflow-hidden rounded-full bg-[#E8F0EF]">
                    <Image
                      source={{ uri: identificationUri }}
                      className="h-full w-full"
                      resizeMode="cover"
                    />
                  </View>
                ) : (
                  <Image
                    source={uploadIdIcon}
                    style={{ width: 86, height: 86 }}
                    resizeMode="contain"
                  />
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
              <IdentificationOptionRow
                label="Choose from Document"
                onPress={handleChooseFromDocument}
                disabled={uploading}
              />
              <IdentificationOptionRow
                label="Take a Photo"
                onPress={handleTakePhoto}
                disabled={uploading}
              />
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
