import { type Dispatch, type SetStateAction } from 'react';
import { View, Text, ScrollView } from 'react-native';
import EstateSvg from '@/src/assets/icons/estate.svg';
import TotalUsersSvg from '@/src/assets/icons/totalusers.svg';
import {
  CarouselDots,
  TrendCard,
} from '@/src/features/ai/components/incidents/result/IncidentResultCards';
import { AnomalyOverviewView } from '@/src/features/ai/utils/anomalyShapes';

export function AnomalyEvidenceSection({
  overview,
  activeEvidenceDot,
  setActiveEvidenceDot,
}: {
  overview: AnomalyOverviewView | undefined;
  activeEvidenceDot: number;
  setActiveEvidenceDot: Dispatch<SetStateAction<number>>;
}) {
  const residentRecords = overview?.evidence_summary?.total_anomalous_residents_instances || 0;
  const visitorRecords = overview?.evidence_summary?.total_anomalous_visitors_instances || 0;

  return (
    <View className="mb-4">
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'UbuntuSans-SemiBold',
          fontSize: 21.88,
          lineHeight: 21.88,
          letterSpacing: 0,
          color: '#113E55',
          marginBottom: 16,
        }}
      >
        EVIDENCE SUMMARY
      </Text>

      <ScrollView
        horizontal
        decelerationRate="fast"
        snapToInterval={227}
        snapToAlignment="start"
        showsHorizontalScrollIndicator={false}
        className="-mx-5"
        contentContainerClassName="items-stretch gap-4 pl-5 pr-5"
        onScroll={(e) => {
          const next = Math.round(e.nativeEvent.contentOffset.x / 227);
          setActiveEvidenceDot(Math.min(Math.max(next, 0), 1));
        }}
        scrollEventThrottle={16}
      >
        <TrendCard
          title={'ACCESS\nLOGS'}
          valueLabel={String(residentRecords)}
          unitLabel="RECORDS"
          body={`Anomalous entry time was detected in ${residentRecords} resident records.`}
          icon={<EstateSvg width={20} height={20} />}
        />
        <TrendCard
          title={'VISITORS\nLOGS'}
          valueLabel={String(visitorRecords)}
          unitLabel="RECORDS"
          body={`Anomalous entry time was detected in ${visitorRecords} visitor records.`}
          icon={<TotalUsersSvg width={20} height={20} />}
        />
      </ScrollView>

      <CarouselDots count={2} activeIndex={activeEvidenceDot} />
    </View>
  );
}
