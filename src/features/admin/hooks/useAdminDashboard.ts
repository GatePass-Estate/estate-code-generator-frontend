import { useCallback, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useFocusEffect, useLocalSearchParams, useNavigation, useRouter } from 'expo-router';
import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { useUserStore } from '@/src/store/userStore';
import { getSeatOccupancy } from '@/src/features/billing/utils/billing';
import { useEstateEntitlements } from '@/src/features/billing';
import { useEstateSubscription } from '@/src/features/billing/hooks/billing';
import { useContactAdminNoticeStore, useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import { estateUsersKeys, fetchEstateUsersPage } from '@/src/features/users/hooks/estateUsers';
import { useFocusedRefetchInterval } from '@/src/features/admin/hooks/useFocusedRefetchInterval';
import {
  getRegistrationBlockReason,
  type RegistrationBlockReason,
} from '@/src/features/admin/utils/dashboard';
import type { AllUsers, User } from '@/src/features/users/types/user';

const DASHBOARD_POLL_MS = 30_000;
const EMPTY_USERS: AllUsers = { total: 0, page: 1, limit: 30, items: [] };

/**
 * Admin home (mobile layout, also the narrow web layout): seat summary, users preview, and the
 * Admin Tools actions. The users page lives in the shared estate-users cache (billing seat usage
 * reads the same entry); it reloads on every focus and polls every 30s while focused.
 */
export function useAdminDashboard() {
  const router = useRouter();
  const navigation = useNavigation();
  const goBack = useGoBack();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const estateId = useUserStore((s) => s.estate_id);
  const userRole = useUserStore((s) => s.role);
  const showContactAdminNotice = useContactAdminNoticeStore((s) => s.show);
  const { data: estateEntitlements } = useEstateEntitlements();
  const { data: subscriptionData } = useEstateSubscription();
  const subscription = subscriptionData?.subscription;

  const refetchInterval = useFocusedRefetchInterval(DASHBOARD_POLL_MS);
  const usersQuery = useQuery({
    queryKey: estateUsersKeys.estatePage(estateId || 'session'),
    queryFn: fetchEstateUsersPage,
    refetchInterval,
  });
  // A failed refresh keeps the last loaded totals (TanStack keeps `data` on error).
  const users = usersQuery.data ?? EMPTY_USERS;
  const isInitialLoading = usersQuery.isLoading;
  const { refetch } = usersQuery;

  // Load on every focus (deduped with the mount fetch instead of cancelling it).
  useFocusEffect(
    useCallback(() => {
      void refetch({ cancelRefetch: false });
    }, [refetch])
  );

  const [refreshing, setRefreshing] = useState(false);
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const { requestAccessWhenReady: requestBroadcastAccess } = useFeatureGate('admin_broadcast', {
    notice: 'floating',
  });
  const { requestAccessWhenReady: requestIncidentReportAccess } = useFeatureGate(
    'incident_report',
    { notice: 'floating' }
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
        // Same admin stack as Broadcast so push/pop slides match the rest of Admin Tools.
        router.push({ pathname: '/admin/report', params: { returnTo: '/admin' } });
      }
    } finally {
      openingIncidentReportRef.current = false;
    }
  }, [navigation, requestIncidentReportAccess, router]);

  const handleBack = useCallback(() => {
    // Same as Broadcast: stack pop → slide. Only replace when there is no history.
    if (navigation.canGoBack() || navigation.getParent()?.canGoBack() || router.canGoBack()) {
      goBack();
      return;
    }
    router.replace(returnTo === '/settings' ? '/settings' : '/user');
  }, [goBack, navigation, returnTo, router]);

  const {
    security: securityPersonnelCount,
    residents: residentsCount,
    seatResidents: seatResidentsCount,
    occupied: occupiedSeats,
  } = getSeatOccupancy(users);
  const totalUsersCount = users.total;
  const isPrimaryAdmin = userRole === 'primary_admin' || userRole === 'root';
  const estateUserCapacity =
    estateEntitlements?.coveredUsers ?? subscription?.covered_users ?? null;
  const pendingCoveredUsers = subscription?.pending_covered_users ?? null;
  const limitedUsers = users.items.filter((user) => user.status).slice(0, 3);

  const [seatModalVisible, setSeatModalVisible] = useState(false);
  const [blockedRegistrationReason, setBlockedRegistrationReason] =
    useState<RegistrationBlockReason | null>(null);

  const handleOpenAddSeats = () => {
    if (isPrimaryAdmin) {
      router.push('/billing/manage-seats');
    } else {
      showContactAdminNotice('guest_management', 'Only the primary admin can add seats.');
    }
  };

  const handleRegisterUser = () => {
    const reason = getRegistrationBlockReason({
      occupiedSeats,
      capacity: estateUserCapacity,
      pendingCoveredUsers,
    });
    if (reason) {
      setBlockedRegistrationReason(reason);
      return;
    }
    router.push('/admin/users/add');
  };

  const openUser = (item: User) => {
    const userId = item.id ?? item.user_id;
    if (!userId) return;
    // Profile API 404s inactive users — keep the list row so the profile can still open.
    queryClient.setQueryData(queryKeys.users.byIdAdmin(userId), {
      ...item,
      user_id: item.user_id || userId,
      id: userId,
    });
    router.push({ pathname: '/admin/users/[userId]', params: { userId } });
  };

  return {
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
  };
}
