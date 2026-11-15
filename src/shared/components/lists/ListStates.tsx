import { memo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import LoadError from '@/src/shared/components/feedback/LoadError';
import { ApiError } from '@/src/shared/services/api/errors';

/**
 * Shared list states, after BlueSky's `ListFooter` / `ListMaybePlaceholder` (src/components/Lists.tsx):
 * every list shows loading, error-with-retry, empty and "loading more" the same way instead of each
 * screen rebuilding them.
 */

/** User-facing text for a failed list request (offline and timeouts get their own wording). */
export function listErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError) {
    if (error.kind === 'network') return "You're offline. Check your connection and try again.";
    if (error.kind === 'timeout') return 'This is taking too long. Please try again.';
  }
  const message = error instanceof Error ? error.message.trim() : '';
  return message || fallback;
}

type ListPlaceholderProps = {
  isLoading: boolean;
  isError: boolean;
  error?: unknown;
  onRetry?: () => void;
  /** Shown when not loading and not failed (render it only when the list is empty). */
  empty?: ReactNode;
  errorFallback?: string;
};

/**
 * For `ListEmptyComponent`: loader on first load, error with retry, otherwise the empty state.
 * Order matches BlueSky: loading → error → empty.
 */
export const ListPlaceholder = memo(function ListPlaceholder({
  isLoading,
  isError,
  error,
  onRetry,
  empty = null,
  errorFallback = 'Could not load this list.',
}: ListPlaceholderProps) {
  if (isLoading) {
    return (
      <View className="items-center pt-10" accessibilityLabel="Loading">
        <CircleLoader size={36} />
      </View>
    );
  }
  if (isError) {
    return onRetry ? (
      <LoadError message={listErrorMessage(error, errorFallback)} onRetry={onRetry} />
    ) : (
      <Text className="py-10 text-center font-inter-regular text-sm text-danger">
        {listErrorMessage(error, errorFallback)}
      </Text>
    );
  }
  return <>{empty}</>;
});

type ListFooterProps = {
  isFetchingNextPage: boolean;
  hasNextPage?: boolean;
  /** Error from loading the next page (the first page's error belongs to ListPlaceholder). */
  error?: unknown;
  onRetry?: () => void;
  /** Show an end-of-list line once every page is loaded. */
  showEndMessage?: boolean;
  endMessage?: string;
};

/** For `ListFooterComponent`: next-page loader, next-page error with retry, or end of list. */
export const ListFooter = memo(function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  error,
  onRetry,
  showEndMessage = false,
  endMessage = "You've reached the end",
}: ListFooterProps) {
  if (isFetchingNextPage) {
    return (
      <View className="items-center py-4" accessibilityLabel="Loading more">
        <CircleLoader size={32} />
      </View>
    );
  }
  if (error) {
    return (
      <View className="items-center gap-2 py-4">
        <Text className="text-center font-inter-regular text-sm text-danger">
          {listErrorMessage(error, 'Could not load more.')}
        </Text>
        {onRetry ? (
          <Pressable onPress={onRetry} accessibilityRole="button" hitSlop={8}>
            <Text className="font-ubuntu-semibold text-sm text-primary">Try again</Text>
          </Pressable>
        ) : null}
      </View>
    );
  }
  if (!hasNextPage && showEndMessage) {
    return (
      <Text className="py-4 text-center font-inter-regular text-xs text-[#878686]">
        {endMessage}
      </Text>
    );
  }
  return null;
});
