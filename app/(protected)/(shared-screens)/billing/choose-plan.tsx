import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, router, useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Back from '@/src/components/mobile/Back';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/components/mobile/Button';
import {
  BillingLoadError,
  BillingLoading,
  BillingViewOnlyNote,
  PlanCard,
  PlanFeatureList,
  PlanTabs,
  SeatStepper,
  type PlanFeatureRow,
} from '@/src/components/billing';
import PlanDurationSheet from '@/src/components/billing/PlanDurationSheet';
import {
  type BillingQuoteParams,
  useBillingQuote,
  useBillingTiers,
  useSeatReductionEligibility,
  useTierSeatPrices,
} from '@/src/hooks/useBillingQueries';
import { useBillingScreenGuard } from '@/src/hooks/useBillingScreenGuard';
import {
  buildCustomEntitlements,
  formatMoney,
  getAmountFontSize,
  getTierFeatureRows,
  PLAN_DURATIONS,
  type PeriodMonths,
} from '@/src/lib/billing';
import { showCheckoutOutcomeAlert, usePaystackCheckout } from '@/src/lib/billingCheckout';
import { sharedStyles } from '@/src/theme/styles';
import type { BillingTier } from '@/src/types/billing';

const MAX_SEATS = 100000;
const QUOTE_DEBOUNCE_MS = 300;
const CUSTOM_SLUG = 'custom';

/** Custom plan builder rows: free features always included, paid + AI features toggleable. */
function getCustomFeatureRows(tier: BillingTier | undefined): {
  rows: PlanFeatureRow[];
  aiKeys: Set<string>;
} {
  const rows: PlanFeatureRow[] = [];
  const aiKeys = new Set<string>();
  const seen = new Set<string>();
  const add = (key: string, label: string, state: PlanFeatureRow['state']) => {
    if (!key || seen.has(key)) return;
    seen.add(key);
    rows.push({ key, label, state });
  };
  for (const f of tier?.free_features?.available ?? []) add(f.service_key, f.label, 'included');
  for (const f of tier?.paid_non_ai_features?.available ?? []) {
    add(f.service_key, f.label, 'selectable');
  }
  for (const f of tier?.paid_ai_features?.available ?? []) {
    aiKeys.add(f.feature_key);
    add(f.feature_key, f.label, 'selectable');
  }
  return { rows, aiKeys };
}

function useDebouncedValue<T>(value: T, delayMs: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);
  return debounced;
}

const clampSeats = (n: number, min: number) => Math.min(MAX_SEATS, Math.max(min, n));

