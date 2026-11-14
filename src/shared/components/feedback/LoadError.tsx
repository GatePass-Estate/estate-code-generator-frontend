import { Pressable, Text, View } from 'react-native';

/** Centred load failure with a button that re-runs the failed request. */
export default function LoadError({
  message,
  onRetry,
  actionLabel = 'Try again',
}: {
  message: string;
  onRetry: () => void;
  actionLabel?: string;
}) {
  return (
    <View className="items-center py-10">
      <Text className="mb-4 text-center font-inter-regular text-sm text-danger">{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        hitSlop={8}
        className="rounded-[24px] bg-primary px-5 py-3 active:opacity-80"
      >
        <Text className="font-ubuntu-semibold text-sm text-white">{actionLabel}</Text>
      </Pressable>
    </View>
  );
}
