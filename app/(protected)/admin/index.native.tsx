import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  RefreshControl,
  BackHandler,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Stack, useFocusEffect, useNavigation, useRouter } from 'expo-router';
import Svg, { Circle, Ellipse, G, Path } from 'react-native-svg';
import { getAllEstateUsers } from '@/src/lib/api/user';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AllUsers } from '@/src/types/user';
import { sharedStyles } from '@/src/theme/styles';
import Back from '@/src/components/mobile/Back';
import icons from '@/src/constants/icons';
import { getRoleIcon, isDataEqual } from '@/src/lib/helpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useEstateEntitlements } from '@/src/lib/api/entitlements';

function ResidentsCardIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 20 20">
      <G fill="#F46036">
        <Path
          d="M3.889 11H2.5a.5.5 0 0 1-.33-.875l8.5-7.5a.5.5 0 0 1 .66 0l8.5 7.5a.5.5 0 0 1-.33.875h-1.389v7a.5.5 0 0 1-.5.5H4.39a.5.5 0 0 1-.5-.5z"
          opacity={0.2}
        />
        <Path
          fillRule="evenodd"
          d="M1 10h1.389v7a.5.5 0 0 0 .5.5H16.11a.5.5 0 0 0 .5-.5v-7H18a.5.5 0 0 0 .33-.875l-8.5-7.5a.5.5 0 0 0-.66 0l-8.5 7.5A.5.5 0 0 0 1 10m1.889-1h-.567L9.5 2.667L16.678 9h-.567a.5.5 0 0 0-.5.5v7H3.39v-7a.5.5 0 0 0-.5-.5"
          clipRule="evenodd"
        />
        <Path
          fillRule="evenodd"
          d="M10.708 11.5h-2.5a1 1 0 0 0-1 1v4a1 1 0 0 0 1 1h2.5a1 1 0 0 0 1-1v-4a1 1 0 0 0-1-1m-2.5 5v-4h2.5v4z"
          clipRule="evenodd"
        />
      </G>
    </Svg>
  );
}

