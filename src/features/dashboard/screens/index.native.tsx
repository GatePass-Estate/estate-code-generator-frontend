import { Stack, router, useFocusEffect } from 'expo-router';
import CountdownRing from '@/src/shared/components/CountdownRing';
import { View, Text, FlatList, Animated, Platform, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import images from '@/src/shared/constants/images';
import { Codes } from '@/src/features/access-codes/types/codes';
import {
  useActiveCodes,
  useExtendCode,
  useFreezeCode,
} from '@/src/features/access-codes/hooks/codes';
import { useUserStore } from '@/src/store/userStore';
import { sharedStyles } from '@/src/shared/theme/styles';
import { errorMessage } from '@/src/shared/services/api/errors';
import { UbuntuSans } from '@/src/shared/constants/fonts';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import {
  isDataEqual,
  formatInvitePeriodDisplay,
  isUpcomingCode,
  parseLogDate,
  timeCalc,
} from '@/src/shared/utils/helpers';
import ActiveCodeCard from '@/src/features/access-codes/components/ActiveCodeCard';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import HeaderActions from '@/src/features/dashboard/components/HeaderActions';
import { CopiedToast } from '@/src/shared/components/feedback/CopiedToast';

export default function HomeMobile() {
  const { tabContentPadding } = useAndroidBottomInset();
  const bounceValue = useRef(new Animated.Value(0)).current;
  const userId = useUserStore((state) => state.user_id);
  const codesQuery = useActiveCodes(userId);
  const freezeCodeMutation = useFreezeCode();
  const extendCodeMutation = useExtendCode();
  const [refreshing, setRefreshing] = useState(true);
  const [codes, setCodes] = useState<Codes[]>([]);
  const [frozenCodes, setFrozenCodes] = useState<Set<string>>(new Set());
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const codesRef = useRef<Codes[]>(codes);
  const copiedToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    codesRef.current = codes;
  }, [codes]);

  const fetchCodes = async (showLoading = true) => {
    if (showLoading) setRefreshing(true);
    try {
      await codesQuery.refetch();
    } catch {
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  useEffect(() => {
    if (!codesQuery.data) return;
    const newCodes = codesQuery.data.items.filter(
      (code) => !code.is_expired && !isUpcomingCode(code)
    );
    if (!isDataEqual(newCodes, codesRef.current)) {
      setCodes(newCodes);
    }
    setRefreshing(false);
  }, [codesQuery.data]);

  useEffect(() => {
    if (!codesQuery.isError) return;
    setRefreshing(false);
  }, [codesQuery.isError, codesQuery.error]);

  // Refresh on every focus and poll only while focused. (A cleanup returned from a navigation
  // 'focus' listener is discarded, which used to leave one 30s interval running per visit.)
  const fetchCodesRef = useRef(fetchCodes);
  fetchCodesRef.current = fetchCodes;
  useFocusEffect(
    useCallback(() => {
      fetchCodesRef.current(false);
      const intervalId = setInterval(() => {
        fetchCodesRef.current(false);
      }, 30000);
      return () => clearInterval(intervalId);
    }, [])
  );

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceValue, {
          toValue: -10,
          duration: 500,
          useNativeDriver: Platform.OS !== 'web',
        }),
        Animated.timing(bounceValue, {
          toValue: 0,
          duration: 500,
          useNativeDriver: Platform.OS !== 'web',
        }),
      ])
    );
    anim.start();

    return () => {
      anim.stop();
    };
  }, [bounceValue]);

  useEffect(() => {
    return () => {
      if (copiedToastTimer.current) clearTimeout(copiedToastTimer.current);
    };
  }, []);

  const handleCopied = () => {
    setShowCopiedToast(true);
    if (copiedToastTimer.current) clearTimeout(copiedToastTimer.current);
    copiedToastTimer.current = setTimeout(() => setShowCopiedToast(false), 1600);
  };

  const handleDeleted = (hashedCode: string) => {
    setCodes((prev) => prev.filter((c) => c.hashed_code !== hashedCode));
  };

  const applyFrozenState = (hashedCode: string, frozen: boolean, isValid?: boolean) => {
    setFrozenCodes((prev) => {
      const next = new Set(prev);
      if (frozen) next.add(hashedCode);
      else next.delete(hashedCode);
      return next;
    });
    setCodes((prev) =>
      prev.map((c) =>
        c.hashed_code === hashedCode
          ? {
              ...c,
              frozen,
              ...(typeof isValid === 'boolean' ? { is_valid: isValid } : {}),
            }
          : c
      )
    );
  };

  /** `isCurrentlyFrozen` must match what the card is showing (not a stale item snapshot). */
  const handleToggleFreeze = async (hashedCode: string, isCurrentlyFrozen: boolean) => {
    const targetFrozen = !isCurrentlyFrozen;

    applyFrozenState(hashedCode, targetFrozen);

    try {
      const res = await freezeCodeMutation.mutateAsync({
        code: hashedCode,
        frozen: targetFrozen,
      });
      // Keep the requested state on success so a sticky `frozen: true` response can't block unfreeze
      applyFrozenState(hashedCode, targetFrozen, res?.is_valid);
    } catch {
      applyFrozenState(hashedCode, isCurrentlyFrozen);
    }
  };

  const openInviteDetails = (item: Codes) => {
    const { home_address, estate_name } = useUserStore.getState();
    const startRaw = item.validity_period?.start;
    const endRaw = item.validity_period?.end || item.valid_until;
    const start = startRaw ? parseLogDate(startRaw) : null;
    const end = endRaw ? parseLogDate(endRaw) : null;

    let formattedDate = '';
    let timeframe = '';
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      ({ formattedDate, timeframe } = formatInvitePeriodDisplay(start, end));
    } else {
      const calc = timeCalc(item.valid_until);
      formattedDate = calc.formattedDate;
      timeframe = calc.timeframe;
    }

    router.push({
      pathname: '/invite',
      params: {
        name: item.visitor_fullname ?? 'Guest',
        code: item.hashed_code,
        date: formattedDate,
        timeframe,
        address: [home_address, estate_name].filter(Boolean).join(', '),
        from: 'home',
      },
    });
  };

  const openHistory = (item: Codes) => {
    router.push({
      pathname: '/user/history/[codeId]',
      params: {
        codeId: item.hashed_code,
        name: item.visitor_fullname ?? '',
        category: item.relationship_with_resident ?? '',
        isActive: 'true',
      },
    });
  };

  const handleExtend = async (item: Codes) => {
    try {
      const res = await extendCodeMutation.mutateAsync(item.hashed_code);
      setCodes((prev) =>
        prev.map((c) =>
          c.hashed_code === item.hashed_code
            ? {
                ...c,
                valid_until: res.valid_until || c.valid_until,
                validity_period: res.validity_period ?? c.validity_period,
                extended: res.extended ?? true,
              }
            : c
        )
      );
    } catch (error: unknown) {
      Alert.alert(
        'Could not extend code',
        errorMessage(error)?.trim() || 'Please try again later.'
      );
    }
  };

  const isEmpty = codes.length === 0;

  const sortedCodes = useMemo(() => {
    return [...codes].sort((a, b) => {
      const aFrozen = Boolean(a.frozen) || frozenCodes.has(a.hashed_code);
      const bFrozen = Boolean(b.frozen) || frozenCodes.has(b.hashed_code);
      if (aFrozen === bFrozen) return 0;
      return aFrozen ? 1 : -1;
    });
  }, [codes, frozenCodes]);

  return (
    <SafeAreaView
      style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}
      edges={['top', 'left', 'right']}
    >
      <Stack.Screen
        options={{
          headerShown: false,
        }}
      />

      <CopiedToast visible={showCopiedToast} />

      <View className="flex-1">
        <ScreenHeader
          title="Active Codes"
          actions={<HeaderActions />}
          containerClassName="z-10"
          titleClassName="text-heading"
        />

        {isEmpty && !refreshing ? (
          <View
            pointerEvents="none"
            style={{
              position: 'absolute',
              top: 0,
              right: 0,
              bottom: 0,
              left: 0,
              alignItems: 'center',
              justifyContent: 'center',
              transform: [{ translateY: -32 }],
            }}
          >
            <Animated.Image
              source={images.ghostImg}
              style={{
                width: 201,
                height: 221,
                opacity: 0.5,
                resizeMode: 'contain',
                transform: [{ translateY: bounceValue }],
              }}
            />
            <Text
              style={{
                marginTop: -20,
                width: 195,
                textAlign: 'center',
                fontFamily: UbuntuSans.semiBold,
                fontSize: 22,
                letterSpacing: -0.24,
                color: '#D3D3D3',
              }}
            >
              Click the ‘+’ to add your guest
            </Text>
          </View>
        ) : null}

        <GestureHandlerRootView style={{ flex: 1 }}>
          <FlatList
            data={sortedCodes}
            extraData={frozenCodes}
            keyExtractor={(item) => item.hashed_code}
            refreshing={refreshing}
            onRefresh={fetchCodes}
            scrollEnabled={!isEmpty}
            contentContainerStyle={{ paddingBottom: tabContentPadding, flexGrow: 1, gap: 8 }}
            ListHeaderComponent={
              !isEmpty ? (
                <Text className="mt-9 mb-[18px] font-inter-medium text-sm text-[#878686]">
                  All incoming guest
                </Text>
              ) : null
            }
            ListEmptyComponent={null}
            renderItem={({ item }) => {
              const iso = String(item.valid_until ?? '')
                .replace(' ', 'T')
                .replace(/([+-]\d{2})(\d{2})$/, '$1:$2');
              const expiresAt = new Date(iso).getTime();

              const startIso = item.validity_period?.start
                ? String(item.validity_period.start)
                    .replace(' ', 'T')
                    .replace(/([+-]\d{2})(\d{2})$/, '$1:$2')
                : null;
              const startAt = startIso ? new Date(startIso).getTime() : null;

              const frozen = Boolean(item.frozen) || frozenCodes.has(item.hashed_code);

              return (
                <ActiveCodeCard
                  item={item}
                  guestName={item.visitor_fullname ?? 'Guest'}
                  code={item.hashed_code.toUpperCase()}
                  expiresAt={expiresAt}
                  startAt={startAt}
                  frozen={frozen}
                  onToggleFreeze={() => handleToggleFreeze(item.hashed_code, frozen)}
                  onDeleted={() => handleDeleted(item.hashed_code)}
                  onCopied={handleCopied}
                  onOpenHistory={() => openHistory(item)}
                  onOpenDetails={() => openInviteDetails(item)}
                  onExtend={() => handleExtend(item)}
                />
              );
            }}
          />
        </GestureHandlerRootView>
      </View>
    </SafeAreaView>
  );
}
