import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

/**
 * Dropdown-style field from the design: a small floating label above a tappable
 * `#EFF1F1` box. Shows `value` once something is chosen, `placeholder` until
 * then, with the placeholder styling matching the Figma's muted grey.
 */
export default function SelectorField({
  label,
  placeholder,
  value,
  onPress,
  error,
}: {
  label: string;
  placeholder: string;
  value?: string | null;
  onPress: () => void;
  error?: string;
}) {
  const hasValue = !!value;

  return (
    <View className="mb-5">
      <Text className="text-[#9B9797] font-inter-medium text-[9px] mb-1.5">{label}</Text>

      <Pressable
        onPress={onPress}
        className="flex-row items-center justify-between bg-[#EFF1F1] rounded-[16px] h-12 px-5"
      >
        <Text
          className="flex-1 font-inter-light text-sm pr-3"
          style={{ color: hasValue ? '#113E55' : '#9B9797' }}
          numberOfLines={1}
        >
          {hasValue ? value : placeholder}
        </Text>
        <MaterialIcons name="keyboard-arrow-down" size={24} color="#9B9797" />
      </Pressable>

      {!!error && (
        <Text className="text-danger font-inter-regular text-[11px] mt-1.5">{error}</Text>
      )}
    </View>
  );
}
