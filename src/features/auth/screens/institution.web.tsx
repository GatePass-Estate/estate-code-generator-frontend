import { useEffect, useRef, useState, useCallback } from 'react';
import { Keyboard, Platform, Pressable, Text, TextInput, View } from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Button from '@/src/shared/components/Button';
import InstitutionSearchIdle from '@/src/assets/icons/institution-search-idle.svg';
import InstitutionSearchActive from '@/src/assets/icons/institution-search-active.svg';
import InstitutionResultCard from '@/src/features/auth/components/InstitutionResultCard';
import { searchPublicEstates } from '@/src/features/admin/services/estate';
import { cn } from '@/src/shared/utils/cn';
import { setSelectedInstitution } from '@/src/features/auth/services/authPersistence';
import { getWidthBreakpoint } from '@/src/shared/utils/helpers';
import LoadingTransition from '@/src/shared/components/feedback/LoadingTransition';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import type { Estate } from '@/src/features/admin/types/estate';

const DEBOUNCE_MS = 300;

export default function InstitutionWebScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<Estate[]>([]);
  const [settledQuery, setSettledQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Estate | null>(null);
  const [appReady, setAppReady] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  const inputRef = useRef<TextInput>(null);
  const searchSeq = useRef(0);
  const cancelWidth = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);
  const dropdownTranslateY = useSharedValue(-8);
  const continueOpacity = useSharedValue(0);
  const continueTranslateY = useSharedValue(20);
  const emptyStateOpacity = useSharedValue(1);
  const titlePlaced = useSharedValue(1);
  const searchingFlag = useSharedValue(0);

  const trimmedQuery = query.trim();
  const hasQuery = trimmedQuery.length > 0;
  const awaitingResults = hasQuery && trimmedQuery !== settledQuery;
  const showDropdown = hasQuery || debouncedQuery.trim().length > 0;

  useEffect(() => {
    if (hasQuery) setSearching(true);
  }, [hasQuery]);
  const isLargeScreen = windowWidth > getWidthBreakpoint();

  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    document.title = 'Select Institution - GatePass';
  }, []);

  useEffect(() => {
    setAppReady(true);
  }, []);

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
    if (searching) {
      cancelWidth.value = withTiming(1, {
        duration: 200,
        easing: Easing.out(Easing.ease),
      });
      return;
    }
    cancelWidth.value = 0;
  }, [searching, cancelWidth]);

  useEffect(() => {
    const visible = showDropdown;
    dropdownOpacity.value = withTiming(visible ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
    dropdownTranslateY.value = withTiming(visible ? 0 : -8, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [showDropdown, dropdownOpacity, dropdownTranslateY]);

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

  useEffect(() => {
    searchingFlag.value = searching ? 1 : 0;
    if (searching) {
      emptyStateOpacity.value = withTiming(0, { duration: 180 }, (finished) => {
        if (finished && searchingFlag.value === 1) titlePlaced.value = 0;
      });
      return;
    }
    titlePlaced.value = 1;
    emptyStateOpacity.value = 1;
  }, [searching, emptyStateOpacity, titlePlaced, searchingFlag]);

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
    setSelected(estate);
  }, []);

  const handleContinue = useCallback(async () => {
    if (!selected) return;

    try {
      await setSelectedInstitution({
        estate_id: selected.id,
        estate_name: selected.name,
      });
      router.push({ pathname: '/auth/login', params: { fromInstitute: 'true' } });
    } catch {
      window.alert('Could not save institution selection. Please try again.');
    }
  }, [selected, router]);

  const handleNotAny = useCallback(() => {
    Linking.openURL('https://www.gatepassng.com/contact');
  }, []);

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: cancelWidth.value,
    width: cancelWidth.value * 72,
    marginLeft: cancelWidth.value * 16,
    overflow: 'hidden',
    flexGrow: 0,
    flexShrink: 0,
  }));

  const dropdownStyle = useAnimatedStyle(() => ({
    opacity: dropdownOpacity.value,
    transform: [{ translateY: dropdownTranslateY.value }],
    pointerEvents: dropdownOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  const continueStyle = useAnimatedStyle(() => ({
    opacity: continueOpacity.value,
    transform: [{ translateY: continueTranslateY.value }],
    pointerEvents: continueOpacity.value > 0.5 ? 'auto' : 'none',
  }));

  const emptyStateStyle = useAnimatedStyle(() => ({
    opacity: titlePlaced.value === 1 ? emptyStateOpacity.value : 0,
    position: titlePlaced.value === 1 ? ('relative' as const) : ('absolute' as const),
    pointerEvents: titlePlaced.value === 1 ? ('auto' as const) : ('none' as const),
  }));

  if (!appReady) {
    return <LoadingTransition />;
  }

  return (
    <View className="min-h-screen bg-body flex-row items-center justify-center p-6">
      <View className="w-full" style={{ maxWidth: isLargeScreen ? 480 : 420 }}>
        {/* Header */}
        <View className="flex-row items-center justify-between mb-8">
          <View style={{ width: 64 }} />
          {searching && (
            <Pressable onPress={handleNotAny} className="active:opacity-70">
              <Text className="font-ubuntu-semibold text-base text-[#167A6F]">Not Any ?</Text>
            </Pressable>
          )}
        </View>

        {/* Empty-state title */}
        <Animated.View className="items-center mb-8" style={emptyStateStyle}>
          <Text className="text-center font-ubuntu-medium text-heading text-primary">
            Which Institution are{'\n'}you signing in to?
          </Text>
        </Animated.View>

        {/* Search */}
        <Pressable onPress={() => inputRef.current?.blur()} className="w-full">
          <View className="flex-row items-center">
            <View
              className={cn(
                'h-14 flex-1 flex-row items-center gap-3 rounded-2xl px-5',
                searching ? 'border-[0.5px] border-primary bg-transparent' : 'bg-[#EFF1F1]'
              )}
            >
              <View className="h-6 w-6 items-center justify-center">
                {searching ? <InstitutionSearchActive /> : <InstitutionSearchIdle />}
              </View>
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                placeholder="Enter Institution name or address"
                placeholderTextColor="#9B9797"
                autoCapitalize="none"
                autoCorrect={false}
                className="h-10 flex-1 font-inter-light text-base text-primary outline-none"
                style={{ paddingVertical: 0 }}
              />
            </View>

            <Animated.View style={cancelStyle}>
              <Pressable onPress={handleCancel} className="active:opacity-70">
                <Text
                  numberOfLines={1}
                  className="font-inter-medium text-sm text-[#167A6F]"
                  style={{ width: 72 }}
                >
                  Cancel
                </Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Dropdown */}
          <Animated.View style={dropdownStyle} className="mt-10 overflow-hidden">
            <View className="gap-3">
              {awaitingResults || isLoading ? (
                <View className="py-6 items-center justify-center">
                  <CircleLoader size={48} />
                </View>
              ) : results.length === 0 ? (
                <View className="py-6 px-4 items-center">
                  <Text className="text-grey font-Inter text-sm text-center">
                    No institutions found. Try a different name or address.
                  </Text>
                </View>
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
          </Animated.View>
        </Pressable>

        {/* Continue button */}
        <Animated.View style={continueStyle} className="mt-8 items-center">
          <Button label="Continue" onPress={handleContinue} />
        </Animated.View>
      </View>
    </View>
  );
}
