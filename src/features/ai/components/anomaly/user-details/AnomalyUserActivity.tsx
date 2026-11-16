import { View, Text, ScrollView } from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { AnomalyCaseHistoryRecord } from '@/src/features/ai/services/anomaly';

export function AnomalyUserActivity({
  historyRecords,
  loading = false,
}: {
  historyRecords: AnomalyCaseHistoryRecord[];
  loading?: boolean;
}) {
  return (
    <>
      {/* Recent Activity */}
      <View style={{ marginBottom: 24 }}>
        <Text
          allowFontScaling={false}
          style={{
            fontFamily: 'Inter_18pt-Medium',
            fontSize: 9,
            lineHeight: 9,
            color: '#878686',
            textTransform: 'uppercase',
            marginBottom: 24,
          }}
        >
          RECENT ACTIVITY
        </Text>
        <ScrollView
          style={{ maxHeight: 258 }}
          showsVerticalScrollIndicator={false}
          nestedScrollEnabled={true}
        >
          <View style={{ position: 'relative' }}>
            {/* Dashed Line Background - starts from center of first card (top: 39) */}
            {historyRecords.length > 0 ? (
              <Svg
                height={historyRecords.length * 90}
                width="2"
                style={{ position: 'absolute', top: 39, left: 12, zIndex: 1 }}
              >
                <Line
                  x1="1"
                  y1="0"
                  x2="1"
                  y2="100%"
                  stroke="#878686"
                  strokeWidth="1.4"
                  strokeDasharray="2.8, 2.8"
                />
              </Svg>
            ) : null}

            <View style={{ gap: 12 }}>
              {loading ? (
                <View className="items-center py-6">
                  <CircleLoader size={36} />
                </View>
              ) : historyRecords.length > 0 ? (
                historyRecords.map((record, index: number) => {
                  const sev = (record.severity || 'low').toLowerCase();
                  let bgColor = '#1B998B1F';
                  let textColor = '#1B998B';
                  if (sev === 'high') {
                    bgColor = '#F61C1C1F';
                    textColor = '#E30404';
                  } else if (sev === 'medium') {
                    bgColor = '#FBFBEE';
                    textColor = '#D97706';
                  }
                  const d = new Date(record.validated_at);
                  const timeString = isNaN(d.getTime())
                    ? '--:--'
                    : d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const dateString = isNaN(d.getTime())
                    ? 'N/A'
                    : `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

                  return (
                    <View
                      key={`history-${index}`}
                      style={{ flexDirection: 'row', alignItems: 'center', gap: 24 }}
                    >
                      <View
                        style={{
                          width: 26,
                          height: 26,
                          borderRadius: 13,
                          borderWidth: 1.4,
                          borderColor: '#8A9A9D',
                          backgroundColor: '#F6F7F7',
                          alignItems: 'center',
                          justifyContent: 'center',
                          zIndex: 10,
                        }}
                      >
                        <View
                          style={{
                            width: 14,
                            height: 14,
                            borderRadius: 7,
                            backgroundColor: '#8A9A9D',
                          }}
                        />
                      </View>
                      <View
                        style={{
                          flex: 1,
                          height: 78,
                          backgroundColor: '#FFFFFF',
                          borderRadius: 16,
                          paddingHorizontal: 16,
                          paddingVertical: 12,
                          justifyContent: 'space-between',
                        }}
                      >
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Inter_18pt-Regular',
                            fontSize: 13,
                            color: '#8A9A9D',
                          }}
                        >
                          {timeString} • {dateString}
                        </Text>
                        <View
                          style={{
                            flexDirection: 'row',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                          }}
                        >
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontFamily: 'UbuntuSans-SemiBold',
                              fontSize: 22,
                              lineHeight: 22,
                              color: '#113E55',
                            }}
                          >
                            {record.validated_code || 'N/A'}
                          </Text>
                          <View
                            style={{
                              backgroundColor: bgColor,
                              paddingHorizontal: 16,
                              height: 28,
                              justifyContent: 'center',
                              alignItems: 'center',
                              borderRadius: 16,
                            }}
                          >
                            <Text
                              allowFontScaling={false}
                              style={{
                                fontFamily: 'Inter_18pt-Regular',
                                fontSize: 11.2,
                                lineHeight: 11.2,
                                color: textColor,
                                textTransform: 'uppercase',
                              }}
                            >
                              {sev === 'medium' ? 'MED' : record.severity || 'Normal'}
                            </Text>
                          </View>
                        </View>
                      </View>
                    </View>
                  );
                })
              ) : (
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}
                >
                  No recent activity found.
                </Text>
              )}
            </View>
          </View>
        </ScrollView>
      </View>
    </>
  );
}
