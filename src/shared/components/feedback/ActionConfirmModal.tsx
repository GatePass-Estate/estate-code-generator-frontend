import { Modal, Text, TouchableOpacity, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';

type ActionConfirmModalProps = {
  visible: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  busy?: boolean;
  /** Hide Cancel and use a single OK-style action. */
  hideCancel?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export default function ActionConfirmModal({
  visible,
  title,
  message,
  confirmLabel,
  busy = false,
  hideCancel = false,
  onConfirm,
  onCancel,
}: ActionConfirmModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => !busy && onCancel()}
    >
      <View className="flex-1 items-center justify-center bg-black/40 px-6">
        <View className="w-full max-w-[360px] rounded-[24px] bg-[#F6F7F7] px-6 py-7">
          <Text className="text-center font-ubuntu-semibold text-[21px] text-primary">{title}</Text>
          <Text className="mt-3 text-center font-inter-regular text-[14px] leading-[21px] text-[#646B70]">
            {message}
          </Text>
          <View className="mt-7 flex-row gap-[10px]">
            {hideCancel ? null : (
              <TouchableOpacity
                accessibilityRole="button"
                onPress={onCancel}
                disabled={busy}
                className="h-12 flex-1 items-center justify-center rounded-3xl bg-[#E5F6FF]"
              >
                <Text className="font-ubuntu-semibold text-[14px] text-primary">Cancel</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              accessibilityRole="button"
              onPress={onConfirm}
              disabled={busy}
              className="h-12 flex-1 items-center justify-center rounded-3xl bg-primary"
            >
              {busy ? (
                <CircleLoader size={22} tone="light" />
              ) : (
                <Text className="font-ubuntu-semibold text-[14px] text-white">{confirmLabel}</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}
