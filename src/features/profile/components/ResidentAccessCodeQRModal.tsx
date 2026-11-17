import { Modal, Pressable, View } from 'react-native';
import { CloseCircleIcon } from '@/src/assets/svgs';
import BrandedQRCode from '@/src/shared/components/BrandedQRCode';

type ResidentAccessCodeQRModalProps = {
  visible: boolean;
  code: string;
  onClose: () => void;
};

export default function ResidentAccessCodeQRModal({
  visible,
  code,
  onClose,
}: ResidentAccessCodeQRModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.50)' }}
        onPress={onClose}
      >
        <Pressable onPress={(event) => event.stopPropagation()} className="w-full items-center">
          <View className="h-[337px] w-full max-w-[331px] items-center justify-center rounded-[24px] bg-[#F6F7F7] px-6 py-[51px]">
            <BrandedQRCode
              value={code}
              size={234}
              backgroundColor="#F6F7F7"
              accessibilityLabel="Access code QR code"
            />
          </View>

          <Pressable
            onPress={onClose}
            accessibilityLabel="Close"
            className="mt-[60px] items-center justify-center"
            hitSlop={12}
          >
            <CloseCircleIcon width={32} height={32} />
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
