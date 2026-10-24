import React, { useEffect, useRef } from 'react';
import {
  Animated as RNAnimated,
  Modal,
  PanResponder,
  Pressable,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Line } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { UbuntuSans } from '@/src/constants/fonts';

type SeatCapacitySheetProps = {
  visible: boolean;
  onClose: () => void;
  currentCapacity: number;
  maxCapacity: number;
  residentsCount: number;
  securityPersonnelCount: number;
};

const TOTAL_TICKS = 54;
const GAUGE_SIZE = 190;
const RADIUS = GAUGE_SIZE / 2;
const INNER_R = RADIUS - 26;
const OUTER_R = RADIUS - 10;
const CX = RADIUS;
const CY = RADIUS;

function RadialSeatGauge({
  totalSeats,
  residentsCount,
  securityCount,
  vacantCount,
}: {
  totalSeats: number;
  residentsCount: number;
  securityCount: number;
  vacantCount: number;
}) {
  const sum = residentsCount + securityCount + vacantCount;

  // Calculate proportional tick counts
  const orangeTicks = sum > 0 ? Math.round((residentsCount / sum) * TOTAL_TICKS) : 0;
  const tealTicks = sum > 0 ? Math.round((securityCount / sum) * TOTAL_TICKS) : 0;
  const grayTicks = Math.max(0, TOTAL_TICKS - orangeTicks - tealTicks);

  // Clockwise order starting at -140 degrees (approx 10 o'clock):
  // 1. Orange (Residents) over the top
  // 2. Gray (Vacant) along the right and bottom
  // 3. Teal (Security) along the left back to -140 degrees
  const ticks = Array.from({ length: TOTAL_TICKS }, (_, i) => {
    const angleDeg = -140 + i * (360 / TOTAL_TICKS);
    const angleRad = (angleDeg * Math.PI) / 180;
    const x1 = CX + INNER_R * Math.cos(angleRad);
    const y1 = CY + INNER_R * Math.sin(angleRad);
    const x2 = CX + OUTER_R * Math.cos(angleRad);
    const y2 = CY + OUTER_R * Math.sin(angleRad);

    let strokeColor = '#9CA3AF'; // Light Gray for Vacant
    if (i < orangeTicks) {
      strokeColor = '#EE5D32'; // Orange for Residents
    } else if (i >= orangeTicks + grayTicks) {
      strokeColor = '#0D7F77'; // Teal for Security
    }

    return (
      <Line
        key={i}
        x1={x1}
        y1={y1}
        x2={x2}
        y2={y2}
        stroke={strokeColor}
        strokeWidth={2.8}
        strokeLinecap="round"
      />
    );
  });

  return (
    <View style={{ alignItems: 'center', justifyContent: 'center', marginVertical: 8 }}>
      <View style={{ width: GAUGE_SIZE, height: GAUGE_SIZE, position: 'relative' }}>
        <Svg width={GAUGE_SIZE} height={GAUGE_SIZE}>
          {ticks}
        </Svg>
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
            allowFontScaling={false}
            style={{
              fontFamily: 'Inter_18pt-Medium',
              fontSize: 10.5,
              color: '#7C8084',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              marginBottom: 2,
            }}
          >
            TOTAL SEATS
          </Text>
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: UbuntuSans.bold,
              fontSize: 36,
              color: '#0A1F29',
              lineHeight: 40,
            }}
          >
            {totalSeats.toLocaleString()}
          </Text>
        </View>
      </View>
    </View>
  );
}

