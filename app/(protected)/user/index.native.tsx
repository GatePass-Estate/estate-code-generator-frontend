import { Stack, router } from 'expo-router';
import { useNavigation } from '@react-navigation/native';
import { View, Text, FlatList, Image } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useEffect, useRef, useState } from 'react';
import images from '@/src/constants/images';
import { Codes } from '@/src/types/codes';
import { getAllCodes } from '@/src/lib/api/codes';
import { useUserStore } from '@/src/lib/stores/userStore';
import { sharedStyles } from '@/src/theme/styles';
import { useAndroidBottomInset } from '@/src/hooks/useAndroidBottomInset';
import { isDataEqual } from '@/src/lib/helpers';
import ActiveCodeCard from '@/src/components/mobile/ActiveCodeCard';
import HeaderActions from '@/src/components/mobile/HeaderActions';
import { CopiedToast } from '@/src/components/mobile/CopiedToast';

export default function HomeMobile({}) {
  const { tabContentPadding } = useAndroidBottomInset();
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
      const newCodes = result.items.filter((code) => !code.is_expired);
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

  const handleToggleFreeze = (hashedCode: string) => {
    setFrozenCodes((prev) => {
      const next = new Set(prev);
      if (next.has(hashedCode)) {
        next.delete(hashedCode);
      } else {
        next.add(hashedCode);
      }
      return next;
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

  const openExtend = (item: Codes) => {
    router.push({
      pathname: '/user/history/duration',
      params: {
        visitorName: item.visitor_fullname ?? 'Guest',
        relationship: item.relationship_with_resident ?? 'other',
        gender: item.gender ?? 'prefer_not_to_say',
      },
    });
  };

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

      <View>
        <View className="mb-6 mt-11 flex-row items-center justify-between">
          <Text className="text-[27.34px] font-ubuntu-medium text-primary">Active Codes</Text>
          <HeaderActions />
        </View>

        <GestureHandlerRootView>
          <FlatList
            data={codes}
            keyExtractor={(item) => item.hashed_code}
            refreshing={refreshing}
            onRefresh={fetchCodes}
            contentContainerStyle={{ paddingBottom: tabContentPadding, gap: 12 }}
            ListEmptyComponent={() => (
              <View className="flex-1 items-center mt-16">
                <Image
                  source={images.ghostImg}
                  style={{ width: 201, height: 221, opacity: 0.5 }}
                  resizeMode="contain"
                />
                <Text className="text-center text-[22px] font-ubuntu-semibold text-[#D3D3D3] mt-6 w-[195px]">
                  {`Click the '+' to add your guest`}
                </Text>
              </View>
            )}
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
                  onToggleFreeze={() => handleToggleFreeze(item.hashed_code)}
                  onDeleted={() => handleDeleted(item.hashed_code)}
                  onCopied={handleCopied}
                  onOpenHistory={() => openHistory(item)}
                  onExtend={() => openExtend(item)}
                />
              );
            }}
          />
        </GestureHandlerRootView>
      </View>
    </SafeAreaView>
  );
}
