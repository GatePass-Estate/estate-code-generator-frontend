import { Modal, Pressable, Text, View } from 'react-native';
import { CloseCircleIcon, CompleteKycIcon } from '@/src/assets/svgs';
import Button from './Button';

type VerifyAccountModalProps = {
  visible: boolean;
  onClose: () => void;
  onVerify: () => void;
};

/** "Complete KYC" overlay shown when an unverified profile tries a feature. */
export default function VerifyAccountModal({
  visible,
  onClose,
  onVerify,
}: VerifyAccountModalProps) {
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      {/* Neutral grey like the design; the theme's `black` is navy, so it is set directly. */}
      <View
        className="flex-1 items-center justify-center px-5"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)' }}
      >
        <View className="items-center" style={{ width: 337, transform: [{ translateY: -48 }] }}>
          <View
            className="items-center rounded-[24px] border-[0.5px] border-[#CEE5ED] bg-white"
            style={{ width: 337, paddingHorizontal: 16, paddingVertical: 40, gap: 40 }}
          >
            <View className="items-center" style={{ gap: 16 }}>
              <View className="items-center" style={{ gap: 8 }}>
                <View className="items-center justify-center" style={{ width: 40, height: 40 }}>
                  <CompleteKycIcon />
                </View>
                <Text
                  className="text-center font-ubuntu-medium text-[#0A1F29]"
                  style={{ fontSize: 27.34 }}
                >
                  Complete KYC
                </Text>
              </View>
              <Text
                className="text-center font-inter-light text-[#878686]"
                style={{ fontSize: 14, width: 257 }}
              >
                Complete your verification process to access this feature.
              </Text>
            </View>
            <Button
              label="Got It !"
              className="h-[44px] py-0"
              onPress={() => {
                onClose();
                onVerify();
              }}
            />
          </View>
          <Pressable
            onPress={onClose}
            hitSlop={12}
            style={{ position: 'absolute', top: '100%', marginTop: '40%', alignSelf: 'center' }}
          >
            <CloseCircleIcon width={32} height={32} color="#F6F7F7" />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
