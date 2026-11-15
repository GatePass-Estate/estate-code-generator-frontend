import { Stack, useIsFocused } from 'expo-router';
import { View, Text, FlatList, Animated, Platform, Alert, RefreshControl } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useExitAppOnRootBack } from '@/src/shared/hooks/useExitAppOnRootBack';
import images from '@/src/shared/constants/images';
import { sharedStyles } from '@/src/shared/theme/styles';
import { UbuntuSans } from '@/src/shared/constants/fonts';
import { useAndroidBottomInset } from '@/src/shared/hooks/useAndroidBottomInset';
import ActiveCodeCard from '@/src/features/access-codes/components/ActiveCodeCard';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import HeaderActions from '@/src/features/dashboard/components/HeaderActions';
import { CopiedToast } from '@/src/shared/components/feedback/CopiedToast';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { useActiveCodeActions, useHomeCodes } from '@/src/features/dashboard/hooks/useHomeCodes';
import type { ActiveCodeRow } from '@/src/features/dashboard/utils/homeCodes';

function showExtendError(message: string) {
  Alert.alert('Could not extend code', message);
}

export default function HomeMobile() {
  const { tabContentPadding } = useAndroidBottomInset();
  const isFocused = useIsFocused();
  useExitAppOnRootBack();
  const bounceValue = useRef(new Animated.Value(0)).current;
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const copiedToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Refetches on every focus and polls only while focused.
  const { codes, setCodes, refreshing, refresh, removeCode } = useHomeCodes({
    excludeUpcoming: true,
    refetchOnFocus: true,
  });
  const {
    rows: listRows,
    frozenCodes,
    toggleFreeze,
    extend,
    openInviteDetails,
    openHistory,
  } = useActiveCodeActions(codes, setCodes, { onExtendError: showExtendError });

  useEffect(() => {
    return () => {
      if (copiedToastTimer.current) clearTimeout(copiedToastTimer.current);
    };
  }, []);

  const handleCopied = useCallback(() => {
    setShowCopiedToast(true);
    if (copiedToastTimer.current) clearTimeout(copiedToastTimer.current);
    copiedToastTimer.current = setTimeout(() => setShowCopiedToast(false), 1600);
  }, []);

  // PERF-15: only bounce while this tab is focused.
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
  }, [bounceValue, isFocused]);

  const isEmpty = codes.length === 0;

  const renderCodeItem = useCallback(
    ({ item: row }: { item: ActiveCodeRow }) => {
      const { item, expiresAt, startAt, frozen } = row;
      return (
        <ActiveCodeCard
          item={item}
          guestName={item.visitor_fullname ?? 'Guest'}
          code={item.hashed_code.toUpperCase()}
          expiresAt={expiresAt}
          startAt={startAt}
          frozen={frozen}
          onToggleFreeze={() => toggleFreeze(item.hashed_code, frozen)}
          onDeleted={() => removeCode(item.hashed_code)}
          onCopied={handleCopied}
          onOpenHistory={() => openHistory(item)}
          onOpenDetails={() => openInviteDetails(item)}
          onExtend={() => extend(item)}
        />
      );
    },
    [handleCopied, removeCode, extend, toggleFreeze, openHistory, openInviteDetails]
  );

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
          titleClassName="font-ubuntu-medium text-[27.34px] leading-[33px] text-[#113E55]"
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
            data={listRows}
            extraData={frozenCodes}
            keyExtractor={(row) => row.item.hashed_code}
            scrollEnabled={!isEmpty}
            contentContainerStyle={{ paddingBottom: tabContentPadding, flexGrow: 1, gap: 8 }}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={() => void refresh(true)}
                // Hide the system ActivityIndicator; CircleLoader is shown in the header.
                tintColor="transparent"
                colors={['transparent']}
                progressBackgroundColor="transparent"
              />
            }
            ListHeaderComponent={
              <>
                {refreshing ? (
                  <View className="items-center py-4">
                    <CircleLoader size={32} />
                  </View>
                ) : null}
                {!isEmpty ? (
                  <Text className="mt-9 mb-[18px] font-inter-medium text-sm text-[#878686]">
                    All incoming guest
                  </Text>
                ) : null}
              </>
            }
            ListEmptyComponent={null}
            renderItem={renderCodeItem}
          />
        </GestureHandlerRootView>
      </View>
    </SafeAreaView>
  );
}
