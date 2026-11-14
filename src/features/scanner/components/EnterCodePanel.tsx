import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

type EnterCodePanelProps = {
  code: string[];
  focusedIndex: number | null;
  isSubmitting: boolean;
  errorMessage: string;
  invalidCode: string;
  setInputRef: (el: TextInput | null, index: number) => void;
  onChangeDigit: (text: string, index: number) => void;
  onKeyPressDigit: (e: { nativeEvent: { key: string } }, index: number) => void;
  onFocusDigit: (index: number) => void;
  onBlurDigit: (index: number) => void;
  onValidate: () => void;
};

export default function EnterCodePanel({
  code,
  focusedIndex,
  isSubmitting,
  errorMessage,
  invalidCode,
  setInputRef,
  onChangeDigit,
  onKeyPressDigit,
  onFocusDigit,
  onBlurDigit,
  onValidate,
}: EnterCodePanelProps) {
  return (
    <View className="w-full items-center">
      <View className="mb-[38px] items-center">
        <View className="h-[26px] w-[302px] items-center justify-center">
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="h-[26px] w-[302px] text-center font-ubuntu-semibold text-heading-sm leading-[21.88px] text-primary"
          >
            Verify Access Code
          </Text>
        </View>
        <View className="mt-[10px] h-[17px] w-[205px] items-center justify-center">
          <Text
            allowFontScaling={false}
            numberOfLines={1}
            className="h-[17px] w-[205px] text-center font-inter-light text-[14px] leading-[14px] text-orange"
          >
            Enter the code from guest here
          </Text>
        </View>
      </View>

      <View className="h-[64.5px] w-[304px] flex-row justify-center gap-[8px] py-[2px]">
        {code.map((digit, idx) => {
          const focused = focusedIndex === idx;
          const boxBorder = focused
            ? { borderColor: '#113E55', borderWidth: 1.5 }
            : { borderColor: '#9B9797', borderWidth: 0.5 };

          return Platform.OS === 'ios' ? (
            <View
              key={idx}
              className="relative h-[60.50px] w-[44px] items-center justify-center rounded-[8px] bg-[#EFF1F1]"
              style={boxBorder}
            >
              <Text
                allowFontScaling={false}
                pointerEvents="none"
                className="text-center font-ubuntu-semibold text-[20px] leading-[20px] text-primary"
              >
                {digit}
              </Text>
              <TextInput
                ref={(el) => setInputRef(el, idx)}
                style={styles.codeInputCapture}
                value={digit}
                onChangeText={(t) => onChangeDigit(t, idx)}
                onKeyPress={(e) => onKeyPressDigit(e, idx)}
                onFocus={() => onFocusDigit(idx)}
                onBlur={() => onBlurDigit(idx)}
                autoCapitalize="characters"
                maxLength={1}
                accessibilityLabel={`Digit ${idx + 1}`}
                returnKeyType="done"
                blurOnSubmit
                cursorColor="#113E55"
                selectionColor="#CEE5ED"
              />
            </View>
          ) : (
            <TextInput
              key={idx}
              ref={(el) => setInputRef(el, idx)}
              className="h-[60.50px] w-[44px] rounded-[8px] bg-[#EFF1F1] text-center font-ubuntu-semibold text-[20px] leading-[20px] text-primary"
              style={[styles.codeInputAndroid, boxBorder]}
              value={digit}
              onChangeText={(t) => onChangeDigit(t, idx)}
              onKeyPress={(e) => onKeyPressDigit(e, idx)}
              onFocus={() => onFocusDigit(idx)}
              onBlur={() => onBlurDigit(idx)}
              autoCapitalize="characters"
              maxLength={1}
              accessibilityLabel={`Digit ${idx + 1}`}
              returnKeyType="done"
              blurOnSubmit
              cursorColor="#113E55"
              selectionColor="#CEE5ED"
            />
          );
        })}
      </View>

      <View className="mt-[106.5px] h-[48px] w-full items-center">
        <Pressable
          className="h-[48px] min-w-[80px] max-w-[278px] w-[171px] flex-row items-center justify-center gap-[10px] rounded-[24px] bg-primary px-[24px] py-[16px]"
          style={({ pressed }) => [pressed && styles.pressed]}
          onPress={onValidate}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <CircleLoader size={22} tone="light" />
          ) : (
            <Text allowFontScaling={false} numberOfLines={1} style={styles.validateCodeButtonText}>
              Validate Code
            </Text>
          )}
        </Pressable>
      </View>

      {errorMessage && !invalidCode ? (
        <Text className="mt-[18px] text-center font-inter-regular text-[13px] text-danger">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
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
    ...StyleSheet.absoluteFill,
    color: 'transparent',
    padding: 0,
    textAlign: 'center',
  },
  codeInputAndroid: {
    paddingVertical: 0,
    textAlignVertical: 'center',
  },
  pressed: {
    opacity: 0.82,
  },
});
