import type { TextInputProps } from 'react-native';
import AppTextInput from '@/src/shared/components/form/AppTextInput';

type PasswordTextInputProps = Omit<TextInputProps, 'value' | 'onChangeText' | 'secureTextEntry'> & {
  value: string;
  onChangeText: (next: string) => void;
  /** When true, show the real characters; when false, hide them. */
  visible: boolean;
};

/** Password field. The real text is stored as typed; the OS hides it until the eye is on. */
export default function PasswordTextInput({
  value,
  onChangeText,
  visible,
  ...props
}: PasswordTextInputProps) {
  return (
    <AppTextInput
      {...props}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={!visible}
      autoCorrect={false}
      autoCapitalize="none"
      spellCheck={false}
      textContentType="password"
      autoComplete="password"
    />
  );
}
