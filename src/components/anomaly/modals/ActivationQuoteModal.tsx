import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, ActivityIndicator } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { getAiQuote } from '@/src/lib/api/aiMarketplace';
import { AiCheckoutDuration, AiQuoteResponse, MarketplaceTier } from '@/src/types/aiMarketplace';

interface ActivationQuoteModalProps {
  visible: boolean;
  onClose: () => void;
  tier: MarketplaceTier | null;
  estateId: string;
  onConfirm: (duration: AiCheckoutDuration, quote: AiQuoteResponse) => Promise<void>;
  isConfirming?: boolean;
}

const DURATION_OPTIONS: { duration: AiCheckoutDuration; label: string }[] = [
  { duration: 1, label: 'One month plan (30 days)' },
  { duration: 3, label: 'Three months plan (90 days)' },
  { duration: 6, label: 'Six months plan (180days)' },
  { duration: 12, label: 'Twelve months plan (360 days)' },
];

function formatQuotePrice(amount?: number | null, currency?: string | null): string {
  if (amount == null) return '--';
  const cleanCurrency = (currency || '').toUpperCase();
  const prefix =
    cleanCurrency === 'NGN'
      ? '₦'
      : cleanCurrency === 'USD'
        ? '$'
        : cleanCurrency
          ? `${cleanCurrency} `
          : '$';
  return `${prefix}${amount.toLocaleString()}`;
}

const quoteMemoryCache = new Map<string, AiQuoteResponse>();

export async function prefetchAiQuotes(estateId: string, featureKey: string) {
  if (!estateId || !featureKey) return;
  const durations: AiCheckoutDuration[] = [1, 3, 6, 12];
  await Promise.allSettled(
    durations.map(async (d) => {
      const key = `${estateId}:${featureKey}:${d}`;
      if (quoteMemoryCache.has(key)) return;
      try {
        const res = await getAiQuote({
          estate_id: estateId,
          ai_feature_keys: [featureKey],
          period_months: d,
        });
        quoteMemoryCache.set(key, res);
      } catch {
        // Silent background prefetch error
      }
    })
  );
}

