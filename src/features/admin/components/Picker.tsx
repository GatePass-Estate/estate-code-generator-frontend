import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import OptionSheet, { type OptionSheetItem } from '@/src/features/admin/components/OptionSheet';

export interface PickerItem {
  label: string;
  value: string;
}

interface PickerProps {
  label: string;
  selectedValue: string | null;
  onValueChange: (value: string) => void;
  items: PickerItem[];
  placeholder?: string;
  enabled?: boolean;
  variant?: 'default' | 'registration';
  invalid?: boolean;
  labelClassName?: string;
  fieldClassName?: string;
  textClassName?: string;
  chevronColor?: string;
  placeholderColor?: string;
  chevron?: React.ReactNode;
}

/**
 * Dropdown field that opens the shared OptionSheet (new bottom-sheet chrome).
 */
export function Picker({
  label,
  selectedValue,
  onValueChange,
  items,
  placeholder = 'Select an option',
  enabled = true,
  variant = 'default',
  invalid = false,
  labelClassName = 'input-label',
  fieldClassName = 'input-style',
  textClassName = 'text-sm font-inter-light',
  chevronColor = '#9CA3AF',
  placeholderColor = '#9CA3AF',
  chevron,
}: PickerProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);

  const selectedItem = items.find((item) => item.value === selectedValue);
  const displayLabel = selectedItem?.label || placeholder;
  const hasValue = !!selectedValue;

  const sheetItems: OptionSheetItem[] = items.map((item) => ({
    label: item.label,
    value: item.value,
  }));

  return (
    <View>
      {label ? <Text className={labelClassName}>{label}</Text> : null}
      <Pressable
        className={
          variant === 'registration'
            ? undefined
            : `${fieldClassName} flex-row items-center justify-between`
        }
        onPress={() => enabled && setIsModalVisible(true)}
        disabled={!enabled}
        style={{
          opacity: enabled ? 1 : 0.5,
          ...(variant === 'registration' && {
            alignItems: 'center',
            backgroundColor: invalid ? '#FFE6E6' : '#EFF1F1',
            borderColor: invalid ? '#FF0D0D' : 'transparent',
            borderRadius: 16,
            borderWidth: 0.5,
            flexDirection: 'row',
            height: 48,
            justifyContent: 'space-between',
            marginTop: 8,
            paddingHorizontal: 16,
          }),
        }}
      >
        <Text
          className={textClassName}
          style={{
            color: invalid
              ? variant === 'registration'
                ? '#C40707'
                : '#ED0808'
              : hasValue
                ? '#113E55'
                : variant === 'registration'
                  ? '#878686'
                  : placeholderColor,
            flex: 1,
            flexShrink: 1,
            fontFamily: variant === 'registration' ? 'Inter_18pt-Light' : undefined,
            fontSize: variant === 'registration' ? 14 : undefined,
          }}
        >
          {displayLabel}
        </Text>
        {chevron ?? (
          <Ionicons
            name="chevron-down"
            size={20}
            color={
              invalid
                ? variant === 'registration'
                  ? '#C40707'
                  : '#ED0808'
                : variant === 'registration'
                  ? '#878686'
                  : chevronColor
            }
          />
        )}
      </Pressable>

      <OptionSheet
        visible={isModalVisible}
        title={placeholder}
        items={sheetItems}
        selected={selectedValue ? [selectedValue] : []}
        onChange={(next) => {
          const value = next[0];
          if (value) onValueChange(value);
        }}
        onClose={() => setIsModalVisible(false)}
      />
    </View>
  );
}
