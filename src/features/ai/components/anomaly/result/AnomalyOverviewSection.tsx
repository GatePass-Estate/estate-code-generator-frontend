import { type Dispatch, type SetStateAction } from 'react';
import { type GaugeData } from '@/src/features/ai/components/anomaly/modals/GaugeDetailModal';
import { anomalyPlotLabel, type AnomalyOverviewView } from '@/src/features/ai/utils/anomalyShapes';
import { View, Text, Pressable } from 'react-native';
import AnomalyRadarChart from '@/src/features/ai/components/anomaly/AnomalyRadarChart';
import SemiCircleGauge from '@/src/features/ai/components/anomaly/SemiCircleGauge';

export function AnomalyOverviewSection({
  overview,
  gaugeList,
  gaugeLimit,
  gaugesInView,
  setGaugeLimit,
  setSelectedGaugeIndex,
  setGaugeSectionLayout,
}: {
  overview: AnomalyOverviewView | undefined;
  gaugeList: GaugeData[];
  gaugeLimit: number;
  gaugesInView: boolean;
  setGaugeLimit: Dispatch<SetStateAction<number>>;
  setSelectedGaugeIndex: Dispatch<SetStateAction<number | null>>;
  setGaugeSectionLayout: Dispatch<SetStateAction<{ y: number; height: number } | null>>;
}) {
  return (
    <>
      {/* ANOMALY OVERVIEW Section */}
      <View className="mb-8">
        <Text
          style={{
            fontFamily: 'UbuntuSans-SemiBold',
            fontSize: 21.88,
            lineHeight: 21.88,
            color: '#0A1F29',
            marginBottom: 2,
          }}
        >
          ANOMALY OVERVIEW
        </Text>
        <Text
          style={{
            fontFamily: 'Inter_18pt-Light',
            fontSize: 14,
            lineHeight: 14,
            color: '#878686',
            marginBottom: 32,
          }}
        >
          Normal/Expected Data Chart
        </Text>

        {/* Radar Chart */}
        <View className="items-center justify-center my-2 relative">
          {(() => {
            const spider = overview?.anomaly_overview?.spider_plot;
            if (spider && spider.length > 0) {
              return (
                <AnomalyRadarChart
                  labels={spider.map((point) => anomalyPlotLabel(point))}
                  series={[
                    {
                      data: spider.map((point) => point.percentage || 0),
                      strokeColor: '#1B998B',
                      fillColor: 'rgba(27, 153, 139, 0.28)',
                      dotColor: '#1B998B',
                    },
                  ]}
                />
              );
            } else {
              return (
                <View className="items-center justify-center">
                  <AnomalyRadarChart
                    labels={['', '', '', '', '']}
                    series={[
                      {
                        data: [0, 0, 0, 0, 0],
                        strokeColor: 'transparent',
                        fillColor: 'transparent',
                        dotColor: 'transparent',
                      },
                    ]}
                  />
                  <View
                    style={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      right: 0,
                      bottom: 0,
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    <Text
                      style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: '#8A9A9D' }}
                    >
                      No anomaly data plotted
                    </Text>
                  </View>
                </View>
              );
            }
          })()}
        </View>

        {/* Contributing Factors */}
        <Text
          style={{
            fontFamily: 'Inter_18pt-Medium',
            fontSize: 14,
            lineHeight: 14,
            color: '#0A1F29',
            marginTop: 32,
            marginBottom: 24,
          }}
        >
          These are the top contributing factors
        </Text>

        {/* Factor Chips */}
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 }}>
          {(() => {
            const topFactors = overview?.anomaly_overview?.spider_plot;
            if (topFactors && topFactors.length > 0) {
              return topFactors.map((factor, index: number) => {
                const PALETTE = [
                  { text: '#F46036', bg: '#FFF0F0' },
                  { text: '#113E55', bg: '#E3EDF2' },
                  { text: '#D97706', bg: '#FEF3C7' },
                  { text: '#1B998B', bg: '#E5F5F3' },
                  { text: '#7C3AED', bg: '#F3E8FF' },
                  { text: '#78350F', bg: '#F0E6E1' },
                ];
                const colorSet = PALETTE[index % PALETTE.length];

                return (
                  <View
                    key={`factor-${index}`}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      height: 34,
                      paddingHorizontal: 14,
                      borderRadius: 17,
                      backgroundColor: colorSet.bg,
                      gap: 8,
                    }}
                  >
                    <View
                      style={{
                        width: 10,
                        height: 10,
                        borderRadius: 5,
                        backgroundColor: colorSet.text,
                      }}
                    />
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Inter_18pt-Medium',
                        fontSize: 11.5,
                        color: colorSet.text,
                      }}
                    >
                      {anomalyPlotLabel(factor)}
                    </Text>
                  </View>
                );
              });
            } else {
              return (
                <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
                  No top factors identified yet.
                </Text>
              );
            }
          })()}
        </View>

        {/* Semi-Circle Gauges */}
        <View onLayout={(e) => setGaugeSectionLayout(e.nativeEvent.layout)}>
          {gaugeList.length > 0 ? (
            <>
              {gaugeList.slice(0, gaugeLimit).map((gauge, index) => (
                <Pressable
                  key={`gauge-${index}`}
                  onPress={() => setSelectedGaugeIndex(index)}
                  style={{
                    width: '100%',
                    marginBottom: 12,
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
                    animate={gaugesInView}
                  />

                  <View style={{ alignSelf: 'stretch', gap: 8 }}>
                    <View className="flex-row items-center" style={{ gap: 10 }}>
                      <View
                        className="rounded-full"
                        style={{ width: 8, height: 8, backgroundColor: gauge.color }}
                      />
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Medium',
                          fontSize: 14,
                          color: '#0A1F29',
                        }}
                      >
                        {gauge.title}
                      </Text>
                    </View>
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
                  </View>
                </Pressable>
              ))}
              {gaugeList.length > gaugeLimit && (
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
              )}
            </>
          ) : (
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 13,
                color: '#878686',
                textAlign: 'center',
                marginVertical: 20,
              }}
            >
              No contributing factors found
            </Text>
          )}
        </View>
      </View>
    </>
  );
}
