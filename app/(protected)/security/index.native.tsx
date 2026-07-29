import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as NavigationBar from 'expo-navigation-bar';
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
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import HistoryRounded from '@/src/assets/icons/history-rounded.svg';
import EnterCodeSegmentLabel from '@/src/assets/icons/enter-code-segment-label.svg';
import InvalidCodeClose from '@/src/assets/icons/invalid-code-close.svg';
import InvalidCodeMessage from '@/src/assets/icons/invalid-code-message.svg';
import InvalidCodeOops from '@/src/assets/icons/invalid-code-oops.svg';
import MoreFill from '@/src/assets/icons/more-fill.svg';
import Rectangle5 from '@/src/assets/icons/rectangle-5.svg';
import ScanFrame from '@/src/assets/icons/scan-frame.svg';
import ScanCodeSegmentLabel from '@/src/assets/icons/scan-code-segment-label.svg';
import { validateCode } from '@/src/lib/api/codes';
import { getUserById } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import { InputRefsStorage } from '@/src/types/general';

const EMPTY_CODE = ['', '', '', '', '', ''];
const SCAN_DEDUPE_MS = 1800;
const invalidCodeIllustration = require('@/src/assets/icons/credit-card-1.png');
type VerificationMode = 'enter' | 'scan';

const extractScannedAccessCode = (value: string) => {
  const rawValue = value.trim();
  const codeKeys = ['code', 'access_code', 'accessCode'];

  try {
    const url = new URL(rawValue);

    for (const key of codeKeys) {
      const candidate = url.searchParams.get(key)?.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
      if (candidate?.length === 6) return candidate;
    }

    const pathCandidate = url.pathname
      .split('/')
      .reverse()
      .map((part) => part.replace(/[^0-9a-zA-Z]/g, '').toUpperCase())
      .find((part) => /^[0-9A-Z]{6}$/.test(part));

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

  const compacted = rawValue.replace(/[^0-9a-zA-Z]/g, '').toUpperCase();
  if (compacted.length === 6) return compacted;

  const compactedMatches = compacted.match(/[0-9A-Z]{6}/g);
  return compactedMatches?.at(-1) ?? '';
};

function InvalidCodeOverlay({ onClose }: { onClose: () => void }) {
  const insets = useSafeAreaInsets();
  const { height, width } = useWindowDimensions();
  const overlayCanvasWidth = Math.min(width, 375);
  const invalidCardLeft = Math.max(0, (overlayCanvasWidth - 331) / 2);
  const closeButtonLeft = Math.max(0, (overlayCanvasWidth - 32) / 2);
  const closeButtonTop = Math.min(664, height - insets.bottom - 32 - 24);

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
        <View style={[styles.invalidOverlayContent, { width: overlayCanvasWidth }]}>
          <View style={[styles.invalidCard, { marginLeft: invalidCardLeft }]}>
            <Image source={invalidCodeIllustration} style={styles.invalidCardImage} />
            <InvalidCodeOops width={82} height={33} style={styles.invalidTitleImage} />
            <InvalidCodeMessage width={271} height={17} style={styles.invalidMessageImage} />
          </View>
        </View>
        <View
          pointerEvents="box-none"
          style={[styles.invalidClosePosition, { left: closeButtonLeft, top: closeButtonTop }]}
        >
          <Pressable
            accessibilityLabel="Close invalid code message"
            onPress={onClose}
            style={({ pressed }) => [styles.invalidCloseButton, pressed && styles.pressed]}
          >
            <InvalidCodeClose width={32} height={32} />
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

export default function SecurityVerificationMobile() {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams();
  const [mode, setMode] = useState<VerificationMode>(params.mode === 'scan' ? 'scan' : 'enter');
  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [errorMessage, setErrorMessage] = useState('');
  const [invalidCode, setInvalidCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();
  const inputs = useRef<InputRefsStorage>({});
  const scanNavigationInProgressRef = useRef(false);
  const lastScanRef = useRef({ code: '', timestamp: 0 });
  const router = useRouter();
  const titleTop = Math.max(0, 88 - insets.top);
  const iconOffsetFromTitle = -4;
  const toggleTop = 172;
  const toggleHeight = 40;
  const toggleGapFromTitle = toggleTop - (88 + 33);
  const contentTopGap = (mode === 'scan' ? 250 : 340) - (toggleTop + toggleHeight);
  const contentWidth = width > 390 ? Math.min(width - 40, 390) : 335;

  useEffect(() => {
    if (Platform.OS !== 'android') return;

    const updateNavigationBar = async () => {
      try {
        await NavigationBar.setBackgroundColorAsync(invalidCode ? '#000000' : '#FBFEFF');
        await NavigationBar.setButtonStyleAsync(invalidCode ? 'light' : 'dark');
      } catch {
        // Navigation bar styling is best-effort in Expo Go.
      }
    };

    void updateNavigationBar();
  }, [invalidCode]);

  const setInputRef = (el: TextInput | null, index: number) => {
    if (el) inputs.current[index] = el;
  };

  const showInvalidOverlay = (entered: string, message: string) => {
    setInvalidCode(entered);
    setErrorMessage(message);
  };

  const resetScanState = useCallback(() => {
    scanNavigationInProgressRef.current = false;
    lastScanRef.current = { code: '', timestamp: 0 };
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
      const now = Date.now();
      const isDuplicate =
        lastScanRef.current.code === scanned &&
        now - lastScanRef.current.timestamp < SCAN_DEDUPE_MS;

      if (isDuplicate) return;

      lastScanRef.current = { code: scanned, timestamp: now };
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

      <View className="h-[64.5px] w-[304px] flex-row justify-center gap-[8px] py-[2px]">
        {code.map((digit, idx) =>
          Platform.OS === 'ios' ? (
            <View
              key={idx}
              className="relative h-[60.50000762939453px] w-[44px] items-center justify-center rounded-[8px] border-[0.5px] border-[#9B9797] bg-[#EFF1F1]"
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
              className="h-[60.50000762939453px] w-[44px] rounded-[8px] border-[0.5px] border-[#9B9797] bg-[#EFF1F1] text-center font-ubuntu-semibold text-[20px] leading-[20px] text-[#113E55]"
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
            <Text
              allowFontScaling={false}
              numberOfLines={1}
              className="h-[17px] w-[123px] text-center font-ubuntu-semibold text-[14px] leading-[17px] tracking-[-0.24px] text-[#F6F7F7]"
            >
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

      <View className="relative mt-[59px] h-[225.15234375px] w-[250.9439697265625px] items-center justify-center overflow-hidden rounded-[24px]">
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
          width={250.9439697265625}
          height={225.15234375}
          style={styles.scanFrame}
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
    <SafeAreaView style={sharedStyles.container}>
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className="flex-row items-center justify-between self-center"
        style={{ marginBottom: toggleGapFromTitle, paddingTop: titleTop, width: contentWidth }}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="h-[33px] w-[209px] font-ubuntu-medium text-[27.34px] leading-[27.34px] text-[#113E55]"
        >
          Incoming Guest
        </Text>
        <View className="flex-row items-center gap-[4px]">
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
              <HistoryRounded
                width={22.105262756347656}
                height={22.105262756347656}
                style={styles.group863InnerIcon}
              />
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
              <MoreFill
                width={26.526315689086914}
                height={26.526315689086914}
                style={styles.group862InnerIcon}
              />
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
          className={`h-[40px] items-center justify-center rounded-[24px] ${
            mode === 'enter' ? 'w-[119px] bg-[#CEE5ED]' : 'w-[110px]'
          }`}
          onPress={() => setMode('enter')}
        >
          <EnterCodeSegmentLabel width={60} height={14} style={styles.enterCodeSegmentText} />
        </Pressable>
        <Pressable
          className={`h-[40px] items-center justify-center rounded-[24px] ${
            mode === 'scan' ? 'w-[119px] bg-[#CEE5ED]' : 'w-[110px]'
          }`}
          onPress={() => setMode('scan')}
        >
          <ScanCodeSegmentLabel width={58} height={14} style={styles.scanCodeSegmentText} />
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
  group863InnerIcon: {
    left: 9.947368621826172,
    position: 'absolute',
    top: 11.052631378173828,
  },
  group862InnerIcon: {
    left: 7.736842155456543,
    position: 'absolute',
    top: 7.736842155456543,
  },
  segmentedControlBackground: {
    height: 40,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 229,
  },
  enterCodeSegmentText: {
    transform: [{ translateX: -2.5 }],
    width: 76,
  },
  scanCodeSegmentText: {
    transform: [{ translateX: 0 }],
    width: 72,
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
    height: 225.15,
    left: 0,
    position: 'absolute',
    top: 0,
    width: 250.94,
  },
  overlayBackdrop: {
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    flex: 1,
  },
  invalidOverlayContent: {
    alignSelf: 'center',
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
    position: 'absolute',
    top: 664,
    width: 32,
  },
  invalidCloseButton: {
    alignItems: 'center',
    borderRadius: 10000,
    height: 32,
    justifyContent: 'center',
    width: 32,
  },
  invalidTitleImage: {
    height: 33,
    left: 124,
    position: 'absolute',
    top: 219,
    width: 82,
  },
  invalidMessageImage: {
    height: 17,
    left: 30,
    position: 'absolute',
    top: 268,
    width: 271,
  },
});
