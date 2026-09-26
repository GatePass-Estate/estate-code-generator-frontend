import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import * as Linking from 'expo-linking';
import { FontAwesome } from '@expo/vector-icons';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { Button } from '@/src/components/nativewindui/Button';
import { searchPublicEstates } from '@/src/lib/api/estate';
import { cn } from '@/src/lib/cn';
import {
  getSelectedInstitution,
  getWidthBreakpoint,
  setSelectedInstitution,
} from '@/src/lib/helpers';
import LoadingTransition from '@/src/components/common/LoadingTransition';
import type { Estate } from '@/src/types/estate';

const DEBOUNCE_MS = 300;

export default function InstitutionWebScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<Estate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Estate | null>(null);
  const [appReady, setAppReady] = useState(false);
  const [windowWidth, setWindowWidth] = useState(
    typeof window !== 'undefined' ? window.innerWidth : 0
  );

  const inputRef = useRef<TextInput>(null);
  const cancelWidth = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);
  const dropdownTranslateY = useSharedValue(-8);
  const continueOpacity = useSharedValue(0);
  const continueTranslateY = useSharedValue(20);
  const emptyStateOpacity = useSharedValue(1);

  const hasQuery = query.trim().length > 0;
  const showDropdown = hasQuery || debouncedQuery.trim().length > 0;
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
    const checkExisting = async () => {
      try {
        const stored = await getSelectedInstitution();
        if (stored) {
          router.replace('/auth/login');
          return;
        }
      } catch {
        // ignore read errors
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
    const search = async () => {
      const trimmed = debouncedQuery.trim();
      if (!trimmed) {
        setResults([]);
        setIsLoading(false);
        return;
      }

      setIsLoading(true);
      try {
        const response = await searchPublicEstates(trimmed);
        setResults(response?.items ?? []);
      } catch {
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    };

    search();
  }, [debouncedQuery]);

  useEffect(() => {
    cancelWidth.value = withTiming(hasQuery ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [hasQuery, cancelWidth]);

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
    emptyStateOpacity.value = withTiming(showDropdown ? 0 : 1, {
      duration: 200,
      easing: Easing.out(Easing.ease),
    });
  }, [showDropdown, emptyStateOpacity]);

  const handleCancel = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setResults([]);
    setSelected(null);
    setIsFocused(false);
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
      router.push('/auth/login');
    } catch {
      window.alert('Could not save institution selection. Please try again.');
    }
  }, [selected, router]);

  const handleNotAny = useCallback(() => {
    Linking.openURL('https://www.gatepassng.com/contact');
  }, []);

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: cancelWidth.value,
    transform: [{ translateX: (1 - cancelWidth.value) * 12 }],
    marginLeft: cancelWidth.value * 12,
    flex: 0,
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
    opacity: emptyStateOpacity.value,
    position: emptyStateOpacity.value < 0.1 ? 'absolute' : 'relative',
    pointerEvents: emptyStateOpacity.value < 0.1 ? 'none' : 'auto',
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
          {hasQuery && (
            <Pressable onPress={handleNotAny} className="active:opacity-70">
              <Text className="text-teal font-UbuntuSans font-medium text-sm">Not Any ?</Text>
            </Pressable>
          )}
        </View>

        {/* Empty-state title */}
        <Animated.View className="items-center mb-8" style={emptyStateStyle}>
          <Text
            className={cn(
              'text-primary font-UbuntuSans font-semibold text-center leading-tight',
              isLargeScreen ? 'text-3xl' : 'text-2xl'
            )}
          >
            Which Institution are you signing in to?
          </Text>
        </Animated.View>

        {/* Search */}
        <Pressable onPress={() => inputRef.current?.blur()} className="w-full">
          <View className="flex-row items-center">
            <View
              className={cn(
                'flex-1 flex-row items-center bg-light-grey rounded-xl px-4 h-14',
                isFocused && 'border border-primary'
              )}
            >
              <FontAwesome name="search" size={18} color="#9B9797" />
              <TextInput
                ref={inputRef}
                value={query}
                onChangeText={setQuery}
                onFocus={() => setIsFocused(true)}
                onBlur={() => setIsFocused(false)}
                placeholder="Enter Institution name or address"
                placeholderTextColor="#9B9797"
                autoCapitalize="none"
                autoCorrect={false}
                className="flex-1 ml-3 font-Inter text-base text-black h-full outline-none"
              />
            </View>

            <Animated.View style={cancelStyle}>
              <Pressable onPress={handleCancel} className="active:opacity-70">
                <Text className="text-primary font-Inter font-medium text-base">Cancel</Text>
              </Pressable>
            </Animated.View>
          </View>

          {/* Dropdown */}
          <Animated.View style={dropdownStyle} className="mt-2 overflow-hidden">
            <View className="bg-white rounded-xl border border-input-border/40 shadow-sm">
              {isLoading ? (
                <View className="py-6 items-center justify-center">
                  <ActivityIndicator color="#113E55" />
                </View>
              ) : results.length === 0 ? (
                <View className="py-6 px-4 items-center">
                  <Text className="text-grey font-Inter text-sm text-center">
                    No institutions found. Try a different name or address.
                  </Text>
                </View>
              ) : (
                results.map((estate) => {
                  const isSelected = selected?.id === estate.id;
                  return (
                    <Pressable
                      key={estate.id}
                      onPress={() => handleSelect(estate)}
                      className={cn(
                        'flex-row items-center px-4 py-4 border-b border-input-border/30 last:border-b-0',
                        isSelected ? 'bg-accent' : 'bg-white'
                      )}
                    >
                      <View
                        className={cn(
                          'w-5 h-5 rounded-full border-2 items-center justify-center mr-3',
                          isSelected ? 'border-primary' : 'border-grey'
                        )}
                      >
                        {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-primary" />}
                      </View>
                      <View className="flex-1">
                        <Text className="font-Inter font-semibold text-base text-black">
                          {estate.name}
                        </Text>
                        {!!estate.location && (
                          <Text className="font-Inter text-sm text-grey mt-0.5">
                            {estate.location}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  );
                })
              )}
            </View>
          </Animated.View>
        </Pressable>

        {/* Continue button */}
        <Animated.View style={continueStyle} className="mt-8">
          <Button
            onPress={handleContinue}
            className="w-full h-14 rounded-xl flex-row items-center justify-center"
            size={Platform.select({ ios: 'lg', default: 'lg' })}
          >
            <Text className="text-white font-UbuntuSans font-semibold text-base">Continue</Text>
          </Button>
        </Animated.View>
      </View>
    </View>
  );
}
