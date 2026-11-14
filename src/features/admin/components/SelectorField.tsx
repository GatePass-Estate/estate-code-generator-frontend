import { Pressable, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ExpandMoreIcon } from '@/src/assets/svgs';
import { sharedStyles } from '@/src/shared/theme/styles';

/**
 * Dropdown-style field: small label above a tappable box.
 * `default` — Broadcast (#EFF1F1).
 * `registration` — Figma Selector 5241:2342 / register 5056:3723 (#EFF1F1, grey label).
 */
export default function SelectorField({
  label,
  placeholder,
  value,
  onPress,
  error,
  variant = 'default',
}: {
  label: string;
  placeholder: string;
  value?: string | null;
  onPress: () => void;
  error?: string;
  variant?: 'default' | 'registration';
}) {
  const hasValue = !!value;
  const registration = variant === 'registration';

  return (
    <View className={registration ? 'mb-4' : 'mb-5'}>
      {registration ? (
        <Text
          style={[
            sharedStyles.registrationLabel,
            error
              ? sharedStyles.registrationLabelError
              : hasValue
                ? sharedStyles.registrationLabelFilled
                : null,
          ]}
        >
          {label}
        </Text>
      ) : (
        <Text className="mb-1.5 font-inter-medium text-[9px] text-grey">{label}</Text>
      )}

      <Pressable
        onPress={onPress}
        className={
          registration
            ? 'flex-row items-center justify-between'
            : 'h-12 flex-row items-center justify-between rounded-[16px] bg-[#EFF1F1] px-5'
        }
        style={
          registration
            ? [
                sharedStyles.registrationInput,
                error ? sharedStyles.registrationInputError : null,
                { justifyContent: 'space-between' },
              ]
            : undefined
        }
      >
        <Text
          className={registration ? undefined : 'flex-1 pr-3 font-inter-light text-sm'}
          style={{
            color: error
              ? registration
                ? '#C40707'
                : '#ED0808'
              : hasValue
                ? '#113E55'
                : '#878686',
            flex: 1,
            flexShrink: 1,
            fontFamily: registration ? 'Inter_18pt-Light' : undefined,
            fontSize: registration ? 14 : undefined,
            paddingRight: 12,
          }}
          numberOfLines={1}
        >
          {hasValue ? value : placeholder}
        </Text>
        {registration ? (
          <ExpandMoreIcon width={24} height={24} color={error ? '#C40707' : '#9B9797'} />
        ) : (
          <MaterialIcons
            name="keyboard-arrow-down"
            size={24}
            color={error ? '#ED0808' : '#9B9797'}
          />
        )}
      </Pressable>

      {!!error && (
        <Text
          className={
            registration
              ? 'mt-1.5 font-inter-regular text-[11px]'
              : 'mt-1.5 font-inter-regular text-[11px] text-danger'
          }
          style={registration ? { color: '#E30404' } : undefined}
        >
          {error}
        </Text>
      )}
    </View>
  );
}
