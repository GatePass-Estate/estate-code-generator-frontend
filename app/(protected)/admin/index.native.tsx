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
import Svg, { G, Path } from 'react-native-svg';
import { getAllEstateUsers } from '@/src/lib/api/user';
import { useCallback, useEffect, useRef, useState } from 'react';
import { AllUsers } from '@/src/types/user';
import { sharedStyles } from '@/src/theme/styles';
import Back from '@/src/components/mobile/Back';
import icons from '@/src/constants/icons';
import { getRoleIcon, isDataEqual } from '@/src/lib/helpers';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useUserStore } from '@/src/lib/stores/userStore';

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

export default function AdminUsersMobilePage() {
  const [users, setUsers] = useState<AllUsers>({ total: 0, page: 1, limit: 30, items: [] });
  const [refreshing, setRefreshing] = useState(false);
  const router = useRouter();
  const navigation = useNavigation();
  const usersRef = useRef<AllUsers>(users);
  const firstName = useUserStore((state) => state.first_name);

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
  const securityPersonnelCount = verifiedUsers.filter((user) => user.role === 'security').length;
  const residentsCount =
    (users as any)?.role_summary?.resident ||
    verifiedUsers.filter((user) => user.role === 'resident').length;
  const totalVerifiedCount = verifiedUsers.length;

  const limitedUsers = verifiedUsers.slice(0, 3);
  const greetingName = firstName || 'Admin';

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <View className="pt-5">
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
        contentContainerStyle={{ paddingTop: 32, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
      >
        <Text className="mb-8 h-[33px] text-[27.34px] leading-[27.34px] text-[#113E55] font-ubuntu-medium">
          Hi {greetingName} !
        </Text>

        <View className="mb-[8px] flex-row gap-[9px]">
          <View
            className="relative h-[82px] flex-1 rounded-[8px] border-[#F46036] bg-[#FFF8F5]"
            style={{ borderWidth: 0.5 }}
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
            className="relative h-[82px] flex-1 rounded-[8px] border-[#1B998B] bg-[#F4FFFE]"
            style={{ borderWidth: 0.5 }}
          >
            <Image
              source={icons.securityIcon}
              className="absolute top-[26px] h-[30px] w-[30px]"
              style={{ left: '16.2%' }}
            />
            <Text
              className="absolute top-[19px] h-[33px] w-[58px] text-center text-[34.18px] leading-[34.18px] text-[#1B998B] font-ubuntu-medium"
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

        <View className="relative mb-[40px] h-[82px] flex-row">
          <View
            className="relative h-[82px] flex-1 rounded-[8px] border-white bg-[#113E55]"
            style={{ maxWidth: '48.7%', borderWidth: 0.5 }}
          >
            <View className="absolute left-[25px] top-[28px] h-[27px] w-[25px] items-center justify-center rounded-full border border-white">
              <Feather name="user" size={17} color="#FFFFFF" />
            </View>
            <Text className="absolute left-[67px] top-[19px] h-[33px] w-[58px] text-center text-[34.18px] leading-[34.18px] text-white font-ubuntu-medium">
              {totalVerifiedCount}
            </Text>
            <Text
              className="absolute left-[61px] top-[54px] h-[12px] w-[70px] text-center text-[8.96px] leading-[10px] text-white font-inter-medium"
              numberOfLines={1}
            >
              TOTAL USERS
            </Text>
          </View>

          <View
            className="absolute h-[82px] w-[82px] items-center justify-center"
            style={{ left: '65.1%' }}
          >
            <TouchableOpacity
              className="h-[60px] w-[60px] items-center justify-center rounded-full bg-[#EFF8FA]"
              onPress={() => router.push('/admin/users/add')}
              accessibilityRole="button"
              accessibilityLabel="Register user"
            >
              <Feather name="plus" size={30} color="#113E55" />
            </TouchableOpacity>
          </View>
        </View>

        <View
          className="mb-[38px] h-[66px] flex-row items-center justify-between rounded-[16px] px-[16px] py-[8px]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.7)' }}
        >
          <TouchableOpacity
            className="h-[50px] w-[50px] items-center justify-center"
            onPress={() => router.push('/admin/users/add')}
          >
            <Image source={icons.addUserIcon} style={{ width: 18, height: 18 }} />
            <Text
              className="mt-[4px] h-[12px] w-[64px] text-center text-[9px] leading-[11px] text-[#113E55] font-inter-regular"
              numberOfLines={1}
            >
              Register User
            </Text>
          </TouchableOpacity>

          <TouchableOpacity className="h-[50px] w-[50px] items-center justify-center">
            <Image source={icons.broadcastIcon} style={{ width: 18, height: 18 }} />
            <Text
              className="mt-[4px] h-[12px] w-[64px] text-center text-[9px] leading-[11px] text-[#113E55] font-inter-regular"
              numberOfLines={1}
            >
              Broadcast
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-[50px] w-[50px] items-center justify-center"
            onPress={() => router.push('/admin/edit-requests')}
          >
            <Image source={icons.editRequestIcon} style={{ width: 18, height: 18 }} />
            <Text
              className="mt-[4px] h-[12px] w-[64px] text-center text-[9px] leading-[11px] text-[#113E55] font-inter-regular"
              numberOfLines={1}
            >
              Edit Requests
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            className="h-[50px] w-[50px] items-center justify-center"
            onPress={() => router.push('/user/report')}
          >
            <Feather name="shield" size={18} color="#113E55" />
            <Text
              className="mt-[4px] h-[12px] w-[64px] text-center text-[9px] leading-[11px] text-[#113E55] font-inter-regular"
              numberOfLines={1}
            >
              Incident Report
            </Text>
          </TouchableOpacity>
        </View>

        <View className="mb-[5px] h-[26px] flex-row items-center justify-between px-[5px]">
          <Text className="h-[26px] w-[90px] text-[20.51px] leading-[25px] text-[#878686] font-ubuntu-medium">
            All Users
          </Text>
          <TouchableOpacity onPress={() => router.push('/admin/users/')}>
            <Text className="h-[15px] w-[47px] text-right text-[8.96px] leading-[11px] text-[#113E55] font-ubuntu-medium">
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
                className="mb-[4px] h-[52px] flex-row items-center rounded-[16px] px-[12px]"
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
                  style={{ width: 24, height: 24 }}
                  resizeMode="contain"
                />
                <View className="ml-[17px] flex-1 justify-center">
                  <Text
                    className="text-[11.96px] leading-[14px] text-[#113E55] font-inter-regular"
                    numberOfLines={1}
                  >
                    {`${item.first_name} ${item.last_name}`}
                  </Text>
                  <Text
                    className="mt-[1px] text-[8.96px] leading-[11px] text-[#113E55] font-inter-regular"
                    numberOfLines={1}
                  >
                    {item.home_address}
                  </Text>
                </View>
                <Feather name="chevron-right" size={14} color="#113E55" />
              </TouchableOpacity>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
