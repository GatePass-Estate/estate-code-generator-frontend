import { Modal, Pressable, View, Image } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { CloseCircleIcon } from '@/src/assets/svgs';
import images from '@/src/constants/images';

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
          <View className="w-full max-w-[331px] h-[337px] items-center justify-center rounded-[24px] bg-[#F6F7F7] px-6 py-[51px]">
            <View
              style={{ width: 234, height: 234, alignItems: 'center', justifyContent: 'center' }}
            >
              <QRCode value={code} size={234} backgroundColor="white" color="#5b5e61" ecl="H" />

              <View
                style={{
                  position: 'absolute',
                  width: 80,
                  height: 80,
                  borderRadius: 40,
                  backgroundColor: 'white',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Image
                  source={images.logo}
                  style={{ width: 70, height: 70, marginTop: 5 }}
                  resizeMode="contain"
                />
              </View>
            </View>
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
