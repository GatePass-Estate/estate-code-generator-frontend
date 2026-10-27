import { useCallback, useState } from 'react';
import { Alert, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { router, Stack } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import {
  BillingLoadError,
  BillingLoading,
  BillingSectionCard,
  BillingViewOnlyNote,
  CheckCircleOutlineIcon,
  CurrentPlanCard,
  ExpiredClockIcon,
  ProgressBar,
  SegmentedProgress,
} from '@/src/components/billing';
import type { BillingSectionAction } from '@/src/components/billing/BillingSectionCard';
import AiToolsSheet from '@/src/components/billing/AiToolsSheet';
import PendingRequestsSheet, {
  usePendingRequests,
} from '@/src/components/billing/PendingRequestsSheet';
import {
  refreshBillingData,
  useBillingCycle,
  useBillingQuote,
  useCancelSubscription,
  useRenewalEligibility,
  useEstateAiTools,
} from '@/src/hooks/useBillingQueries';
import { useBillingScreenGuard } from '@/src/hooks/useBillingScreenGuard';
import { useEstateUsers } from '@/src/hooks/useEstateUsers';
import { useEstateEntitlements } from '@/src/lib/api/entitlements';
import {
  formatBillingDate,
  formatMoney,
  getCurrentPlanQuoteParams,
  getCurrentPlanState,
  getCycleProgress,
  getSeatOccupancy,
  inferPeriodMonths,
  getRenewalBlockMessage,
  canCancelSubscription,
} from '@/src/lib/billing';
import { sharedStyles } from '@/src/theme/styles';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

// A new purchase replaces a cancelled plan from the day it is paid (no carry-over of the days left).
const REPLACES_PLAN_WARNING =
  "A new plan replaces this one as soon as you pay, and any unused days on this plan won't carry over.";

/**
 * "Your Current Plan" (the More screen's plan banner). Always shown to billing viewers, in one of
 * three states: a running paid plan, the free Access plan (or no plan), or a paid plan that has
 * expired. Everyone who can't view billing is sent back to the More screen.
 */
export default function BillingScreen() {
  const { canView, canManage, subscriptionQuery, subscription, tier, redirecting } =
    useBillingScreenGuard();
  const planState = subscriptionQuery.data ? getCurrentPlanState(subscription, tier) : null;
  const isPaid = planState === 'paid';
  const isExpired = planState === 'expired';

  // The cycle's total, as a fallback for the billing-cycle amount when the API has no
  // `next_billing_amount`. A running or ended paid plan has one; the free plan doesn't.
  const cycleQuote = useBillingQuote(
    isPaid || isExpired
      ? getCurrentPlanQuoteParams(
          subscription,
          tier,
          subscription?.covered_users ?? 0,
          inferPeriodMonths(subscription?.period_start, subscription?.period_end)
        )
      : null
  );
  const { data: billingCycle } = useBillingCycle();
  const renewalQuery = useRenewalEligibility({ enabled: isPaid || isExpired });
  // Seat usage without a dedicated call: the seat total from the (already cached) entitlements and
  // seats in use counted like the admin dashboard, from the shared estate users list.
  const { data: entitlements } = useEstateEntitlements();
  const { data: estateUsers } = useEstateUsers({ enabled: canView });
  const aiTools = useEstateAiTools();
  const pendingRequests = usePendingRequests();
  const cancelPlan = useCancelSubscription();

  const [aiToolsOpen, setAiToolsOpen] = useState(false);
  const [pendingOpen, setPendingOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshBillingData();
    } finally {
      setRefreshing(false);
    }
  }, []);

  const renderBody = () => {
    if (subscriptionQuery.error && !subscriptionQuery.data) {
      return (
        <BillingLoadError
          message={subscriptionQuery.error.message || 'Could not load your subscription.'}
          onRetry={() => void subscriptionQuery.refetch()}
        />
      );
    }
    if (redirecting || !subscriptionQuery.data || !planState) return <BillingLoading />;

    const isFree = planState === 'free';
    const periodStart = subscription?.period_start;
    const periodEnd = subscription?.period_end;
    // Free plans have no billing period; an expired plan keeps its last period when it has one.
    const showCycleProgress = isPaid || (isExpired && !!periodStart && !!periodEnd);

    let cycleAmount = '';
    if (isFree) {
      cycleAmount = 'Free';
    } else {
      const nextAmount = billingCycle?.next_billing_amount;
      cycleAmount =
        nextAmount !== null && nextAmount !== undefined
          ? formatMoney(
              nextAmount,
              billingCycle?.next_billing_currency ?? cycleQuote.data?.currency_code
            )
          : formatMoney(cycleQuote.data?.client_total, cycleQuote.data?.currency_code);
    }
    const isRunning =
      isPaid && (subscription?.status === 'active' || subscription?.status === 'trialing');
    // Cancelled but still inside its paid period: the backend refuses plan/seat changes and renewals.
    const isCancelledRunning = isPaid && subscription?.status === 'cancelled';
    const canCancel = canCancelSubscription(subscription, tier);
    // Active but past period_end (renewal grace): cancelling ends the plan straight away.
    const inGracePeriod = canCancel && isExpired;
    const planName = tier?.name ?? 'your plan';
    const endDate = formatBillingDate(periodEnd) || 'the end of your billing cycle';
    const endShort = formatBillingDate(periodEnd, 'short');

    const covered =
      entitlements?.coveredUsers ??
      subscription?.covered_users ??
      subscriptionQuery.data.covered_users ??
      0;

    // Manual renewal (checkout kind `renew`) is only allowed when the backend says so: auto-renew off
    // and within its window before period_end. Otherwise the button is greyed out but still tells
    // the user why (e.g. auto-renewal is on, so there is nothing to do).
    const renewBlock = getRenewalBlockMessage(renewalQuery.data);
    const renewAction: BillingSectionAction = {
      label: 'Renew Plan',
      muted: Boolean(renewBlock),
      onPress: () =>
        renewBlock
          ? Alert.alert(renewBlock.title, renewBlock.message)
          : router.push({ pathname: '/billing/choose-plan', params: { renew: '1' } }),
    };
    // The backend only renews active plans: a cancelled one is bought again as a new plan.
    const buyAgain = () =>
      router.push({
        pathname: '/billing/choose-plan',
        params: { plan: tier?.slug ?? '', seats: String(covered) },
      });

    const confirmBuyAgain = () =>
      Alert.alert('Buy a new plan?', REPLACES_PLAN_WARNING, [
        { text: 'Not now', style: 'cancel' },
        { text: 'Continue', onPress: buyAgain },
      ]);

    const cycleActions: BillingSectionAction[] = isCancelledRunning
      ? [{ label: 'Choose Plan', onPress: confirmBuyAgain }]
      : isPaid
        ? [
            { label: 'Change Plan', onPress: () => router.push('/billing/change-plan') },
            renewAction,
          ]
        : isExpired
          ? subscription?.status === 'cancelled'
            ? [{ label: 'Choose Plan', onPress: buyAgain }]
            : [renewAction]
          : [{ label: 'Upgrade Plan', onPress: () => router.push('/billing/choose-plan') }];
    // Seats can only be bought within a running billing period (renewal keeps the seat count).
    const seatAction =
      isPaid && !isCancelledRunning ? () => router.push('/billing/manage-seats') : undefined;

    const confirmCancel = () =>
      Alert.alert(
        `Cancel your ${planName} plan?`,
        inGracePeriod
          ? `Your plan ended on ${endDate}. Cancelling stops renewal and any payment retries, and moves your estate to the free Access plan straight away.\n\nThis can't be undone.`
          : `Auto-renewal will stop. You'll keep ${planName} until ${endDate}, then your estate moves to the free Access plan.\n\nThis can't be undone. ${REPLACES_PLAN_WARNING}`,
        [
          { text: 'Keep Plan', style: 'cancel' },
          {
            text: 'Cancel Plan',
            style: 'destructive',
            onPress: () =>
              cancelPlan.mutate(undefined, {
                onSuccess: () =>
                  Alert.alert(
                    'Plan cancelled',
                    inGracePeriod
                      ? 'Your estate is now on the free Access plan.'
                      : `You'll keep ${planName} until ${endDate}.`
                  ),
                onError: (error) => Alert.alert('Could not cancel plan', error.message),
              }),
          },
        ]
      );
    const activeUsers = estateUsers ? getSeatOccupancy(estateUsers).occupied : undefined;
    const hasUsage = typeof activeUsers === 'number';
    const seatTrailing = hasUsage ? `${activeUsers}/${covered} Seats` : plural(covered, 'Seat');
    const seatUsage = hasUsage && covered > 0 ? activeUsers / covered : 0;

    const { activeCount, totalCount } = aiTools;
    const toolsTrailing =
      totalCount > 0 ? `${activeCount}/${totalCount} Tools` : plural(activeCount, 'Tool');

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        // Figma: plan card 40pt under the title (16pt gap so scrolled content clears the fixed title,
        // + 24pt padding); 24pt to the first section, 16pt between sections.
        style={{ marginTop: 16 }}
        contentContainerStyle={{ paddingTop: 24, paddingBottom: 40 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#113E55" />
        }
      >
        <CurrentPlanCard subscription={subscription} tier={tier} />

        {canManage ? null : <BillingViewOnlyNote className="mt-4" />}

        <View className="mt-6 gap-4">
          <BillingSectionCard
            eyebrow="Your Billing Cycle"
            title={
              <View className="flex-row items-center gap-1">
                <Text className="font-ubuntu-medium text-[27px] leading-[32.8px] text-[#113E55]">
                  {cycleAmount || '—'}
                </Text>
                {isRunning || isExpired ? (
                  <>
                    <View className="h-[2px] w-[2px] rounded-full bg-[#878686]" />
                    {isExpired ? (
                      <View accessible accessibilityLabel="Plan expired">
                        <ExpiredClockIcon size={16} />
                      </View>
                    ) : (
                      <View accessible accessibilityLabel="Subscription active">
                        <CheckCircleOutlineIcon size={16} color="#46EE6A" />
                      </View>
                    )}
                  </>
                ) : null}
              </View>
            }
            actions={cycleActions}
          >
            {showCycleProgress ? (
              // Figma: the bar sits 8pt into its frame, with ~11pt of slack under the dates.
              <SegmentedProgress
                className="mb-[11px] mt-2"
                progress={getCycleProgress(periodStart, periodEnd)}
                startLabel={formatBillingDate(periodStart, 'short')}
                endLabel={formatBillingDate(periodEnd, 'short')}
              />
            ) : null}
          </BillingSectionCard>

          <BillingSectionCard
            eyebrow="Seat Usage"
            title="Active Users"
            trailing={seatTrailing}
            actionLabel={seatAction ? 'Manage Seats' : undefined}
            onAction={seatAction}
          >
            <ProgressBar className="mb-3 mt-[7px]" progress={seatUsage} />
          </BillingSectionCard>

          <BillingSectionCard
            eyebrow="AI Tools"
            title="Active AI Tools"
            trailing={toolsTrailing}
            actionLabel="View"
            onAction={() => setAiToolsOpen(true)}
          />

          <BillingSectionCard
            eyebrow="Subscription changes"
            title="Pending Request"
            trailing={plural(pendingRequests.length, 'Request')}
            actionLabel="View"
            onAction={() => setPendingOpen(true)}
          />

          {/* Only a running paid plan can be cancelled; once cancelled it says when it ends. */}
          {canCancel ? (
            <BillingSectionCard
              eyebrow="Cancel Subscription"
              title="Cancel Plan"
              actions={[
                {
                  label: 'Cancel Plan',
                  variant: 'danger',
                  onPress: confirmCancel,
                  disabled: !canManage,
                  loading: cancelPlan.isPending,
                },
              ]}
            >
              <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#878686]">
                {inGracePeriod
                  ? `Your plan ended on ${endDate}. Cancel to stop renewal and move your estate to the free Access plan now.`
                  : `Stop auto-renewal. You'll keep ${planName} until ${endDate}, then your estate moves to the free Access plan.`}
              </Text>
            </BillingSectionCard>
          ) : isCancelledRunning ? (
            <BillingSectionCard
              eyebrow="Cancel Subscription"
              title="Plan Cancelled"
              trailing={endShort ? `Ends ${endShort}` : null}
            >
              <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#878686]">
                {`You'll keep ${planName} until ${endDate}. ${REPLACES_PLAN_WARNING}`}
              </Text>
            </BillingSectionCard>
          ) : null}
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      {/* Hidden until the role is known, so users who are redirected away never see it. */}
      {!redirecting ? (
        <Text className="mt-[9px] font-ubuntu-medium text-[27px] leading-[32.8px] text-[#113E55]">
          Your Current Plan
        </Text>
      ) : null}

      {renderBody()}

      <AiToolsSheet visible={aiToolsOpen} onClose={() => setAiToolsOpen(false)} />
      <PendingRequestsSheet visible={pendingOpen} onClose={() => setPendingOpen(false)} />
    </SafeAreaView>
  );
}
