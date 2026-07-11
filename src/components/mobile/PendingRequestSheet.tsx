import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  View,
  Text,
  Alert,
  Dimensions,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { deletePendingRequest } from '@/src/lib/api/requests';
import { downloadFile } from '@/src/lib/pendingRequestHelpers';
import { FileDocumentIcon } from '@/src/assets/svgs';

const SCREEN_HEIGHT = Dimensions.get('window').height;
const SHEET_HEIGHT = SCREEN_HEIGHT * 0.6;
const SHEET_ANIMATION = {
  duration: 280,
  easing: Easing.out(Easing.cubic),
};

export type PendingRequestKind = 'field' | 'photo' | 'identification';

export type PendingRequestSheetData = {
  kind: PendingRequestKind;
  requestId: string;
  fieldLabel?: string;
  currentValue?: string;
  newValue?: string;
  currentFileName?: string;
  newFileName?: string;
  currentFileUri?: string | null;
  newFileUri?: string | null;
};

type PendingRequestSheetProps = {
  visible: boolean;
  request: PendingRequestSheetData | null;
  onClose: () => void;
  onDeleted: (request: PendingRequestSheetData) => void;
};

const SHEET_TITLES: Record<PendingRequestKind, string> = {
  field: 'Your request is under review',
  photo: 'Your photo request is under review',
  identification: 'Your ID request is under review',
};

const DEFAULT_FILE_LABEL = 'Name of Image title stored as..';

function ValueRow({
  sectionLabel,
  label,
  value,
}: {
  sectionLabel: string;
  label: string;
  value: string;
}) {
  return (
    <View className="gap-2">
      <Text className="ml-[13px] text-[10px] font-ubuntu-regular text-[#6C6C6C]">
        {sectionLabel}
      </Text>
      <View className="flex-row items-center justify-between rounded-[16px] bg-white px-4 py-3">
        <Text className="text-xs font-ubuntu-bold text-[#6C6C6C]">{label}</Text>
        <Text className="ml-3 flex-1 text-right text-xs font-ubuntu-light text-[#6C6C6C]">
          {value}
        </Text>
      </View>
    </View>
  );
}

function FileRow({
  sectionLabel,
  fileName,
  onDownload,
}: {
  sectionLabel: string;
  fileName: string;
  onDownload: () => void;
}) {
  return (
    <View className="gap-2">
      <Text className="ml-[13px] text-[10px] font-ubuntu-regular text-[#6C6C6C]">
        {sectionLabel}
      </Text>
      <View className="flex-row items-center justify-between rounded-[16px] bg-white px-4 py-3">
        <Text
          className="mr-3 flex-1 text-xs italic text-[#6C6C6C]"
          numberOfLines={1}
          ellipsizeMode="middle"
        >
          {fileName}
        </Text>
        <Pressable
          onPress={onDownload}
          className="flex-row items-center gap-1 rounded-full bg-[#E5F6FF] px-[24px] py-[15px]"
        >
          <Text className="text-[10px] font-roboto-regular text-[#113E55]">Download</Text>
          <FileDocumentIcon width={8} height={8} />
        </Pressable>
      </View>
    </View>
  );
}

export default function PendingRequestSheet({
  visible,
  request,
  onClose,
  onDeleted,
}: PendingRequestSheetProps) {
  const insets = useSafeAreaInsets();
  const translateY = useSharedValue(SHEET_HEIGHT);
  const dragStartY = useSharedValue(0);
  const [deleting, setDeleting] = useState(false);
  const [notifying, setNotifying] = useState(false);

  const closeSheet = () => {
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

  const handleDeleteRequest = async () => {
    if (!request?.requestId) return;

    setDeleting(true);
    try {
      if (
        (request.kind === 'field' || request.kind === 'identification') &&
        !request.requestId.startsWith('local-')
      ) {
        await deletePendingRequest(request.requestId);
      }

      closeSheet();
      onDeleted(request);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Could not delete request';
      Alert.alert('Delete failed', message);
    } finally {
      setDeleting(false);
    }
  };

  const handleReNotifyAdmin = () => {
    setNotifying(true);
    Alert.alert('Re-Notify Admin', 'Your admin will be reminded about this request.', [
      { text: 'OK', onPress: () => setNotifying(false) },
    ]);
  };

  if (!request) return null;

  const isFileRequest = request.kind === 'photo' || request.kind === 'identification';

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={closeSheet}>
      <GestureHandlerRootView style={styles.overlay}>
        <Animated.View style={[styles.backdrop, backdropAnimatedStyle]}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={closeSheet} />
        </Animated.View>

        <GestureDetector gesture={panGesture}>
          <Animated.View
            style={[
              styles.sheet,
              { height: SHEET_HEIGHT, paddingBottom: Math.max(insets.bottom, 24) },
              sheetAnimatedStyle,
            ]}
          >
            <View className="items-center pb-[83px] pt-[13px]">
              <View className="h-[7px] w-[134px] rounded-full bg-[#9B9797]" />
            </View>

            <Text className="px-5 text-lg font-ubuntu-semibold text-[#113E55]">
              {SHEET_TITLES[request.kind]}
            </Text>

            <View className="mt-8 gap-6 px-5">
              {isFileRequest ? (
                <>
                  <FileRow
                    sectionLabel="Current"
                    fileName={request.currentFileName || DEFAULT_FILE_LABEL}
                    onDownload={() => downloadFile(request.currentFileUri)}
                  />
                  <FileRow
                    sectionLabel="New"
                    fileName={request.newFileName || DEFAULT_FILE_LABEL}
                    onDownload={() => downloadFile(request.newFileUri)}
                  />
                </>
              ) : (
                <>
                  <ValueRow
                    sectionLabel="Current"
                    label={request.fieldLabel || 'Field'}
                    value={request.currentValue || '—'}
                  />
                  <ValueRow
                    sectionLabel="New"
                    label={request.fieldLabel || 'Field'}
                    value={request.newValue || '—'}
                  />
                </>
              )}
            </View>

            <View className="mb-10 mt-auto flex-row gap-2.5 px-5 pt-8">
              <Pressable
                onPress={handleDeleteRequest}
                disabled={deleting || notifying}
                className="flex-1 items-center justify-center rounded-full bg-[#CEE5ED] py-4"
              >
                {deleting ? (
                  <ActivityIndicator color="#113E55" size="small" />
                ) : (
                  <Text className="text-sm font-ubuntu-semibold text-[#113E55]">
                    Delete Request
                  </Text>
                )}
              </Pressable>

              <Pressable
                onPress={handleReNotifyAdmin}
                disabled={deleting || notifying}
                className="flex-1 items-center justify-center rounded-full bg-[#113E55] py-4"
              >
                {notifying ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text className="text-sm font-ubuntu-semibold text-white">Re-Notify Admin</Text>
                )}
              </Pressable>
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
