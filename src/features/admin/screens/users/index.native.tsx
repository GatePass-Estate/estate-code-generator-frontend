import {
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import AppTextInput from '@/src/shared/components/form/AppTextInput';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { Feather } from '@expo/vector-icons';
import { NavigationBar as AndroidNavigationBar } from 'expo-navigation-bar';
import { Stack } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import Back from '@/src/shared/components/navigation/Back';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import { ListFooter } from '@/src/shared/components/lists/ListStates';
import { getRoleIconHeight, getRoleIconWidth } from '@/src/shared/utils/helpers';
import RoleIcon from '@/src/shared/components/RoleIcon';
import { type EstateUserRoleFilter } from '@/src/features/users/hooks/estateUsers';
import { useAllUsers } from '@/src/features/admin/hooks/useAllUsers';

type UserFilter = EstateUserRoleFilter;
/** Multi-select: true = validated, false = non-validated. Both or neither = everyone. */
type ValidationStatus = boolean;

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

export default function AllUsersMobile() {
  const insets = useSafeAreaInsets();
  const {
    searchQuery,
    setSearchQuery,
    deferredSearch,
    selectedFilters,
    onRoleChange,
    validationStatuses,
    onValidationChange,
    hasActiveAdvancedFilter,
    filterVisible,
    setFilterVisible,
    users: displayedUsers,
    loading,
    error,
    retry,
    fetchingMore,
    hasNextPage,
    refreshing,
    refreshUsers,
    loadMore,
    openUser,
  } = useAllUsers();

  return (
    <SafeAreaView
      edges={['left', 'right', 'bottom']}
      style={{
        backgroundColor: '#F6F7F7',
        flex: 1,
        // Keep 19px below the status bar — do not override SafeArea top with a flat 19.
        paddingTop: insets.top + 19,
      }}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <View className="px-5">
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
            <AppTextInput
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search"
              autoCapitalize="none"
              autoCorrect={false}
              className="h-8 flex-1"
            />
            {searchQuery ? (
              <TouchableOpacity
                onPress={() => setSearchQuery('')}
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
                item.value === null
                  ? selectedFilters.length === 0
                  : selectedFilters.includes(item.value);
              return [
                <Pressable
                  key={item.label}
                  onPress={() => onRoleChange(item.value)}
                  style={{ width: item.width, height: 35 }}
                  className={`items-center justify-center rounded-2xl ${
                    active ? 'bg-accent' : 'bg-[#EFF1F1]'
                  }`}
                >
                  <Text
                    className={`text-2xs leading-[9px] font-inter-medium ${
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
            <CircleLoader size={32} />
            <Text className="mt-3 text-[14px] text-grey font-inter-regular">Loading users...</Text>
          </View>
        ) : error ? (
          <View className="flex-1 items-center justify-center px-8">
            <Text className="text-center text-[14px] leading-5 text-danger font-inter-regular">
              {error}
            </Text>
            <TouchableOpacity className="mt-4 rounded-2xl bg-primary px-6 py-3" onPress={retry}>
              <Text className="text-[14px] text-white font-ubuntu-medium">Try Again</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={displayedUsers}
            extraData={`${selectedFilters.join(',')}|${deferredSearch}|${validationStatuses.join(',')}`}
            keyExtractor={(item, index) => item.id ?? item.user_id ?? String(index)}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={{
              flexGrow: 1,
              gap: 8,
              paddingTop: 32,
              paddingRight: 20,
              paddingBottom: 32,
              paddingLeft: 20,
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
                <Text className="mt-1 text-center text-caption text-grey font-inter-regular">
                  Try changing your search or selected filter.
                </Text>
              </View>
            }
            ListFooterComponent={
              <ListFooter isFetchingNextPage={fetchingMore} hasNextPage={hasNextPage} />
            }
            renderItem={({ item }) => {
              const fullName = `${item.first_name ?? ''} ${item.last_name ?? ''}`.trim();
              return (
                <TouchableOpacity
                  onPress={() => openUser(item)}
                  activeOpacity={0.75}
                  className="h-[52px] flex-row items-center rounded-2xl bg-white p-2"
                >
                  <RoleIcon
                    role={item.role}
                    width={Math.min(getRoleIconWidth(item.role), 24)}
                    height={Math.min(getRoleIconHeight(item.role), 24)}
                  />
                  <View className="ml-4 flex-1">
                    <Text
                      numberOfLines={1}
                      className="text-[14px] leading-[18px] text-primary font-inter-light"
                    >
                      {fullName || 'Unnamed user'}
                    </Text>
                    <Text
                      numberOfLines={1}
                      className="mt-1.5 text-caption leading-[14px] text-primary font-inter-regular"
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
        validationStatuses={validationStatuses}
        selectedRoles={selectedFilters}
        onClose={() => setFilterVisible(false)}
        onValidationChange={onValidationChange}
        onRoleChange={onRoleChange}
      />
    </SafeAreaView>
  );
}

function AdvancedFilterSheet({
  visible,
  validationStatuses,
  selectedRoles,
  onClose,
  onValidationChange,
  onRoleChange,
}: {
  visible: boolean;
  validationStatuses: ValidationStatus[];
  selectedRoles: UserFilter[];
  onClose: () => void;
  onValidationChange: (value: ValidationStatus) => void;
  onRoleChange: (value: UserFilter | null) => void;
}) {
  const insets = useSafeAreaInsets();

  return (
    <>
      {Platform.OS === 'android' && visible ? <AndroidNavigationBar hidden /> : null}
      <BottomSheet
        visible={visible}
        onClose={onClose}
        scrimClassName="flex-1 justify-end"
        scrimProps={{ accessibilityLabel: 'Close filters' }}
        panelClassName="bg-[#F6F7F7] rounded-t-[40px] px-5"
        panelStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 16 }}
      >
        <Text className="mt-2 text-[14px] leading-[14px] text-[#878686] font-inter-light">
          Validation Status
        </Text>
        <View className="mt-4 flex-row flex-wrap items-center gap-3">
          <FilterSheetChip
            label="Validated Account"
            width={121}
            active={validationStatuses.includes(true)}
            onPress={() => onValidationChange(true)}
          />
          <FilterSheetChip
            label="Non Validated Account"
            width={146}
            active={validationStatuses.includes(false)}
            onPress={() => onValidationChange(false)}
          />
        </View>

        <View className="my-5 border-t-[0.5px] border-grey" />

        <Text className="text-[14px] leading-[14px] text-[#878686] font-inter-light">
          User Role
        </Text>
        <View className="mt-4 flex-row flex-wrap items-center gap-2">
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
      </BottomSheet>
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
        active ? 'bg-accent' : 'bg-[#EFF1F1]'
      }`}
      style={{ width }}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
    >
      <Text
        className={`text-caption leading-[11.2px] font-inter-regular ${
          active ? 'text-primary' : 'text-[#878686]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}
