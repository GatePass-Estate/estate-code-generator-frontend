import { useState } from 'react';
import {
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import {
  BillingLoadError,
  BillingLoading,
  BillingViewOnlyNote,
  CurrentPlanCard,
  InfoNote,
  SeatStepper,
} from '@/src/components/billing';
import PendingRequestsSheet from '@/src/components/billing/PendingRequestsSheet';
import SeatConfirmationSheet, {
  SeatCountTile,
} from '@/src/components/billing/SeatConfirmationSheet';
import {
  useBillingQuote,
  useScheduleSeatReduction,
  useSeatProrate,
  useSeatReductionEligibility,
} from '@/src/hooks/useBillingQueries';
import { useBillingScreenGuard } from '@/src/hooks/useBillingScreenGuard';
import { usePaystackCheckout, showCheckoutOutcomeAlert } from '@/src/lib/billingCheckout';
import { formatBillingDate, formatMoney, getCurrentPlanQuoteParams } from '@/src/lib/billing';
import { sharedStyles } from '@/src/theme/styles';
import type { CheckoutQuote } from '@/src/types/billing';

const MAX_SEATS = 100000;

/** Formatted `client_total`, or a placeholder while the quote loads / when it failed. */
function quoteTotal(query: {
  data?: CheckoutQuote;
  isError: boolean;
  isPlaceholderData: boolean;
}): string {
  if (query.data && !query.isPlaceholderData) {
    return formatMoney(query.data.client_total, query.data.currency_code);
  }
  return query.isError ? 'Unavailable' : '…';
}

/** RN Modal slide-out duration, so the next sheet doesn't present mid-dismiss. */
const SHEET_DISMISS_MS = 350;

export default function ManageSeatsScreen() {
  // Seat changes only apply to a running paid plan; anything else picks a plan first.
  const { canManage, subscriptionQuery, subscription, tier, redirecting } = useBillingScreenGuard({
    requirePaidPlan: true,
  });
  const eligibilityQuery = useSeatReductionEligibility();
  const scheduleSeatReduction = useScheduleSeatReduction();
  const { startCheckout, isRunning: checkoutRunning, checkoutSheet } = usePaystackCheckout();

  const eligibility = eligibilityQuery.data ?? null;
  const currentSeats = subscription?.covered_users ?? 1;

  const [seats, setSeats] = useState<number | null>(null);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [pendingVisible, setPendingVisible] = useState(false);

  const newSeats = seats ?? currentSeats;
  const delta = newSeats - currentSeats;
  const isReduction = delta < 0;
  const busy = scheduleSeatReduction.isPending || checkoutRunning;

  // Monthly totals and the prorated charge are only needed once the confirmation sheet is open.
  const currentMonthlyQuote = useBillingQuote(
    confirmVisible ? getCurrentPlanQuoteParams(subscription, tier, currentSeats, 1) : null
  );
  const newMonthlyQuote = useBillingQuote(
    confirmVisible ? getCurrentPlanQuoteParams(subscription, tier, newSeats, 1) : null
  );
  const prorateQuery = useSeatProrate(confirmVisible && delta > 0 ? delta : null);

  const minSeats = Math.max(1, eligibility?.min_allowed_seats ?? 1);
  const reductionBlocked = isReduction && eligibility?.can_reduce !== true;
  const reductionBlockedReason =
    !reductionBlocked || eligibilityQuery.isPending
      ? null
      : subscription && !subscription.auto_renew
        ? 'Auto-renewal is off — seat reductions are not available.'
        : eligibility
          ? 'All your seats are in use by active users, so they can’t be reduced right now.'
          : 'Seat reductions are not available for this subscription right now.';
  const canSubmit = canManage && delta !== 0 && !reductionBlocked && !busy;

  const pendingSeats = subscription?.pending_covered_users;
  const hasPendingReduction =
    pendingSeats !== null && pendingSeats !== undefined && pendingSeats !== currentSeats;

  const closeAfterSuccess = () => {
    setConfirmVisible(false);
    setSeats(null);
    router.back();
  };

  const openConfirmation = () => {
    // A typed seat count is committed on blur: let it land before confirming (as on Choose Plan).
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      return;
    }
    setConfirmVisible(true);
  };

  const handleConfirm = async () => {
    if (isReduction) {
      scheduleSeatReduction.mutate(newSeats, {
        onSuccess: (result) => {
          const date = formatBillingDate(result.effective_from ?? subscription?.period_end);
          const seatCount = result.pending_covered_users ?? newSeats;
          Alert.alert(
            'Seat reduction scheduled',
            `Seats will reduce to ${seatCount}${date ? ` on ${date}` : ' at your next renewal'}.`
          );
          closeAfterSuccess();
        },
        onError: (error) => Alert.alert('Could not update seats', error.message),
      });
      return;
    }
    // Close the confirmation sheet before the checkout sheet opens: iOS can't present a modal while
    // another is still sliding away.
    setConfirmVisible(false);
    await new Promise((resolve) => setTimeout(resolve, SHEET_DISMISS_MS));
    const outcome = await startCheckout({ checkout_kind: 'seat_add', seats_added: delta });
    showCheckoutOutcomeAlert(outcome, 'Your seats have been updated.');
    if (outcome === 'paid') closeAfterSuccess();
  };

  const retry = () => {
    subscriptionQuery.refetch();
    eligibilityQuery.refetch();
  };

  const renderContent = () => {
    if (redirecting || subscriptionQuery.isPending) return <BillingLoading />;

    if (subscriptionQuery.isError) {
      return (
        <BillingLoadError
          message={subscriptionQuery.error?.message || 'Could not load your subscription.'}
          onRetry={retry}
        />
      );
    }

    const renewal = formatBillingDate(subscription?.period_end);

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: BUTTON_MARGIN_BOTTOM }}
        >
          <Text className="mt-[26px] font-ubuntu-medium text-[27px] leading-[32.8px] text-[#113E55]">
            Manage Seats
          </Text>
          <Text className="mt-2 font-inter-light text-[14px] leading-[16.9px] text-[#878686]">
            Adjust the number of seats you pay for.
          </Text>

          {subscription && tier ? (
            <CurrentPlanCard className="mt-10" subscription={subscription} tier={tier} />
          ) : null}

          <View className="mt-6 flex-row gap-[17px]">
            <SeatCountTile
              label="Active Users"
              value={eligibility?.active_users ?? null}
              unit="Users"
            />
            <SeatCountTile label="Assigned Seats" value={currentSeats} unit="Seats" />
          </View>

          <View className="mt-6 gap-4 rounded-[16px] bg-white px-4 py-6">
            <Text className="text-center font-inter-regular text-[11.2px] leading-[13.6px] text-[#0A1F29]">
              Seats Available
            </Text>
            <SeatStepper
              value={newSeats}
              onChange={setSeats}
              min={minSeats}
              max={MAX_SEATS}
              disabled={!canManage || busy}
              accessibilityLabel="Seats"
            />
          </View>

          <InfoNote
            className="mt-[23px]"
            text="You can reduce your seats to a number greater than or equal to your current active users."
          />

          {reductionBlockedReason ? (
            <InfoNote className="mt-3" text={reductionBlockedReason} />
          ) : null}

          {hasPendingReduction ? (
            <InfoNote className="mt-3">
              <View className="flex-row items-center gap-2">
                <Text className="flex-1 font-inter-regular text-[11.2px] leading-[13.6px] text-[#113E55]">
                  {`A seat reduction to ${pendingSeats} seats is scheduled${
                    renewal ? ` for ${renewal}` : ' for your next renewal'
                  }.`}
                </Text>
                <Pressable
                  onPress={() => setPendingVisible(true)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="View pending requests"
                  className="active:opacity-60"
                >
                  <Text className="font-ubuntu-semibold text-[12px] text-[#113E55] underline">
                    View
                  </Text>
                </Pressable>
              </View>
            </InfoNote>
          ) : null}

          {!canManage ? <BillingViewOnlyNote className="mt-3" /> : null}

          <View className="mt-12 items-center">
            <Button label="Update Seat" onPress={openConfirmation} disabled={!canSubmit} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    );
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      {renderContent()}

      <SeatConfirmationSheet
        visible={confirmVisible}
        onClose={() => setConfirmVisible(false)}
        currentSeats={currentSeats}
        newSeats={newSeats}
        currentMonthly={quoteTotal(currentMonthlyQuote)}
        newMonthly={quoteTotal(newMonthlyQuote)}
        proratedCharge={
          delta > 0
            ? prorateQuery.data && !prorateQuery.isPlaceholderData
              ? formatMoney(prorateQuery.data.prorated_charge, prorateQuery.data.currency_code)
              : prorateQuery.isError
                ? 'Unavailable'
                : '…'
            : null
        }
        effectiveDate={subscription?.period_end ?? null}
        isReduction={isReduction}
        busy={busy}
        onConfirm={handleConfirm}
      />

      <PendingRequestsSheet visible={pendingVisible} onClose={() => setPendingVisible(false)} />
      {checkoutSheet}
    </SafeAreaView>
  );
}
