import { Text, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import BillingSheet from '@/src/components/billing/BillingSheet';
import InfoNote from '@/src/components/billing/InfoNote';
import Button from '@/src/components/mobile/Button';
import { formatBillingDate } from '@/src/lib/billing';

export type SeatConfirmationSheetProps = {
  visible: boolean;
  onClose: () => void;
  /** Seats the estate pays for today (`subscription.covered_users`). */
  currentSeats: number;
  /** Seats the user picked on Manage Seats. */
  newSeats: number;
  /** Formatted monthly total at `currentSeats`, e.g. '₦49,900'. Missing → '—'. */
  currentMonthly?: string | null;
  /** Formatted monthly total at `newSeats`. Missing → '—'. */
  newMonthly?: string | null;
  /** Increases only: formatted prorated amount due today. The row is hidden when null/undefined. */
  proratedCharge?: string | null;
  /** ISO date the reduction takes effect (the current `period_end`). Reductions only. */
  effectiveDate?: string | null;
  /** true → scheduled for next cycle (shows the effective-date note); false → paid now. */
  isReduction: boolean;
  /** Request/checkout in flight: spinner on Confirm, Cancel + scrim dismissal blocked. */
  busy: boolean;
  onConfirm: () => void;
};

/** "( February 25, 2026 )"-style date for the next-billing-cycle note. */
function formatEffectiveDate(iso: string | null | undefined): string {
  const short = formatBillingDate(iso, 'short');
  if (!short || !iso) return '';
  return `${short}, ${new Date(iso).getFullYear()}`;
}

/**
 * White r16 count tile ("Active Users  200 Users"): grey caption, bold number + lighter unit.
 * Shared by this sheet and the Manage Seats screen. `null` value renders '—'.
 */
export function SeatCountTile({
  label,
  value,
  unit,
}: {
  label: string;
  value: number | null;
  unit: string;
}) {
  return (
    <View
      className="flex-1 rounded-[16px] bg-white px-4 pb-[14px] pt-2"
      accessible
      accessibilityLabel={`${label}, ${value ?? 'unknown'} ${unit}`}
    >
      <Text
        className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#878686]"
        numberOfLines={1}
      >
        {label}
      </Text>
      <Text className="mt-1 text-[#878686]" numberOfLines={1}>
        <Text className="font-ubuntu-semibold text-[22px] leading-[26.3px]">{value ?? '—'}</Text>
        <Text className="font-ubuntu-regular text-[15px] leading-[26.3px]"> {unit}</Text>
      </Text>
    </View>
  );
}

function SummaryRow({ label, value }: { label: string; value?: string | null }) {
  return (
    <View className="flex-row items-center justify-between gap-3">
      <Text className="flex-shrink font-inter-light text-[14px] leading-[16.9px] text-[#878686]">
        {label}
      </Text>
      <Text className="text-right font-inter-medium text-[14px] leading-[16.9px] text-[#878686]">
        {value || '—'}
      </Text>
    </View>
  );
}

/**
 * "Confirm Seats" bottom sheet from Manage Seats: current → new seat capacity, a
 * monthly cost summary, and a timing note. Reductions are scheduled for the next
 * billing cycle (designer annotation: the effective-date note shows only then);
 * increases are paid now (prorated), so they show the "Due today" row instead.
 * Presentational: the screen computes the figures and runs the confirm action.
 */
export default function SeatConfirmationSheet({
  visible,
  onClose,
  currentSeats,
  newSeats,
  currentMonthly,
  newMonthly,
  proratedCharge,
  effectiveDate,
  isReduction,
  busy,
  onConfirm,
}: SeatConfirmationSheetProps) {
  const effective = formatEffectiveDate(effectiveDate);

  return (
    <BillingSheet visible={visible} onClose={onClose} busy={busy}>
      <View className="flex-row items-center">
        <SeatCountTile label="Current Seat Capacity" value={currentSeats} unit="Users" />
        <View className="w-5 items-center">
          <Ionicons name="arrow-forward" size={16} color="#1B998B" />
        </View>
        <SeatCountTile label="New Seats Capacity" value={newSeats} unit="Seats" />
      </View>

      <View className="mt-6 gap-[14px] rounded-[16px] bg-white px-4 py-[30px]">
        <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#0A1F29]">
          Summary
        </Text>
        <View className="gap-[17px]">
          <SummaryRow label="Current monthly cost" value={currentMonthly} />
          <SummaryRow label="New monthly cost" value={newMonthly} />
          {!isReduction && proratedCharge != null ? (
            <SummaryRow label="Due today (prorated)" value={proratedCharge} />
          ) : null}
        </View>
      </View>

      <InfoNote
        className="mt-6"
        text={
          isReduction
            ? `This change will take effect on your next billing cycle${effective ? ` ( ${effective} )` : ''}`
            : "You'll pay the prorated amount now; seats are added once payment is confirmed."
        }
      />

      <View className="mt-8 items-center gap-2">
        <Button
          label="Confirm Seats"
          onPress={onConfirm}
          loading={busy}
          accessibilityState={{ busy }}
        />
        <Button label="Cancel" variant="secondary" onPress={onClose} disabled={busy} />
      </View>
    </BillingSheet>
  );
}
