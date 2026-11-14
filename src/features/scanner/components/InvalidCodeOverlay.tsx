import InvalidCodeClose from '@/src/assets/icons/invalid-code-close.svg';
import { Inter } from '@/src/shared/constants/fonts';
import { Image, Modal, Pressable, StyleSheet, Text, View } from 'react-native';

const invalidCodeIllustration = require('@/src/assets/icons/credit-card-1.png');

export default function InvalidCodeOverlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.overlayBackdrop}>
        <Pressable
          accessibilityLabel="Close invalid code message"
          onPress={onClose}
          style={StyleSheet.absoluteFill}
        />
        <View style={styles.invalidOverlayContent}>
          <View style={styles.invalidCard}>
            <Image source={invalidCodeIllustration} style={styles.invalidCardImage} />
            <Text allowFontScaling={false} numberOfLines={1} style={styles.invalidTitleText}>
              Oops!!
            </Text>
            <Text allowFontScaling={false} numberOfLines={1} style={styles.invalidMessageText}>
              {"This code doesn't exist or has expired"}
            </Text>
          </View>
          <View pointerEvents="box-none" style={styles.invalidClosePosition}>
            <Pressable
              accessibilityLabel="Close invalid code message"
              onPress={onClose}
              style={({ pressed }) => [styles.invalidCloseButton, pressed && styles.pressed]}
            >
              <InvalidCodeClose width={32} height={32} />
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlayBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    flex: 1,
  },
  invalidOverlayContent: {
    alignItems: 'center',
    flex: 1,
    paddingTop: 209,
  },
  invalidCard: {
    alignItems: 'center',
    backgroundColor: '#F6F7F7',
    borderRadius: 40,
    height: 351,
    justifyContent: 'center',
    overflow: 'hidden',
    position: 'relative',
    width: 331,
  },
  invalidCardImage: {
    height: 150,
    left: 91,
    position: 'absolute',
    top: 53,
    width: 150,
  },
  invalidClosePosition: {
    height: 32,
    marginTop: 104,
    width: 32,
  },
  invalidCloseButton: {
    alignItems: 'center',
    borderRadius: 10000,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  invalidTitleText: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 26,
    height: 33,
    left: 124,
    lineHeight: 33,
    position: 'absolute',
    textAlign: 'center',
    top: 219,
    width: 82,
  },
  invalidMessageText: {
    color: '#0A1F29',
    fontFamily: Inter.regular,
    fontSize: 14,
    height: 17,
    left: 30,
    lineHeight: 17,
    position: 'absolute',
    textAlign: 'center',
    top: 268,
    width: 271,
  },
  pressed: {
    opacity: 0.82,
  },
});
