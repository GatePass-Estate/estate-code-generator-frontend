import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import SemiCircleGauge from '@/src/features/ai/components/anomaly/SemiCircleGauge';
import GaugeDetailModal, {
  GaugeData,
} from '@/src/features/ai/components/anomaly/modals/GaugeDetailModal';

export const AnomalyUserGaugeCards = function AnomalyUserGaugeCards({
  gaugeList,
}: {
  gaugeList: GaugeData[];
}) {
  const [gaugeLimit, setGaugeLimit] = useState(2);
  const [selectedGaugeIndex, setSelectedGaugeIndex] = useState<number | null>(null);

  return (
    <>
      <View style={{ gap: 16 }}>
        {gaugeList.length > 0 ? (
          <>
            {gaugeList.slice(0, gaugeLimit).map((gauge, index: number) => (
              <Pressable
                key={`gauge-${index}`}
                onPress={() => setSelectedGaugeIndex(index)}
                style={{
                  width: '100%',
                  borderRadius: 16,
                  backgroundColor: '#FFFFFF',
                  paddingHorizontal: 32,
                  paddingVertical: 16,
                  alignItems: 'center',
                  gap: 32,
                }}
              >
                <SemiCircleGauge
                  percentage={gauge.percentage}
                  color={gauge.arcColor || gauge.color}
                  size={130}
                  animate={true}
                />
                <View style={{ alignSelf: 'stretch', gap: 8 }}>
                  <View className="flex-row items-center" style={{ gap: 10 }}>
                    <View
                      className="rounded-full"
                      style={{ width: 8, height: 8, backgroundColor: gauge.color }}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 14, color: '#0A1F29' }}
                    >
                      {gauge.title}
                    </Text>
                  </View>
                  {gauge.description ? (
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Inter_18pt-Regular',
                        fontSize: 11.2,
                        lineHeight: 14,
                        color: '#878686',
                      }}
                    >
                      {gauge.description}
                    </Text>
                  ) : null}
                </View>
              </Pressable>
            ))}
            {gaugeList.length > gaugeLimit ? (
              <Pressable
                onPress={() => setGaugeLimit((l) => l + 2)}
                style={{ alignItems: 'center', paddingVertical: 12 }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'UbuntuSans-SemiBold', fontSize: 14, color: '#113E55' }}
                >
                  Load More
                </Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text
            allowFontScaling={false}
            style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}
          >
            No gauges found.
          </Text>
        )}
      </View>

      <GaugeDetailModal
        visible={selectedGaugeIndex !== null}
        onClose={() => setSelectedGaugeIndex(null)}
        gaugeData={selectedGaugeIndex !== null ? gaugeList[selectedGaugeIndex] : null}
        onNext={() =>
          selectedGaugeIndex !== null &&
          setSelectedGaugeIndex((selectedGaugeIndex + 1) % gaugeList.length)
        }
        onPrev={() =>
          selectedGaugeIndex !== null &&
          setSelectedGaugeIndex((selectedGaugeIndex - 1 + gaugeList.length) % gaugeList.length)
        }
      />
    </>
  );
};
