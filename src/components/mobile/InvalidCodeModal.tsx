import { Modal, Text, Pressable, Image } from 'react-native';
import images from '@/src/constants/images';
import { CloseCircleIcon } from '@/src/assets/svgs';

type InvalidCodeModalProps = {
  visible: boolean;
  onClose: () => void;
  message?: string;
};

export default function InvalidCodeModal({
  visible,
  onClose,
  message = "This code doesn't exist or has expired",
}: InvalidCodeModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.82)' }}
        onPress={onClose}
      >
        <Pressable
          className="items-center justify-center px-8"
          style={{
            width: 331,
            height: 351,
            borderRadius: 40,
            backgroundColor: '#F6F7F7',
            paddingVertical: 51,
          }}
          onPress={(event) => event.stopPropagation()}
        >
          <Image
            source={images.brokenCard}
            resizeMode="contain"
            style={{ width: 150, height: 150, aspectRatio: 1 }}
          />

          <Text className="mt-4 text-center text-[28px] font-ubuntu-medium text-primary">
            Opps!!
          </Text>

          <Text className="mt-3 px-2 w-[180px] text-center text-base font-inter-regular leading-[18px] text-[#0A1F29]">
            {message}
          </Text>
        </Pressable>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onClose();
          }}
          accessibilityLabel="Close"
          className="absolute items-center justify-center"
          style={{ bottom: 116, alignSelf: 'center' }}
        >
          <CloseCircleIcon width={32} height={32} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
