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
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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
  const insets = useSafeAreaInsets();

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
        <Pressable className="flex-1 justify-center bg-black/50 px-5" onPress={onCancel}>
          <Pressable
            className="rounded-3xl bg-body px-4 pt-8"
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            onPress={(event) => event.stopPropagation()}
          >
            <Text className="text-center text-xl text-primary font-ubuntu-semibold">
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
              className="mt-5 h-14 rounded-xl bg-light-grey px-4 text-primary font-inter-regular"
            />

            {!!error && (
              <Text className="mt-2 text-xs text-danger font-inter-regular">{error}</Text>
            )}

            <View className="mt-8 flex-row gap-3">
              <TouchableOpacity
                onPress={onCancel}
                disabled={loading}
                className="h-12 flex-1 items-center justify-center rounded-xl bg-accent"
              >
                <Text className="text-sm text-primary font-ubuntu-medium">Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => onSave(trimmedName)}
                disabled={!trimmedName || loading}
                className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary ${!trimmedName || loading ? 'opacity-50' : ''}`}
              >
                {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
                <Text className="text-sm text-white font-ubuntu-medium">
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
