import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  BackHandler,
  useWindowDimensions,
  StyleSheet,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';
import { StatusBar } from 'expo-status-bar';
import { fetchEstateUsersFresh } from '@/src/hooks/useEstateUsers';
import { getSeatOccupancy } from '@/src/lib/billing';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AllUsers } from '@/src/types/user';
import icons from '@/src/constants/icons';
import { getRoleIcon, isDataEqual } from '@/src/lib/helpers';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useEstateEntitlements } from '@/src/lib/api/entitlements';
import {
  useContactAdminNoticeStore,
  useFeatureGate,
  useUpgradePromptStore,
} from '@/src/hooks/usePlan';
import { useUserStore } from '@/src/lib/stores/userStore';
import AdminToolsSvg from '@/src/assets/images/admintools.svg';
import AdminResidentsSvg from '@/src/assets/images/adminresidents.svg';
import AdminSecuritySvg from '@/src/assets/images/adminsecurity.svg';
import AdminIncidentResponseSvg from '@/src/assets/images/adminincidentresponse.svg';
import SeatsSvg from '@/src/assets/images/seats.svg';
import SeatCapacitySheet from '@/src/components/mobile/SeatCapacitySheet';

export default function AdminUsersMobilePage() {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [users, setUsers] = useState<AllUsers>({ total: 0, page: 1, limit: 30, items: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [seatModalVisible, setSeatModalVisible] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();
  const usersRef = useRef<AllUsers>(users);
  const { data: estateEntitlements } = useEstateEntitlements();
  const showUpgradePrompt = useUpgradePromptStore((s) => s.show);
  const showContactAdminNotice = useContactAdminNoticeStore((s) => s.show);
  const userRole = useUserStore((s) => s.role);

  const { requestAccessWhenReady: requestBroadcastAccess } = useFeatureGate('admin_broadcast', {
    notice: 'floating',
  });
  const { requestAccessWhenReady: requestIncidentReportAccess } = useFeatureGate(
    'incident_report',
    {
      notice: 'floating',
    }
  );
  const openingBroadcastRef = useRef(false);
  const openingIncidentReportRef = useRef(false);

  const handleOpenBroadcast = useCallback(async () => {
    if (openingBroadcastRef.current) return;
    openingBroadcastRef.current = true;
    try {
      const allowed = await requestBroadcastAccess(() => navigation.isFocused());
      if (allowed && navigation.isFocused()) router.push('/admin/broadcast');
    } finally {
      openingBroadcastRef.current = false;
    }
  }, [navigation, requestBroadcastAccess, router]);

  const handleOpenIncidentReport = useCallback(async () => {
    if (openingIncidentReportRef.current) return;
    openingIncidentReportRef.current = true;
    try {
      const allowed = await requestIncidentReportAccess(() => navigation.isFocused());
      if (allowed && navigation.isFocused()) {
        router.push({ pathname: '/user/report', params: { returnTo: '/admin' } });
      }
    } finally {
      openingIncidentReportRef.current = false;
    }
  }, [navigation, requestIncidentReportAccess, router]);

  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const handleBack = useCallback(() => {
    if (navigation.canGoBack()) {
      navigation.goBack();
      return;
    }
    let parent = navigation.getParent();
    while (parent) {
      if (parent.canGoBack()) {
        parent.goBack();
        return;
      }
      parent = parent.getParent();
    }
    if (router.canGoBack()) {
      router.back();
      return;
    }
    router.replace(returnTo === '/settings' ? '/settings' : '/user');
  }, [navigation, returnTo, router]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const fetchUsers = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      // Goes through the shared query cache so other screens (billing seat usage) reuse it.
      const finalData = await fetchEstateUsersFresh(useUserStore.getState().estate_id ?? '');

      if (!isDataEqual(finalData, usersRef.current)) {
        setUsers(finalData);
      }
    } catch {
      // Preserve the last successfully loaded totals when refreshing fails.
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    await fetchUsers(true);
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  useFocusEffect(
    useCallback(() => {
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack();
        return true;
      });

      return () => subscription.remove();
    }, [handleBack])
  );

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchUsers();
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const intervalId = setInterval(() => {
        fetchUsers(false);
      }, 30000);

      return () => clearInterval(intervalId);
    });

    return unsubscribe;
  }, [navigation]);

  const verifiedUsers = users.items.filter((user) => user.status);
  const {
    security: securityPersonnelCount,
    residents: residentsCount,
    seatResidents: seatResidentsCount,
    occupied: occupiedSeats,
  } = getSeatOccupancy(users);
  const totalUsersCount = users.total;
  const registeredUsersCount = users.total;
  const estateUserCapacity = estateEntitlements?.coveredUsers ?? null;
  const isRegistrationAtCapacity =
    estateUserCapacity !== null && occupiedSeats >= estateUserCapacity;
  const limitedUsers = verifiedUsers.slice(0, 3);

  const handleOpenAddSeats = () => {
    if (userRole === 'primary_admin') {
      router.push('/admin/seats');
    } else {
      showContactAdminNotice(
        'guest_management',
        'Only the primary admin can manage seat capacity.'
      );
    }
  };

  const handleRegisterUser = () => {
    if (isRegistrationAtCapacity) {
      showUpgradePrompt('household_department_management');
      return;
    }
    router.push('/admin/users/add');
  };

  const illustrationWidth = Math.min(screenWidth - 32, 340);
  const illustrationHeight = Math.round(illustrationWidth * (246 / 353));

  return (
    <View style={{ flex: 1, backgroundColor: '#F6F7F7' }}>
      <StatusBar style="light" />
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
              paddingTop: Math.max(insets.top, 14),
              paddingHorizontal: 16,
              paddingBottom: 16,
            }}
          >
            {/* Top Bar with Back and Add Seats */}
            <View
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: 8,
                paddingHorizontal: 4,
              }}
            >
              <TouchableOpacity
                onPress={handleBack}
                hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 18,
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Feather name="chevron-left" size={22} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleOpenAddSeats}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.25)',
                  borderColor: 'rgba(255, 255, 255, 0.35)',
                  borderWidth: 1,
                  borderRadius: 8,
                  paddingHorizontal: 14,
                  paddingVertical: 6,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontSize: 13,
                    color: '#FFFFFF',
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
                <AdminResidentsSvg width={22} height={22} />
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
                <AdminSecuritySvg width={22} height={22} />
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

              {/* Broadcast (Greyed out for upgrade) */}
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
                    style={{ width: 22, height: 22, tintColor: '#9DA9AF', opacity: 0.6 }}
                    resizeMode="contain"
                  />
                </View>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Medium',
                    fontSize: 10,
                    color: '#9DA9AF',
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
        <View style={{ paddingHorizontal: 16, marginTop: 8 }}>
          {/* All Users Title & View All */}
          <View
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              marginBottom: 14,
              paddingHorizontal: 4,
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
            {limitedUsers.length === 0 ? (
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
                  style={{
                    backgroundColor: '#FFFFFF',
                    borderRadius: 16,
                    paddingHorizontal: 16,
                    paddingVertical: 14,
                    marginBottom: 10,
                    flexDirection: 'row',
                    alignItems: 'center',
                    borderWidth: 1,
                    borderColor: '#EFF1F3',
                    shadowColor: '#000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.03,
                    shadowRadius: 4,
                    elevation: 1,
                  }}
                  onPress={() =>
                    router.push({
                      pathname: '/(protected)/admin/users/[userId]',
                      params: { userId: item.id!, userParam: JSON.stringify(item) },
                    })
                  }
                >
                  <Image
                    source={getRoleIcon(item.role)}
                    style={{ width: 26, height: 26 }}
                    resizeMode="contain"
                  />
                  <View style={{ flex: 1, marginLeft: 14, marginRight: 8 }}>
                    <Text
                      allowFontScaling={false}
                      style={{
                        fontFamily: 'Inter_18pt-Medium',
                        fontSize: 14,
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
                        fontSize: 12,
                        color: '#8A9A9D',
                        marginTop: 4,
                      }}
                      numberOfLines={1}
                    >
                      {item.home_address || 'No address provided'}
                    </Text>
                  </View>
                  <Feather name="chevron-right" size={20} color="#113E55" />
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
      />
    </View>
  );
}
