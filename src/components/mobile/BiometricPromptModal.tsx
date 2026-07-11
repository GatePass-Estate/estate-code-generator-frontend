import { Modal, View, Text, Pressable } from 'react-native';

interface BiometricPromptModalProps {
  visible: boolean;
  onEnable: () => void;
  onDismiss: () => void;
}

export function BiometricPromptModal({ visible, onEnable, onDismiss }: BiometricPromptModalProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View
        className="flex-1 items-center justify-center px-6"
        style={{ backgroundColor: 'rgba(0, 0, 0, 0.55)' }}
      >
        <View
          className="w-full max-w-sm bg-white rounded-2xl px-8 py-16"
          style={{
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.25,
            shadowRadius: 6,
            elevation: 8,
          }}
        >
          <Text className="text-2xl text-primary font-ubuntu-bold mb-1">
            Enable Biometric Login?
          </Text>

          <Text className="text-base text-[#4B5563] font-inter-regular leading-6 mb-6">
            Sign in faster next time using your device biometric authentication.
          </Text>

          <View className="gap-5 flex-row">
            <Pressable
              onPress={onDismiss}
              className="h-14 rounded-full bg-[#CEE5ED] items-center justify-center active:opacity-80 grow"
            >
              <Text className="text-primary font-ubuntu-semibold text-lg">Not Now</Text>
            </Pressable>

            <Pressable
              onPress={onEnable}
              className="h-14 rounded-full bg-primary items-center justify-center active:opacity-80 grow"
            >
              <Text className="text-white font-ubuntu-semibold text-lg">Enable</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}
