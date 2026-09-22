import { Stack, router, useNavigation } from 'expo-router';
import { View, Text, FlatList, Animated, Platform, Alert } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import images from '@/src/constants/images';
import { Codes } from '@/src/types/codes';
import { extendCode, freezeCode, getAllCodes } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { sharedStyles } from '@/src/theme/styles';
import { UbuntuSans } from '@/src/constants/fonts';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { isDataEqual, formatInvitePeriodDisplay, isUpcomingCode, parseLogDate, timeCalc } from '@/src/lib/helpers';
import ActiveCodeCard from '@/src/components/mobile/ActiveCodeCard';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import { CopiedToast } from '@/src/components/mobile/CopiedToast';

export default function HomeMobile() {
  const { tabContentPadding } = useAndroidBottomInset();
  const bounceValue = useRef(new Animated.Value(0)).current;
  const [refreshing, setRefreshing] = useState(true);
  const [codes, setCodes] = useState<Codes[]>([]);
  const [frozenCodes, setFrozenCodes] = useState<Set<string>>(new Set());
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const navigation = useNavigation();
  const codesRef = useRef<Codes[]>(codes);
  const copiedToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    codesRef.current = codes;
  }, [codes]);

  const fetchCodes = async (showLoading = true) => {
    if (showLoading) setRefreshing(true);
    try {
      const result = await getAllCodes(useUserStore.getState().user_id);
      const newCodes = result.items.filter((code) => !code.is_expired && !isUpcomingCode(code));
      if (!isDataEqual(newCodes, codesRef.current)) {
        setCodes(newCodes);
      }
    } catch (error) {
      console.log('Failed to fetch codes:', error);
    } finally {
      if (showLoading) setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchCodes(true);
  }, []);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      fetchCodes(false);
    });
    return unsubscribe;
  }, [navigation]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      const intervalId = setInterval(() => {
        fetchCodes(false);
      }, 30000);

      return () => clearInterval(intervalId);
    });

    return unsubscribe;
  }, [navigation]);

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
      const res = await freezeCode(hashedCode, targetFrozen);
      // Keep the requested state on success so a sticky `frozen: true` response can't block unfreeze
      applyFrozenState(hashedCode, targetFrozen, res?.is_valid);
    } catch (error) {
      console.log('Failed to freeze code via API:', error);
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
      const res = await extendCode(item.hashed_code);
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
    } catch (error: any) {
      Alert.alert('Could not extend code', error?.message?.trim() || 'Please try again later.');
    }
  };

  const isEmpty = codes.length === 0;

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
          showActions
          containerClassName="z-10"
          titleClassName="text-[27.34px]"
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
            data={codes}
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
