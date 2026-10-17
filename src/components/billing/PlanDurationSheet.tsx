import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Svg, { Circle, Path } from 'react-native-svg';
import BillingSheet from '@/src/components/billing/BillingSheet';
import Button from '@/src/components/mobile/Button';
import { type BillingQuoteParams, useBillingQuote } from '@/src/hooks/useBillingQueries';
import { formatMoney, PLAN_DURATIONS, type PeriodMonths } from '@/src/lib/billing';

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

/** lets-icons `check-ring-duotone`: navy filled when selected, faint light-blue ring otherwise. */
function CheckBadge({ selected }: { selected: boolean }) {
  return (
    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={8} fill={selected ? '#113E55' : '#CEE5ED'} />
      {selected ? (
        <Path
          d="M9 12.2l2.1 2 3.9-4.2"
          stroke="#F6F7F7"
          strokeWidth={1.4}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ) : null}
    </Svg>
  );
}

/**
 * "Set Plan Duration" bottom sheet: total cost of the highlighted duration (live quote) and the
 * four 30/90/180/360-day options. Nothing is applied until Confirm.
 */
export default function PlanDurationSheet({
  visible,
  onClose,
  value,
  onConfirm,
  quoteParams,
}: PlanDurationSheetProps) {
  const [highlighted, setHighlighted] = useState<PeriodMonths>(value);

  // Re-sync with the screen's duration every time the sheet opens.
  useEffect(() => {
    if (visible) setHighlighted(value);
  }, [visible, value]);

  const params = visible ? quoteParams(highlighted) : null;
  const quoteQuery = useBillingQuote(params);
  const quote = params ? quoteQuery.data : undefined;
  // The previous duration's total stays visible (dimmed) while the new one loads.
  const stale = quoteQuery.isPlaceholderData;

  const confirm = () => {
    onConfirm(highlighted);
    onClose();
  };

  return (
    <BillingSheet visible={visible} onClose={onClose}>
      <View className="h-24 items-center justify-center gap-1 rounded-[16px] bg-white px-4">
        {quote ? (
          <Text
            className="font-ubuntu-medium text-[27px] leading-[32.8px] text-[#113E55]"
            style={{ opacity: stale ? 0.5 : 1 }}
            numberOfLines={1}
            adjustsFontSizeToFit
          >
            {formatMoney(quote.client_total, quote.currency_code)}
          </Text>
        ) : quoteQuery.isError ? (
          <Text
            className="text-center font-inter-regular text-[11.2px] leading-[13.6px] text-[#E30404]"
            numberOfLines={2}
          >
            {quoteQuery.error?.message || 'Could not load the price.'}
          </Text>
        ) : params ? (
          <View className="h-[33px] justify-center">
            <ActivityIndicator color="#113E55" />
          </View>
        ) : (
          <Text className="font-ubuntu-medium text-[27px] leading-[32.8px] text-[#113E55]">—</Text>
        )}
        <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#113E55]">
          TOTAL COST OF SUBSCRIPTION
        </Text>
      </View>

      <View className="mt-[22px] gap-2" accessibilityRole="radiogroup">
        {PLAN_DURATIONS.map((option) => {
          const selected = option.months === highlighted;
          return (
            <Pressable
              key={option.months}
              onPress={() => setHighlighted(option.months)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              accessibilityLabel={option.label}
              className="h-12 flex-row items-center justify-between rounded-[16px] bg-[#EFF1F1] px-4 active:opacity-70"
            >
              <Text className="font-inter-light text-[14px] leading-[16.9px] text-[#113E55]">
                {option.label}
              </Text>
              <CheckBadge selected={selected} />
            </Pressable>
          );
        })}
      </View>

      <View className="mt-8 items-center">
        <Button label="Confirm" onPress={confirm} />
      </View>
    </BillingSheet>
  );
}
