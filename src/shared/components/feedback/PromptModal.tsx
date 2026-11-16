import { type ReactNode } from 'react';
import { Modal, Pressable, Text, useWindowDimensions, View } from 'react-native';
import { CloseCircleIcon } from '@/src/assets/svgs';
import Button from '@/src/shared/components/Button';

type PromptModalProps = {
  visible: boolean;
  title?: string;
  message: string;
  confirmLabel: string;
  icon?: ReactNode;
  onConfirm: () => void;
  onClose: () => void;
};

/**
 * Centered prompt from the upgrade-plan design: icon, title, message, one button,
 * and a close control under the card.
 */
export default function PromptModal({
  visible,
  title,
  message,
  confirmLabel,
  icon,
  onConfirm,
  onClose,
}: PromptModalProps) {
  const { height } = useWindowDimensions();
  const closeGap = Math.min(138, Math.max(32, height - 520));

  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Pressable className="flex-1 items-center justify-center bg-black/80 px-5" onPress={onClose}>
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full max-w-[337px] items-center"
          style={{ transform: [{ translateY: -42 }] }}
        >
          <View
            className="w-full items-center rounded-[24px] border-[0.5px] border-[#CEE5ED] bg-white px-4 py-10"
            style={{ gap: 24 }}
          >
            <View className="w-full items-center" style={{ maxWidth: 257, gap: 16 }}>
              {icon || title ? (
                <View className="items-center" style={{ gap: 8 }}>
                  {icon}
                  {title ? (
                    <Text
                      className="text-center font-ubuntu-medium text-[#0A1F29]"
                      style={{ fontSize: 27.34, lineHeight: 33 }}
                    >
                      {title}
                    </Text>
                  ) : null}
                </View>
              ) : null}
              <Text
                className="text-center font-inter-light text-[14px] text-[#878686]"
                style={{ lineHeight: 18 }}
              >
                {message}
              </Text>
            </View>
            <Button label={confirmLabel} className="h-11 py-0" onPress={onConfirm} />
          </View>
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            accessibilityLabel="Close"
            hitSlop={12}
            className="h-8 w-8 items-center justify-center"
            style={{ marginTop: closeGap }}
          >
            <CloseCircleIcon width={32} height={32} color="#F6F7F7" />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