export default function SeatCapacitySheet({
  visible,
  onClose,
  currentCapacity,
  maxCapacity,
  residentsCount,
  securityPersonnelCount,
}: SeatCapacitySheetProps) {
  const insets = useSafeAreaInsets();
  const panY = useRef(new RNAnimated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      panY.setValue(0);
    }
  }, [visible, panY]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.6) {
          RNAnimated.timing(panY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          RNAnimated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const handlePanResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 2,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 100 || gestureState.vy > 0.6) {
          RNAnimated.timing(panY, {
            toValue: 600,
            duration: 180,
            useNativeDriver: true,
          }).start(() => {
            onClose();
          });
        } else {
          RNAnimated.spring(panY, {
            toValue: 0,
            bounciness: 4,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  const occupiedSeats = residentsCount + securityPersonnelCount;
  const vacantSeats = Math.max(0, maxCapacity - occupiedSeats);

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable
        style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.45)', justifyContent: 'flex-end' }}
        onPress={onClose}
      >
        <RNAnimated.View
          {...panResponder.panHandlers}
          style={{
            transform: [{ translateY: panY }],
            backgroundColor: '#F8F9FA',
            borderTopLeftRadius: 36,
            borderTopRightRadius: 36,
            paddingHorizontal: 20,
            paddingTop: 8,
            paddingBottom: Math.max(insets.bottom, 16) + 16,
          }}
        >
          {/* Top Handle Drag Zone */}
          <View
            {...handlePanResponder.panHandlers}
            style={{
              paddingTop: 8,
              paddingBottom: 16,
              alignItems: 'center',
              width: '100%',
            }}
          >
            <View
              style={{
                width: 120,
                height: 5,
                borderRadius: 3,
                backgroundColor: '#9B9797',
              }}
            />
          </View>

          {/* Radial Meter Gauge */}
          <RadialSeatGauge
            totalSeats={maxCapacity}
            residentsCount={residentsCount}
            securityCount={securityPersonnelCount}
            vacantCount={vacantSeats}
          />

          {/* Side by Side Capacity Cards */}
          <View
            style={{
              flexDirection: 'row',
              gap: 12,
              marginTop: 14,
            }}
          >
            {/* Current Seat Capacity */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 12,
                  color: '#878686',
                  marginBottom: 6,
                }}
              >
                Current Seat Capacity
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: UbuntuSans.bold,
                  fontSize: 24,
                  color: '#0A1F29',
                }}
              >
                {occupiedSeats.toLocaleString()}
              </Text>
            </View>

            {/* Max Seat Capacity */}
            <View
              style={{
                flex: 1,
                backgroundColor: '#FFFFFF',
                borderRadius: 16,
                padding: 16,
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 12,
                  color: '#878686',
                  marginBottom: 6,
                }}
              >
                Max Seat Capacity
              </Text>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: UbuntuSans.bold,
                  fontSize: 24,
                  color: '#0A1F29',
                }}
              >
                {maxCapacity.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Seat Allocation Card */}
          <View
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 16,
              padding: 16,
              marginTop: 12,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Inter_18pt-SemiBold',
                fontSize: 13,
                color: '#0A1F29',
                marginBottom: 14,
              }}
            >
              Seat Allocation
            </Text>

            {/* Residents Row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#EE5D32',
                    marginRight: 10,
                  }}
                />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Regular',
                    fontSize: 14,
                    color: '#6B7280',
                  }}
                >
                  Residents
                </Text>
              </View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 14,
                  color: '#0A1F29',
                }}
              >
                {residentsCount.toLocaleString()}
              </Text>
            </View>

            {/* Security Row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 12,
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#0D7F77',
                    marginRight: 10,
                  }}
                />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Regular',
                    fontSize: 14,
                    color: '#6B7280',
                  }}
                >
                  Security
                </Text>
              </View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 14,
                  color: '#0A1F29',
                }}
              >
                {securityPersonnelCount.toLocaleString()}
              </Text>
            </View>

            {/* Vacant Seats Row */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
              }}
            >
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <View
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: 4,
                    backgroundColor: '#D1D5DB',
                    marginRight: 10,
                  }}
                />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Regular',
                    fontSize: 14,
                    color: '#6B7280',
                  }}
                >
                  Vacant Seats
                </Text>
              </View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 14,
                  color: '#0A1F29',
                }}
              >
                {vacantSeats.toLocaleString()}
              </Text>
            </View>
          </View>

          {/* Done Action Button */}
          <TouchableOpacity
            activeOpacity={0.85}
            onPress={onClose}
            style={{
              backgroundColor: '#113E55',
              height: 50,
              borderRadius: 25,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 24,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: UbuntuSans.medium,
                fontSize: 15,
                color: '#FFFFFF',
              }}
            >
              Done
            </Text>
          </TouchableOpacity>
        </RNAnimated.View>
      </Pressable>
    </Modal>
  );
}
