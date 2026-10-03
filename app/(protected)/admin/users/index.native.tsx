import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Modal,
  PanResponder,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { NavigationBar as AndroidNavigationBar } from 'expo-navigation-bar';
import { Stack, router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import Back from '@/src/components/mobile/Back';
import { getRoleIcon, getRoleIconHeight, getRoleIconWidth } from '@/src/lib/helpers';
import { getAllEstateUsers } from '@/src/lib/api/user';
import type { User } from '@/src/types/user';
import type { UserRolesType } from '@/src/types/general';

type UserFilter = UserRolesType | 'admins';
type ValidationFilter = boolean | null;

const FILTERS: {
  label: string;
  value: UserFilter | null;
  width: number;
}[] = [
  { label: 'All Users', value: null, width: 63 },
  { label: 'Residents', value: 'resident', width: 78 },
  { label: 'Security', value: 'security', width: 60 },
  { label: 'Admins', value: 'admins', width: 57 },
];

const FILTER_GAPS = [7, 4, 3];

const SHEET_ROLE_FILTERS: { label: string; value: UserFilter | null; width: number }[] = [
  { label: 'All Users', value: null, width: 71 },
  { label: 'Residents', value: 'resident', width: 78 },
  { label: 'Security', value: 'security', width: 68 },
  { label: 'Admins', value: 'admins', width: 64 },
];

const PAGE_SIZE = 10;

export default function AllUsersMobile() {
  const insets = useSafeAreaInsets();
  const [allUsers, setAllUsers] = useState<User[]>([]);
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [fetchingMore, setFetchingMore] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickRoleFilter, setQuickRoleFilter] = useState<UserFilter | null>(null);
  const [selectedFilters, setSelectedFilters] = useState<UserFilter[]>([]);
  const [validationFilter, setValidationFilter] = useState<ValidationFilter>(null);
  const [filterVisible, setFilterVisible] = useState(false);
  const [error, setError] = useState('');
  const hasActiveAdvancedFilter = validationFilter !== null || selectedFilters.length > 0;

  const fetchUsers = useCallback(async (showLoading = false) => {
    try {
      let items: User[] = [];
      let page = 1;
      let total = 0;
      let response;

      do {
        response = await getAllEstateUsers(page, 100);
        items = [...items, ...response.items];
        total = response.total;
        page += 1;
      } while (items.length < total && response.items.length > 0);

      setAllUsers(items);
      setError('');
    } catch (requestError) {
      setError(
        requestError instanceof Error ? requestError.message.trim() : 'Could not load users'
      );
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    // Initial route data is loaded after mount; subsequent visits refresh through useFocusEffect.
    void fetchUsers(true);
  }, [fetchUsers]);

  useFocusEffect(
    useCallback(() => {
      if (!loading) void fetchUsers(false);
    }, [fetchUsers, loading])
  );

  const filteredUsers = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return allUsers.filter((user) => {
      const name = `${user.first_name ?? ''} ${user.last_name ?? ''}`.trim().toLowerCase();
      const address = user.home_address?.toLowerCase() ?? '';
      const matchesSearch =
        normalizedQuery.length === 0 ||
        name.includes(normalizedQuery) ||
        address.includes(normalizedQuery);

      const matchesFilter =
        selectedFilters.length === 0 ||
        selectedFilters.some((filter) => {
          if (filter === 'admins') {
            return ['admin', 'primary_admin'].includes(user.role as string);
          }

          return user.role === filter;
        });

      const matchesQuickRole =
        quickRoleFilter === null ||
        (quickRoleFilter === 'admins'
          ? ['admin', 'primary_admin'].includes(user.role as string)
          : user.role === quickRoleFilter);

      const matchesValidation = validationFilter === null || user.status === validationFilter;

      return matchesSearch && matchesQuickRole && matchesFilter && matchesValidation;
    });
  }, [allUsers, quickRoleFilter, searchQuery, selectedFilters, validationFilter]);

  const displayedUsers = useMemo(
    () => filteredUsers.slice(0, visibleCount),
    [filteredUsers, visibleCount]
  );

  const refreshUsers = async () => {
    setRefreshing(true);
    await fetchUsers(false);
    setRefreshing(false);
  };

  const loadMore = () => {
    if (loading || fetchingMore || visibleCount >= filteredUsers.length) return;

    setFetchingMore(true);
    setVisibleCount((count) => count + PAGE_SIZE);
    setFetchingMore(false);
  };

  const openUser = (user: User) => {
    const userId = user.id ?? user.user_id;
    if (!userId) return;

    router.push({
      pathname: '/(protected)/admin/users/[userId]',
      params: { userId, userParam: JSON.stringify(user) },
    });
  };

  return (
    <SafeAreaView
      style={{
        backgroundColor: '#F6F7F7',
        flex: 1,
        paddingTop: Math.max(0, 88 - insets.top),
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-4">
        <View className="flex-row items-center gap-[15px]">
          <Back
            type="short-arrow"
            showText={false}
            showBorder
            borderSize={30}
            leftOffset={1}
            iconStyle={{ width: 8.56, height: 12, top: 0 }}
          />

          <View className="mr-[14px] h-9 min-w-0 flex-1 flex-row items-center gap-2 rounded-2xl bg-[#EFF1F1] px-4 py-1">
            <Feather name="search" size={20} color="#878686" />
            <TextInput
              value={searchQuery}
              onChangeText={(value) => {
                setSearchQuery(value);
                setVisibleCount(PAGE_SIZE);
              }}
              placeholder="Search Guest List"
              placeholderTextColor="#878686"
              autoCapitalize="none"
              autoCorrect={false}
              className="h-7 flex-1 text-[14px] leading-[14px] text-primary font-inter-light"
              style={{ paddingVertical: 0, textAlignVertical: 'center' }}
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => {
                  setSearchQuery('');
                  setVisibleCount(PAGE_SIZE);
                }}
                accessibilityRole="button"
                accessibilityLabel="Clear search"
              >
                <Feather name="x" size={16} color="#878686" />
              </TouchableOpacity>
            ) : null}
          </View>
        </View>

        <View className="flex-row items-center" style={{ marginTop: 24 }}>
          <Pressable
            onPress={() => setFilterVisible(true)}
            className="flex-row items-center justify-center rounded-lg"
            style={{ width: 56, height: 26, marginLeft: 1, marginRight: 4 }}
            accessibilityRole="button"
            accessibilityLabel="Open advanced filters"
          >
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path
                d="M21.25 12H8.895m-4.361 0H2.75m18.5 6.607h-5.748m-4.361 0H2.75m18.5-13.214h-3.105m-4.361 0H2.75m13.214 2.18a2.18 2.18 0 1 0 0-4.36 2.18 2.18 0 0 0 0 4.36Zm-9.25 6.607a2.18 2.18 0 1 0 0-4.36 2.18 2.18 0 0 0 0 4.36Zm6.607 6.608a2.18 2.18 0 1 0 0-4.361 2.18 2.18 0 0 0 0 4.36Z"
                fill="none"
                stroke={hasActiveAdvancedFilter ? '#113E55' : '#878686'}
                strokeLinecap="round"
                strokeMiterlimit={10}
                strokeWidth={1.5}
              />
            </Svg>
            <Svg width={16} height={16} viewBox="0 0 24 24">
              <Path d="m12 15 5-5H7Z" fill={hasActiveAdvancedFilter ? '#113E55' : '#878686'} />
            </Svg>
          </Pressable>

          <View className="h-[35px] min-w-0 flex-1 flex-row items-center pr-[10px]">
            {FILTERS.map((item, index) => {
              const active =
                item.value === null ? quickRoleFilter === null : quickRoleFilter === item.value;
              return [
                <Pressable
                  key={item.label}
                  onPress={() => {
                    setQuickRoleFilter(item.value);
                    setVisibleCount(PAGE_SIZE);
                  }}
                  style={{ width: item.width, height: 35 }}
                  className={`items-center justify-center rounded-2xl ${
                    active ? 'bg-[#CEE5ED]' : 'bg-[#EFF1F1]'
                  }`}
                >
                  <Text
                    className={`text-[8.96px] leading-[9px] font-inter-medium ${
                      active ? 'text-black' : 'text-[#878686]'
                    }`}
                  >
                    {item.label}
                  </Text>
                </Pressable>,
                index < FILTER_GAPS.length ? (
                  <View
                    key={`${item.label}-gap`}
                    className="flex-1"
                    style={{ minWidth: FILTER_GAPS[index] }}
                  />
                ) : null,
              ];
            })}
          </View>
        </View>
      </View>

      <View className="mt-[17px] flex-1" style={{ borderTopColor: '#9B9797', borderTopWidth: 0.3 }}>
        {loading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator color="#113E55" />
            <Text className="mt-3 text-[14px] text-grey font-inter-regular">Loading users...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-[14px] leading-5 text-danger font-inter-regular">
              {error}
            </Text>
            <TouchableOpacity
              className="mt-4 rounded-2xl bg-primary px-6 py-3"
              onPress={() => {
                setLoading(true);
                void fetchUsers(true);
              }}
            >
              <Text className="text-[14px] text-white font-ubuntu-medium">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={displayedUsers}
            keyExtractor={(item, index) => item.id ?? item.user_id ?? String(index)}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              gap: 8,
              paddingTop: 32,
              paddingRight: 16,
              paddingBottom: 32,
              paddingLeft: 16,
            }}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refreshUsers} />}
            onEndReached={loadMore}
            onEndReachedThreshold={0.2}
            ListEmptyComponent={
              <View className="flex-1 items-center justify-center pb-20">
                <View className="h-12 w-12 items-center justify-center rounded-full bg-[#EFF1F1]">
                  <Feather name="users" size={22} color="#878686" />
                </View>
                <Text className="mt-4 text-[14px] text-primary font-inter-medium">
                  No users found
                </Text>
                <Text className="mt-1 text-center text-[11.2px] text-grey font-inter-regular">
                  Try changing your search or selected filter.
                </Text>
              </View>
            }
            ListFooterComponent={
              fetchingMore ? (
                <ActivityIndicator size="small" color="#113E55" className="my-4" />
              ) : null
            }
            renderItem={({ item }) => {
              const fullName = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();
              return (
                <TouchableOpacity
                  onPress={() => openUser(item)}
                  activeOpacity={0.75}
                  className="h-[52px] flex-row items-center rounded-2xl bg-white p-2"
                >
                  <Image
                    source={getRoleIcon(item.role)}
                    style={{
                      width: Math.min(getRoleIconWidth(item.role), 24),
                      height: Math.min(getRoleIconHeight(item.role), 24),
                    }}
                    resizeMode="contain"
                  />
                  <View className="ml-4 flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[14px] leading-[14px] text-primary font-inter-light"
                    >
                      {fullName || 'Unnamed user'}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="mt-2 text-[11.2px] leading-[11.2px] text-primary font-inter-regular"
                    >
                      {item.home_address || 'No address provided'}
                    </Text>
                  </View>
                  <View className="h-6 w-6 items-center justify-center">
                    <Feather name="chevron-right" size={16} color="#113E55" />
                  </View>
                </TouchableOpacity>
              );
            }}
          />
        )}
      </View>

      <AdvancedFilterSheet
        visible={filterVisible}
        validationFilter={validationFilter}
        selectedRoles={selectedFilters}
        onClose={() => setFilterVisible(false)}
        onValidationChange={(value) => {
          setValidationFilter((current) => (current === value ? null : value));
          setVisibleCount(PAGE_SIZE);
        }}
        onRoleChange={(value) => {
          if (value === null) {
            setSelectedFilters([]);
          } else {
            setSelectedFilters((current) =>
              current.includes(value)
                ? current.filter((filter) => filter !== value)
                : [...current, value]
            );
          }
          setVisibleCount(PAGE_SIZE);
        }}
      />
    </SafeAreaView>
  );
}

