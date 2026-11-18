import {
  View,
  Text,
  StyleSheet,
  Animated,
  FlatList,
  Alert,
  Pressable,
  RefreshControl,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { router, Stack, useFocusEffect, useIsFocused, useLocalSearchParams } from 'expo-router';
import { logger } from '@/src/shared/utils/logger';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import AppTextInput from '@/src/shared/components/form/AppTextInput';
import HeaderActions from '@/src/features/dashboard/components/HeaderActions';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import images from '@/src/shared/constants/images';
import { SavedGuestCard } from '@/src/features/visitors/components/SavedGuestCard';
import { filterGuests } from '@/src/features/visitors/utils/filterGuests';
import { useDeleteGuest, useMyGuestsInfinite } from '@/src/features/visitors/hooks/guests';
import { GenderType, RelationshipType } from '@/src/shared/types/general';
import { sharedStyles } from '@/src/shared/theme/styles';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import { GuestSearchIcon } from '@/src/features/visitors/components/guestIcons';
import { getErrorMessage } from '@/src/shared/utils/helpers';
import Modal from '@/src/shared/components/feedback/Modal';
import {
  LIST_EMPTY_TOP,
  ListFooter,
  ListPlaceholder,
} from '@/src/shared/components/lists/ListStates';
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';

const GUEST_PAGE_SIZE = 20;

function showDeleteError(error: unknown) {
  Alert.alert(
    'Could not delete guest',
    getErrorMessage(error)?.trim() || 'Please try again later.'
  );
}

const MyGuestMobile = () => {
  const { tabContentPadding } = useAndroidBottomInset();
  const [searchQuery, setSearchQuery] = useState('');
  const [accessReady, setAccessReady] = useState(false);
  const { requestAccessWhenReady } = useFeatureGate('guest_management', { notice: 'floating' });
  const guestsQuery = useMyGuestsInfinite(GUEST_PAGE_SIZE, { enabled: accessReady });
  const deleteGuestMutation = useDeleteGuest();
  const { refetch, data, isFetching, isError, hasNextPage, isFetchingNextPage, fetchNextPage } =
    guestsQuery;
  const guests = useMemo(() => data?.pages.flatMap((page) => page.items) ?? [], [data]);
  const loading = !accessReady || (isFetching && !isFetchingNextPage);
  const deleting = deleteGuestMutation.isPending;
  const isFocused = useIsFocused();
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);
  const [pullRefreshing, setPullRefreshing] = useState(false);

  const { refresh } = useLocalSearchParams();

  const filteredGuests = filterGuests(guests, searchQuery);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const allowed = await requestAccessWhenReady(() => active);
        if (!active) return;
        if (allowed) {
          setAccessReady(true);
          return;
        }
        setAccessReady(false);
        if (router.canGoBack()) {
          router.back();
        } else {
          router.replace('/user');
        }
      })();
      return () => {
        active = false;
      };
    }, [requestAccessWhenReady])
  );

  const fetchGuests = useCallback(() => {
    void refetch();
  }, [refetch]);

  const handlePullRefresh = useCallback(async () => {
    setPullRefreshing(true);
    try {
      await refetch();
    } finally {
      setPullRefreshing(false);
    }
  }, [refetch]);

  const loadMoreGuests = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage && !isError) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isError, isFetchingNextPage]);

  // Search only sees loaded guests, so load the rest while a search is active.
  useEffect(() => {
    if (searchQuery.trim()) loadMoreGuests();
  }, [searchQuery, loadMoreGuests]);

  const deleteGuest = async (id: string) => {
    try {
      await deleteGuestMutation.mutateAsync(id);
    } catch (error) {
      showDeleteError(error);
    }
  };

  useEffect(() => {
    if (refresh === 'true') void refetch();
  }, [refresh, refetch]);

  function openDurationForGuest({
    name,
    relationship_with_resident,
    gender,
  }: {
    name: string;
    gender: GenderType;
    relationship_with_resident: RelationshipType;
  }) {
    router.push({
      pathname: '/duration',
      params: {
        visitorName: name,
        relationship: relationship_with_resident ?? 'other',
        gender: gender ?? 'prefer_not_to_say',
        saveGuest: 'false',
      },
    });
  }

  const performDeleteGuest = async (id: string) => {
    try {
      await deleteGuestMutation.mutateAsync(id);
    } catch (error) {
      logger.error('Could not delete guest', error);
      showDeleteError(error);
    }
  };

  const bounceValue = useRef(new Animated.Value(0)).current;

  // PERF-15: stop bounce when this screen is not focused.
  useEffect(() => {
    if (!isFocused) {
      bounceValue.stopAnimation();
      bounceValue.setValue(0);
      return;
    }
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: -10,
          duration: 500,
          useNativeDriver: true,
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => {
      anim.stop();
    };
  }, [bounceValue, isFocused]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}
      edges={['top', 'left', 'right']}
    >
      <Stack.Screen options={{ headerShown: false }} />
      <ScreenHeader
        title="My Guests"
        actions={<HeaderActions />}
        containerClassName="z-10"
        titleClassName="font-ubuntu-medium text-[27.34px] leading-[33px] text-[#113E55]"
      />

      <View className="mt-5 flex-row items-center">
        <View className="h-11 min-w-0 flex-1 flex-row items-center rounded-[16px] border-[0.5px] border-[#113E55] bg-[#EFF1F1] px-4">
          <GuestSearchIcon />
          <AppTextInput
            placeholder="Search "
            placeholderTextColor="#113E55"
            className="ml-1 flex-1"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <Pressable
          onPress={() => setSearchQuery('')}
          accessibilityRole="button"
          accessibilityLabel="Cancel search"
          className="h-7 w-[66px] items-center justify-center"
        >
          <Text className="font-inter-medium text-[14px] text-[#167A6F]">Cancel</Text>
        </Pressable>
      </View>

      <View className="mt-[38px]">
        <Text className="px-3 pb-[15px] text-sm font-light text-[#0A1F29]">All Saved Guests</Text>
        <View style={styles.divider} />
      </View>

      <FlatList
        data={filteredGuests}
        keyExtractor={(item) => item.id}
        onEndReached={loadMoreGuests}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={pullRefreshing}
            onRefresh={() => void handlePullRefresh()}
            // Hide the system ActivityIndicator; CircleLoader is shown in the header.
            tintColor="transparent"
            colors={['transparent']}
            progressBackgroundColor="transparent"
          />
        }
        ListHeaderComponent={
          pullRefreshing ? (
            <View className="items-center pb-4">
              <CircleLoader size={32} />
            </View>
          ) : null
        }
        ListFooterComponent={
          <ListFooter
            isFetchingNextPage={isFetchingNextPage}
            hasNextPage={hasNextPage}
            error={guestsQuery.isFetchNextPageError ? guestsQuery.error : undefined}
            onRetry={() => void fetchNextPage()}
          />
        }
        contentContainerStyle={{
          paddingBottom: tabContentPadding,
          gap: 8,
          paddingTop: LIST_EMPTY_TOP,
        }}
        ListEmptyComponent={
          <ListPlaceholder
            isLoading={loading && !pullRefreshing}
            isError={isError}
            error={guestsQuery.error}
            onRetry={fetchGuests}
            errorFallback="Could not load your guests."
            empty={
              <View
                style={{
                  flex: 1,
                  justifyContent: 'flex-start',
                  alignItems: 'center',
                }}
              >
                <Animated.Image
                  source={images.ghostImg}
                  style={{
                    width: 300,
                    height: 300,
                    resizeMode: 'contain',
                    transform: [{ translateY: bounceValue }],
                  }}
                />
                <Text style={{ textAlign: 'center', fontSize: 23, opacity: 0.2 }}>
                  {"Click the '+' to add \nyour guest"}
                </Text>
              </View>
            }
          />
        }
        renderItem={({ item }) => (
          <SavedGuestCard
            guest={item}
            onDeletePress={() => {
              Alert.alert(
                'Delete guest',
                `Are you sure you want to delete ${item.guest_name}?`,
                [
                  { text: 'Cancel', style: 'cancel' },
                  {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: () => deleteGuest(item.id),
                  },
                ],
                { cancelable: true }
              );
            }}
            onGenerateCode={() =>
              openDurationForGuest({
                name: item.guest_name,
                relationship_with_resident: item.relationship as RelationshipType,
                gender: item.gender as GenderType,
              })
            }
          />
        )}
      />

      {confirmModalVisible && (
        <Modal
          closeModal={() => {
            setConfirmModalVisible(false);
            setPendingGuestId(null);
          }}
          heading={'Confirm delete'}
          message={`Are you sure you want to delete this guest? This action cannot be undone.`}
          btnDisabled={deleting}
          actionRunnig={deleting}
          cancelText={'Cancel'}
          action={async () => {
            if (!pendingGuestId) return;
            await performDeleteGuest(pendingGuestId);
            setConfirmModalVisible(false);
            setPendingGuestId(null);
          }}
          runningText={'Deleting...'}
          actionText={'Delete'}
        />
      )}
    </SafeAreaView>
  );
};

export default MyGuestMobile;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FBFEFF',
    paddingHorizontal: 20,
    paddingTop: 35,
    elevation: 0,
    shadowOpacity: 0,
    borderBottomWidth: 0,
  },

  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#113E55',
  },

  searchBar: {
    flexDirection: 'row',
    backgroundColor: '#F7F9F9',
    borderRadius: 8,
    alignItems: 'center',
    paddingHorizontal: 8,
    marginBottom: 20,
  },

  profileCircle: {
    width: 35,
    height: 35,
    borderRadius: 17,
    borderWidth: 1,
    marginRight: 30,
    borderColor: '#167a6f',
    justifyContent: 'center',
    alignItems: 'center',
  },

  profileInitials: {
    color: '#167a6f',
    fontWeight: '300',
    fontFamily: 'UbuntuSans',
    fontSize: 23,
  },

  fab: {
    position: 'absolute',
    bottom: 20,
    left: '50%',
    transform: [{ translateX: -30 }],
    backgroundColor: '#113E55',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 5,
  },

  divider: {
    height: 0.5,
    backgroundColor: '#113E55',
    marginTop: 0,
    width: '100%',
  },
});
