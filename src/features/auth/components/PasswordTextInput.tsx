import { TextInput, type TextInputProps } from 'react-native';
import {
  nextPasswordFromMaskedInput,
  passwordDisplayValue,
} from '@/src/features/auth/utils/passwordMask';

type PasswordTextInputProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'secureTextEntry'> & {
  value: string;
  onChangeText: (next: string) => void;
  /** When true, show the real characters; when false, show `*`. */
  visible: boolean;
};

/** Password field that masks with `*` instead of the OS secure-entry bullets. */
export default function PasswordTextInput({
  value,
  onChangeText,
  visible,
  ...props
}: PasswordTextInputProps) {
  return (
    <TextInput
      {...props}
      value={passwordDisplayValue(value, visible)}
      onChangeText={(text) => onChangeText(nextPasswordFromMaskedInput(value, text, visible))}
      secureTextEntry={false}
      autoCorrect={false}
      autoCapitalize="none"
      spellCheck={false}
      textContentType="password"
      autoComplete="password"
    />
  );
}
