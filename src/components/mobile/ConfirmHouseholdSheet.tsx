import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { Household } from '@/src/types/household';

type Props = {
  visible: boolean;
  household: Household | null;
  loading?: boolean;
  title?: string;
  actionLabel?: string;
  onCancel: () => void;
  onConfirm: () => void;
};

export default function ConfirmHouseholdSheet({
  visible,
  household,
  loading = false,
  title = 'Confirm Household Selection',
  actionLabel = 'Confirm',
  onCancel,
  onConfirm,
}: Props) {
  const insets = useSafeAreaInsets();

  if (!visible) return null;

  return (
    <Pressable
      className="justify-end bg-black/50"
      style={[StyleSheet.absoluteFill, styles.overlay]}
      onPress={onCancel}
    >
      <Pressable
        className="rounded-t-[40px] bg-body px-5 pt-5"
        style={{ paddingBottom: Math.max(insets.bottom, 24) }}
        onPress={(event) => event.stopPropagation()}
      >
        <View className="mb-6 h-1 w-24 self-center rounded-full bg-grey/60" />
        <View className="self-center rounded-full bg-accent p-4">
          <Feather name="home" size={26} color="#113E55" />
        </View>
        <Text className="mt-4 text-center text-xl text-primary font-ubuntu-semibold">{title}</Text>
        <Text className="mt-2 text-center text-sm text-grey font-inter-regular">
          {household ? `Continue with ${household.name}?` : 'Select a household before continuing.'}
        </Text>
        <View className="mt-7 flex-row gap-3">
          <TouchableOpacity
            className="h-12 flex-1 items-center justify-center rounded-xl bg-accent"
            disabled={loading}
            onPress={onCancel}
          >
            <Text className="text-sm text-primary font-ubuntu-medium">Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`h-12 flex-1 flex-row items-center justify-center gap-2 rounded-xl bg-primary ${
              !household || loading ? 'opacity-50' : ''
            }`}
            disabled={!household || loading}
            onPress={onConfirm}
          >
            {loading && <ActivityIndicator size="small" color="#FFFFFF" />}
            <Text className="text-sm text-white font-ubuntu-medium">
              {loading ? 'Please wait...' : actionLabel}
            </Text>
          </TouchableOpacity>
        </View>
      </Pressable>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    zIndex: 100,
  },
});
