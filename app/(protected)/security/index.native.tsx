import { useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import Icon from 'react-native-vector-icons/Ionicons';
import images from '@/src/constants/images';
import { validateCode } from '@/src/lib/api/codes';
import { getUserById } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import { InputRefsStorage } from '@/src/types/general';

const EMPTY_CODE = ['', '', '', '', '', ''];

type VerificationMode = 'enter' | 'scan';

function ThinClockIcon() {
  return (
    <Svg width={38} height={38} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.9 7.2A7.3 7.3 0 1 1 5 12"
        stroke="#113E55"
        strokeWidth={0.95}
        strokeLinecap="round"
      />
      <Path
        d="M6.65 3.9v3.55h3.55"
        stroke="#113E55"
        strokeWidth={0.95}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M12 8.1v4.15l2.85 1.7"
        stroke="#113E55"
        strokeWidth={0.95}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function InvalidCodeOverlay({ onClose }: { onClose: () => void }) {
  return (
    <Modal visible transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlayBackdrop}>
        <View style={styles.invalidCard}>
          <Image source={images.brokenCard} style={styles.invalidIllustration} />

          <Text style={styles.invalidTitle}>Opps!!</Text>
          <Text style={styles.invalidBody}>{"This code doesn't exist\nor has expired"}</Text>
        </View>

        <Pressable
          accessibilityLabel="Close invalid code message"
          onPress={onClose}
          style={({ pressed }) => [styles.invalidCloseButton, pressed && styles.pressed]}
        >
          <Icon name="close" size={18} color="#FFFFFF" />
        </Pressable>
      </View>
    </Modal>
  );
}

export default function SecurityVerificationMobile() {
  const params = useLocalSearchParams();
  const [mode, setMode] = useState<VerificationMode>('enter');
  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [errorMessage, setErrorMessage] = useState('');
  const [invalidCode, setInvalidCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const inputs = useRef<InputRefsStorage>({});
  const router = useRouter();

  useEffect(() => {
    if (!__DEV__ || (params.preview_result !== 'guest' && params.preview_result !== 'resident')) {
      return;
    }

    const isResidentPreview = params.preview_result === 'resident';

    router.replace({
      pathname: '/security/result',
      params: {
        code: String(params.code || '7653E2'),
        gender: String(params.gender || 'female'),
        household: String(params.household || 'Olaburaku'),
        receiver: isResidentPreview ? 'resident' : 'visitor',
        relationship_with_resident: String(params.relationship_with_resident || 'Technician'),
        resident_address: String(params.resident_address || 'Flat 1B, Olayinka street'),
        resident_email: String(params.resident_email || 'sandraoh@hot.com'),
        resident_name: String(params.resident_name || 'Sandra Happiness'),
        resident_phone_number: String(params.resident_phone_number || '0908727289'),
        visitor_fullname: String(params.visitor_fullname || 'Sandra Happiness'),
      },
    });
  }, [params, router]);

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
        <Text style={styles.title}>Verify Access Code</Text>
        <Text style={styles.subtitle}>Enter the code from guest here</Text>
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
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => validateEnteredCode(code.join(''))}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.validateButtonText}>Validate Code</Text>
          )}
        </Pressable>
      </View>

      {errorMessage && !invalidCode ? <Text style={styles.inlineError}>{errorMessage}</Text> : null}
    </>
  );

  const renderScanner = () => (
    <View style={styles.scannerContent}>
      <Text style={[styles.title, styles.scannerTitle]}>Verify Access Code</Text>
      <Text style={[styles.subtitle, styles.scannerSubtitle]}>
        Position the QR code within the frame to scan
      </Text>

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

        <View pointerEvents="none" style={styles.scanCornerTopLeft} />
        <View pointerEvents="none" style={styles.scanCornerTopRight} />
        <View pointerEvents="none" style={styles.scanCornerBottomLeft} />
        <View pointerEvents="none" style={styles.scanCornerBottomRight} />
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

      <View style={styles.topBar}>
        <Text style={styles.topBarTitle}>Incoming Guest</Text>
        <View style={styles.topBarActions}>
          <Pressable
            accessibilityLabel="Open recent activity"
            hitSlop={8}
            onPress={() => {}}
            style={({ pressed }) => [styles.topIconButton, pressed && styles.pressed]}
          >
            <ThinClockIcon />
          </Pressable>
          <Pressable
            accessibilityLabel="Open more options"
            hitSlop={8}
            onPress={() => {}}
            style={({ pressed }) => [styles.topIconButton, pressed && styles.pressed]}
          >
            <Icon name="ellipsis-horizontal" size={22} color="#113E55" />
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
    marginBottom: 74,
    paddingHorizontal: 2,
    paddingTop: 41,
  },
  topBarTitle: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 21.33,
    height: 30,
    lineHeight: 24,
    marginRight: 63,
    width: 186,
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
  segmentedControl: {
    alignSelf: 'center',
    flexDirection: 'row',
    backgroundColor: '#EFF1F1',
    borderRadius: 26,
    height: 44,
    padding: 3,
    width: 245,
  },
  segmentButton: {
    alignItems: 'center',
    borderRadius: 20,
    flex: 1,
    justifyContent: 'center',
  },
  segmentButtonActive: {
    backgroundColor: '#CEE5ED',
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
    marginBottom: 37,
  },
  title: {
    color: '#113E55',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 23.04,
    height: 32,
    lineHeight: 28,
    textAlign: 'center',
    width: 302,
  },
  subtitle: {
    color: '#F46036',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 12,
    flexShrink: 0,
    height: 18,
    lineHeight: 16,
    marginTop: 8,
    textAlign: 'center',
    width: 230,
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
    backgroundColor: '#113E55',
    borderRadius: 23,
    height: 46,
    justifyContent: 'center',
    width: 148,
  },
  validateButtonSlot: {
    alignItems: 'center',
    marginTop: 107,
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontSize: 11,
    fontWeight: '700',
  },
  validateButtonText: {
    alignItems: 'center',
    backgroundColor: '#113E55',
    borderRadius: 24,
    color: '#FFFFFF',
    fontFamily: 'Roboto',
    fontSize: 10,
    fontWeight: '500',
    height: 48,
    justifyContent: 'center',
    lineHeight: 13,
    maxWidth: 278,
    minWidth: 80,
    overflow: 'hidden',
    paddingHorizontal: 24,
    paddingTop: 16,
    textAlign: 'center',
    width: 171,
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
    width: 320,
  },
  scannerSubtitle: {
    height: 22,
    lineHeight: 18,
    marginTop: 9,
    width: 340,
  },
  scannerShell: {
    alignItems: 'center',
    height: 225.15,
    justifyContent: 'center',
    marginTop: 54,
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
    backgroundColor: '#F6F7F7',
    borderRadius: 40,
    height: 351,
    justifyContent: 'flex-start',
    paddingHorizontal: 28,
    paddingTop: 49,
    width: 331,
  },
  invalidCloseButton: {
    alignItems: 'center',
    borderColor: '#FFFFFF',
    borderRadius: 10000,
    borderWidth: 1,
    height: 34,
    justifyContent: 'center',
    marginTop: 72,
    width: 34,
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
