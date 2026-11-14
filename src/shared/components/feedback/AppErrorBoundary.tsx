import React, { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { logger } from '@/src/shared/utils/logger';

type Props = {
  children: ReactNode;
  /** Optional label for logs (e.g. "root", "protected"). */
  name?: string;
};

type State = {
  hasError: boolean;
};

/**
 * Last-resort UI when a render throws. Prevents a white screen with no recovery path.
 * Pair with `installGlobalErrorHandlers` for unhandled promise / JS exceptions.
 */
export default class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    logger.error(`UI crashed${this.props.name ? ` (${this.props.name})` : ''}`, error);
    if (__DEV__ && info.componentStack) {
      logger.warn(info.componentStack);
    }
  }

  private handleRetry = () => {
    this.setState({ hasError: false });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View className="flex-1 items-center justify-center bg-[#F6F7F7] px-8">
        <Text className="mb-2 text-center font-ubuntu-semibold text-lg text-[#113E55]">
          Something went wrong
        </Text>
        <Text className="mb-6 text-center font-inter-regular text-sm text-[#878686]">
          The screen hit an unexpected error. You can try again without leaving the app.
        </Text>
        <Pressable
          onPress={this.handleRetry}
          accessibilityRole="button"
          className="rounded-[24px] bg-primary px-6 py-3 active:opacity-80"
        >
          <Text className="font-ubuntu-semibold text-sm text-white">Try again</Text>
        </Pressable>
      </View>
    );
  }
}
