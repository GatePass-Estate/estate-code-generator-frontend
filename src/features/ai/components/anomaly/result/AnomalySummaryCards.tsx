import { View, Text, Pressable } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { ResultPlaceCards } from '@/src/features/ai/components/shared/ResultPlaceCards';
import TotalUsersSvg from '@/src/assets/icons/totalusers.svg';
import AnomalyDonutChart from '@/src/features/ai/components/shared/AnomalyDonutChart';
import UserWarningSvg from '@/src/assets/icons/userwarning.svg';
import AlertSvg from '@/src/assets/icons/alert.svg';
import ExportSvg from '@/src/assets/icons/incident-export.svg';
import Button from '@/src/shared/components/Button';
import { AnomalyOverviewView } from '@/src/features/ai/utils/anomalyShapes';

export function AnomalySummaryCards({
  overview,
  userEstateName,
  selectedRangeText,
  getShortLocation,
  handleCycleRange,
  handleExport,
  isActive,
}: {
  overview: AnomalyOverviewView | undefined;
  userEstateName: string | null | undefined;
  selectedRangeText: string;
  getShortLocation: () => string;
  handleCycleRange: () => void;
  handleExport: () => void;
  isActive: boolean;
}) {
  return (
    <>
      {/* Title & Export Row */}
      <View className="flex-row items-start justify-between mb-1.5">
        <View style={{ flex: 1, alignItems: 'flex-start' }}>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'UbuntuSans-Medium',
              fontWeight: '500',
              fontSize: 27.34,
              lineHeight: 27.34,
              letterSpacing: 0,
              textAlign: 'left',
              color: '#113E55',
              width: 259,
            }}
          >
            Your Anomaly{'\n'}Detection{'\n'}Summary
          </Text>
        </View>
        <Button
          label="Export"
          accessibilityLabel="Export"
          hitSlop={8}
          icon={<ExportSvg width={23} height={23} />}
          onPress={handleExport}
        />
      </View>

      {/* Range Dropdown */}
      <Pressable
        onPress={handleCycleRange}
        style={{
          minWidth: 93,
          minHeight: 28,
          maxWidth: '100%',
          borderRadius: 16,
          backgroundColor: '#167A6F', // #1B998B + 20% black overlay
          paddingTop: 5,
          paddingRight: 10,
          paddingBottom: 5,
          paddingLeft: 10,
          gap: 6,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 20,
          alignSelf: 'flex-start',
        }}
        hitSlop={8}
      >
        <Text
          allowFontScaling={false}
          numberOfLines={1}
          style={{ flexShrink: 1 }}
          className="text-[12px] font-inter-medium text-white"
        >
          {selectedRangeText}
        </Text>
        <MaterialIcons
          name="keyboard-arrow-down"
          size={16}
          color="white"
          style={{ flexShrink: 0 }}
        />
      </Pressable>

      <ResultPlaceCards
        className="mb-4"
        name={overview?.demographic?.estate_name || userEstateName || 'Unknown Estate'}
        location={getShortLocation()}
      />

      <View
        style={{
          width: '100%',
          minHeight: 178,
          borderRadius: 16,
          backgroundColor: '#FFFFFF',
          borderWidth: 1,
          borderColor: '#EFF1F3',
          paddingTop: 12,
          paddingHorizontal: 14,
          paddingBottom: 22,
          marginBottom: 20,
        }}
      >
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 9 }}>
          <View
            style={{
              width: 28,
              height: 28,
              borderRadius: 14,
              backgroundColor: '#F6F7F7',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <TotalUsersSvg width={13} height={13} />
          </View>
          <Text
            allowFontScaling={false}
            style={{
              marginLeft: 8,
              fontSize: 14,
              fontFamily: 'Inter_18pt-Medium',
              color: '#113E55',
              lineHeight: 18,
            }}
          >
            Total Users
          </Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View
            style={{
              width: 114,
              alignItems: 'center',
              justifyContent: 'center',
              marginLeft: 4,
            }}
          >
            <AnomalyDonutChart
              size={106}
              isActive={isActive}
              countText={String(overview?.demographic?.total_users || 0)}
              residentPercentage={overview?.demographic?.ratio?.resident?.percentage || 0}
              guestPercentage={overview?.demographic?.ratio?.guest?.percentage || 0}
              securityPercentage={overview?.demographic?.ratio?.security?.percentage || 0}
            />
          </View>

          <View style={{ marginLeft: 22, gap: 10, justifyContent: 'center' }}>
            {(
              [
                ['Guest', '#F25B2A', overview?.demographic?.ratio?.guest],
                ['Resident', '#113E55', overview?.demographic?.ratio?.resident],
                ['Security', '#1B998B', overview?.demographic?.ratio?.security],
              ] as const
            ).map(([label, color, share]) => (
              <View key={label} style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 2,
                    height: 23,
                    borderRadius: 1,
                    backgroundColor: color,
                    marginRight: 9,
                  }}
                />
                <View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontSize: 11.2,
                      fontFamily: 'Inter_18pt-Regular',
                      color: '#113E55',
                      lineHeight: 14,
                    }}
                  >
                    {label}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 3 }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        minWidth: 44,
                        fontSize: 9.5,
                        fontFamily: 'Inter_18pt-Medium',
                        color: '#878686',
                        lineHeight: 12,
                      }}
                    >
                      {share?.percentage || 0}%
                    </Text>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontSize: 9.5,
                        fontFamily: 'Inter_18pt-Medium',
                        color: '#878686',
                        lineHeight: 12,
                      }}
                    >
                      {share?.count || 0} Users
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        </View>
      </View>

      {/* Anomalous & High Risk Events Cards (Dark Navy) */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 32 }}>
        {/* Anomalous Events */}
        <View
          style={{
            flex: 1,
            minHeight: 120,
            borderRadius: 16,
            backgroundColor: '#113E55',
            paddingTop: 16,
            paddingBottom: 16,
            paddingHorizontal: 16,
            justifyContent: 'space-between',
            opacity: 1,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                color: '#CEE5ED',
                lineHeight: 14,
                letterSpacing: 0,
              }}
            >
              Anomalous{'\n'}Events
            </Text>
            <UserWarningSvg width={44} height={44} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'UbuntuSans-Medium',
                fontSize: 34.18,
                lineHeight: 34.18,
                color: '#FFFFFF',
                letterSpacing: 0,
                textAlign: 'center',
              }}
            >
              {overview?.demographic?.total_anomalous_instances || 0}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                lineHeight: 14,
                color: '#CEE5ED',
                letterSpacing: 0,
                opacity: 1,
              }}
            >
              EVENTS
            </Text>
          </View>
        </View>

        {/* High Risk Events */}
        <View
          style={{
            flex: 1,
            minHeight: 120,
            borderRadius: 16,
            backgroundColor: '#113E55',
            paddingTop: 16,
            paddingBottom: 16,
            paddingHorizontal: 16,
            justifyContent: 'space-between',
            opacity: 1,
          }}
        >
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'flex-start',
              justifyContent: 'space-between',
            }}
          >
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                color: '#CEE5ED',
                lineHeight: 14,
                letterSpacing: 0,
              }}
            >
              High Risk{'\n'}Events
            </Text>
            <AlertSvg width={44} height={44} />
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
            <Text
              style={{
                fontFamily: 'UbuntuSans-Medium',
                fontSize: 34.18,
                lineHeight: 34.18,
                color: '#FFFFFF',
                letterSpacing: 0,
                textAlign: 'center',
              }}
            >
              {overview?.demographic?.total_high_risk_instances || 0}
            </Text>
            <Text
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 11.2,
                lineHeight: 14,
                color: '#CEE5ED',
                letterSpacing: 0,
                opacity: 1,
              }}
            >
              EVENTS
            </Text>
          </View>
        </View>
      </View>
    </>
  );
}
