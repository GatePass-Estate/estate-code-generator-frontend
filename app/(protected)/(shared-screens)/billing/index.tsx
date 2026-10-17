import { useCallback, useState } from 'react';
import { RefreshControl, ScrollView, Text, View } from 'react-native';
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
  ProgressBar,
  SegmentedProgress,
} from '@/src/components/billing';
import AiToolsSheet from '@/src/components/billing/AiToolsSheet';
import PendingRequestsSheet, {
  usePendingRequests,
} from '@/src/components/billing/PendingRequestsSheet';
import {
  refreshBillingData,
  useBillingCycle,
  useBillingQuote,
  useEstateAiTools,
  useSeatReductionEligibility,
} from '@/src/hooks/useBillingQueries';
import { useBillingScreenGuard } from '@/src/hooks/useBillingScreenGuard';
import {
  formatBillingDate,
  formatMoney,
  getCurrentPlanQuoteParams,
  getCycleProgress,
  inferPeriodMonths,
} from '@/src/lib/billing';
import { sharedStyles } from '@/src/theme/styles';

const plural = (count: number, word: string) => `${count} ${word}${count === 1 ? '' : 's'}`;

/**
 * Billing entry + "Your Current Plan". Estates without a paid, running plan are sent to
 * "Choose your plan"; everyone who can't view billing is sent back to the More screen.
 */
export default function BillingScreen() {
  const { canManage, subscriptionQuery, subscription, tier, entry, redirecting } =
    useBillingScreenGuard({ requirePaidPlan: true });
  const isCurrent = entry === 'current';

  // The current cycle's total, as a fallback for the billing-cycle amount when the API has no
  // `next_billing_amount`.
  const cycleQuote = useBillingQuote(
    isCurrent
      ? getCurrentPlanQuoteParams(
          subscription,
          tier,
          subscription?.covered_users ?? 0,
          inferPeriodMonths(subscription?.period_start, subscription?.period_end)
        )
      : null
  );
  const { data: billingCycle } = useBillingCycle();
  const { data: eligibility } = useSeatReductionEligibility();
  const aiTools = useEstateAiTools();
  const pendingRequests = usePendingRequests();

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
    if (redirecting || !isCurrent || !subscription || !tier) return <BillingLoading />;

    const periodStart = subscription.period_start;
    const periodEnd = subscription.period_end;

    const nextAmount = billingCycle?.next_billing_amount;
    const cycleAmount =
      nextAmount !== null && nextAmount !== undefined
        ? formatMoney(
            nextAmount,
            billingCycle?.next_billing_currency ?? cycleQuote.data?.currency_code
          )
        : formatMoney(cycleQuote.data?.client_total, cycleQuote.data?.currency_code);
    const isRunning = subscription.status === 'active' || subscription.status === 'trialing';

    const covered = subscription.covered_users;
    const activeUsers = eligibility?.active_users;
    const hasUsage = typeof activeUsers === 'number';
    const seatTrailing = hasUsage ? `${activeUsers}/${covered} Seats` : plural(covered, 'Seat');
    const seatUsage = hasUsage && covered > 0 ? activeUsers / covered : 0;

    const { activeCount, totalCount } = aiTools;
    const toolsTrailing =
      totalCount > 0 ? `${activeCount}/${totalCount} Tools` : plural(activeCount, 'Tool');

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        // Figma: plan card 40pt under the title; 24pt to the first section, 16pt between sections.
        contentContainerStyle={{ paddingTop: 40, paddingBottom: 40 }}
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
                {isRunning ? (
                  <>
                    <View className="h-[2px] w-[2px] rounded-full bg-[#878686]" />
                    <View accessible accessibilityLabel="Subscription active">
                      <CheckCircleOutlineIcon size={16} color="#46EE6A" />
                    </View>
                  </>
                ) : null}
              </View>
            }
            actionLabel="Change Plan"
            onAction={() => router.push('/billing/change-plan')}
          >
            {/* Figma: the bar sits 8pt into its frame, with ~11pt of slack under the dates. */}
            <SegmentedProgress
              className="mb-[11px] mt-2"
              progress={getCycleProgress(periodStart, periodEnd)}
              startLabel={formatBillingDate(periodStart, 'short')}
              endLabel={formatBillingDate(periodEnd, 'short')}
            />
          </BillingSectionCard>

          <BillingSectionCard
            eyebrow="Seat Usage"
            title="Active Users"
            trailing={seatTrailing}
            actionLabel="Manage Seats"
            onAction={() => router.push('/billing/manage-seats')}
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

      {/* Hidden while deciding the entry so "Choose your plan" estates never see this title. */}
      {isCurrent ? (
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
