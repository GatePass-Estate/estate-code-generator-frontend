import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

type AddHouseholdSheetProps = {
  visible: boolean;
  loading: boolean;
  error?: string;
  onCancel: () => void;
  onSave: (name: string) => void;
};

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

  return (
    visible && (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        className="absolute inset-0 z-20"
      >
        <Pressable className="flex-1 justify-center bg-black/50" onPress={onCancel}>
          <Pressable
            className="h-[322px] w-full justify-center rounded-[24px] bg-body px-5"
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="text-center text-[17.5px] leading-[21px] text-primary font-ubuntu-medium">
              Add New Household
            </Text>

            <TextInput
              value={name}
              onChangeText={setName}
              editable={!loading}
              placeholder="Enter your household name..."
              placeholderTextColor="#9B9797"
              returnKeyType="done"
              onSubmitEditing={() => trimmedName && !loading && onSave(trimmedName)}
              className="mt-5 h-12 rounded-2xl bg-light-grey px-4 text-[11.2px] text-primary font-inter-regular"
            />

            {!!error && (
              <Text className="mt-2 text-xs text-danger font-inter-regular">{error}</Text>
            )}

            <View className="mt-10 flex-row gap-3">
              <TouchableOpacity
                onPress={onCancel}
                disabled={loading}
                className="h-12 flex-1 items-center justify-center rounded-[24px] bg-accent"
              >
                <Text className="text-[11.2px] text-primary font-ubuntu-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSave(trimmedName)}
                disabled={!trimmedName || loading}
                className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-[24px] bg-primary ${!trimmedName || loading ? 'opacity-50' : ''}`}
              >
                {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text className="text-[11.2px] text-white font-ubuntu-medium">
                  {loading ? 'Saving...' : 'Save'}
                </Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    )
  );
}
