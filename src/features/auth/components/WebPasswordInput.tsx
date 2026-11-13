import { useCallback } from 'react';
import { Image, Pressable } from 'react-native';
import icons from '@/src/shared/constants/icons';
import {
  nextPasswordFromMaskedInput,
  passwordDisplayValue,
} from '@/src/features/auth/utils/passwordMask';

interface WebPasswordInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  show: boolean;
  onToggle: () => void;
  disabled?: boolean;
  inputRef?: React.Ref<HTMLInputElement | null>;
}

const WebPasswordInput = ({
  label,
  placeholder,
  value,
  onChange,
  show,
  onToggle,
  disabled,
  inputRef,
}: WebPasswordInputProps) => {
  const handleCopy = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  const handlePaste = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  const handleCut = useCallback((e: React.ClipboardEvent) => {
    e.preventDefault();
  }, []);

  const handleContextMenu = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
  }, []);

  return (
    <div className="flex w-full min-w-0 flex-col gap-2">
      <label className="input-label-web text-left text-sm sm:text-base">{label}</label>
      <div className="relative w-full min-w-0">
        <input
          type="text"
          placeholder={placeholder}
          className="input-style-web box-border w-full min-w-0 pr-12 text-base"
          value={passwordDisplayValue(value, show)}
          onChange={(e) => onChange(nextPasswordFromMaskedInput(value, e.target.value, show))}
          disabled={disabled}
          ref={inputRef as React.Ref<HTMLInputElement | null>}
          autoComplete="current-password"
          autoCapitalize="off"
          autoCorrect="off"
          spellCheck={false}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onCut={handleCut}
          onContextMenu={handleContextMenu}
        />
        <Pressable
          onPress={onToggle}
          className="absolute right-5 top-1/2 -translate-y-1/2"
          disabled={disabled}
        >
          <Image
            source={show ? icons.eye : icons.hiddenEye}
            style={{ width: 20, height: 20 }}
            resizeMode="contain"
          />
        </Pressable>
      </div>
    </div>
  );
};

export default WebPasswordInput;
