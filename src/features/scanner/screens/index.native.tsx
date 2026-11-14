import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useCallback, useEffect, useRef, useState } from 'react';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Stack, useFocusEffect, useIsFocused, useLocalSearchParams, useRouter } from 'expo-router';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Linking,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { Ionicons as Icon } from '@expo/vector-icons';
import NotificationBell from '@/src/features/notifications/components/NotificationBell';
import MoreFill from '@/src/assets/icons/more-fill.svg';
import ScanFrame from '@/src/assets/icons/scan-frame.svg';
import { useValidateCode } from '@/src/features/access-codes/hooks/codes';
import { fetchCachedUser } from '@/src/features/history/hooks/accessLogs';
import { refreshEstateEntitlements } from '@/src/features/billing';
import { getScanWarningSeverity } from '@/src/features/scanner/utils/securityScanWarning';
import { useVerificationGate } from '@/src/features/auth/hooks/useAccountVerification';
import AnimatedPillTabs from '@/src/shared/components/AnimatedPillTabs';
import { sharedStyles } from '@/src/shared/theme/styles';
import { Inter } from '@/src/shared/constants/fonts';
import EnterCodePanel from '@/src/features/scanner/components/EnterCodePanel';
import InvalidCodeOverlay from '@/src/features/scanner/components/InvalidCodeOverlay';
import SecurityTabBar from '@/src/features/scanner/components/SecurityTabBar';
import { useExitAppOnRootBack } from '@/src/shared/hooks/useExitAppOnRootBack';
import { InputRefsStorage } from '@/src/shared/types/general';

const EMPTY_CODE = ['', '', '', '', '', ''];
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

