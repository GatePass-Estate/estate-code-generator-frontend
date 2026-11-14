import { useMemo, type Dispatch, type SetStateAction } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import IncidentAISummaryCard, {
  type AISummarySlide,
} from '@/src/features/ai/components/incidents/result/IncidentAISummaryCard';
import type { AISummaryVariant } from '@/src/features/ai/components/incidents/modals/IncidentAISummaryModal';
import { AnomalyDemographicView, AnomalySummaryView } from '@/src/features/ai/utils/anomalyShapes';

export function AnomalyUserInsight({
  aiState,
  handleGenerateSummary,
  demographic,
  currentSummaryData,
  setModalInitialIndex,
  setShowAiSummaryModal,
}: {
  aiState: 'idle' | 'loading' | 'loaded' | 'forbidden' | 'error';
  handleGenerateSummary: () => Promise<void>;
  demographic: AnomalyDemographicView;
  currentSummaryData: AnomalySummaryView | undefined;
  setModalInitialIndex: Dispatch<SetStateAction<number>>;
  setShowAiSummaryModal: Dispatch<SetStateAction<boolean>>;
}) {
  const slides = useMemo<AISummarySlide[]>(() => {
    const next: AISummarySlide[] = [];
    if (currentSummaryData?.tier1) {
      next.push({
        variant: 'in_house',
        text: currentSummaryData.tier1.executive_summary,
        readTimeLabel: '2 mins Read',
        sourceLabel: 'In house',
      });
    }
    if (currentSummaryData?.tier2) {
      next.push({
        variant: 'third_party',
        text: currentSummaryData.tier2.executive_summary,
        readTimeLabel: '2 mins Read',
        sourceLabel: 'Third Party',
      });
    }
    return next;
  }, [currentSummaryData]);

  const { showDenied: showSummaryUpgrade } = useFeatureGate('access_anomaly_detection_tier_2', {
    notice: 'floating',
    onUpgrade: () =>
      router.push({
        pathname: '/(protected)/(shared-screens)/ai-store/anomaly-detection',
        params: { tab: 'Overview', expandTier: '2' },
      }),
  });

  const openSlide = (variant: AISummaryVariant) => {
    setModalInitialIndex(variant === 'third_party' && slides[0]?.variant === 'in_house' ? 1 : 0);
    setShowAiSummaryModal(true);
  };

  const mode =
    aiState === 'forbidden'
      ? 'locked'
      : aiState === 'loaded' && slides.length
        ? 'generated'
        : 'idle';

  return (
    <View className="mb-8">
      <IncidentAISummaryCard
        mode={mode}
        isLoading={aiState === 'loading'}
        alreadyGenerated={!!(demographic?.has_tier1_summary || demographic?.has_tier2_summary)}
        slides={slides}
        onPress={() => {
          if (mode === 'generated') {
            openSlide(slides[0]?.variant ?? 'in_house');
            return;
          }
          void handleGenerateSummary();
        }}
        onOpenSlide={openSlide}
        onUpgradePress={() => showSummaryUpgrade()}
        readTimeLabel="2 mins Read"
        sourceLabel="In house"
      />
      {aiState === 'error' ? (
        <Text
          allowFontScaling={false}
          className="mt-3 text-center text-caption font-inter-regular text-[#878686]"
        >
          Failed to generate summary. Tap to try again.
        </Text>
      ) : null}
    </View>
  );
}
