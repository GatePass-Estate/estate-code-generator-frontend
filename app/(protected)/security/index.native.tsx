import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import HistoryRounded from '@/src/assets/icons/history-rounded.svg';
import InvalidCodeClose from '@/src/assets/icons/invalid-code-close.svg';
import MoreFill from '@/src/assets/icons/more-fill.svg';
import Rectangle5 from '@/src/assets/icons/rectangle-5.svg';
import ScanFrame from '@/src/assets/icons/scan-frame.svg';
import { validateCode } from '@/src/lib/api/codes';
import { getUserById } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import { InputRefsStorage } from '@/src/types/general';

const EMPTY_CODE = ['', '', '', '', '', ''];
const invalidCodeIllustration = require('@/src/assets/icons/credit-card-1.png');
type VerificationMode = 'enter' | 'scan';

const normalizeAccessCode = (value: string | null | undefined) => {
  const candidate = value?.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  return candidate && /^[0-9A-Z]{6}$/.test(candidate) ? candidate : '';
};

const extractScannedAccessCode = (value: string) => {
  const rawValue = value.trim();
  const codeKeys = ['code', 'access_code', 'accessCode'];

  try {
    const parsed = JSON.parse(rawValue);

    if (parsed && typeof parsed === 'object') {
      for (const key of codeKeys) {
        const candidate = normalizeAccessCode(String(parsed[key] ?? ''));
        if (candidate) return candidate;
      }
    }
  } catch {
    // QR payloads are often plain text or URLs rather than JSON.
  }

  try {
    const url = new URL(rawValue);

    for (const key of codeKeys) {
      const candidate = normalizeAccessCode(url.searchParams.get(key));
      if (candidate) return candidate;
    }

    const pathCandidate = url.pathname
      .split('/')
      .reverse()
      .map((part) => normalizeAccessCode(part))
      .find(Boolean);

    if (pathCandidate) return pathCandidate;
  } catch {
    // The scanner usually receives the raw access code, not a URL.
  }

  const groupedCandidate = rawValue
    .toUpperCase()
    .split(/[^0-9A-Z]+/)
    .filter(Boolean)
    .find((part) => /^[0-9A-Z]{6}$/.test(part));

  if (groupedCandidate) return groupedCandidate;

  const labelledCandidate = rawValue
    .toUpperCase()
    .match(/(?:CODE|ACCESS_CODE|ACCESSCODE|ACCESS)[^0-9A-Z]*([0-9A-Z][0-9A-Z\s-]{4,10}[0-9A-Z])/);

  const normalizedLabelledCandidate = normalizeAccessCode(labelledCandidate?.[1]);
  if (normalizedLabelledCandidate) return normalizedLabelledCandidate;

  const visibleCandidate = rawValue
    .toUpperCase()
    .match(/(^|[^0-9A-Z])([0-9A-Z]{3}[\s-]?[0-9A-Z]{3})(?=$|[^0-9A-Z])/);

  const normalizedVisibleCandidate = normalizeAccessCode(visibleCandidate?.[2]);
  if (normalizedVisibleCandidate) return normalizedVisibleCandidate;

  return normalizeAccessCode(rawValue);
};

