import { useMemo, useState } from 'react';
import { Alert, Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import Button from '@/src/components/mobile/Button';
import BillingSheet from '@/src/components/billing/BillingSheet';
import InfoNote from '@/src/components/billing/InfoNote';
import {
  useBillingAccess,
  useBillingTiers,
  useCancelSeatReduction,
  useCancelTierChange,
  useEstateSubscription,
} from '@/src/hooks/useBillingQueries';
import { buildPendingRequests, formatBillingDate } from '@/src/lib/billing';
import { cn } from '@/src/lib/cn';
import type { PendingRequest } from '@/src/types/billing';

/** Scheduled plan/seat changes on the estate's subscription (0–2 items), memoised. */
export function usePendingRequests(): PendingRequest[] {
  const { data } = useEstateSubscription();
  const { data: tiers } = useBillingTiers();
  const subscription = data?.subscription;
  const currentTier = data?.tier;
  return useMemo(
    () => buildPendingRequests({ subscription, tiers, currentTier }),
    [subscription, tiers, currentTier]
  );
}

/**
 * "Pending Request" bottom sheet: a note that changes apply next cycle, then one card per
 * scheduled change with a Cancel action (primary admin / root only).
 */
export default function PendingRequestsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { canManage } = useBillingAccess();
  const requests = usePendingRequests();
  const cancelTierChange = useCancelTierChange();
  const cancelSeatReduction = useCancelSeatReduction();
  const busy = cancelTierChange.isPending || cancelSeatReduction.isPending;
  const [expandedKinds, setExpandedKinds] = useState<Record<string, boolean>>({});

  const toggleExpand = (kind: string) => {
    setExpandedKinds((prev) => ({ ...prev, [kind]: !prev[kind] }));
  };

  const confirmCancel = (request: PendingRequest) => {
    const mutation = request.kind === 'tier_change' ? cancelTierChange : cancelSeatReduction;
    Alert.alert('Cancel request?', `Your ${request.title.toLowerCase()} will be withdrawn.`, [
      { text: 'No', style: 'cancel' },
      {
        text: 'Yes',
        style: 'destructive',
        onPress: () =>
          mutation.mutate(undefined, {
            onError: (error) => Alert.alert('Could not cancel request', error.message),
          }),
      },
    ]);
  };

  return (
    <BillingSheet visible={visible} onClose={onClose} busy={busy} scrollable>
      {/* Figma: cards follow 24pt under the note. */}
      <View className="gap-6">
        <InfoNote text="All Pending request takes effect on your next billing cycle." />

        {requests.length === 0 ? (
          <Text className="py-6 text-center font-inter-regular text-sm text-[#878686]">
            No pending requests.
          </Text>
        ) : (
          <View className="gap-[9px]">
            {requests.map((request) => {
              const running =
                request.kind === 'tier_change'
                  ? cancelTierChange.isPending
                  : cancelSeatReduction.isPending;
              const effectiveDate = formatBillingDate(request.effectiveFrom);
              const isExpanded = !!expandedKinds[request.kind];
              return (
                <View
                  key={request.kind}
                  className="gap-[14px] rounded-[16px] bg-white px-4 py-[17px]"
                >
                  <View className="gap-1">
                    {effectiveDate ? (
                      <Text className="font-inter-medium text-[9px] leading-[10.8px] text-[#878686]">
                        {`Takes effect on ${effectiveDate}`}
                      </Text>
                    ) : null}
                    <Text className="font-inter-light text-[14px] leading-[16.9px] text-[#113E55]">
                      {request.title}
                    </Text>
                    <Text className="font-inter-medium text-[9px] leading-[10.8px] text-[#878686]">
                      {request.description}
                    </Text>
                  </View>

                  {/* Expandable Request Details */}
                  {isExpanded && (
                    <View className="gap-2 rounded-[12px] bg-[#F8F9FA] p-3 border border-[#E5E9EA]">
                      <Text className="font-inter-medium text-[11px] text-[#113E55]">
                        Request Details:
                      </Text>
                      {request.kind === 'seat_reduction' ? (
                        <>
                          <View className="flex-row justify-between">
                            <Text className="font-inter-regular text-[11px] text-[#64748B]">
                              New Seat Limit:
                            </Text>
                            <Text className="font-inter-medium text-[11px] text-[#113E55]">
                              {request.seats ? `${request.seats} Seats` : 'Reduced'}
                            </Text>
                          </View>
                          <Text className="font-inter-regular text-[10px] text-[#878686] leading-[14px] mt-1">
                            Your estate capacity will reduce to this seat count starting next
                            billing cycle.
                          </Text>
                        </>
                      ) : (
                        <>
                          <View className="flex-row justify-between">
                            <Text className="font-inter-regular text-[11px] text-[#64748B]">
                              Scheduled Plan:
                            </Text>
                            <Text className="font-inter-medium text-[11px] text-[#113E55]">
                              {request.targetTierName || request.targetTierSlug || 'New Plan'}
                            </Text>
                          </View>
                          <Text className="font-inter-regular text-[10px] text-[#878686] leading-[14px] mt-1">
                            Your plan and features will automatically transition on your next
                            renewal date.
                          </Text>
                        </>
                      )}
                    </View>
                  )}

                  <Pressable
                    onPress={() => toggleExpand(request.kind)}
                    hitSlop={8}
                    accessibilityRole="button"
                    accessibilityLabel={
                      isExpanded ? 'Hide request details' : 'View request details'
                    }
                    className="flex-row items-center justify-center gap-1 active:opacity-60"
                  >
                    <Text className="font-ubuntu-semibold text-[11px] text-[#113E55] underline">
                      {isExpanded ? 'Hide Details' : 'View Details'}
                    </Text>
                    <Feather
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={14}
                      color="#113E55"
                    />
                  </Pressable>

                  <Button
                    label="Cancel Request"
                    variant="secondary"
                    loading={running}
                    disabled={!canManage || busy}
                    onPress={() => confirmCancel(request)}
                    accessibilityLabel={`Cancel ${request.title}`}
                    accessibilityState={{ disabled: !canManage || busy, busy: running }}
                    className={cn(
                      'h-[44px] w-[225px] max-w-[225px] self-center py-0',
                      !canManage && 'opacity-50'
                    )}
                  />
                </View>
              );
            })}
          </View>
        )}
      </View>
    </BillingSheet>
  );
}