function AdvancedFilterSheet({
  visible,
  validationFilter,
  selectedRoles,
  onClose,
  onValidationChange,
  onRoleChange,
}: {
  visible: boolean;
  validationFilter: ValidationFilter;
  selectedRoles: UserFilter[];
  onClose: () => void;
  onValidationChange: (value: boolean) => void;
  onRoleChange: (value: UserFilter | null) => void;
}) {
  const translateY = useRef(new Animated.Value(0)).current;
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => gesture.dy > 6,
        onPanResponderMove: (_, gesture) => {
          translateY.setValue(Math.max(0, gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          if (gesture.dy > 80 || gesture.vy > 0.8) {
            Animated.timing(translateY, {
              toValue: 369,
              duration: 160,
              useNativeDriver: true,
            }).start(onClose);
            return;
          }

          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        },
      }),
    [onClose, translateY]
  );

  useEffect(() => {
    if (visible) translateY.setValue(0);
  }, [translateY, visible]);

  return (
    <>
      {Platform.OS === 'android' && visible ? <AndroidNavigationBar hidden /> : null}
      <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
        <View className="flex-1 justify-end">
          <Pressable className="flex-1" onPress={onClose} accessibilityLabel="Close filters" />
          <Animated.View
            className="h-[369px] w-full rounded-t-[40px] border border-white bg-[#F6F7F7]"
            style={{ transform: [{ translateY }] }}
          >
            <View className="h-[34px] w-full items-center pt-[13px]" {...panResponder.panHandlers}>
              <View className="h-[7.21px] w-[134px] rounded-[4px] bg-[#9B9797]" />
            </View>

            <View className="absolute top-[81px] h-[74px]" style={{ left: '8%', right: '9.8667%' }}>
              <Text className="absolute left-px top-[7px] text-[14px] leading-[14px] text-[#878686] font-inter-light">
                Validation Status
              </Text>

              <View className="absolute left-0 right-0 top-[35px] h-[38px]">
                <View className="absolute left-0">
                  <FilterSheetChip
                    label="Validated Account"
                    width={121}
                    active={validationFilter === true}
                    onPress={() => onValidationChange(true)}
                  />
                </View>
                <View className="absolute" style={{ left: '42.2078%' }}>
                  <FilterSheetChip
                    label="Non Validated Account"
                    width={146}
                    active={validationFilter === false}
                    onPress={() => onValidationChange(false)}
                  />
                </View>
              </View>
            </View>

            <View
              className="absolute top-[166px] border-t-[0.5px] border-[#9B9797]"
              style={{ left: '7.8667%', right: '9.8667%' }}
            />

            <View
              className="absolute top-[178px] h-[71px]"
              style={{ left: '8%', right: '9.8667%' }}
            >
              <Text className="text-[14px] leading-[14px] text-[#878686] font-inter-light">
                User Role
              </Text>

              <View className="mt-[19px] h-[38px] flex-row items-center justify-between">
                {SHEET_ROLE_FILTERS.map((item) => (
                  <FilterSheetChip
                    key={item.label}
                    label={item.label}
                    width={item.width}
                    active={
                      item.value === null
                        ? selectedRoles.length === 0
                        : selectedRoles.includes(item.value)
                    }
                    onPress={() => onRoleChange(item.value)}
                  />
                ))}
              </View>
            </View>
          </Animated.View>
        </View>
      </Modal>
    </>
  );
}

function FilterSheetChip({
  label,
  width,
  active,
  onPress,
}: {
  label: string;
  width: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`h-[38px] items-center justify-center rounded-2xl ${
        active ? 'bg-[#CEE5ED]' : 'bg-[#EFF1F1]'
      }`}
      style={{ width }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        className={`text-[11.2px] leading-[11.2px] font-inter-regular ${
          active ? 'text-primary' : 'text-[#878686]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