export default function ActivationQuoteModal({
  visible,
  onClose,
  tier,
  estateId,
  onConfirm,
  isConfirming = false,
}: ActivationQuoteModalProps) {
  const [selectedDuration, setSelectedDuration] = useState<AiCheckoutDuration>(1);
  const [quote, setQuote] = useState<AiQuoteResponse | null>(null);
  const [isLoadingQuote, setIsLoadingQuote] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const selectedDurationRef = React.useRef<AiCheckoutDuration>(1);

  const fetchSingleQuote = useCallback(
    async (duration: AiCheckoutDuration) => {
      const featureKey = tier?.feature_key;
      if (!featureKey || !estateId) return;

      const cacheKey = `${estateId}:${featureKey}:${duration}`;
      const cached = quoteMemoryCache.get(cacheKey);
      if (cached) {
        setQuote(cached);
        setIsLoadingQuote(false);
        setQuoteError(null);
        return;
      }

      setIsLoadingQuote(true);
      setQuoteError(null);
      try {
        const response = await getAiQuote({
          estate_id: estateId,
          ai_feature_keys: [featureKey],
          period_months: duration,
        });
        quoteMemoryCache.set(cacheKey, response);
        if (selectedDurationRef.current === duration) {
          setQuote(response);
        }
      } catch (err: any) {
        console.error('Failed to fetch quote:', err);
        if (selectedDurationRef.current === duration) {
          setQuoteError(err?.message || 'Unable to fetch total price');
        }
      } finally {
        if (selectedDurationRef.current === duration) {
          setIsLoadingQuote(false);
        }
      }
    },
    [tier?.feature_key, estateId]
  );

  useEffect(() => {
    selectedDurationRef.current = selectedDuration;
  }, [selectedDuration]);

  useEffect(() => {
    if (visible && tier?.feature_key && estateId) {
      setSelectedDuration(1);
      selectedDurationRef.current = 1;

      const featureKey = tier.feature_key;
      const initialCacheKey = `${estateId}:${featureKey}:1`;
      const cachedInitial = quoteMemoryCache.get(initialCacheKey);

      if (cachedInitial) {
        setQuote(cachedInitial);
        setIsLoadingQuote(false);
        setQuoteError(null);
      } else {
        setIsLoadingQuote(true);
        setQuote(null);
        setQuoteError(null);
      }

      // Fetch all 4 plans in parallel so switching is instantaneous
      const durations: AiCheckoutDuration[] = [1, 3, 6, 12];
      durations.forEach(async (d) => {
        const key = `${estateId}:${featureKey}:${d}`;
        try {
          const res = await getAiQuote({
            estate_id: estateId,
            ai_feature_keys: [featureKey],
            period_months: d,
          });
          quoteMemoryCache.set(key, res);
          if (selectedDurationRef.current === d) {
            setQuote(res);
            setIsLoadingQuote(false);
            setQuoteError(null);
          }
        } catch (err: any) {
          if (selectedDurationRef.current === d && !quoteMemoryCache.has(key)) {
            setQuoteError(err?.message || 'Unable to fetch total price');
            setIsLoadingQuote(false);
          }
        }
      });
    } else if (!visible) {
      setQuote(null);
      setQuoteError(null);
    }
  }, [visible, tier?.feature_key, estateId]);

  const handleSelectDuration = (duration: AiCheckoutDuration) => {
    if (duration === selectedDuration || isConfirming) return;
    setSelectedDuration(duration);
    selectedDurationRef.current = duration;

    const featureKey = tier?.feature_key;
    const cacheKey = `${estateId}:${featureKey}:${duration}`;
    const cached = quoteMemoryCache.get(cacheKey);

    if (cached) {
      setQuote(cached);
      setIsLoadingQuote(false);
      setQuoteError(null);
    } else {
      fetchSingleQuote(duration);
    }
  };

  const handleConfirm = async () => {
    if (!quote || isConfirming || isLoadingQuote) return;
    await onConfirm(selectedDuration, quote);
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.backdropContainer}>
        <BlurView intensity={20} tint="dark" style={StyleSheet.absoluteFill} />
        <Pressable style={StyleSheet.absoluteFill} onPress={isConfirming ? undefined : onClose} />

        <View style={styles.sheetContainer}>
          {/* Top Drag Indicator */}
          <View style={styles.dragHandleWrapper}>
            <View style={styles.dragHandle} />
          </View>

          {/* Total Cost of Subscription Card */}
          <View style={styles.totalCard}>
            {isLoadingQuote ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="small" color="#113E55" />
              </View>
            ) : quoteError ? (
              <View style={styles.errorContainer}>
                <Text allowFontScaling={false} style={styles.errorText}>
                  {quoteError}
                </Text>
                <Pressable
                  onPress={() => fetchSingleQuote(selectedDuration)}
                  hitSlop={10}
                  style={styles.retryButton}
                >
                  <Text allowFontScaling={false} style={styles.retryText}>
                    Retry
                  </Text>
                </Pressable>
              </View>
            ) : (
              <Text allowFontScaling={false} style={styles.totalAmount}>
                {formatQuotePrice(quote?.client_total, quote?.currency_code)}
              </Text>
            )}
            <Text allowFontScaling={false} style={styles.totalSubtitle}>
              TOTAL COST OF SUBSCRIPTION
            </Text>
          </View>

          {/* Duration Options */}
          <View style={styles.optionsList}>
            {DURATION_OPTIONS.map((opt) => {
              const isSelected = selectedDuration === opt.duration;
              return (
                <Pressable
                  key={opt.duration}
                  onPress={() => handleSelectDuration(opt.duration)}
                  disabled={isConfirming}
                  style={[styles.optionRow, isSelected && styles.optionRowSelected]}
                >
                  <Text
                    allowFontScaling={false}
                    style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}
                  >
                    {opt.label}
                  </Text>

                  <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                    {isSelected && <Ionicons name="checkmark-sharp" size={14} color="#113E55" />}
                  </View>
                </Pressable>
              );
            })}
          </View>

          {/* Confirm Button */}
          <Pressable
            onPress={handleConfirm}
            disabled={isConfirming || isLoadingQuote || !quote}
            style={[
              styles.confirmButton,
              (isConfirming || isLoadingQuote || !quote) && styles.confirmButtonDisabled,
            ]}
          >
            {isConfirming ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text allowFontScaling={false} style={styles.confirmButtonText}>
                Confirm
              </Text>
            )}
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}

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
    paddingBottom: 40,
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
    fontFamily: 'Inter_18pt-Regular',
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
    fontFamily: 'Inter_18pt-Medium',
  },
  totalAmount: {
    fontFamily: 'UbuntuSans-Bold',
    fontSize: 38,
    lineHeight: 46,
    color: '#113E55',
    fontWeight: '700',
  },
  totalSubtitle: {
    fontFamily: 'UbuntuSans-Medium',
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
  optionRowSelected: {
    backgroundColor: '#EEF2F6',
  },
  optionLabel: {
    fontFamily: 'Inter_18pt-Regular',
    fontSize: 15,
    color: '#113E55',
  },
  optionLabelSelected: {
    color: '#113E55',
    fontFamily: 'Inter_18pt-Medium',
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
  confirmButtonDisabled: {
    opacity: 0.6,
  },
  confirmButtonText: {
    fontFamily: 'Inter_18pt-Medium',
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});
