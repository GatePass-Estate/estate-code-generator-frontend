import { View, Text, Image, Animated } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import TotalUsersSvg from '@/src/assets/icons/totalusers.svg';
import GuestMaleSvg from '@/src/assets/images/guestmale.svg';
import GuestFemaleSvg from '@/src/assets/images/guestfemale.svg';
import { AnomalyDemographicView } from '@/src/features/ai/utils/anomalyShapes';

export function AnomalyUserProfileCard({
  demo,
  dateRangeText,
  accentColor,
  pulseAnim,
  isFetchingPicture,
  isGuest,
  isFemale,
  profilePicUri,
}: {
  demo: AnomalyDemographicView;
  dateRangeText: string;
  accentColor: string;
  pulseAnim: Animated.Value;
  isFetchingPicture: boolean;
  isGuest: boolean;
  isFemale: boolean;
  profilePicUri: string | null;
}) {
  return (
    <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24, marginBottom: 24 }}>
      {/* Header */}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 28 }}>
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
          <TotalUsersSvg width={14} height={14} color="#113E55" />
        </View>
        <View>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Inter_18pt-Medium',
              fontSize: 14,
              lineHeight: 14,
              color: '#113E55',
              marginBottom: 4,
            }}
          >
            {demo.display_name || demo.name || 'Unknown User'}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 9,
                lineHeight: 11,
                color: '#8A9A9D',
              }}
            >
              {dateRangeText || (demo.user_id ? 'Verified User' : 'N/A')}
            </Text>
          </View>
        </View>
      </View>

      {/* Avatar and Stats */}
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 28,
          flexWrap: 'wrap',
          justifyContent: 'center',
        }}
      >
        {/* Dashed Avatar Circle */}
        <View style={{ width: 120, height: 120, alignItems: 'center', justifyContent: 'center' }}>
          <Animated.View
            style={{
              position: 'absolute',
              transform: [{ scale: pulseAnim }],
              opacity: pulseAnim.interpolate({ inputRange: [1, 1.03], outputRange: [1, 0.7] }),
            }}
          >
            <Svg width="120" height="120" viewBox="0 0 120 120">
              <Circle
                cx="60"
                cy="60"
                r="52"
                stroke={accentColor}
                strokeWidth="8"
                strokeDasharray="2 6"
                fill="none"
              />
            </Svg>
          </Animated.View>
          <View style={{ backgroundColor: '#EEF0F2', borderRadius: 44, padding: 5 }}>
            {isFetchingPicture ? (
              !isGuest ? (
                <View
                  style={{
                    width: 78,
                    height: 78,
                    borderRadius: 39,
                    backgroundColor: '#EFF1F3',
                  }}
                />
              ) : isFemale ? (
                <GuestFemaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
              ) : (
                <GuestMaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
              )
            ) : demo.avatar_url || profilePicUri ? (
              <Image
                source={{ uri: demo.avatar_url || profilePicUri! }}
                style={{ width: 78, height: 78, borderRadius: 39 }}
              />
            ) : isGuest ? (
              isFemale ? (
                <GuestFemaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
              ) : (
                <GuestMaleSvg width={78} height={78} style={{ borderRadius: 39 }} />
              )
            ) : (
              <View
                style={{ width: 78, height: 78, borderRadius: 39, backgroundColor: '#EFF1F3' }}
              />
            )}
          </View>
        </View>

        {/* Stats List */}
        <View style={{ flex: 1, gap: 16 }}>
          {/* Stat 1 */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
            <View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 9,
                  lineHeight: 9,
                  color: '#878686',
                  marginBottom: 2,
                }}
              >
                User Type
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 11,
                  lineHeight: 11,
                  color: '#04162D',
                  textTransform: 'capitalize',
                }}
              >
                {demo.user_type || 'Unknown'}
              </Text>
            </View>
          </View>

          {/* Stat 2 */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
            <View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 9,
                  lineHeight: 9,
                  color: '#878686',
                  marginBottom: 2,
                }}
              >
                Avg. Entries / Week
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 11,
                  lineHeight: 11,
                  color: '#04162D',
                }}
              >
                {demo.average_entry_per_week?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>

          {/* Stat 3 */}
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ width: 3, backgroundColor: accentColor, borderRadius: 2 }} />
            <View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 9,
                  lineHeight: 9,
                  color: '#878686',
                  marginBottom: 2,
                }}
              >
                Total Entries
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 11,
                  lineHeight: 11,
                  color: '#04162D',
                }}
              >
                {demo.total_entries || '0'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
}