export default function SecurityVerificationMobile() {
  useExitAppOnRootBack();
  const queryClient = useQueryClient();
  const params = useLocalSearchParams();
  const isFocused = useIsFocused();
  const { width: windowWidth } = useWindowDimensions();
  const [mode, setMode] = useState<VerificationMode>(params.mode === 'scan' ? 'scan' : 'enter');
  const [code, setCode] = useState<string[]>(EMPTY_CODE);
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [invalidCode, setInvalidCode] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { requireVerified } = useVerificationGate();
  const validateCodeMutation = useValidateCode();
  const [permission, requestPermission] = useCameraPermissions();
  const inputs = useRef<InputRefsStorage>({});
  const scanNavigationInProgressRef = useRef(false);
  const router = useRouter();
  // PERF-08: unmount the camera when leaving the scan tab or this screen.
  const cameraActive = isFocused && mode === 'scan' && Boolean(permission?.granted);
  const headerTopGap = 24.14;
  const headerToToggleGap = 24;
  const contentTopGap = mode === 'scan' ? 66 : 96;
  // Match the stretch tabs that sat inside container padding (20 each side).
  const tabTrackWidth = Math.max(229, windowWidth - 40);
  const tabActiveWidth = Math.round(tabTrackWidth / 2);

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

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    try {
      refreshEstateEntitlements();
      await queryClient.invalidateQueries({ queryKey: queryKeys.anomaly.all });
    } finally {
      setIsRefreshing(false);
    }
  }, [queryClient]);

  useFocusEffect(
    useCallback(() => {
      resetScanState();
      refreshEstateEntitlements();
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

    if (!requireVerified()) {
      if (source === 'scan') scanNavigationInProgressRef.current = false;
      return;
    }

    setIsSubmitting(true);
    setErrorMessage('');
    Keyboard.dismiss();

    try {
      const result = await validateCodeMutation.mutateAsync(entered);
      if (result.is_valid === false || result.is_expired) {
        showInvalidOverlay(entered, 'This code does not exist or has expired.');
        return;
      }

      // PERF-08: navigate on validation alone; warm the resident cache for the result screen.
      if (result.user_id) {
        void fetchCachedUser(result.user_id).catch(() => null);
      }
      const warningSeverity = getScanWarningSeverity(result);

      router.push({
        pathname: '/security/result',
        params: {
          visitor_fullname: result.visitor_fullname,
          relationship_with_resident: result.relationship_with_resident,
          gender: result.gender,
          resident_household: result.household_name || 'Household',
          resident_user_id: result.user_id ?? '',
          code: result.hashed_code,
          receiver: result.receiver,
          ...(warningSeverity ? { warningSeverity } : {}),
        },
      });
      setCode(EMPTY_CODE);
    } catch (err: unknown) {
      if (source === 'scan') scanNavigationInProgressRef.current = false;
      showInvalidOverlay(
        entered,
        thrownMessage(err) ?? 'Invalid Access Code. This does not exist or has expired.'
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
        'Open your device settings and allow GatePass to use the camera.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Open Settings', onPress: () => void openAppSettings() },
        ]
      );
      return;
    }

    const result = await requestPermission();
    if (!result.granted && !result.canAskAgain) {
      Alert.alert(
        'Camera access is blocked',
        'Open your device settings and allow GatePass to use the camera.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Try Open Settings', onPress: () => void openAppSettings() },
        ]
      );
    }
  };

  const renderEnterCode = () => (
    <EnterCodePanel
      code={code}
      focusedIndex={focusedIndex}
      isSubmitting={isSubmitting}
      errorMessage={errorMessage}
      invalidCode={invalidCode}
      setInputRef={setInputRef}
      onChangeDigit={handleChange}
      onKeyPressDigit={handleKeyPress}
      onFocusDigit={setFocusedIndex}
      onBlurDigit={(idx) => setFocusedIndex((current) => (current === idx ? null : current))}
      onValidate={() => validateEnteredCode(code.join(''))}
    />
  );

  const renderScanner = () => (
    <View className="w-full items-center">
      <View className="h-[26px] w-[302px] items-center justify-center">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="h-[26px] w-[302px] text-center font-ubuntu-semibold text-heading-sm leading-[21.88px] text-primary"
        >
          Verify Access Code
        </Text>
      </View>
      <View className="mt-[11px] h-[17px] w-[304px] items-center justify-center">
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="h-[17px] w-[304px] text-center font-inter-light text-[14px] leading-[14px] text-orange"
        >
          Position the QR code within the frame to scan.
        </Text>
      </View>

      <View style={styles.scanFrame}>
        {cameraActive ? (
          <CameraView
            style={styles.camera}
            facing="back"
            barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
            onCameraReady={resetScanState}
            onBarcodeScanned={isSubmitting ? undefined : handleScan}
          />
        ) : permission?.granted ? (
          <View style={styles.permissionState}>
            <CircleLoader size={32} />
          </View>
        ) : (
          <View style={styles.permissionState}>
            <Icon name="camera-outline" size={34} color="#113E55" />
            <Text style={styles.permissionTitle}>Camera access needed</Text>
            <Text style={styles.permissionBody}>
              {permission && !permission.canAskAgain
                ? 'Camera access is blocked. Enable it in your device settings to scan access codes.'
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
          <CircleLoader size={32} />
          <Text className="font-inter-regular text-[13px] text-primary">Validating code...</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <SafeAreaView
      className="relative flex-1 bg-body"
      style={[sharedStyles.container, sharedStyles.modalContainer]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View
        className="relative h-[77px] w-full max-w-[390px] self-center"
        style={{ marginBottom: headerToToggleGap, marginTop: headerTopGap }}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          className="absolute left-[1px] top-[44px] h-[33px] w-[229px] font-ubuntu-medium text-heading leading-[27.34px] text-primary"
          style={styles.incomingGuestTitle}
        >
          Incoming Guest
        </Text>
        <View
          className="absolute right-0 top-0 flex-row items-start gap-[10px]"
          style={styles.headerIconGroup}
        >
          <NotificationBell className="mt-[3px]" />
          <Pressable
            accessibilityLabel="Open more options"
            hitSlop={8}
            onPress={() => router.push('/security/more')}
            className="h-[38px] w-[38px] items-center justify-center"
            style={({ pressed }) => [pressed && styles.pressed]}
          >
            <View className="relative h-[38px] w-[38px] rounded-full bg-[#F6FCFF]">
              <MoreFill width={18} height={4} style={styles.group862VectorIcon} />
            </View>
          </Pressable>
        </View>
      </View>

      <AnimatedPillTabs
        style={{ alignSelf: 'stretch' }}
        options={[
          { value: 'enter', label: 'Enter Code' },
          { value: 'scan', label: 'Scan Code' },
        ]}
        value={mode}
        onChange={setMode}
        width={tabTrackWidth}
        activeWidth={tabActiveWidth}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        style={styles.content}
      >
        <ScrollView
          contentContainerStyle={[styles.keyboardContent, { paddingTop: contentTopGap }]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={() => void handleRefresh()}
              tintColor="#113E55"
              colors={['#113E55']}
            />
          }
        >
          {mode === 'enter' ? renderEnterCode() : renderScanner()}
        </ScrollView>
      </KeyboardAvoidingView>

      <SecurityTabBar activeTab="home" />

      {invalidCode ? (
        <InvalidCodeOverlay
          onClose={() => {
            setInvalidCode('');
            setErrorMessage('');
            setCode(EMPTY_CODE);
            // A rejected scan (200 with is_valid false / expired) leaves the scan lock set so the
            // same QR is not re-read behind the overlay; closing it lets the guard scan again.
            resetScanState();
          }}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  incomingGuestTitle: {
    letterSpacing: 0,
  },
  headerIconGroup: {
    transform: [{ translateY: -22.14 }],
  },
  group862VectorIcon: {
    left: 10,
    position: 'absolute',
    top: 17,
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
    fontFamily: Inter.regular,
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
    fontFamily: Inter.semiBold,
    fontSize: 12,
  },
  scanFrame: {
    alignItems: 'center',
    borderRadius: 24,
    height: 225.15,
    justifyContent: 'center',
    marginTop: 44,
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
});
