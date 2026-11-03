import { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Inter, UbuntuSans } from '@/src/constants/fonts';
import {
  type BillingQuoteParams,
  useBillingQuote,
  usePrefetchBillingQuote,
} from '@/src/hooks/useBillingQueries';
import {
  formatMoney,
  getAmountFontSize,
  PLAN_DURATIONS,
  type PeriodMonths,
} from '@/src/lib/billing';

export type PlanDurationSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Duration currently applied on the screen; the sheet opens with it highlighted. */
  value: PeriodMonths;
  /** Called with the highlighted duration when the user taps Confirm (the sheet then closes). */
  onConfirm: (months: PeriodMonths) => void;
  /** Quote body for a given duration; `null` when there is nothing to price yet. */
  quoteParams: (months: PeriodMonths) => BillingQuoteParams | null;
};

/**
 * "Set Plan Duration" bottom sheet: total cost of the highlighted duration (live quote) and the
 * four 30/90/180/360-day options. Nothing is applied until Confirm.
 *
 * Visual design mirrors the team's AI activation duration modal
 * (`src/components/anomaly/modals/ActivationQuoteModal.tsx` on phase-2): blurred backdrop,
 * #F8F9FA sheet, white total card, #EEF2F6 option rows with a light-blue check circle.
 */
export default function PlanDurationSheet({
  visible,
  onClose,
  value,
  onConfirm,
  quoteParams,
}: PlanDurationSheetProps) {
  const insets = useSafeAreaInsets();
  const prefetchQuote = usePrefetchBillingQuote();
  const [highlighted, setHighlighted] = useState<PeriodMonths>(value);

  // Re-sync with the screen's duration every time the sheet opens.
  useEffect(() => {
    if (visible) setHighlighted(value);
  }, [visible, value]);

  // Warm the cache for all four durations on open so switching options is instant. Same key and
  // fetcher as `useBillingQuote`, so the hook below picks these up.
  useEffect(() => {
    if (!visible) return;
    for (const { months } of PLAN_DURATIONS) prefetchQuote(quoteParams(months));
  }, [visible, quoteParams, prefetchQuote]);

  const params = visible ? quoteParams(highlighted) : null;
  const quoteQuery = useBillingQuote(params);
  // Placeholder data is the previous duration's total; show the loader instead, like the reference.
  const quote = params && !quoteQuery.isPlaceholderData ? quoteQuery.data : undefined;
  const isLoading = Boolean(params) && !quote && !quoteQuery.isError;
  const hasError = Boolean(params) && !quote && quoteQuery.isError;
  const totalLabel = quote ? formatMoney(quote.client_total, quote.currency_code) : '--';

  const confirm = () => {
    onConfirm(highlighted);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdropContainer}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close"
        />

        <View
          style={[styles.sheetContainer, { paddingBottom: Math.max(40, insets.bottom + 12) }]}
          accessibilityViewIsModal
          onAccessibilityEscape={onClose}
        >
          <View style={styles.dragHandleWrapper}>
            <View style={styles.dragHandle} />
          </View>

          <View style={styles.totalCard}>
            {isLoading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#113E55" />
              </View>
            ) : hasError ? (
              <View style={styles.errorContainer}>
                <Text allowFontScaling={false} style={styles.errorText} numberOfLines={3}>
                  {quoteQuery.error?.message || 'Unable to fetch total price'}
                </Text>
                <Pressable
                  onPress={() => quoteQuery.refetch()}
                  hitSlop={10}
                  accessibilityRole="button"
                  style={styles.retryButton}
                >
                  <Text allowFontScaling={false} style={styles.retryText}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text
                allowFontScaling={false}
                // ~13 characters fit the total card at 38pt.
                style={[styles.totalAmount, { fontSize: getAmountFontSize(totalLabel, 38, 13) }]}
                numberOfLines={1}
              >
                {totalLabel}
              </Text>
            )}
            <Text allowFontScaling={false} style={styles.totalSubtitle}>
              TOTAL COST OF SUBSCRIPTION
            </Text>
          </View>

          <View style={styles.optionsList} accessibilityRole="radiogroup">
            {PLAN_DURATIONS.map((option) => {
              const isSelected = option.months === highlighted;
              return (
                <Pressable
                  key={option.months}
                  onPress={() => setHighlighted(option.months)}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  accessibilityLabel={option.label}
                  style={styles.optionRow}
                >
                  <Text
                    allowFontScaling={false}
                    style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                  >
                    {option.label}
                  </Text>
                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected ? (
                      <Ionicons name="checkmark-sharp" size={14} color="#113E55" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable
            onPress={confirm}
            accessibilityRole="button"
            accessibilityLabel="Confirm"
            style={({ pressed }) => [styles.confirmButton, pressed && styles.confirmButtonPressed]}
          >
            <Text allowFontScaling={false} style={styles.confirmButtonText}>
              Confirm
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

// Values copied from ActivationQuoteModal (phase-2) so both duration sheets look identical.
const styles = StyleSheet.create({
  backdropContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#F8F9FA',
    borderTopLeftRadius: 36,
    borderTopRightRadius: 36,
    paddingHorizontal: 20,
    paddingTop: 12,
    width: '100%',
  },
  dragHandleWrapper: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  dragHandle: {
    width: 60,
    height: 5,
    backgroundColor: '#8E9BAE',
    borderRadius: 3,
  },
  totalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
    marginTop: 6,
  },
  loaderContainer: {
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  errorText: {
    fontSize: 14,
    color: '#EF4444',
    fontFamily: Inter.regular,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 6,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#EFF2F5',
    borderRadius: 8,
  },
  retryText: {
    fontSize: 12,
    color: '#113E55',
    fontFamily: Inter.medium,
  },
  totalAmount: {
    fontFamily: UbuntuSans.bold,
    fontSize: 38,
    lineHeight: 46,
    color: '#113E55',
    fontWeight: '700',
  },
  totalSubtitle: {
    fontFamily: UbuntuSans.medium,
    fontSize: 12,
    color: '#113E55',
    letterSpacing: 0.9,
    marginTop: 6,
    fontWeight: '600',
  },
  optionsList: {
    gap: 12,
    marginBottom: 8,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#EEF2F6',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 18,
  },
  optionLabel: {
    fontFamily: Inter.regular,
    fontSize: 15,
    color: '#113E55',
  },
  optionLabelSelected: {
    fontFamily: Inter.medium,
  },
  checkCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 1.5,
    borderColor: '#CFD8DC',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
  },
  checkCircleSelected: {
    backgroundColor: '#BCE3F5',
    borderColor: '#BCE3F5',
  },
  confirmButton: {
    backgroundColor: '#113E55',
    height: 52,
    borderRadius: 26,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
  },
  confirmButtonPressed: {
    opacity: 0.85,
  },
  confirmButtonText: {
    fontFamily: Inter.medium,
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