function TotalUsersCardIcon() {
  return (
    <Svg width={25} height={27} viewBox="0 0 25 27">
      <Ellipse
        cx={12.5}
        cy={13.5}
        rx={11.75}
        ry={12.75}
        fill="none"
        stroke="#F6F7F7"
        strokeWidth={1.5}
      />
      <Circle cx={12.5} cy={8.5} r={3.75} fill="none" stroke="#F6F7F7" strokeWidth={1.5} />
      <Path
        d="M3.6 21.75C6.15 18.45 9.1 16.75 12.5 16.75S18.85 18.45 21.4 21.75"
        fill="none"
        stroke="#F6F7F7"
        strokeWidth={1.5}
        strokeLinecap="butt"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function AdminUsersMobilePage() {
  const [users, setUsers] = useState<AllUsers>({ total: 0, page: 1, limit: 30, items: [] });
  const [refreshing, setRefreshing] = useState(false);
  const [activeTool, setActiveTool] = useState<string | null>(null);
  const router = useRouter();
  const navigation = useNavigation();
  const usersRef = useRef<AllUsers>(users);
  const firstName = useUserStore((state) => state.first_name);
  const { data: estateEntitlements } = useEstateEntitlements();

  const handleBackToHome = useCallback(() => {
    router.replace('/user');
  }, [router]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  const fetchUsers = async (showLoading = false) => {
    if (showLoading) setRefreshing(true);
    try {
      let allItems: any[] = [];
      let currentPage = 1;
      let totalUsers = 0;
      let fetchedData;

      do {
        fetchedData = await getAllEstateUsers(currentPage, 100);
        allItems = [...allItems, ...fetchedData.items];
        totalUsers = fetchedData.total;
        currentPage++;
      } while (allItems.length < totalUsers && fetchedData.items.length > 0);

      const finalData = { ...fetchedData, items: allItems, total: totalUsers };

      if (!isDataEqual(finalData, usersRef.current)) {
        setUsers(finalData);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
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
        handleBackToHome();
        return true;
      });

      return () => subscription.remove();
    }, [handleBackToHome])
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
  const securityPersonnelCount =
    users.role_summary?.security ?? users.items.filter((user) => user.role === 'security').length;
  const residentsCount =
    users.role_summary?.resident ?? users.items.filter((user) => user.role === 'resident').length;
  const totalUsersCount = users.total;
  const registeredUsersCount = users.total;
  const estateUserCapacity = estateEntitlements?.coveredUsers ?? null;
  const isRegistrationAtCapacity =
    estateUserCapacity !== null && registeredUsersCount >= estateUserCapacity;
  const limitedUsers = verifiedUsers.slice(0, 3);
  const greetingName = firstName || 'Admin';

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View className="pt-10">
        <Back
          type="short-arrow"
          showText={false}
          showBorder
          borderSize={30}
          leftOffset={-3}
          iconStyle={{ width: 8.56, height: 12, top: 0 }}
          onPress={handleBackToHome}
        />
      </View>

      <ScrollView
        style={{ marginHorizontal: -4 }}
        contentContainerStyle={{ paddingTop: 22, paddingBottom: 24, paddingHorizontal: 4 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text className="mb-8 h-[33px] text-[27.34px] leading-[27.34px] text-[#113E55] font-ubuntu-medium">
          Hi {greetingName} !
        </Text>

        <View className="mx-[-3px] mb-[8px] flex-row justify-between">
          <View
            className="relative h-[82px] rounded-[8px] border-[#F46036] bg-[#FFF8F5]"
            style={{ width: '48.7%', borderWidth: 0.5 }}
          >
            <View className="absolute top-[26px]" style={{ left: '15.6%' }}>
              <ResidentsCardIcon />
            </View>
            <Text
              className="absolute top-[19px] h-[33px] w-[58px] text-center text-[34.18px] leading-[34.18px] text-[#F46036] font-ubuntu-medium"
              style={{ left: '40.1%' }}
            >
              {residentsCount}
            </Text>
            <Text
              className="absolute top-[54px] h-[11px] w-[50px] text-center text-[8.96px] leading-[8.96px] text-[#F46036] font-inter-medium"
              style={{ left: '44.9%' }}
            >
              RESIDENTS
            </Text>
          </View>

          <View
            className="relative h-[82px] rounded-[8px] border-[#1B998B] bg-[#F4FFFE]"
            style={{ width: '48.7%', borderWidth: 0.5 }}
          >
            <Image
              source={icons.securityIcon}
              className="absolute top-[26px] h-[30px] w-[30px]"
              style={{ left: '16.2%' }}
            />
            <Text
              className="absolute top-[19px] h-[34px] w-[58px] text-center text-[34.18px] leading-[34.18px] text-[#1B998B] font-ubuntu-medium"
              style={{ left: '40.1%' }}
            >
              {securityPersonnelCount}
            </Text>
            <Text
              className="absolute top-[56px] h-[11px] w-[101px] text-center text-[8.96px] leading-[8.96px] text-[#1B998B] font-inter-medium"
              style={{ left: '14.4%' }}
            >
              SECURITY PERSONNEL
            </Text>
          </View>
        </View>

        <View className="relative mx-[-3px] mb-[40px] h-[82px] flex-row">
          <View
            className="relative h-[82px] flex-1 rounded-[8px] border-[#F6F7F7] bg-[#113E55]"
            style={{ maxWidth: '48.7%', borderWidth: 0.5 }}
          >
            <View className="absolute left-[25px] top-[28px] h-[27px] w-[25px]">
              <TotalUsersCardIcon />
            </View>
            <Text className="absolute left-[67px] top-[19px] h-[32px] w-[58px] text-center text-[34.18px] leading-[34.18px] text-[#F6F7F7] font-ubuntu-medium">
              {totalUsersCount}
            </Text>
            <Text
              className="absolute left-[65px] top-[56px] h-[11px] w-[61px] text-center text-[8.96px] leading-[8.96px] text-[#F6F7F7] font-inter-medium"
              numberOfLines={1}
            >
              TOTAL USERS
            </Text>
          </View>

          <View
            className="absolute h-[82px] w-[82px] items-center justify-center"
            style={{ left: '65.1%' }}
          >
            <View
              className="h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF8FA]"
              accessibilityLabel="Add user"
            >
              <Feather name="plus" size={30} color="#113E55" />
            </View>
          </View>
        </View>

        <View
          className="relative left-[-1px] mb-[46px] h-[66px] flex-row items-center justify-between rounded-[16px] px-[16px] py-[8px]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
        >
          <TouchableOpacity
            className="h-[50px] w-[50px] items-center justify-center"
            onPress={() => router.push('/admin/users/add')}
            onPressIn={() => !isRegistrationAtCapacity && setActiveTool('register')}
            onPressOut={() => setActiveTool(null)}
            disabled={isRegistrationAtCapacity}
            accessibilityState={{ disabled: isRegistrationAtCapacity }}
            style={{
              opacity: isRegistrationAtCapacity ? 0.35 : 1,
              backgroundColor: activeTool === 'register' ? '#EFF8FA' : 'transparent',
              borderRadius: 8,
            }}
          >
            <Image source={icons.addUserIcon} style={{ width: 19.64, height: 19.64 }} />
            <Text
              className="mt-[4px] h-[12px] w-[64px] text-center text-[8.96px] leading-[8.96px] text-[#113E55] font-inter-medium"
              numberOfLines={1}
            >
              Register User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-[50px] w-[50px] items-center justify-center"
            onPressIn={() => setActiveTool('broadcast')}
            onPressOut={() => setActiveTool(null)}
            style={{
              backgroundColor: activeTool === 'broadcast' ? '#EFF8FA' : 'transparent',
              borderRadius: 8,
            }}
          >
            <Image source={icons.broadcastIcon} style={{ width: 19.64, height: 19.64 }} />
            <Text
              className="mt-[4px] h-[12px] w-[64px] text-center text-[8.96px] leading-[8.96px] text-[#113E55] font-inter-medium"
              numberOfLines={1}
            >
              Broadcast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-[50px] w-[50px] items-center justify-center"
            onPress={() => router.push('/admin/edit-requests')}
            onPressIn={() => setActiveTool('edit-requests')}
            onPressOut={() => setActiveTool(null)}
            style={{
              backgroundColor: activeTool === 'edit-requests' ? '#EFF8FA' : 'transparent',
              borderRadius: 8,
            }}
          >
            <Image source={icons.editRequestIcon} style={{ width: 24, height: 24 }} />
            <Text
              className="mt-[4px] h-[12px] w-[64px] text-center text-[8.96px] leading-[8.96px] text-[#113E55] font-inter-medium"
              numberOfLines={1}
            >
              Edit Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-[50px] w-[50px] items-center justify-center"
            onPress={() => router.push('/user/report')}
            onPressIn={() => setActiveTool('incident-report')}
            onPressOut={() => setActiveTool(null)}
            style={{
              backgroundColor: activeTool === 'incident-report' ? '#EFF8FA' : 'transparent',
              borderRadius: 8,
            }}
          >
            <Feather name="shield" size={24} color="#113E55" />
            <Text
              className="mt-[4px] h-[12px] w-[70px] text-center text-[8.96px] leading-[8.96px] text-[#113E55] font-inter-medium"
              numberOfLines={1}
            >
              Incident Report
            </Text>
          </TouchableOpacity>
        </View>

        <View className="relative mb-[22px] h-[34px]">
          <Text
            className="absolute left-[5px] top-[8px] h-[26px] w-[110px] text-[21.88px] leading-[21.88px] text-[#878686] font-ubuntu-semibold"
            numberOfLines={1}
          >
            All Users
          </Text>
          <TouchableOpacity
            className="absolute right-[2px] top-0 h-[34px] w-[63px] items-center justify-center"
            onPress={() => router.push('/admin/users/')}
          >
            <Text className="h-[15px] w-[47px] text-center text-[12px] leading-[12px] text-[#113E55] font-inter-semibold">
              View All
            </Text>
          </TouchableOpacity>
        </View>

        <View>
          {limitedUsers.length === 0 ? (
            <View className="py-8 items-center">
              <Text className="text-grey text-center text-md font-inter-regular">
                No users at the moment
              </Text>
            </View>
          ) : (
            limitedUsers.map((item) => (
              <TouchableOpacity
                key={item.id}
                className="relative left-[-1px] mb-[4px] h-[52px] rounded-[16px]"
                style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
                onPress={() =>
                  router.push({
                    pathname: '/(protected)/admin/users/[userId]',
                    params: { userId: item.id!, userParam: JSON.stringify(item) },
                  })
                }
              >
                <Image
                  source={getRoleIcon(item.role)}
                  style={{ position: 'absolute', left: 16, top: 14, width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <View className="absolute left-[56px] top-[8px] h-[36px] right-[56px]">
                  <Text
                    className="h-[17px] text-[14px] leading-[14px] text-[#113E55] font-inter-light"
                    numberOfLines={1}
                  >
                    {`${item.first_name} ${item.last_name}`}
                  </Text>
                  <Text
                    className="mt-[5px] h-[14px] text-[11.2px] leading-[11.2px] text-[#113E55] font-inter-regular"
                    numberOfLines={1}
                  >
                    {item.home_address}
                  </Text>
                </View>
                <View className="absolute right-[16px] top-[14px] h-[24px] w-[24px] items-center justify-center">
                  <Feather name="chevron-right" size={24} color="#113E55" />
                </View>
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
