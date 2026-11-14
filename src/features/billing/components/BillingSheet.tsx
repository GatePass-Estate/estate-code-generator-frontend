import type { ReactNode } from 'react';
import { ScrollView, useWindowDimensions, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import { cn } from '@/src/shared/utils/cn';

export type BillingSheetProps = {
  visible: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Blocks scrim / back-button dismissal while a request is in flight. */
  busy?: boolean;
  /** Wrap the content in a ScrollView capped at ~80% of the screen (long lists). */
  scrollable?: boolean;
  /** Extra classes for the content container (defaults: 20pt sides, 24pt below the handle). */
  contentClassName?: string;
};

/**
 * Bottom-sheet shell for the billing sheets (seat confirmation, pending
 * requests, AI tools, plan duration): slide-up Modal, 40% black scrim,
 * #F6F7F7 panel with 40pt top corners and the 134x7 grab handle 13pt from
 * the top. Same structure as ConfirmSheet / OptionSheet.
 *
 * Figma sheet frames are fixed-height mock-ups with large empty bands above the content and the
 * buttons; sheets here hug their content instead: 24pt from the handle to the first element and
 * 32pt above the action buttons.
 */
export default function BillingSheet({
  visible,
  onClose,
  children,
  busy = false,
  scrollable = false,
  contentClassName,
}: BillingSheetProps) {
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();

  const close = () => {
    if (!busy) onClose();
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      busy={busy}
      scrimClassName="flex-1 justify-end bg-black/40"
      scrimProps={{ accessible: false }}
      panelClassName="rounded-t-[40px] bg-[#F6F7F7]"
      panelStyle={{ paddingBottom: insets.bottom + 24 }}
      panelProps={{
        accessible: false,
        accessibilityViewIsModal: true,
        onAccessibilityEscape: close,
      }}
    >
      <View className="h-[7px] w-[134px] self-center rounded-[4px] bg-grey" />

      {scrollable ? (
        <ScrollView
          style={{ maxHeight: height * 0.8 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <View className={cn('px-5 pt-6', contentClassName)}>{children}</View>
        </ScrollView>
      ) : (
        <View className={cn('px-5 pt-6', contentClassName)}>{children}</View>
      )}
    </BottomSheet>
  );
}
