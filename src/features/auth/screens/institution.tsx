import { useEffect, useRef, useState, useCallback } from 'react';
import { Alert, Keyboard, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Button from '@/src/shared/components/Button';
import InstitutionSearchIdle from '@/src/assets/icons/institution-search-idle.svg';
import InstitutionSearchActive from '@/src/assets/icons/institution-search-active.svg';
import { searchPublicEstates } from '@/src/features/admin/services/estate';
import InstitutionResultCard from '@/src/features/auth/components/InstitutionResultCard';
import {
  getSelectedInstitution,
  setSelectedInstitution,
} from '@/src/features/auth/services/authPersistence';
import LoadingTransition from '@/src/shared/components/feedback/LoadingTransition';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import type { Estate } from '@/src/features/admin/types/estate';

const DEBOUNCE_MS = 300;
const MOVE_MS = 380;
const MOVE_EASE = Easing.out(Easing.cubic);
/** Where the search field sits under "Not Any ?" while searching. */
const ACTIVE_TOP = 56;
const TITLE_GAP = 48;
/** Continue sits 108px above the bottom of the 812pt frame, above the home indicator. */
const CONTINUE_BOTTOM = 108;

export default function InstitutionScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Estate[]>([]);
  const [settledQuery, setSettledQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Estate | null>(null);
  const [appReady, setAppReady] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const searchSeq = useRef(0);
  const placed = useRef(false);
  const metrics = useRef({ container: 0, title: 0, row: 0 });
  const progress = useSharedValue(0);
  const shift = useSharedValue(0);
  const anchor = useSharedValue(0);
  const titleH = useSharedValue(0);
  const rowH = useSharedValue(0);
  const continueOpacity = useSharedValue(0);
  const continueTranslateY = useSharedValue(20);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const awaitingResults = hasQuery && trimmedQuery !== settledQuery;

  useEffect(() => {
    if (hasQuery) setSearching(true);
  }, [hasQuery]);

  useEffect(() => {
    progress.value = withTiming(searching ? 1 : 0, { duration: MOVE_MS, easing: MOVE_EASE });
  }, [searching, progress]);

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const stored = await getSelectedInstitution();
        // Native: a stored estate means go straight to login — don't paint this picker first.
        if (stored && Platform.OS !== 'web') {
          router.replace('/auth/login');
          return;
        }
        if (stored) {
          setSelected(null);
        }
      } catch {
        // ignore read errors; continue to selection screen
      }
      setAppReady(true);
    };
    checkExisting();
  }, [router]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, DEBOUNCE_MS);
    return () => clearTimeout(handler);
  }, [query]);

  useEffect(() => {
    const trimmed = debouncedQuery.trim();
    const seq = ++searchSeq.current;

    if (!trimmed) {
      setResults([]);
      setSettledQuery('');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    searchPublicEstates(trimmed)
      .then((response) => {
        if (seq !== searchSeq.current) return;
        setResults(response?.items ?? []);
        setSettledQuery(trimmed);
      })
      .catch(() => {
        if (seq !== searchSeq.current) return;
        setResults([]);
        setSettledQuery(trimmed);
      })
      .finally(() => {
        if (seq !== searchSeq.current) return;
        setIsLoading(false);
      });
  }, [debouncedQuery]);

  useEffect(() => {
    const visible = selected !== null;
    continueOpacity.value = withTiming(visible ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
    continueTranslateY.value = withTiming(visible ? 0 : 20, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [selected, continueOpacity, continueTranslateY]);

  const placeGroup = useCallback(() => {
    if (placed.current) return;
    const { container, title, row } = metrics.current;
    if (container <= 0 || title <= 0 || row <= 0) return;
    const idle = Math.max(0, (container - title - TITLE_GAP - row) / 2 - 72);
    anchor.value = idle;
    titleH.value = title;
    rowH.value = row;
    shift.value = ACTIVE_TOP - (idle + title + TITLE_GAP);
    placed.current = true;
  }, [anchor, rowH, shift, titleH]);

  const searchStyle = useAnimatedStyle(() => ({
    top: anchor.value + titleH.value + TITLE_GAP,
    transform: [{ translateY: shift.value * progress.value }],
  }));

  const titleStyle = useAnimatedStyle(() => ({
    top: anchor.value,
    opacity: interpolate(progress.value, [0, 0.18, 1], [1, 0, 0]),
  }));

  const fieldStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(progress.value, [0, 1], ['#EFF1F1', '#F6F7F7']),
    borderColor: interpolateColor(progress.value, [0, 1], ['#EFF1F1', '#113E55']),
  }));

  const idleIconStyle = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
  const activeIconStyle = useAnimatedStyle(() => ({ opacity: progress.value }));

  const notAnyStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
  }));

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    width: progress.value * 72,
    marginLeft: progress.value * 12,
    overflow: 'hidden' as const,
  }));

  const resultsStyle = useAnimatedStyle(() => ({
    opacity: progress.value,
    top: anchor.value + titleH.value + TITLE_GAP + rowH.value + shift.value * progress.value + 40,
  }));

  const handleCancel = useCallback(() => {
    setSearching(false);
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setSelected(null);
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const handleSelect = useCallback((estate: Estate) => {
    Keyboard.dismiss();
    inputRef.current?.blur();
    setSelected(estate);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selected) return;

    Keyboard.dismiss();
    inputRef.current?.blur();

    try {
      await setSelectedInstitution({
        estate_id: selected.id,
        estate_name: selected.name,
      });
      router.push({ pathname: '/auth/login', params: { fromInstitute: 'true' } });
    } catch {
      Alert.alert('Error', 'Could not save institution selection. Please try again.');
    }
  }, [selected, router]);

  const handleNotAny = useCallback(() => {
    Linking.openURL('https://www.gatepassng.com/contact');
  }, []);

  const continueStyle = useAnimatedStyle(() => ({
    opacity: continueOpacity.value,
    transform: [{ translateY: continueTranslateY.value }],
    pointerEvents: continueOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  if (!appReady) {
    return <LoadingTransition />;
  }

  return (
    <SafeAreaView className="flex-1 bg-body">
      <View className="flex-1 px-5 pt-6">
        <View
          className="w-full max-w-md flex-1"
          onLayout={(event) => {
            metrics.current.container = event.nativeEvent.layout.height;
            placeGroup();
          }}
        >
          <Animated.View
            pointerEvents={searching ? 'auto' : 'none'}
            style={notAnyStyle}
            className="absolute right-0 top-0 z-10"
          >
            <Pressable onPress={handleNotAny} className="active:opacity-70">
              <Text className="font-ubuntu-semibold text-base text-[#167A6F]">Not Any ?</Text>
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents={searching ? 'none' : 'box-none'}
            style={titleStyle}
            className="absolute left-0 right-0"
          >
            <View
              onLayout={(event) => {
                metrics.current.title = event.nativeEvent.layout.height;
                placeGroup();
              }}
            >
              <Text className="text-center font-ubuntu-medium text-heading text-primary">
                Which Institution are{'\n'}you signing in to?
              </Text>
            </View>
          </Animated.View>

          <Animated.View style={searchStyle} className="absolute left-0 right-0">
            <Pressable onPress={() => inputRef.current?.blur()} className="w-full">
              <View
                className="h-12 flex-row items-center"
                onLayout={(event) => {
                  metrics.current.row = event.nativeEvent.layout.height;
                  placeGroup();
                }}
              >
                <Animated.View
                  style={fieldStyle}
                  className="h-12 flex-1 flex-row items-center gap-2 rounded-full border-[0.5px] px-4"
                >
                  <View className="h-5 w-5 items-center justify-center">
                    <Animated.View style={idleIconStyle} className="absolute">
                      <InstitutionSearchIdle />
                    </Animated.View>
                    <Animated.View style={activeIconStyle} className="absolute">
                      <InstitutionSearchActive />
                    </Animated.View>
                  </View>
                  <TextInput
                    ref={inputRef}
                    value={query}
                    onChangeText={setQuery}
                    placeholder="Enter Institution name or address"
                    placeholderTextColor="#9B9797"
                    autoCapitalize="none"
                    autoCorrect={false}
                    className="h-9 flex-1 font-inter-light text-sm text-primary"
                    style={{ paddingVertical: 0 }}
                  />
                </Animated.View>

                <Animated.View style={cancelStyle} className="h-12 justify-center">
                  <Pressable onPress={handleCancel} className="active:opacity-70">
                    <Text numberOfLines={1} className="font-inter-medium text-sm text-[#167A6F]">
                      Cancel
                    </Text>
                  </Pressable>
                </Animated.View>
              </View>
            </Pressable>
          </Animated.View>

          <Animated.View
            pointerEvents={searching ? 'auto' : 'none'}
            style={resultsStyle}
            className="absolute left-0 right-0"
          >
            {searching && (
              <View className="gap-3">
                {awaitingResults || isLoading ? (
                  <View className="items-center justify-center py-6">
                    <CircleLoader size={48} />
                  </View>
                ) : results.length === 0 ? (
                  hasQuery ? (
                    <View className="items-center px-4 py-6">
                      <Text className="text-center font-Inter text-sm text-grey">
                        No institutions found. Try a different name or address.
                      </Text>
                    </View>
                  ) : null
                ) : (
                  results.map((estate) => (
                    <InstitutionResultCard
                      key={estate.id}
                      estate={estate}
                      selected={selected?.id === estate.id}
                      onPress={handleSelect}
                    />
                  ))
                )}
              </View>
            )}
          </Animated.View>
        </View>
      </View>

      {/* Continue button */}
      <Animated.View
        style={[continueStyle, { bottom: Math.max(24, CONTINUE_BOTTOM - insets.bottom) }]}
        className="absolute left-0 right-0 items-center px-5"
      >
        <Button label="Continue" onPress={handleContinue} />
      </Animated.View>
    </SafeAreaView>
  );
}
