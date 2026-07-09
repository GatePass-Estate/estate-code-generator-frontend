import { useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Image,
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import Group862 from '@/src/assets/icons/group-862.svg';
import Group863 from '@/src/assets/icons/group-863.svg';
import EnterCodeSubtitle from '@/src/assets/icons/enter-code-subtitle.svg';
import IncomingGuestTitle from '@/src/assets/icons/incoming-guest-title.svg';
import InvalidCodeClose from '@/src/assets/icons/invalid-code-close.svg';
import ScanFrame from '@/src/assets/icons/scan-frame.svg';
import ScanPositionQrSubtitle from '@/src/assets/icons/scan-position-qr-subtitle.svg';
import ScanVerifyAccessCodeTitle from '@/src/assets/icons/scan-verify-access-code-title.svg';
import ValidateCodeButton from '@/src/assets/icons/validate-code-button.svg';
import VerifyAccessCodeTitle from '@/src/assets/icons/verify-access-code-title.svg';
import { validateCode } from '@/src/lib/api/codes';
import { getUserById } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import { InputRefsStorage } from '@/src/types/general';

const EMPTY_CODE = ['', '', '', '', '', ''];
const invalidCodeCard = require('@/src/assets/icons/invalid-code-card.png');

type VerificationMode = 'enter' | 'scan';

function InvalidCodeOverlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayBackdrop}>
        <View style={styles.invalidCard}>
          <Image source={invalidCodeCard} style={styles.invalidCardImage} />
        </View>

        <Pressable
          accessibilityLabel="Close invalid code message"
          onPress={onClose}
          style={({ pressed }) => [styles.invalidCloseButton, pressed && styles.pressed]}
        >
          <InvalidCodeClose width={32} height={32} />
        </Pressable>
      </View>
    </Modal>
  );
}

