import { Modal, Pressable, View } from 'react-native';
import { CloseCircleIcon, ProfileAvatar } from '@/src/assets/svgs';

type ProfilePreviewModalProps = {
  visible: boolean;
  onClose: () => void;
};

export default function ProfilePreviewModal({ visible, onClose }: ProfilePreviewModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.82)' }}
        onPress={onClose}
      >
        <Pressable
          className="items-center justify-center"
          onPress={(event) => event.stopPropagation()}
        >
          <View className="h-[240px] w-[240px] items-center justify-center rounded-full bg-[#0A1F29]">
            <ProfileAvatar width={250} height={250} />
          </View>
        </Pressable>

        <Pressable
          onPress={(event) => {
            event.stopPropagation();
            onClose();
          }}
          accessibilityLabel="Close"
          className="mt-[47px] items-center justify-center"
        >
          <CloseCircleIcon width={32} height={32} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}
