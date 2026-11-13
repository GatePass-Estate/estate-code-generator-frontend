import { type Dispatch, type SetStateAction } from 'react';
import { View, Text, Pressable } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { router } from 'expo-router';
import { MaterialIcons, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import UpAndDownSvg from '@/src/assets/icons/upanddown.svg';
import TableEmptyState from '@/src/features/ai/components/shared/TableEmptyState';
import { AnomalyPredictionRow } from '@/src/features/ai/utils/anomalyShapes';

export function AnomalyUserTable({
  predictions,
  totalPredictionsCount,
  startDate,
  endDate,
  setPaginationLimit,
  setFilterModalVisible,
  setOrderModalVisible,
  predictionsFetching,
}: {
  predictions: AnomalyPredictionRow[];
  totalPredictionsCount: number;
  startDate: Date | null;
  endDate: Date | null;
  setPaginationLimit: Dispatch<SetStateAction<number>>;
  setFilterModalVisible: Dispatch<SetStateAction<boolean>>;
  setOrderModalVisible: Dispatch<SetStateAction<boolean>>;
  predictionsFetching: boolean;
}) {
  return (
    <>
      {/* USER OVERVIEW Section */}
      <View style={{ marginBottom: 32, marginTop: 24 }}>
        {/* Alignment Row: width 333, height 36, left 22 */}
        <View
          style={{
            width: '100%',
            maxWidth: 333,
            height: 36,
            borderRadius: 16,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            alignSelf: 'center',
            marginBottom: 16,
            opacity: 1,
          }}
        >
          <Text
            style={{
              width: 173,
              height: 26,
              fontFamily: 'UbuntuSans-SemiBold',
              fontWeight: '600',
              fontSize: 21.88,
              lineHeight: 26,
              letterSpacing: 0,
              color: '#113E55',
              opacity: 1,
            }}
          >
            USER OVERVIEW
          </Text>
          <Pressable
            onPress={() => setFilterModalVisible(true)}
            style={{
              width: 52,
              height: 36,
              borderRadius: 16,
              backgroundColor: '#113E55',
              paddingTop: 4,
              paddingRight: 16,
              paddingBottom: 4,
              paddingLeft: 16,
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: 1,
            }}
            hitSlop={8}
          >
            <Ionicons name="options-outline" size={18} color="white" />
          </Pressable>
        </View>

        <View className="w-full gap-3.5 rounded-[16px] bg-white p-4">
          {predictions.length === 0 ? (
            <TableEmptyState
              icon={
                <MaterialCommunityIcons name="account-search-outline" size={22} color="#878686" />
              }
              title="No suspicious users"
              subtitle="No anomalous access was detected in this period. Try another date range."
            />
          ) : (
            <>
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingBottom: 10,
                  borderBottomWidth: 1,
                  borderBottomColor: '#F0F2F4',
                }}
              >
                <Text
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontWeight: '500',
                    fontSize: 8.96,
                    lineHeight: 11,
                    letterSpacing: 0,
                    color: '#8A9A9D',
                    width: 32,
                  }}
                >
                  RANK
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontWeight: '500',
                    fontSize: 8.96,
                    lineHeight: 11,
                    letterSpacing: 0,
                    color: '#8A9A9D',
                    flex: 1,
                    marginLeft: 8,
                  }}
                >
                  USER
                </Text>
                <Text
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontWeight: '500',
                    fontSize: 8.96,
                    lineHeight: 11,
                    letterSpacing: 0,
                    color: '#8A9A9D',
                    width: 90,
                    textAlign: 'center',
                  }}
                >
                  SEVERITY
                </Text>
                <Pressable
                  onPress={() => setOrderModalVisible(true)}
                  hitSlop={8}
                  style={{
                    width: 25,
                    height: 25,
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <UpAndDownSvg width={25} height={25} />
                </Pressable>
              </View>
              {predictions.map((row, index: number) => {
                const severityRaw = (row.severity || 'LOW').toUpperCase();
                const severityStr = severityRaw === 'MEDIUM' ? 'MED' : severityRaw;
                let badgeBg = 'bg-[#1B998B1F]';
                let badgeText = '#1B998B';
                if (severityStr === 'HIGH') {
                  badgeBg = 'bg-[#F61C1C1F]';
                  badgeText = '#E30404';
                } else if (severityStr === 'MED') {
                  badgeBg = 'bg-[#FBFBEE]';
                  badgeText = '#D97706';
                }

                return (
                  <Pressable
                    key={row.prediction_id || row.id || row.user_id || index}
                    onPress={() => {
                      const idToUse = row.prediction_id || row.id || row.user_id;
                      if (!idToUse) return;
                      router.push({
                        pathname: `/(protected)/(shared-screens)/ai-store/anomaly-detection/user/${idToUse}`,
                        params: {
                          gender: row.gender || '',
                          user_type: row.user_type || row.role || '',
                          display_name: row.display_name || row.name || '',
                          date_from: startDate ? startDate.toISOString() : '',
                          date_to: endDate ? endDate.toISOString() : '',
                        },
                      });
                    }}
                    style={{
                      flexDirection: 'row',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                    }}
                  >
                    <Text
                      style={{
                        fontFamily: 'Inter_18pt-Regular',
                        fontSize: 11.2,
                        color: '#8A9A9D',
                        width: 32,
                        marginLeft: 12,
                      }}
                    >
                      {index + 1}
                    </Text>

                    <View style={{ flex: 1, marginLeft: 2 }}>
                      <Text
                        style={{
                          fontFamily: 'Inter_18pt-Regular',
                          fontSize: 13,
                          color: '#113E55',
                        }}
                      >
                        {row.display_name || row.name || 'Unknown User'}
                      </Text>
                      <Text
                        style={{
                          fontFamily: 'Inter_18pt-Regular',
                          fontSize: 10.5,
                          color: '#8A9A9D',
                          textTransform: 'capitalize',
                        }}
                      >
                        {(row.user_type || row.role || 'Guest').toLowerCase() === 'visitor'
                          ? 'Guest'
                          : row.user_type || row.role || 'Guest'}
                      </Text>
                    </View>
                    <View style={{ width: 90, alignItems: 'center' }}>
                      <View
                        className={`px-4 h-[28px] items-center justify-center rounded-full ${badgeBg}`}
                      >
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Inter_18pt-Regular',
                            fontSize: 11.2,
                            lineHeight: 11.2,
                            color: badgeText,
                            textTransform: 'uppercase',
                          }}
                        >
                          {severityStr}
                        </Text>
                      </View>
                    </View>
                    <View style={{ width: 25, alignItems: 'center' }}>
                      <MaterialIcons name="chevron-right" size={18} color="#8A9A9D" />
                    </View>
                  </Pressable>
                );
              })}
            </>
          )}

          {/* Load More */}
          {predictions.length > 0 && predictions.length < totalPredictionsCount && (
            <Pressable
              onPress={() => setPaginationLimit((l) => l + 5)}
              style={{ alignItems: 'center', paddingTop: 24, paddingBottom: 16 }}
              hitSlop={8}
              disabled={predictionsFetching}
            >
              {predictionsFetching ? (
                <CircleLoader size={32} />
              ) : (
                <Text
                  style={{
                    fontFamily: 'UbuntuSans-SemiBold',
                    fontSize: 14,
                    color: '#113E55',
                  }}
                >
                  Load More
                </Text>
              )}
            </Pressable>
          )}
        </View>
      </View>
    </>
  );
}
