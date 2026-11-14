import { Modal, Pressable, Text, View } from 'react-native';

export type MarketplaceConfirmConfig = {
  title: string;
  message: string;
  cancelText: string;
  confirmText: string;
  confirmStyle: 'default' | 'destructive';
  onConfirm: () => void;
};

export const emptyMarketplaceConfirm = (): MarketplaceConfirmConfig => ({
  title: '',
  message: '',
  cancelText: 'Cancel',
  confirmText: 'Confirm',
  confirmStyle: 'default',
  onConfirm: () => {},
});

export default function MarketplaceConfirmModal({
  visible,
  config,
  onClose,
}: {
  visible: boolean;
  config: MarketplaceConfirmConfig;
  onClose: () => void;
}) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View className="flex-1 items-center justify-center bg-black/50 px-6">
        <View className="w-full rounded-[28px] bg-[#F2F4F4] px-6 pb-6 pt-7">
          <Text allowFontScaling={false} className="mb-2.5 font-inter-semibold text-lg text-black">
            {config.title}
          </Text>
          <Text
            allowFontScaling={false}
            className="mb-7 font-inter-regular text-[15px] leading-[22px] text-[#666]"
          >
            {config.message}
          </Text>
          <View className="flex-row gap-3.5">
            <Pressable
              onPress={onClose}
              className="h-[50px] flex-1 items-center justify-center rounded-[25px] bg-[#EBEBEB]"
            >
              <Text allowFontScaling={false} className="font-inter-medium text-base text-black">
                {config.cancelText}
              </Text>
            </Pressable>
            <Pressable
              onPress={config.onConfirm}
              className="h-[50px] flex-1 items-center justify-center rounded-[25px] bg-[#EBEBEB]"
            >
              <Text
                allowFontScaling={false}
                className="font-inter-medium text-base"
                style={{ color: config.confirmStyle === 'destructive' ? '#FF3B30' : '#000' }}
              >
                {config.confirmText}
              </Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
