import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Image,
  RefreshControl,
  BackHandler,
  useWindowDimensions,
  StyleSheet,
  Modal,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { Feather } from '@expo/vector-icons';
import { Stack, useFocusEffect, useRouter } from 'expo-router';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback } from 'react';
import icons from '@/src/shared/constants/icons';
import RoleIcon from '@/src/shared/components/RoleIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AdminToolsSvg from '@/src/assets/images/admintools.svg';
import AdminResidentsSvg from '@/src/assets/images/adminresidents.svg';
import AdminSecuritySvg from '@/src/assets/images/adminsecurity.svg';
import AdminIncidentResponseSvg from '@/src/assets/images/adminincidentresponse.svg';
import SeatsSvg from '@/src/assets/images/seats.svg';
import SeatCapacitySheet from '@/src/features/billing/components/SeatCapacitySheet';
import { useAdminDashboard } from '@/src/features/admin/hooks/useAdminDashboard';

export default function AdminUsersMobilePage() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const router = useRouter();
  const {
    isInitialLoading,
    refreshing,
    handleRefresh,
    handleBack,
    handleOpenBroadcast,
    handleOpenIncidentReport,
    handleOpenAddSeats,
    handleRegisterUser,
    openUser,
    residentsCount,
    securityPersonnelCount,
    seatResidentsCount,
    occupiedSeats,
    totalUsersCount,
    estateUserCapacity,
    isPrimaryAdmin,
    limitedUsers,
    seatModalVisible,
    setSeatModalVisible,
    blockedRegistrationReason,
    setBlockedRegistrationReason,
  } = useAdminDashboard();

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });

      return () => subscription.remove();
    }, [handleBack])
  );

  const illustrationWidth = Math.min(screenWidth - 32, 340);
  const illustrationHeight = Math.round(illustrationWidth * (246 / 353));

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7F7' }}>
      {/* Status icons come from AndroidNavBarGlobal (light on /admin, dark everywhere else). */}
      <Stack.Screen options={{ headerShown: false }} />

      {/* Top Bounce Background for iOS */}
      <View
        style={{
          position: 'absolute',
          top: -500,
          left: 0,
          right: 0,
          height: 500,
          backgroundColor: '#14659B',
        }}
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor="#FFFFFF"
            colors={['#14659B']}
          />
        }
      >
        {/* Top Header with Gradient & Glow */}
        <View style={{ position: 'relative' }}>
          <LinearGradient
            colors={['#14659B', '#1E6B9E', '#2C6492', '#4B8BAA', '#8EB6C8', '#F6F7F7', '#F6F7F7']}
            locations={[0, 0.35, 0.76, 0.83, 0.87, 0.91, 1.0]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={StyleSheet.absoluteFill}
          />

          {/* Radiant Glow in #1B998B behind illustration */}
          <Svg style={StyleSheet.absoluteFill} width="100%" height="100%" pointerEvents="none">
            <Defs>
              <RadialGradient id="adminGlow" cx="80%" cy="32%" rx="55%" ry="45%" fx="80%" fy="32%">
                <Stop offset="0%" stopColor="#1B998B" stopOpacity="0.85" />
                <Stop offset="55%" stopColor="#1B998B" stopOpacity="0.35" />
                <Stop offset="100%" stopColor="#1B998B" stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Rect x="0" y="0" width="100%" height="100%" fill="url(#adminGlow)" />
          </Svg>

          <View
            style={{
              paddingTop: insets.top + 19,
              paddingHorizontal: 20,
              paddingBottom: 16,
            }}
          >
            {/* Top Bar with Back and Add Seats — same 20px edge as More / Broadcast */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
              }}
            >
              <TouchableOpacity
                onPress={handleBack}
                accessibilityRole="button"
                accessibilityLabel="Back"
                hitSlop={12}
                style={{
                  // Match shared Back short-arrow hit target (30×30), light style for the dark header.
                  width: 30,
                  height: 30,
                  borderRadius: 15,
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="chevron-left" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenAddSeats}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  width: 100,
                  height: 34,
                  backgroundColor: 'rgba(255, 255, 255, 0.3)',
                  borderRadius: 8,
                  padding: 10,
                  alignItems: 'center',
                  justifyContent: 'center',
                  opacity: isPrimaryAdmin ? 1 : 0.45,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-SemiBold',
                    fontSize: 11.2,
                    color: '#F6F7F7',
                    textAlign: 'center',
                  }}
                >
                  Add Seats
                </Text>
              </TouchableOpacity>
            </View>

            {/* Hero Illustration */}
            <View
              style={{
                alignItems: 'center',
                justifyContent: 'center',
                marginVertical: 6,
              }}
            >
              <AdminToolsSvg width={illustrationWidth} height={illustrationHeight} />
            </View>

            {/* 3 Metrics Pills */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 8,
                marginTop: 12,
              }}
            >
              {/* Residents */}
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/admin/users', params: { role: 'resident' } })
                }
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  gap: 8,
                }}
              >
                <AdminResidentsSvg width={24} height={24} />
                <View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'UbuntuSans-SemiBold',
                      fontSize: 21.88,
                      color: '#FFFFFF',
                      lineHeight: 22,
                      letterSpacing: 0,
                    }}
                  >
                    {residentsCount}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Medium',
                      fontSize: 8.5,
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                      marginTop: 2,
                    }}
                  >
                    RESIDENTS
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Security */}
              <TouchableOpacity
                onPress={() =>
                  router.push({ pathname: '/admin/users', params: { role: 'security' } })
                }
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  gap: 8,
                }}
              >
                <AdminSecuritySvg width={24} height={24} />
                <View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'UbuntuSans-SemiBold',
                      fontSize: 21.88,
                      color: '#FFFFFF',
                      lineHeight: 22,
                      letterSpacing: 0,
                    }}
                  >
                    {securityPersonnelCount}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Medium',
                      fontSize: 8.5,
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                      marginTop: 2,
                    }}
                  >
                    SECURITY
                  </Text>
                </View>
              </TouchableOpacity>

              {/* Seats */}
              <TouchableOpacity
                onPress={() => setSeatModalVisible(true)}
                activeOpacity={0.8}
                style={{
                  flex: 1,
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: 'rgba(255, 255, 255, 0.18)',
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  borderWidth: 1,
                  borderRadius: 14,
                  paddingVertical: 10,
                  paddingHorizontal: 10,
                  gap: 8,
                }}
              >
                <SeatsSvg width={22} height={22} />
                <View>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'UbuntuSans-SemiBold',
                      fontSize: 21.88,
                      color: '#FFFFFF',
                      lineHeight: 22,
                      letterSpacing: 0,
                    }}
                  >
                    {estateUserCapacity ?? totalUsersCount}
                  </Text>
                  <Text
                    allowFontScaling={false}
                    style={{
                      fontFamily: 'Inter_18pt-Medium',
                      fontSize: 8.5,
                      color: '#FFFFFF',
                      letterSpacing: 0.5,
                      marginTop: 2,
                    }}
                  >
                    SEATS
                  </Text>
                </View>
              </TouchableOpacity>
            </View>

            {/* Quick Actions Card (gradient stops at half of the card) */}
            <View
              style={{
                backgroundColor: '#FFFFFF',
                borderRadius: 18,
                paddingVertical: 14,
                paddingHorizontal: 12,
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-around',
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.06,
                shadowRadius: 10,
                elevation: 3,
                marginTop: 16,
              }}
            >
              {/* Register User */}
              <TouchableOpacity
                style={{ alignItems: 'center', flex: 1 }}
                onPress={handleRegisterUser}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <View
                  style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Image
                    source={icons.addUserIcon}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontSize: 10,
                    color: '#113E55',
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  Register User
                </Text>
              </TouchableOpacity>

              {/* Broadcast */}
              <TouchableOpacity
                style={{ alignItems: 'center', flex: 1 }}
                onPress={handleOpenBroadcast}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <View
                  style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Image
                    source={icons.broadcastIcon}
                    style={{ width: 22, height: 22 }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontSize: 10,
                    color: '#113E55',
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  Broadcast
                </Text>
              </TouchableOpacity>

              {/* Edit Requests */}
              <TouchableOpacity
                style={{ alignItems: 'center', flex: 1 }}
                onPress={() => router.push('/admin/edit-requests')}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <View
                  style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <Image
                    source={icons.editRequestIcon}
                    style={{ width: 24, height: 24 }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontSize: 10,
                    color: '#113E55',
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  Edit Requests
                </Text>
              </TouchableOpacity>

              {/* Incident Report */}
              <TouchableOpacity
                style={{ alignItems: 'center', flex: 1 }}
                onPress={handleOpenIncidentReport}
                hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
              >
                <View
                  style={{ width: 28, height: 28, alignItems: 'center', justifyContent: 'center' }}
                >
                  <AdminIncidentResponseSvg width={24} height={24} />
                </View>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontSize: 10,
                    color: '#113E55',
                    marginTop: 6,
                    textAlign: 'center',
                  }}
                  numberOfLines={1}
                >
                  Incident Report
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Lower Content Section */}
        <View style={{ paddingHorizontal: 20, marginTop: 8 }}>
          {/* All Users Title & View All */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Ubuntu-SemiBold',
                fontSize: 20,
                color: '#7A868C',
              }}
            >
              All Users
            </Text>
            <TouchableOpacity
              onPress={() => router.push('/admin/users/')}
              hitSlop={{ top: 8, bottom: 8, left: 10, right: 10 }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-SemiBold',
                  fontSize: 13,
                  color: '#113E55',
                }}
              >
                View All
              </Text>
            </TouchableOpacity>
          </View>

          {/* Users List */}
          <View>
            {isInitialLoading ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <CircleLoader size={32} />
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Regular',
                    fontSize: 14,
                    color: '#8A9A9D',
                    textAlign: 'center',
                    marginTop: 10,
                  }}
                >
                  Loading users...
                </Text>
              </View>
            ) : limitedUsers.length === 0 ? (
              <View style={{ paddingVertical: 32, alignItems: 'center' }}>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Regular',
                    fontSize: 14,
                    color: '#8A9A9D',
                    textAlign: 'center',
                  }}
                >
                  No users at the moment
                </Text>
              </View>
            ) : (
              limitedUsers.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.75}
                  style={{
                    // Figma 6667:9244 — frosted card, no shadow/border
                    height: 52,
                    backgroundColor: 'rgba(255, 255, 255, 0.7)',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 8,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                  onPress={() => openUser(item)}
                >
                  <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center' }}>
                    <RoleIcon role={item.role} width={24} height={24} />
                    <View style={{ flex: 1, marginLeft: 16, marginRight: 8 }}>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Light',
                          fontSize: 14,
                          lineHeight: 17,
                          color: '#113E55',
                        }}
                        numberOfLines={1}
                      >
                        {`${item.first_name} ${item.last_name}`}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Regular',
                          fontSize: 11.2,
                          lineHeight: 14,
                          color: '#113E55',
                          marginTop: 5,
                        }}
                        numberOfLines={1}
                      >
                        {item.home_address || 'No address provided'}
                      </Text>
                    </View>
                  </View>
                  <Feather name="chevron-right" size={24} color="#113E55" />
                </TouchableOpacity>
              ))
            )}
          </View>
        </View>
      </ScrollView>

      {/* Seat Capacity Bottom Drawer Modal */}
      <SeatCapacitySheet
        visible={seatModalVisible}
        onClose={() => setSeatModalVisible(false)}
        currentCapacity={occupiedSeats}
        maxCapacity={estateUserCapacity ?? totalUsersCount}
        residentsCount={seatResidentsCount}
        securityPersonnelCount={securityPersonnelCount}
        onManageSeats={handleOpenAddSeats}
        canManageSeats={isPrimaryAdmin}
      />

      {/* Blocked Registration Overlay (Capacity reached or Pending reduction) */}
      <Modal
        visible={blockedRegistrationReason !== null}
        transparent
        statusBarTranslucent
        animationType="fade"
        onRequestClose={() => setBlockedRegistrationReason(null)}
      >
        <Pressable
          onPress={() => setBlockedRegistrationReason(null)}
          style={{
            flex: 1,
            backgroundColor: 'rgba(0, 0, 0, 0.55)',
            justifyContent: 'center',
            alignItems: 'center',
            paddingHorizontal: 24,
          }}
        >
          <Pressable
            onPress={() => {}}
            style={{
              backgroundColor: '#FFFFFF',
              borderRadius: 24,
              padding: 24,
              width: '100%',
              maxWidth: 340,
              alignItems: 'center',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.15,
              shadowRadius: 12,
              elevation: 6,
            }}
          >
            <View
              style={{
                width: 56,
                height: 56,
                borderRadius: 28,
                backgroundColor: '#FEE2E2',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: 16,
              }}
            >
              <Feather name="alert-triangle" size={26} color="#DC2626" />
            </View>

            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'UbuntuSans-Bold',
                fontSize: 18,
                color: '#113E55',
                textAlign: 'center',
                marginBottom: 12,
              }}
            >
              {blockedRegistrationReason === 'capacity'
                ? 'Capacity Reached'
                : 'Registration Blocked'}
            </Text>

            <Text
              allowFontScaling={false}
              style={{
                fontFamily: 'Inter_18pt-Regular',
                fontSize: 14,
                lineHeight: 20,
                color: '#64748B',
                textAlign: 'center',
                marginBottom: 24,
              }}
            >
              {blockedRegistrationReason === 'capacity'
                ? 'You have reached the maximum user capacity for your current plan. Please add seats to register more users.'
                : 'A seat reduction request prevents addition of new users. To add users, the request has to be cancelled.'}
            </Text>

            <TouchableOpacity
              onPress={() => setBlockedRegistrationReason(null)}
              activeOpacity={0.8}
              style={{
                width: '100%',
                backgroundColor: '#113E55',
                borderRadius: 28,
                paddingVertical: 14,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Medium',
                  fontSize: 15,
                  color: '#FFFFFF',
                }}
              >
                Done
              </Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}
