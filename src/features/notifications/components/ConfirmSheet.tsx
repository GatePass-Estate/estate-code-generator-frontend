import { Pressable, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';

type ConfirmSheetProps = {
  visible: boolean;
  title?: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Shows a spinner on the confirm button and blocks dismissal while true. */
  busy?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

/**
 * "Are you sure?" bottom sheet from the design: grey heading, centred body,
 * then Cancel (light) and a primary confirm button side by side.
 *
 * Dismissal is blocked while `busy` so a destructive request cannot be
 * abandoned half-way by a stray tap on the scrim.
 */
export default function ConfirmSheet({
  visible,
  title = 'Are You sure ?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  busy = false,
  onConfirm,
  onCancel,
}: ConfirmSheetProps) {
  const insets = useSafeAreaInsets();
  const cancel = () => {
    if (!busy) onCancel();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onCancel}
      busy={busy}
      scrimClassName="flex-1 bg-black/40 justify-end"
      panelClassName="bg-[#F6F7F7] rounded-t-[40px] px-6"
      panelStyle={{ paddingBottom: insets.bottom + 56 }}
    >
      <View className="h-[7px] w-[134px] rounded-[4px] bg-grey self-center" />

      <Text
        className="text-[#878686] font-ubuntu-semibold text-center mt-16"
        style={{ fontSize: 22 }}
      >
        {title}
      </Text>

      <Text className="text-[#0A1F29] font-inter-light text-sm text-center leading-5 mt-6">
        {message}
      </Text>

      <View className="flex-row gap-5 mt-16">
        <Pressable
          onPress={cancel}
          disabled={busy}
          className="flex-1 h-12 rounded-[24px] bg-[#E5F6FF] items-center justify-center"
        >
          <Text className="text-primary font-ubuntu-semibold text-sm">{cancelLabel}</Text>
        </Pressable>

        <Pressable
          onPress={onConfirm}
          disabled={busy}
          className="flex-1 h-12 rounded-[24px] bg-primary items-center justify-center"
          style={{ opacity: busy ? 0.7 : 1 }}
        >
          {busy ? (
            <CircleLoader size={22} tone="light" />
          ) : (
            <Text className="text-[#F6F7F7] font-ubuntu-semibold text-sm">{confirmLabel}</Text>
          )}
        </Pressable>
      </View>
    </BottomSheet>
  );
}
