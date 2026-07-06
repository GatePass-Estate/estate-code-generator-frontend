import { useRef, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { View, Text, TextInput, Keyboard, Pressable, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BarcodeScanningResult, CameraView, useCameraPermissions } from 'expo-camera';
import { sharedStyles } from '@/src/theme/styles';
import { MaterialIcons } from '@expo/vector-icons';
import { HistoryIcon } from '@/src/assets/svgs';
import { validateCode } from '@/src/lib/api/codes';
import { InputRefsStorage } from '@/src/types/general';
import { getUserById } from '@/src/lib/api/user';
import InvalidCodeModal from '@/src/components/mobile/InvalidCodeModal';

type VerificationMode = 'enter' | 'scan';

export default function SecurityVerificationMobile() {
  const [code, setCode] = useState<string[]>(['', '', '', '', '', '']);
  const [mode, setMode] = useState<VerificationMode>('enter');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showInvalidCodeModal, setShowInvalidCodeModal] = useState(false);
  const [permission, requestPermission] = useCameraPermissions();

  const inputs = useRef<InputRefsStorage>({});
  const inputContainer = useRef(null);
  const lastScannedCode = useRef<string | null>(null);

  const router = useRouter();

  const switchMode = (nextMode: VerificationMode) => {
    Keyboard.dismiss();
    setMode(nextMode);
    setErrorMessage('');

    if (nextMode === 'enter') {
      requestAnimationFrame(() => inputs.current[0]?.focus());
    } else if (!permission?.granted) {
      requestPermission();
    }
  };

  const normalizeAccessCode = (value: string) => value.replace(/\s+/g, '').toUpperCase();

  const codeToInputSlots = (value: string) => {
    const chars = normalizeAccessCode(value).slice(0, 6).split('');
    return Array.from({ length: 6 }, (_, index) => chars[index] ?? '');
  };

  const extractCodeFromScannedData = (data: string) => {
    const trimmed = data.trim();

    try {
      const url = new URL(trimmed);
      const codeParam = url.searchParams.get('code') ?? url.searchParams.get('access_code');
      if (codeParam) return normalizeAccessCode(codeParam);
    } catch {
      // QR invites currently encode the raw access code, not a URL.
    }

    const normalized = normalizeAccessCode(trimmed);
    return normalized.match(/[A-Z0-9]{6}/)?.[0] ?? normalized;
  };

  const setInputRef = (el: TextInput | null, index: number) => {
    if (el) {
      inputs.current[index] = el;
    }
  };

  const handleChange = (text: string, index: number) => {
    // always convert to uppercase
    text = text.toUpperCase();
    setErrorMessage('');
    const newCode = [...code];

    // if the user pasted or typed multiple characters, spread them
    if (text.length > 1) {
      console.log(text);

      for (let i = 0; i < text.length && index + i < newCode.length; i++) {
        newCode[index + i] = text[i];
      }
      setCode(newCode);
      const lastFilled = Math.min(5, index + text.length - 1);
      inputs.current[lastFilled]?.focus();
      return;
    }

    const digit = text.slice(-1);

    // backspace on empty should clear previous
    if (!digit && newCode[index] === '' && index > 0) {
      newCode[index - 1] = '';
      setCode(newCode);
      inputs.current[index - 1]?.focus();
      return;
    }

    newCode[index] = digit;
    setCode(newCode);

    if (digit && index < 5) {
      inputs.current[index + 1]?.focus();
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

  const validateAccessCode = async (rawCode: string) => {
    const entered = normalizeAccessCode(rawCode);
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
    } catch (err: any) {
      setShowInvalidCodeModal(true);
    } finally {
      setCode(['', '', '', '', '', '']);
      setIsSubmitting(false);
      lastScannedCode.current = null;
    }
  };

  const handleValidation = async () => {
    await validateAccessCode(code.join(''));
  };

  const handleQRCodeScanned = async ({ data }: BarcodeScanningResult) => {
    const scannedCode = extractCodeFromScannedData(data);

    if (!scannedCode || isSubmitting || lastScannedCode.current === scannedCode) {
      return;
    }

    lastScannedCode.current = scannedCode;
    setCode(codeToInputSlots(scannedCode));
    await validateAccessCode(scannedCode);
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View className="flex-row items-center justify-between pt-5">
        <Text className="text-[21px] font-ubuntu-semibold text-[#113E55]">Incoming Guest</Text>
        <View className="flex-row items-center gap-2">
          <Pressable
            className="w-[38px] h-[38px] rounded-full bg-[#F6FCFF] items-center justify-center"
            onPress={() => router.push('/security/history')}
          >
            <HistoryIcon width={14} height={14} color="#113E55" />
          </Pressable>
          <Pressable
            className="h-[38px] w-[38px] items-center justify-center rounded-full bg-[#F6FCFF]"
            onPress={() => router.push('/security/more')}
          >
            <MaterialIcons name="more-horiz" size={22} color="#113E55" />
          </Pressable>
        </View>
      </View>

      <View
        style={{
          flex: 1,
          paddingTop: 53,
        }}
      >
        <View
          className={`self-center flex-row ${mode === 'scan' ? 'mb-10' : 'mb-32'}`}
          style={{
            borderRadius: 999,
            backgroundColor: '#EFF1F1',
            overflow: 'hidden',
          }}
        >
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              width: 119,
              paddingVertical: 13,
              borderRadius: 999,
              borderWidth: mode === 'enter' ? 1 : 0,
              borderColor: '#000',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: mode === 'enter' ? '#CEE5ED' : 'transparent',
            }}
            onPress={() => switchMode('enter')}
          >
            <Text
              className={`font-ubuntu-regular text-xs ${
                mode === 'enter' ? 'text-[#113E55]' : 'text-[#6C6C6C]'
              }`}
            >
              Enter Code
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            activeOpacity={0.8}
            style={{
              width: 119,
              paddingVertical: 13,
              borderRadius: 999,

              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: mode === 'scan' ? '#CEE5ED' : 'transparent',
            }}
            onPress={() => switchMode('scan')}
          >
            <Text
              className={`font-ubuntu-regular text-xs ${
                mode === 'scan' ? 'text-[#113E55]' : 'text-[#6C6C6C]'
              }`}
            >
              Scan Code
            </Text>
          </TouchableOpacity>
        </View>

        <View className={`gap-2 ${mode === 'scan' ? 'mb-[62px]' : 'mb-10'}`}>
          <Text className="text-[23px] font-UbuntuSans text-primary text-center">
            Verify Access Code
          </Text>
          <Text className="text-[#F46036] font-UbuntuSans text-center text-xs">
            {mode === 'scan'
              ? 'Position the QR code within the frame to scan.'
              : 'Enter the code from guest here'}
          </Text>
        </View>

        {mode === 'enter' ? (
          <>
            <View
              style={{ flexDirection: 'row', justifyContent: 'center', gap: 8 }}
              ref={inputContainer}
            >
              {code.map((digit, idx) => (
                <TextInput
                  key={idx}
                  style={{
                    backgroundColor: '#EFF1F1',
                    borderWidth: 0.5,
                    borderColor: '#9B9797',
                    borderRadius: 8,
                    width: 44,
                    height: 60,
                    textAlign: 'center',
                    fontSize: 24,
                    fontWeight: '600',
                    color: '#113E55',
                  }}
                  value={digit}
                  onChangeText={(t) => handleChange(t, idx)}
                  onKeyPress={(e) => handleKeyPress(e, idx)}
                  autoCapitalize="characters"
                  onLayout={(e) => {
                    setInputRef(e.target as unknown as TextInput, idx);
                  }}
                  accessibilityLabel={`Digit ${idx + 1}`}
                  returnKeyType={'done'}
                  blurOnSubmit={true}
                />
              ))}
            </View>

            {errorMessage && (
              <Text className="text-danger text-center mt-5 text-base">{errorMessage}</Text>
            )}

            <Pressable
              className={`bg-primary py-4 px-12 rounded-full self-center mt-[106px] min-w-[171px] items-center justify-center ${isSubmitting && 'opacity-70'}`}
              onPress={handleValidation}
              disabled={isSubmitting}
            >
              <Text className="text-white font-ubuntu-semibold text-sm">
                {isSubmitting ? 'Validating…' : 'Validate Code'}
              </Text>
            </Pressable>
          </>
        ) : (
          <View className="self-center w-[264px] h-[236px] overflow-hidden rounded-3xl ">
            {!permission ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-primary text-center font-inter-medium">
                  Checking camera permission...
                </Text>
              </View>
            ) : !permission.granted ? (
              <View className="flex-1 items-center justify-center px-6">
                <Text className="text-primary text-center font-inter-medium mb-4">
                  Camera access is needed to scan QR codes.
                </Text>
                <Pressable
                  className="bg-primary rounded-full px-6 py-3"
                  onPress={() => requestPermission()}
                >
                  <Text className="text-white font-inter-medium">Allow Camera</Text>
                </Pressable>
              </View>
            ) : (
              <CameraView
                style={{ flex: 1 }}
                facing="back"
                barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
                onBarcodeScanned={isSubmitting ? undefined : handleQRCodeScanned}
              />
            )}

            <View pointerEvents="none" className="absolute inset-0">
              <View className="absolute top-0 left-0 w-[61px] h-[70px] border-l-2 border-t-2 border-primary rounded-tl-3xl" />
              <View className="absolute top-0 right-0 w-[61px] h-[70px] border-r-2 border-t-2 border-primary rounded-tr-3xl" />
              <View className="absolute bottom-0 left-0 w-[61px] h-[70px] border-l-2 border-b-2 border-primary rounded-bl-3xl" />
              <View className="absolute bottom-0 right-0 w-[61px] h-[70px] border-r-2 border-b-2 border-primary rounded-br-3xl" />
            </View>
          </View>
        )}
      </View>

      <InvalidCodeModal
        visible={showInvalidCodeModal}
        onClose={() => {
          setShowInvalidCodeModal(false);
          if (mode === 'enter') {
            requestAnimationFrame(() => inputs.current[0]?.focus());
          }
        }}
      />
    </SafeAreaView>
  );
}
