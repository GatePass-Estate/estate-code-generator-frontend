import { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';
import Button from '@/src/shared/components/Button';

type AddHouseholdSheetProps = {
  visible: boolean;
  loading: boolean;
  error?: string;
  onCancel: () => void;
  onSave: (name: string) => void;
};

/** Figma 5225:6778 — centered #F6F7F7 card, #EFF1F1 name field, Cancel + Save. */
export default function AddHouseholdSheet({
  visible,
  loading,
  error,
  onCancel,
  onSave,
}: AddHouseholdSheetProps) {
  const [name, setName] = useState('');

  useEffect(() => {
    if (!visible) setName('');
  }, [visible]);

  const trimmedName = name.trim();
  const canSave = !!trimmedName && !loading;

  if (!visible) return null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="absolute inset-0 z-20"
    >
      <Pressable
        className="flex-1 items-center justify-center bg-black/50 px-[20px]"
        onPress={loading ? undefined : onCancel}
      >
        <Pressable
          onPress={(event) => event.stopPropagation()}
          className="w-full max-w-[375px] rounded-[24px] bg-[#F6F7F7] px-[13px]"
          style={{ height: 325 }}
        >
          <Text
            className="text-center font-ubuntu-semibold text-primary"
            style={{
              fontSize: 21.88,
              lineHeight: 26,
              marginTop: 80,
            }}
          >
            Add New Household
          </Text>

          <TextInput
            value={name}
            onChangeText={setName}
            editable={!loading}
            placeholder="Enter your household name..."
            placeholderTextColor="#878686"
            returnKeyType="done"
            onSubmitEditing={() => canSave && onSave(trimmedName)}
            className="h-12 rounded-[16px] bg-[#EFF1F1] px-4 font-inter-light text-sm text-primary"
            style={{ marginTop: 29 }}
          />

          {!!error && (
            <Text className="mt-2 font-inter-regular text-[11px]" style={{ color: '#E30404' }}>
              {error}
            </Text>
          )}

          <View
            className="flex-row items-center justify-between"
            style={{ marginTop: error ? 36 : 60 }}
          >
            <Button
              label="Cancel"
              variant="secondary"
              size="md"
              disabled={loading}
              onPress={onCancel}
            />
            <Button
              label="Save"
              size="md"
              loading={loading}
              disabled={!trimmedName}
              onPress={() => onSave(trimmedName)}
            />
          </View>
        </Pressable>
      </Pressable>
    </KeyboardAvoidingView>
  );
}