export default function ChoosePlanScreen() {
  const { plan } = useLocalSearchParams<{ plan?: string }>();
  // No paid-plan requirement: estates with a running plan may still open this screen directly
  // (checkout then surfaces the API's "already subscribed" error).
  const { canManage, subscriptionQuery, redirecting } = useBillingScreenGuard();

  const tiersQuery = useBillingTiers();
  const eligibilityQuery = useSeatReductionEligibility();
  const seatPrices = useTierSeatPrices(tiersQuery.data);
  const { startCheckout, isRunning } = usePaystackCheckout();

  const [selectedSlug, setSelectedSlug] = useState<string | null>(null);
  const [seatsInput, setSeatsInput] = useState<number | null>(null);
  const [months, setMonths] = useState<PeriodMonths>(1);
  const [selectedKeys, setSelectedKeys] = useState<string[]>([]);
  const [durationOpen, setDurationOpen] = useState(false);

  const tabTiers = useMemo(
    () => (tiersQuery.data ?? []).filter((tier) => tier.slug !== 'access' && tier.is_active),
    [tiersQuery.data]
  );
  const tabs = useMemo(
    () => tabTiers.map((tier) => ({ key: tier.slug, label: tier.name })),
    [tabTiers]
  );

  const initialSlug = tabTiers.some((tier) => tier.slug === plan) ? plan : tabTiers[0]?.slug;
  const activeSlug = selectedSlug ?? initialSlug ?? null;
  const activeTier = tabTiers.find((tier) => tier.slug === activeSlug);
  const isCustom = Boolean(activeTier?.is_custom);

  const minSeats = Math.max(1, eligibilityQuery.data?.active_users ?? 1);
  const defaultSeats = subscriptionQuery.data?.subscription?.covered_users ?? minSeats;
  const seats = clampSeats(seatsInput ?? defaultSeats, minSeats);

  const custom = useMemo(() => getCustomFeatureRows(activeTier), [activeTier]);

  const buildQuoteParams = useCallback(
    (periodMonths: PeriodMonths): BillingQuoteParams | null => {
      if (!activeTier) return null;
      if (!activeTier.is_custom) {
        return { tier_slug: activeTier.slug, covered_users: seats, period_months: periodMonths };
      }
      if (selectedKeys.length === 0) return null;
      const serviceKeys = selectedKeys.filter((key) => !custom.aiKeys.has(key));
      const aiKeys = selectedKeys.filter((key) => custom.aiKeys.has(key));
      return {
        tier_slug: CUSTOM_SLUG,
        entitlements: buildCustomEntitlements(serviceKeys),
        ...(aiKeys.length ? { ai_feature_keys: aiKeys } : {}),
        covered_users: seats,
        period_months: periodMonths,
      };
    },
    [activeTier, seats, selectedKeys, custom.aiKeys]
  );

  const liveParams = useMemo(() => buildQuoteParams(months), [buildQuoteParams, months]);
  const liveKey = JSON.stringify(liveParams);
  const debouncedKey = useDebouncedValue(liveKey, QUOTE_DEBOUNCE_MS);
  const quoteParams = useMemo<BillingQuoteParams | null>(
    () => JSON.parse(debouncedKey),
    [debouncedKey]
  );
  const quoteQuery = useBillingQuote(quoteParams);
  // Keep the previous figure while seats/duration/features refetch, but never show another tab's.
  const quote =
    liveParams && quoteQuery.data?.tier_slug === liveParams.tier_slug ? quoteQuery.data : null;
  const quoteSettled = Boolean(quote) && !quoteQuery.isPlaceholderData && liveKey === debouncedKey;

  const toggleFeature = useCallback((key: string) => {
    setSelectedKeys((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key]
    );
  }, []);

  const subscribe = async () => {
    // A typed seat count is committed on blur: let the price catch up before paying.
    if (Keyboard.isVisible()) {
      Keyboard.dismiss();
      return;
    }
    if (!liveParams) return;
    // Pay for exactly what was quoted. Custom: no tier_slug (the API rejects it for this kind).
    const { tier_slug, entitlements, ai_feature_keys, covered_users, period_months } = liveParams;
    const outcome = await startCheckout(
      isCustom
        ? { checkout_kind: 'custom', entitlements, ai_feature_keys, covered_users, period_months }
        : { checkout_kind: 'tier', tier_slug, covered_users, period_months }
    );
    showCheckoutOutcomeAlert(outcome, 'Your subscription is now active.');
    // Back to an existing Current Plan screen rather than stacking a second copy of it.
    if (outcome === 'paid') router.dismissTo('/billing');
  };

  const retry = () => {
    tiersQuery.refetch();
    subscriptionQuery.refetch();
  };

  const loading = redirecting || tiersQuery.isLoading || subscriptionQuery.isLoading;
  const loadError = tiersQuery.error ?? subscriptionQuery.error;

  const seatPrice = activeSlug ? seatPrices[activeSlug] : undefined;
  const planPriceLabel = isCustom
    ? quote
      ? formatMoney(quote.price_per_seat, quote.currency_code)
      : null
    : formatMoney(seatPrice?.pricePerSeat, seatPrice?.currency);
  const duration = PLAN_DURATIONS.find((option) => option.months === months) ?? PLAN_DURATIONS[0];
  const billedCaption = months === 1 ? 'Billed Monthly' : `Billed every ${months} months`;
  const subscribeDisabled =
    !canManage || !quoteSettled || (isCustom && selectedKeys.length === 0) || isRunning;

  const renderAmount = () => {
    if (isCustom && selectedKeys.length === 0) {
      return (
        <View className="h-[41px] justify-center">
          <Text className="font-inter-regular text-[14px] leading-[16.9px] text-[#878686]">
            Select features
          </Text>
        </View>
      );
    }
    if (quote) {
      const amount = formatMoney(quote.client_total, quote.currency_code);
      return (
        <Text
          className="text-center font-ubuntu-medium text-[#167A6F]"
          style={{
            fontSize: getAmountFontSize(amount, 34, 11),
            lineHeight: 41,
            opacity: quoteQuery.isPlaceholderData ? 0.5 : 1,
          }}
          numberOfLines={1}
        >
          {amount}
        </Text>
      );
    }
    if (quoteQuery.isError) {
      return (
        <Text className="text-center font-ubuntu-medium text-[34px] leading-[41px] text-[#167A6F]">
          —
        </Text>
      );
    }
    return (
      <View className="h-[41px] justify-center">
        <ActivityIndicator color="#113E55" />
      </View>
    );
  };

  const renderContent = () => {
    if (loading) return <BillingLoading />;
    if (loadError || !activeTier) {
      return (
        <BillingLoadError
          message={loadError?.message || 'No plans are available right now.'}
          onRetry={retry}
        />
      );
    }

    return (
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'android' ? 'height' : undefined}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          automaticallyAdjustKeyboardInsets
          // Full-bleed scroll area so the plan tabs can span the screen without being clipped.
          // 16pt gap under the fixed title so scrolled content doesn't run into it.
          style={{ marginHorizontal: -20, marginTop: 16 }}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: BUTTON_MARGIN_BOTTOM }}
        >
          <PlanCard
            slug={activeTier.slug}
            name={activeTier.name}
            priceLabel={planPriceLabel}
            unitLabel="/month"
            footnote={isCustom ? 'Build your own plan' : 'Per seat'}
            className="mt-6"
          />

          <PlanTabs
            tabs={tabs}
            value={activeSlug}
            onChange={setSelectedSlug}
            className="-mx-5 mt-6"
          />

          <View className="mt-6 gap-4 px-3">
            <View className="items-center rounded-[16px] bg-white px-10 py-4">
              <Text className="font-inter-regular text-[17.5px] leading-[21.2px] text-[#0A1F29]">
                {activeTier.name} Plan
              </Text>
              <View className="mt-2 self-stretch items-center">{renderAmount()}</View>
              {quoteQuery.isError && !quoteQuery.isFetching ? (
                <Text
                  className="mt-1 text-center font-inter-regular text-[11.2px] leading-[13.6px] text-[#E30404]"
                  numberOfLines={3}
                >
                  {quoteQuery.error?.message || 'Could not load the price.'}
                </Text>
              ) : null}
              <Text className="mt-1 font-inter-regular text-[11.2px] leading-[13.6px] text-[#0A1F29]">
                {billedCaption}
              </Text>
            </View>

            <View className="gap-4 rounded-[16px] bg-white px-4 py-6">
              <View className="gap-1">
                <Text className="font-inter-regular text-[17.5px] leading-[21.2px] text-[#0A1F29]">
                  Seats
                </Text>
                <Text className="font-inter-regular text-[11.2px] leading-[13.6px] text-[#0A1F29]">
                  Set the total seats required
                </Text>
              </View>
              <SeatStepper
                value={seats}
                onChange={setSeatsInput}
                min={minSeats}
                max={MAX_SEATS}
                accessibilityLabel="Total seats"
              />
            </View>

            {isCustom ? (
              <PlanFeatureList
                rows={custom.rows}
                selectedKeys={selectedKeys}
                onToggle={toggleFeature}
              />
            ) : (
              <PlanFeatureList rows={getTierFeatureRows(activeTier)} />
            )}

            <Pressable
              onPress={() => setDurationOpen(true)}
              accessibilityRole="button"
              accessibilityLabel={`Set Plan Duration, ${duration.label}`}
              className="flex-row items-center gap-4 rounded-[8px] border-[0.5px] border-[#CEE5ED] bg-white p-4 active:opacity-70"
            >
              <Text className="flex-1 font-inter-light text-[14px] leading-[16.9px] text-[#113E55]">
                Set Plan Duration
              </Text>
              <Text className="font-inter-extralight text-[14px] italic leading-[16.9px] text-[#113E55]">
                {duration.shortLabel}
              </Text>
              <Ionicons name="chevron-forward" size={16} color="#113E55" />
            </Pressable>
          </View>

          {!canManage ? <BillingViewOnlyNote className="mt-6" /> : null}

          <View className={canManage ? 'mt-10 items-center' : 'mt-4 items-center'}>
            <Button
              label="Subscribe"
              onPress={subscribe}
              disabled={subscribeDisabled}
              loading={isRunning}
            />
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
      <Text className="mt-[9px] font-ubuntu-medium text-[27px] leading-[32.8px] text-[#113E55]">
        Choose your plan
      </Text>

      {renderContent()}

      <PlanDurationSheet
        visible={durationOpen}
        onClose={() => setDurationOpen(false)}
        value={months}
        onConfirm={setMonths}
        quoteParams={buildQuoteParams}
      />
    </SafeAreaView>
  );
}
