import { useMemo, useState } from 'react';
import { Alert, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router } from 'expo-router';
import Back from '@/src/components/mobile/Back';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import {
  BillingLoadError,
  BillingLoading,
  BillingSectionCard,
  BillingViewOnlyNote,
  InfoNote,
  PlanCard,
  PlanFeatureList,
  PlanTabs,
  RadioOptionCard,
} from '@/src/components/billing';
import PendingRequestsSheet, {
  usePendingRequests,
} from '@/src/components/billing/PendingRequestsSheet';
import {
  useBillingQuote,
  useBillingTiers,
  useScheduleTierChange,
  useTierSeatPrices,
} from '@/src/hooks/useBillingQueries';
import { useBillingScreenGuard } from '@/src/hooks/useBillingScreenGuard';
import { showCheckoutOutcomeAlert, usePaystackCheckout } from '@/src/lib/billingCheckout';
import {
  formatBillingDate,
  formatMoney,
  getPlanDirection,
  getTierFeatureRows,
} from '@/src/lib/billing';
import { sharedStyles } from '@/src/theme/styles';

type ChangeTiming = 'immediate' | 'next_cycle';

export default function ChangePlanScreen() {
  // Plan changes need a running paid plan; anything else picks a plan first.
  const {
    canManage,
    subscriptionQuery,
    subscription,
    tier: currentTier,
    redirecting,
  } = useBillingScreenGuard({ requirePaidPlan: true });
  const tiersQuery = useBillingTiers();
  const scheduleTierChange = useScheduleTierChange();
  const { startCheckout, isRunning: checkoutRunning, checkoutSheet } = usePaystackCheckout();
  const pendingRequests = usePendingRequests();

  const tiers = tiersQuery.data;
  const seatPrices = useTierSeatPrices(tiers);

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [timing, setTiming] = useState<ChangeTiming | null>(null);
  const [pendingVisible, setPendingVisible] = useState(false);

  // Designer annotation: the current plan is not offered as a tab.
  const otherTiers = useMemo(
    () =>
      (tiers ?? []).filter(
        (tier) => tier.id !== currentTier?.id && tier.slug !== currentTier?.slug
      ),
    [tiers, currentTier]
  );
  const defaultSlug =
    otherTiers.find((tier) => tier.display_order > (currentTier?.display_order ?? -1))?.slug ??
    otherTiers[0]?.slug ??
    null;
  const target =
    otherTiers.find((tier) => tier.slug === selectedSlug) ??
    otherTiers.find((tier) => tier.slug === defaultSlug) ??
    null;

  const direction =
    target && currentTier
      ? getPlanDirection(currentTier.display_order, target.display_order)
      : 'upgrade';
  const isUpgrade = direction === 'upgrade';
  const isCustomTarget = !!target?.is_custom;
  const isFreeTarget = target?.slug === 'access';
  const autoRenew = !!subscription?.auto_renew;
  const hasPendingTierChange = !!subscription?.pending_tier_slug;

  // Downgrades only happen at renewal, so that option is pre-selected; upgrades need a pick.
  const effectiveTiming: ChangeTiming | null = isUpgrade
    ? timing === 'next_cycle' && !autoRenew
      ? null
      : timing
    : autoRenew
      ? 'next_cycle'
      : null;

  const nextCycleQuote = useBillingQuote(
    target && subscription && !isCustomTarget && !isFreeTarget
      ? { tier_slug: target.slug, covered_users: subscription.covered_users, period_months: 1 }
      : null
  );
  const nextCycleAmount = isFreeTarget
    ? 'Free'
    : nextCycleQuote.data && !nextCycleQuote.isPlaceholderData
      ? formatMoney(nextCycleQuote.data.client_total, nextCycleQuote.data.currency_code)
      : nextCycleQuote.isError
        ? 'Unavailable'
        : 'Calculating…';

  const busy = scheduleTierChange.isPending || checkoutRunning;
  const canSubmit = canManage && !!target && !isCustomTarget && effectiveTiming !== null && !busy;

  const periodEnd = subscription?.period_end ?? null;
  const effectiveLong = formatBillingDate(periodEnd);
  const effectiveShort = formatBillingDate(periodEnd, 'short');

  const selectTab = (slug: string) => {
    setSelectedSlug(slug);
    setTiming(null);
  };

  const scheduleChange = () => {
    if (!target) return;
    const when = effectiveLong ? ` on ${effectiveLong}` : ' at your next renewal';
    Alert.alert(
      isUpgrade ? 'Upgrade next billing cycle?' : 'Downgrade next billing cycle?',
      `Your plan will change to ${target.name}${when}. You can cancel this from your pending requests before then.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: () =>
            scheduleTierChange.mutate(target.slug, {
              onSuccess: (result) => {
                const date = formatBillingDate(result.effective_from ?? periodEnd);
                Alert.alert(
                  'Plan change scheduled',
                  `Your plan will change to ${target.name}${date ? ` on ${date}` : ' at your next renewal'}.`
                );
                router.back();
              },
              onError: (error) => Alert.alert('Could not change plan', error.message),
            }),
        },
      ]
    );
  };

  const upgradeNow = async () => {
    if (!target) return;
    const outcome = await startCheckout({
      checkout_kind: 'tier_upgrade_immediate',
      tier_slug: target.slug,
    });
    showCheckoutOutcomeAlert(outcome, 'Your plan has been upgraded.');
    if (outcome === 'paid') router.back();
  };

  const handleSubmit = () => {
    if (effectiveTiming === 'immediate') upgradeNow();
    else if (effectiveTiming === 'next_cycle') scheduleChange();
  };

  const retry = () => {
    subscriptionQuery.refetch();
    tiersQuery.refetch();
  };

  const renderOptions = () => {
    if (!target) return null;

    if (isCustomTarget) {
      return (
        <InfoNote
          className="mt-10"
          text="Custom plans can't be scheduled as a plan change yet. Contact GatePass support to switch to a custom plan."
        />
      );
    }

    if (hasPendingTierChange) {
      const count = pendingRequests.length;
      return (
        <BillingSectionCard
          className="mt-6"
          eyebrow="Subscription changes"
          title="Pending Request"
          trailing={`${count} ${count === 1 ? 'Request' : 'Requests'}`}
          actionLabel="View"
          onAction={() => setPendingVisible(true)}
        />
      );
    }

    const nextCycleDescription = effectiveLong
      ? `Your new plan will take effect on ${effectiveLong}`
      : 'Your new plan will take effect at your next renewal';

    return (
      <View className="mt-10 gap-4">
        {!autoRenew ? (
          <InfoNote
            text={
              isUpgrade
                ? 'Auto-renewal is off, so plan changes can’t be scheduled. Immediate upgrades are still available.'
                : 'Auto-renewal is off, so plan changes can’t be scheduled.'
            }
          />
        ) : null}

        {isUpgrade ? (
          <>
            <RadioOptionCard
              selected={effectiveTiming === 'immediate'}
              onPress={() => setTiming('immediate')}
              disabled={!canManage || busy}
              title="Immediate Upgrade"
              description="Pay the prorated amount for the remaining period and get access to the plan right away."
              amount="Calculated at checkout"
              footnote={
                effectiveShort ? `Prorated charge (today – ${effectiveShort})` : 'Prorated charge'
              }
            />
            <RadioOptionCard
              selected={effectiveTiming === 'next_cycle'}
              onPress={() => setTiming('next_cycle')}
              disabled={!canManage || busy || !autoRenew}
              title="Upgrade next billing cycle"
              description={nextCycleDescription}
              amount={nextCycleAmount}
            />
          </>
        ) : (
          <RadioOptionCard
            selected={effectiveTiming === 'next_cycle'}
            onPress={() => setTiming('next_cycle')}
            disabled={!canManage || busy || !autoRenew}
            title="Downgrade next billing cycle"
            description={nextCycleDescription}
            amount={nextCycleAmount}
          />
        )}
      </View>
    );
  };

  const renderContent = () => {
    const loading =
      redirecting || subscriptionQuery.isPending || (tiersQuery.isPending && !tiersQuery.isError);

    if (subscriptionQuery.isError || tiersQuery.isError) {
      const error = subscriptionQuery.error ?? tiersQuery.error;
      return (
        <BillingLoadError
          message={error?.message || 'Could not load the available plans.'}
          onRetry={retry}
        />
      );
    }

    if (loading) return <BillingLoading />;

    const seatPrice = target ? seatPrices[target.slug] : undefined;
    const priceLabel = isFreeTarget
      ? 'Free'
      : seatPrice
        ? formatMoney(seatPrice.pricePerSeat, seatPrice.currency)
        : null;
    const footnote = isFreeTarget ? 'Free plan' : isCustomTarget ? 'Custom pricing' : 'Per seat';
    const hideButton = hasPendingTierChange && !isCustomTarget;

    return (
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: BUTTON_MARGIN_BOTTOM }}
      >
        <Text className="mt-[9px] font-ubuntu-medium text-[27px] leading-[32.8px] text-[#113E55]">
          Change Plan
        </Text>
        <Text className="mt-2 font-inter-regular text-[11.2px] leading-[13.6px] text-[#878686]">
          {`You are currently on ${(currentTier?.name ?? '').toUpperCase()} PLAN, select another to upgrade or downgrade.`}
        </Text>

        {otherTiers.length > 0 ? (
          <PlanTabs
            className="-mx-5 mt-6"
            tabs={otherTiers.map((tier) => ({ key: tier.slug, label: tier.name }))}
            value={target?.slug ?? null}
            onChange={selectTab}
          />
        ) : null}

        {target ? (
          <>
            <PlanCard
              className="mt-9"
              slug={target.slug}
              name={target.name}
              priceLabel={priceLabel}
              unitLabel={priceLabel && !isFreeTarget ? '/month' : undefined}
              footnote={footnote}
            />
            <PlanFeatureList
              className="mt-6 px-10 py-[21px]"
              rows={getTierFeatureRows(target)}
              mutedIncluded
            />
          </>
        ) : (
          <Text className="mt-10 text-center font-inter-regular text-sm text-[#878686]">
            No other plans are available right now.
          </Text>
        )}

        {renderOptions()}

        {!canManage ? <BillingViewOnlyNote className="mt-4" /> : null}

        {target && !hideButton ? (
          <View className="mt-[79px] items-center">
            <Button
              label={isUpgrade ? 'Upgrade' : 'Downgrade'}
              onPress={handleSubmit}
              disabled={!canSubmit}
              loading={busy}
            />
          </View>
        ) : null}
      </ScrollView>
    );
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" showText={false} showBorder />

      {renderContent()}

      <PendingRequestsSheet visible={pendingVisible} onClose={() => setPendingVisible(false)} />
      {checkoutSheet}
    </SafeAreaView>
  );
}
