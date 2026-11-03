import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import InfoNote from '@/src/components/billing/InfoNote';
import { BILLING_VIEW_ONLY_NOTE } from '@/src/lib/billing';

/** Full-height centred spinner for a billing screen that is loading or redirecting. */
export function BillingLoading() {
  return (
    <View className="flex-1 items-center justify-center">
      <ActivityIndicator color="#113E55" />
    </View>
  );
}

/** Inline load error with a "Try again" button. */
export function BillingLoadError({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <View className="items-center py-10">
      <Text className="mb-4 text-center font-inter-regular text-sm text-danger">{message}</Text>
      <Pressable
        onPress={onRetry}
        accessibilityRole="button"
        hitSlop={8}
        className="rounded-[24px] bg-primary px-5 py-3 active:opacity-80"
      >
        <Text className="font-ubuntu-semibold text-sm text-white">Try again</Text>
      </Pressable>
    </View>
  );
}

/** "Only the primary admin can change the subscription." note for view-only admins. */
export function BillingViewOnlyNote({ className }: { className?: string }) {
  return <InfoNote className={className} text={BILLING_VIEW_ONLY_NOTE} />;
}
