import { View, Text } from 'react-native';
import AnomalyRadarChart from '@/src/features/ai/components/anomaly/AnomalyRadarChart';
import { GaugeData } from '@/src/features/ai/components/anomaly/modals/GaugeDetailModal';
import { AnomalyUserGaugeCards } from '@/src/features/ai/components/anomaly/user-details/AnomalyUserGaugeCards';
import { anomalyPlotLabel, AnomalyResultsView } from '@/src/features/ai/utils/anomalyShapes';

export function AnomalyUserOverview({
  resultsData,
  gaugeList,
}: {
  resultsData: AnomalyResultsView;
  gaugeList: GaugeData[];
}) {
  return (
    <View style={{ marginBottom: 32 }}>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'UbuntuSans-Medium',
          fontSize: 24,
          color: '#113E55',
          marginBottom: 4,
        }}
      >
        ANOMALY OVERVIEW
      </Text>
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'Inter_18pt-Regular',
          fontSize: 16,
          color: '#8A9A9D',
          marginBottom: 40,
        }}
      >
        Actual VS Expected Data Chart
      </Text>

      <View style={{ alignItems: 'center', marginBottom: 40 }}>
        {(() => {
          const spider = resultsData?.anomaly_overview?.spider_plot;
          if (spider && spider.length > 0) {
            return (
              <AnomalyRadarChart
                labels={spider.map((point) => anomalyPlotLabel(point))}
                series={[
                  {
                    data: spider.map((point) => point.percentage || 0),
                    strokeColor: '#1B998B', // Normal is green
                    fillColor: 'rgba(27, 153, 139, 0.28)',
                    dotColor: '#1B998B',
                  },
                  {
                    data: spider.map((point) => point.instance_percentage || 0),
                    strokeColor: '#F46036', // Instance is redish
                    fillColor: 'rgba(244, 96, 54, 0.28)',
                    dotColor: '#F46036',
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
                  <Text style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: '#8A9A9D' }}>
                    No anomaly data plotted
                  </Text>
                </View>
              </View>
            );
          }
        })()}
      </View>

      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'Inter_18pt-Medium',
          fontSize: 18,
          color: '#113E55',
          marginBottom: 20,
        }}
      >
        These are the top contributing factors
      </Text>

      {/* Pill tags */}
      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32, flexWrap: 'wrap' }}>
        {(() => {
          const factors = resultsData?.anomaly_overview?.spider_plot;

          if (factors && factors.length > 0) {
            return factors.map((factor, index: number) => {
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
              <View>
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}
                >
                  No top contributing factors identified.
                </Text>
              </View>
            );
          }
        })()}
      </View>
      {/* Gauge Cards Section */}
      <AnomalyUserGaugeCards gaugeList={gaugeList} />
    </View>
  );
}