export default function SecurityVerificationMobile() {
  const insets = useSafeAreaInsets();
  const [mode, setMode] = useState<VerificationMode>('enter');
  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [errorMessage, setErrorMessage] = useState('');
  const [invalidCode, setInvalidCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const inputs = useRef<InputRefsStorage>({});
  const router = useRouter();

  const setInputRef = (el: TextInput | null, index: number) => {
    if (el) inputs.current[index] = el;
  };

  const showInvalidOverlay = (entered: string, message: string) => {
    setInvalidCode(entered);
    setErrorMessage(message);
  };

  const validateEnteredCode = async (entered: string) => {
    if (entered.length < 6) {
      setErrorMessage('Please fill all 6 digits');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    Keyboard.dismiss();

    try {
      const result = await validateCode(entered);
      const resident = await getUserById(result.user_id);

      router.push({
        pathname: '/security/result',
        params: {
          visitor_fullname: result.visitor_fullname,
          relationship_with_resident: result.relationship_with_resident,
          gender: result.gender,
          resident_name: `${resident?.first_name ?? ''} ${resident?.last_name ?? ''}`,
          resident_address: resident?.home_address,
          resident_email: resident?.email,
          resident_phone_number: resident?.phone_number,
          code: result.hashed_code,
          receiver: result.receiver,
        },
      });
      setCode(EMPTY_CODE);
    } catch (err: any) {
      showInvalidOverlay(
        entered,
        err.message ?? 'Invalid Access Code. This does not exist or has expired.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (text: string, index: number) => {
    const cleaned = text.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
    setErrorMessage('');
    const newCode = [...code];

    if (cleaned.length > 1) {
      for (let i = 0; i < cleaned.length && index + i < newCode.length; i++) {
        newCode[index + i] = cleaned[i];
      }
      setCode(newCode);
      const lastFilledIndex = Math.min(5, index + cleaned.length - 1);
      if (newCode.every(Boolean)) {
        Keyboard.dismiss();
      } else {
        inputs.current[lastFilledIndex]?.focus();
      }
      return;
    }

    const digit = cleaned.slice(-1);
    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
    } else if (digit && index === 5) {
      Keyboard.dismiss();
    } else if (!digit && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleKeyPress = (e: { nativeEvent: { key: string } }, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && code[index] === '' && index > 0) {
      const newCode = [...code];
      newCode[index - 1] = '';
      setCode(newCode);
      inputs.current[index - 1]?.focus();
    }
  };

  const handleScan = ({ data }: { data: string }) => {
    if (isSubmitting) return;
    const scanned = data
      .replace(/[^0-9a-zA-Z]/g, '')
      .toUpperCase()
      .slice(-6);
    if (scanned.length === 6) {
      setCode(scanned.split(''));
      void validateEnteredCode(scanned);
    }
  };

  const renderEnterCode = () => (
    <>
      <View style={styles.heroCopy}>
        <View style={styles.title}>
          <VerifyAccessCodeTitle width={189} height={23} />
        </View>
        <View style={styles.subtitle}>
          <EnterCodeSubtitle width={168} height={12} />
        </View>
      </View>

      <View style={styles.codeInputRow}>
        {code.map((digit, idx) => (
          <TextInput
            key={idx}
            ref={(el) => setInputRef(el, idx)}
            style={styles.codeInput}
            value={digit}
            onChangeText={(t) => handleChange(t, idx)}
            onKeyPress={(e) => handleKeyPress(e, idx)}
            autoCapitalize="characters"
            maxLength={1}
            accessibilityLabel={`Digit ${idx + 1}`}
            returnKeyType="done"
            blurOnSubmit
          />
        ))}
      </View>

      <View style={styles.validateButtonSlot}>
        <Pressable
          style={({ pressed }) => [styles.validateButton, pressed && styles.pressed]}
          onPress={() => validateEnteredCode(code.join(''))}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <ValidateCodeButton width={171} height={48} style={styles.validateButtonImage} />
          )}
        </Pressable>
      </View>

      {errorMessage && !invalidCode ? <Text style={styles.inlineError}>{errorMessage}</Text> : null}
    </>
  );

  const renderScanner = () => (
    <View style={styles.scannerContent}>
      <View style={styles.scannerTitle}>
        <ScanVerifyAccessCodeTitle width={189} height={23} />
      </View>
      <View style={styles.scannerSubtitle}>
        <ScanPositionQrSubtitle width={250} height={14} />
      </View>

      <View style={styles.scannerShell}>
        {permission?.granted ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onBarcodeScanned={handleScan}
          />
        ) : (
          <View style={styles.permissionState}>
            <Icon name="camera-outline" size={34} color="#113E55" />
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionBody}>
              Allow GatePass to scan access codes in this space.
            </Text>
            <Pressable
              style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}
              onPress={requestPermission}
            >
              <Text style={styles.permissionButtonText}>Allow Camera</Text>
            </Pressable>
          </View>
        )}

        <ScanFrame
          pointerEvents="none"
          width={250.9439697265625}
          height={225.15234375}
          style={styles.scanFrame}
        />
      </View>

      {isSubmitting ? (
        <View style={styles.scanStatus}>
          <ActivityIndicator color="#113E55" />
          <Text style={styles.scanStatusText}>Validating code...</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView style={sharedStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View style={[styles.topBar, { paddingTop: Math.max(0, 81 - insets.top) }]}>
        <IncomingGuestTitle width={174} height={24} style={styles.topBarTitle} />
        <View style={styles.topBarActions}>
          <Pressable
            accessibilityLabel="Open recent activity"
            hitSlop={8}
            onPress={() => {}}
            style={({ pressed }) => [styles.topIconButton, pressed && styles.pressed]}
          >
            <Group863 width={38} height={38} style={styles.group863Icon} />
          </Pressable>
          <Pressable
            accessibilityLabel="Open more options"
            hitSlop={8}
            onPress={() => {}}
            style={({ pressed }) => [styles.topIconButton, pressed && styles.pressed]}
          >
            <Group862 width={38} height={38} style={styles.topActionIcon} />
          </Pressable>
        </View>
      </View>

      <View style={styles.segmentedControl}>
        <Pressable
          style={[styles.segmentButton, mode === 'enter' && styles.segmentButtonActive]}
          onPress={() => setMode('enter')}
        >
          <Text
            style={[
              styles.segmentText,
              styles.enterCodeSegmentText,
              mode === 'enter' && styles.segmentTextActive,
            ]}
          >
            Enter Code
          </Text>
        </Pressable>
        <Pressable
          style={[styles.segmentButton, mode === 'scan' && styles.segmentButtonActive]}
          onPress={() => setMode('scan')}
        >
          <Text
            style={[
              styles.segmentText,
              styles.scanCodeSegmentText,
              mode === 'scan' && styles.segmentTextActive,
            ]}
          >
            Scan Code
          </Text>
        </Pressable>
      </View>

      <View style={styles.content}>{mode === 'enter' ? renderEnterCode() : renderScanner()}</View>
      <View pointerEvents="none" style={styles.bottomIndicator} />

      {invalidCode ? (
        <InvalidCodeOverlay
          onClose={() => {
            setInvalidCode('');
            setErrorMessage('');
            setCode(EMPTY_CODE);
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  topBar: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 53,
    paddingHorizontal: 2,
  },
  topBarTitle: {
    height: 24,
    marginRight: 75,
    width: 174,
  },
  topBarActions: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 22,
  },
  topIconButton: {
    alignItems: 'center',
    height: 38,
    justifyContent: 'center',
    width: 38,
  },
  group863Icon: {
    height: 38,
    width: 38,
  },
  topActionIcon: {
    height: 38,
    width: 38,
  },
  segmentedControl: {
    backgroundColor: '#EFF1F1',
    borderRadius: 24,
    flexDirection: 'row',
    height: 40,
    marginLeft: 52,
    width: 229,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 40,
    justifyContent: 'center',
    width: 110,
  },
  segmentButtonActive: {
    backgroundColor: '#CEE5ED',
    width: 119,
  },
  segmentText: {
    color: '#6C6C6C',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 12,
    height: 14,
    lineHeight: 14,
    flexShrink: 0,
    textAlign: 'center',
  },
  segmentTextActive: {
    color: '#113E55',
  },
  enterCodeSegmentText: {
    transform: [{ translateX: 5 }],
    width: 76,
  },
  scanCodeSegmentText: {
    transform: [{ translateX: -5 }],
    width: 72,
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
    paddingBottom: 34,
    paddingTop: 128,
  },
  heroCopy: {
    alignItems: 'center',
    marginBottom: 43,
  },
  title: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 302,
  },
  subtitle: {
    alignItems: 'center',
    height: 14,
    justifyContent: 'center',
    marginTop: 8,
    width: 169,
  },
  codeInputRow: {
    alignSelf: 'center',
    flexDirection: 'row',
    gap: 8,
    height: 64.5,
    justifyContent: 'center',
    paddingBottom: 2,
    paddingTop: 2,
    width: 304,
  },
  codeInput: {
    backgroundColor: '#F7F9F9',
    borderColor: '#9B9797',
    borderRadius: 8,
    borderWidth: 0.5,
    color: '#113E55',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 20,
    height: 57,
    textAlign: 'center',
    width: 42,
  },
  inlineError: {
    color: '#ED0808',
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 13,
    marginTop: 18,
    textAlign: 'center',
  },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#113E55',
    borderRadius: 24,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 32,
  },
  validateButton: {
    alignItems: 'center',
    borderRadius: 24,
    height: 48,
    justifyContent: 'center',
    overflow: 'hidden',
    width: 171,
  },
  validateButtonImage: {
    height: 48,
    width: 171,
  },
  validateButtonSlot: {
    alignItems: 'center',
    height: 48,
    marginTop: 106.5,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontSize: 11,
    fontWeight: '700',
  },
  validateButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontSize: 10,
    fontWeight: '500',
    lineHeight: 13,
    textAlign: 'center',
  },
  bottomIndicator: {
    bottom: 0,
    height: 34,
    left: 0,
    position: 'absolute',
    right: 0,
    width: '100%',
  },
  pressed: {
    opacity: 0.82,
  },
  scannerContent: {
    alignItems: 'center',
    marginTop: -90,
  },
  scannerTitle: {
    alignItems: 'center',
    height: 28,
    justifyContent: 'center',
    width: 302,
  },
  scannerSubtitle: {
    alignItems: 'center',
    height: 14,
    justifyContent: 'center',
    marginTop: 9,
    width: 250,
  },
  scannerShell: {
    alignItems: 'center',
    height: 225.15,
    justifyContent: 'center',
    marginTop: 62,
    overflow: 'hidden',
    width: 250.94,
  },
  camera: {
    borderRadius: 22,
    height: 221.15,
    overflow: 'hidden',
    width: 246.94,
  },
  permissionState: {
    alignItems: 'center',
    backgroundColor: '#F7F9F9',
    borderRadius: 22,
    height: 221.15,
    justifyContent: 'center',
    paddingHorizontal: 24,
    width: 246.94,
  },
  permissionTitle: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-Medium',
    fontSize: 17,
    marginTop: 14,
  },
  permissionBody: {
    color: '#6A7980',
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 12,
    lineHeight: 17,
    marginTop: 8,
    textAlign: 'center',
  },
  permissionButton: {
    backgroundColor: '#CEE5ED',
    borderRadius: 18,
    marginTop: 18,
    paddingHorizontal: 18,
    paddingVertical: 10,
  },
  permissionButtonText: {
    color: '#113E55',
    fontFamily: 'Inter_18pt-SemiBold',
    fontSize: 12,
  },
  scanFrame: {
    height: 225.15,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 250.94,
  },
  scanCornerTopLeft: {
    borderColor: '#113E55',
    borderLeftWidth: 2,
    borderTopLeftRadius: 24,
    borderTopWidth: 2,
    height: 74,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 74,
  },
  scanCornerTopRight: {
    borderColor: '#113E55',
    borderRightWidth: 2,
    borderTopRightRadius: 24,
    borderTopWidth: 2,
    height: 74,
    position: 'absolute',
    right: 0,
    top: 0,
    width: 74,
  },
  scanCornerBottomLeft: {
    borderBottomLeftRadius: 24,
    borderBottomWidth: 2,
    borderColor: '#113E55',
    borderLeftWidth: 2,
    bottom: 0,
    height: 74,
    left: 0,
    position: 'absolute',
    width: 74,
  },
  scanCornerBottomRight: {
    borderBottomRightRadius: 24,
    borderBottomWidth: 2,
    borderColor: '#113E55',
    borderRightWidth: 2,
    bottom: 0,
    height: 74,
    position: 'absolute',
    right: 0,
    width: 74,
  },
  scanStatus: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    marginTop: 24,
  },
  scanStatusText: {
    color: '#113E55',
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 13,
  },
  overlayBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(17, 62, 85, 0.36)',
    flex: 1,
    justifyContent: 'flex-start',
    paddingTop: 209,
  },
  invalidCard: {
    alignItems: 'center',
    borderRadius: 40,
    height: 351,
    justifyContent: 'center',
    width: 331,
  },
  invalidCardImage: {
    height: 351,
    width: 331,
  },
  invalidCloseButton: {
    alignItems: 'center',
    borderRadius: 10000,
    height: 32,
    justifyContent: 'center',
    marginTop: 104,
    width: 32,
  },
  invalidIllustration: {
    height: 96,
    resizeMode: 'contain',
    width: 118,
  },
  invalidTitle: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 23,
    lineHeight: 28,
    marginTop: 27,
    textAlign: 'center',
  },
  invalidBody: {
    color: '#0A1F29',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 12,
    lineHeight: 14,
    marginTop: 8,
    textAlign: 'center',
  },
});
