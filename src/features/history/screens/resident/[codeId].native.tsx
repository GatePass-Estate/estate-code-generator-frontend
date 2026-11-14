import { useCallback, useMemo, useState } from 'react';
import { Alert, Share } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useNavigation, router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import AccessHistoryDetail, {
  AccessHistoryTimelineEvent,
} from '@/src/features/history/components/AccessHistoryDetail';
import { useMyVisitorAccessLogByCodeInfinite } from '@/src/features/history/hooks/accessLogs';
import { useDeleteCode } from '@/src/features/access-codes/hooks/codes';
import {
  compareLogDatesDesc,
  formatAccessLogTimestamp,
  getErrorMessage,
  parseLogDate,
} from '@/src/shared/utils/helpers';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import { GenderType } from '@/src/shared/types/general';
import { sharedStyles } from '@/src/shared/theme/styles';

const VISITS_PAGE_SIZE = 20;

export default function HistoryDetailScreen() {
  const navigation = useNavigation();
  const { tabBarStyle } = useAndroidBottomInset();
  const params = useLocalSearchParams<{
    codeId: string;
    name?: string;
    category?: string;
    isActive?: string;
  }>();

  const hashedCode = params.codeId ?? '';
  const isActive = params.isActive === 'true';
  const historyQuery = useMyVisitorAccessLogByCodeInfinite(hashedCode, VISITS_PAGE_SIZE);
  const deleteCodeMutation = useDeleteCode();
  const [deleting, setDeleting] = useState(false);
  const visits = useMemo(
    () => historyQuery.data?.pages.flatMap((page) => page.items) ?? [],
    [historyQuery.data]
  );
  const latest = visits[0];
  const name = latest?.visitor_fullname?.trim() || params.name?.trim() || '';
  const category = latest?.relationship_with_resident?.trim() || params.category?.trim() || '';
  const gender: GenderType = latest?.gender || 'prefer_not_to_say';
  const events = useMemo<AccessHistoryTimelineEvent[]>(() => {
    return [...visits]
      .sort((a, b) => compareLogDatesDesc(a.visit_time, b.visit_time))
      .map((item, index) => ({
        id: item.id || `visit-${index}`,
        title: 'Access Granted',
        timestamp: formatAccessLogTimestamp(parseLogDate(item.visit_time)),
      }));
  }, [visits]);

  const { hasNextPage, isFetchingNextPage, fetchNextPage } = historyQuery;
  const loadMoreVisits = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) void fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const loading = Boolean(hashedCode) && historyQuery.isLoading;
  const error = !hashedCode
    ? 'History not found.'
    : historyQuery.isError
      ? historyQuery.error.message.trim() || 'Could not load history details.'
      : null;

  useFocusEffect(
    useCallback(() => {
      const parent = navigation.getParent();
      parent?.setOptions({
        tabBarStyle: { display: 'none' },
      });

      return () => {
        parent?.setOptions({
          tabBarStyle,
        });
      };
    }, [navigation, tabBarStyle])
  );

  const openDurationScreen = useCallback(() => {
    router.push({
      pathname: '/user/history/duration',
      params: {
        visitorName: name || 'Guest',
        relationship: category || 'other',
        gender,
      },
    });
  }, [category, gender, name]);

  const handleShare = useCallback(async () => {
    try {
      await Share.share({
        message: `Access code for ${name || 'your guest'}: ${hashedCode.toUpperCase()}`,
      });
    } catch {
      // user dismissed the share sheet
    }
  }, [hashedCode, name]);

  const handleDelete = useCallback(() => {
    if (!hashedCode || deleting) return;

    Alert.alert('Delete Invite', 'Are you sure you want to delete this invite?', [
      { text: 'Keep', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          setDeleting(true);
          try {
            await deleteCodeMutation.mutateAsync(hashedCode);
            navigation.goBack();
          } catch (err) {
            Alert.alert(
              'Could not delete invite',
              getErrorMessage(err)?.trim() || 'Please try again later.'
            );
          } finally {
            setDeleting(false);
          }
        },
      },
    ]);
  }, [deleteCodeMutation, deleting, hashedCode, navigation]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <AccessHistoryDetail
        name={name}
        category={category}
        events={events}
        loading={loading}
        error={error}
        onBack={() => navigation.goBack()}
        showRegenerate={!isActive && !loading && !error}
        onRegenerate={openDurationScreen}
        onEndReached={loadMoreVisits}
        loadingMore={isFetchingNextPage}
        activeCodeActions={
          isActive && !loading && !error
            ? { onShare: handleShare, onDelete: handleDelete, deleting }
            : undefined
        }
      />
    </SafeAreaView>
  );
}