function InvalidCodeOverlay({ onClose }: { onClose: () => void }) {
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

export default function SecurityVerificationMobile() {
  const params = useLocalSearchParams();
  const [mode, setMode] = useState<VerificationMode>(params.mode === 'scan' ? 'scan' : 'enter');
  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [errorMessage, setErrorMessage] = useState('');
  const [invalidCode, setInvalidCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const inputs = useRef<InputRefsStorage>({});
  const scanNavigationInProgressRef = useRef(false);
  const router = useRouter();
  const iconOffsetFromTitle = -7;
  const headerTopGap = 24.14;
  const headerToToggleGap = 51;
  const contentTopGap = mode === 'scan' ? 40 : 128;

  const setInputRef = (el: TextInput | null, index: number) => {
    if (el) inputs.current[index] = el;
  };

  const showInvalidOverlay = (entered: string, message: string) => {
    setInvalidCode(entered);
    setErrorMessage(message);
  };

  const resetScanState = useCallback(() => {
    scanNavigationInProgressRef.current = false;
  }, []);

  useFocusEffect(
    useCallback(() => {
      resetScanState();
    }, [resetScanState])
  );

  useEffect(() => {
    if (mode === 'scan') resetScanState();
  }, [mode, resetScanState]);

  const validateEnteredCode = async (entered: string, source: VerificationMode = 'enter') => {
    if (entered.length < 6) {
      setErrorMessage('Please fill all 6 digits');
      if (source === 'scan') scanNavigationInProgressRef.current = false;
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    Keyboard.dismiss();

    try {
      const result = await validateCode(entered);
      const resident = await getUserById(result.user_id);
      const residentHousehold = resident?.household_name || resident?.household_id || 'Household';

      router.push({
        pathname: '/security/result',
        params: {
          visitor_fullname: result.visitor_fullname,
          relationship_with_resident: result.relationship_with_resident,
          gender: result.gender,
          resident_name: `${resident?.first_name ?? ''} ${resident?.last_name ?? ''}`,
          resident_address: resident?.home_address,
          resident_household: residentHousehold,
          resident_email: resident?.email,
          resident_phone_number: resident?.phone_number,
          resident_user_id: result.user_id,
          code: result.hashed_code,
          receiver: result.receiver,
        },
      });
      setCode(EMPTY_CODE);
    } catch (err: any) {
      if (source === 'scan') scanNavigationInProgressRef.current = false;
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
    if (isSubmitting || scanNavigationInProgressRef.current) return;
    const scanned = extractScannedAccessCode(data);

    if (scanned.length === 6) {
      scanNavigationInProgressRef.current = true;
      setCode(scanned.split(''));
      void validateEnteredCode(scanned, 'scan');
    }
  };

  const handleCameraPermissionPress = async () => {
    const openAppSettings = async () => {
      try {
        if (Platform.OS === 'ios') {
          await Linking.openURL('app-settings:');
          return;
        }

        await Linking.openSettings();
      } catch {
        if (Platform.OS === 'ios') {
          await Linking.openURL('app-settings:');
        }
      }
    };

    if (permission && !permission.canAskAgain) {
      Alert.alert(
        'Camera access is blocked',
        'Open iPhone Settings, select Expo Go, then turn Camera back on.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Open Settings', onPress: () => void openAppSettings() },
        ]
      );
      return;
    }

    if (permission?.status === 'denied') {
      await openAppSettings();
      return;
    }

    const result = await requestPermission();
    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        'Camera access is blocked',
        'Open iPhone Settings, select Expo Go, then turn Camera back on.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Open Settings', onPress: () => void openAppSettings() },
        ]
      );
    }
  };

  const renderEnterCode = () => (
    <View className="w-full items-center">
      <View className="mb-[38px] items-center">
        <View className="h-[26px] w-[302px] items-center justify-center">
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="h-[26px] w-[302px] text-center font-ubuntu-semibold text-[21.88px] leading-[21.88px] text-[#113E55]"
          >
            Verify Access Code
          </Text>
        </View>
        <View className="mt-[10px] h-[17px] w-[205px] items-center justify-center">
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="h-[17px] w-[205px] text-center font-inter-light text-[14px] leading-[14px] text-[#F46036]"
          >
            Enter the code from guest here
          </Text>
        </View>
      </View>

      <View className="h-[65px] w-[304px] flex-row justify-center gap-[8px] py-[2px]">
        {code.map((digit, idx) =>
          Platform.OS === 'ios' ? (
            <View
              key={idx}
              className="relative h-[60.50px] w-[44px] items-center justify-center rounded-[8px] border-[0.5px] border-[#9B9797] bg-[#EFF1F1]"
            >
              <Text
                allowFontScaling={false}
                pointerEvents="none"
                className="text-center font-ubuntu-semibold text-[20px] leading-[20px] text-[#113E55]"
              >
                {digit}
              </Text>
              <TextInput
                ref={(el) => setInputRef(el, idx)}
                style={styles.codeInputCapture}
                value={digit}
                onChangeText={(t) => handleChange(t, idx)}
                onKeyPress={(e) => handleKeyPress(e, idx)}
                autoCapitalize="characters"
                maxLength={1}
                accessibilityLabel={`Digit ${idx + 1}`}
                returnKeyType="done"
                blurOnSubmit
                caretHidden
                selectionColor="transparent"
              />
            </View>
          ) : (
            <TextInput
              key={idx}
              ref={(el) => setInputRef(el, idx)}
              className="h-[60.50px] w-[44px] rounded-[8px] border-[0.5px] border-[#9B9797] bg-[#EFF1F1] text-center font-ubuntu-semibold text-[20px] leading-[20px] text-[#113E55]"
              style={styles.codeInputAndroid}
              value={digit}
              onChangeText={(t) => handleChange(t, idx)}
              onKeyPress={(e) => handleKeyPress(e, idx)}
              autoCapitalize="characters"
              maxLength={1}
              accessibilityLabel={`Digit ${idx + 1}`}
              returnKeyType="done"
              blurOnSubmit
            />
          )
        )}
      </View>

      <View className="mt-[108px] h-[48px] w-full items-center">
        <Pressable
          className="h-[48px] min-w-[80px] max-w-[278px] w-[171px] flex-row items-center justify-center gap-[10px] rounded-[24px] bg-[#113E55] px-[24px] py-[16px]"
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={() => validateEnteredCode(code.join(''))}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text allowFontScaling={false} numberOfLines={1} style={styles.validateCodeButtonText}>
              Validate Code
            </Text>
          )}
        </Pressable>
      </View>

      {errorMessage && !invalidCode ? (
        <Text className="mt-[18px] text-center font-inter-regular text-[13px] text-[#ED0808]">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );

  const renderScanner = () => (
    <View className="w-full items-center">
      <View className="h-[26px] w-[302px] items-center justify-center">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="h-[26px] w-[302px] text-center font-ubuntu-semibold text-[21.88px] leading-[21.88px] text-[#113E55]"
        >
          Verify Access Code
        </Text>
      </View>
      <View className="mt-[11px] h-[17px] w-[304px] items-center justify-center">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="h-[17px] w-[304px] text-center font-inter-light text-[14px] leading-[14px] text-[#F46036]"
        >
          Position the QR code within the frame to scan.
        </Text>
      </View>

      <View style={styles.scanFrame}>
        {permission?.granted ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onCameraReady={resetScanState}
            onBarcodeScanned={handleScan}
          />
        ) : (
          <View style={styles.permissionState}>
            <Icon name="camera-outline" size={34} color="#113E55" />
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionBody}>
              {permission && !permission.canAskAgain
                ? 'Camera access is blocked. Enable it in iPhone Settings to scan access codes.'
                : 'Allow GatePass to scan access codes in this space.'}
            </Text>
            <Pressable
              style={({ pressed }) => [styles.permissionButton, pressed && styles.pressed]}
              onPress={handleCameraPermissionPress}
            >
              <Text style={styles.permissionButtonText}>
                {permission && !permission.canAskAgain ? 'Open Settings' : 'Allow Camera'}
              </Text>
            </Pressable>
          </View>
        )}

        <ScanFrame
          pointerEvents="none"
          width={250.94}
          height={225.15}
          style={styles.scanCornerFrame}
        />
      </View>

      {isSubmitting ? (
        <View className="mt-[24px] flex-row items-center gap-[8px]">
          <ActivityIndicator color="#113E55" />
          <Text className="font-inter-regular text-[13px] text-[#113E55]">Validating code...</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      className="relative flex-1 bg-[#FBFEFF]"
      style={[sharedStyles.container, sharedStyles.modalContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className="w-full max-w-[390px] flex-row items-center justify-between self-center"
        style={{ marginBottom: headerToToggleGap, marginTop: headerTopGap }}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="h-[33px] w-[209px] font-ubuntu-medium text-[27.34px] leading-[27.34px] text-[#113E55]"
          style={styles.incomingGuestTitle}
        >
          Incoming Guest
        </Text>
        <View className="flex-row items-center gap-[4px]" style={styles.headerIconGroup}>
          <Pressable
            accessibilityLabel="Open access log"
            hitSlop={8}
            onPress={() => router.push('/security/history')}
            className="h-[42px] w-[42px] items-center justify-center"
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <View
              className="relative h-[42px] w-[42px] rounded-full bg-[#F6FCFF]"
              style={{ transform: [{ translateY: iconOffsetFromTitle }] }}
            >
              <View style={styles.group863InnerIcon}>
                <HistoryRounded width={14.58} height={14.74} style={styles.group863VectorIcon} />
              </View>
            </View>
          </Pressable>
          <Pressable
            accessibilityLabel="Open more options"
            hitSlop={8}
            onPress={() => router.push('/security/more')}
            className="h-[42px] w-[42px] items-center justify-center"
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <View
              className="relative h-[42px] w-[42px] rounded-full bg-[#F6FCFF]"
              style={{ transform: [{ translateY: iconOffsetFromTitle }] }}
            >
              <View style={styles.group862InnerIcon}>
                <MoreFill width={19.89} height={4.43} style={styles.group862VectorIcon} />
              </View>
            </View>
          </Pressable>
        </View>
      </View>

      <View className="relative h-[40px] w-[229px] flex-row self-center overflow-hidden rounded-[24px]">
        <Rectangle5
          pointerEvents="none"
          width={229}
          height={40}
          style={styles.segmentedControlBackground}
        />
        <Pressable
          className={`relative h-[40px] rounded-[24px] ${
            mode === 'enter' ? 'w-[119px] bg-[#CEE5ED]' : 'w-[110px]'
          }`}
          onPress={() => setMode('enter')}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.enterCodeSegmentText, mode === 'scan' && styles.inactiveSegmentText]}
          >
            Enter Code
          </Text>
        </Pressable>
        <Pressable
          className={`relative h-[40px] rounded-[24px] ${
            mode === 'scan' ? 'w-[119px] bg-[#CEE5ED]' : 'w-[110px]'
          }`}
          onPress={() => setMode('scan')}
        >
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            style={[styles.scanCodeSegmentText, mode === 'scan' && styles.activeSegmentText]}
          >
            Scan Code
          </Text>
        </Pressable>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={[styles.keyboardContent, { paddingTop: contentTopGap }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {mode === 'enter' ? renderEnterCode() : renderScanner()}
        </ScrollView>
      </KeyboardAvoidingView>

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
  incomingGuestTitle: {
    marginLeft: 2,
  },
  headerIconGroup: {
    marginRight: -4,
  },
  group863InnerIcon: {
    height: 22.08,
    left: 9.95,
    position: 'absolute',
    top: 11.08,
    width: 22.1,
  },
  group863VectorIcon: {
    left: 3.81,
    position: 'absolute',
    top: 3.68,
  },
  group862InnerIcon: {
    height: 26.53,
    left: 7.74,
    position: 'absolute',
    top: 7.74,
    width: 26.53,
  },
  group862VectorIcon: {
    left: 3.32,
    position: 'absolute',
    top: 11.05,
  },
  segmentedControlBackground: {
    height: 40,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 229,
  },
  enterCodeSegmentText: {
    color: '#113E55',
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 11.2,
    height: 14,
    left: 27,
    lineHeight: 14,
    position: 'absolute',
    textAlign: 'center',
    top: 13,
    width: 60,
  },
  scanCodeSegmentText: {
    color: '#878686',
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 11.2,
    height: 14,
    left: 23,
    lineHeight: 14,
    position: 'absolute',
    textAlign: 'center',
    top: 13,
    width: 64,
  },
  activeSegmentText: {
    color: '#113E55',
  },
  inactiveSegmentText: {
    color: '#878686',
  },
  validateCodeButtonText: {
    color: '#F6F7F7',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 14,
    height: 17,
    left: 24,
    letterSpacing: -0.24,
    lineHeight: 17,
    position: 'absolute',
    textAlign: 'center',
    top: 15.5,
    width: 123,
  },
  codeInputCapture: {
    ...StyleSheet.absoluteFillObject,
    color: 'transparent',
    padding: 0,
    textAlign: 'center',
  },
  codeInputAndroid: {
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'flex-start',
  },
  keyboardContent: {
    flexGrow: 1,
    justifyContent: 'flex-start',
    paddingBottom: Platform.OS === 'android' ? 92 : 34,
  },
  pressed: {
    opacity: 0.82,
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
    alignItems: 'center',
    borderRadius: 24,
    height: 225.15,
    justifyContent: 'center',
    marginTop: 59,
    position: 'relative',
    width: 250.94,
  },
  scanCornerFrame: {
    elevation: 2,
    height: 225.15,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 250.94,
    zIndex: 2,
  },
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
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 14,
    height: 17,
    left: 30,
    lineHeight: 17,
    position: 'absolute',
    textAlign: 'center',
    top: 268,
    width: 271,
  },
});
