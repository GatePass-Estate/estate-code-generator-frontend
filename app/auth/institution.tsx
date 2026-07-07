import { useEffect, useRef, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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
import { getSelectedInstitution, setSelectedInstitution } from '@/src/lib/helpers';
import LoadingTransition from '@/src/components/common/LoadingTransition';
import type { Estate } from '@/src/types/estate';

const DEBOUNCE_MS = 300;

export default function InstitutionScreen() {
  const router = useRouter();

  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const [results, setResults] = useState<Estate[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [selected, setSelected] = useState<Estate | null>(null);
  const [appReady, setAppReady] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const cancelWidth = useSharedValue(0);
  const dropdownOpacity = useSharedValue(0);
  const dropdownTranslateY = useSharedValue(-8);
  const continueOpacity = useSharedValue(0);
  const continueTranslateY = useSharedValue(20);
  const emptyStateOpacity = useSharedValue(1);

  const hasQuery = query.trim().length > 0;
  const showDropdown = hasQuery || debouncedQuery.trim().length > 0;

  useEffect(() => {
    const checkExisting = async () => {
      try {
        const stored = await getSelectedInstitution();
        if (stored) {
          router.replace('/auth/login');
          return;
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
      Alert.alert('Error', 'Could not save institution selection. Please try again.');
    }
  }, [selected, router]);

  const handleNotAny = useCallback(() => {
    Linking.openURL('https://www.gatepassng.com/contact');
  }, []);

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: cancelWidth.value,
    transform: [{ translateX: (1 - cancelWidth.value) * 12 }],
    marginLeft: cancelWidth.value * 12,
    // width is removed from layout by keeping a zero-width state
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
    <SafeAreaView className="flex-1 bg-body">
      <View className="flex-1 px-5 pt-6">
        <View className={cn('flex-1', !showDropdown && 'justify-center items-center')}>
          <View className="w-full max-w-md">
            <Animated.View className="justify-center mb-6" style={emptyStateStyle}>
              <View className="items-center px-4">
                <Text className="text-primary font-ubuntu-semibold text-4xl text-center ">
                  Which Institution are you signing in to?
                </Text>
              </View>
            </Animated.View>

            <View className="w-full">
              {hasQuery && (
                <View className="flex-row items-center justify-between mb-8">
                  <View className="w-16" />
                  <Pressable onPress={handleNotAny} className="active:opacity-70">
                    <Text className="text-teal font-ubuntu-semibold">Not Any ?</Text>
                  </Pressable>
                </View>
              )}

              <Pressable onPress={() => inputRef.current?.blur()} className="w-full">
                <View className="flex-row items-center">
                  <View
                    className={cn(
                      'flex-1 flex-row items-center bg-light-grey rounded-full px-4 h-14',
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
                      className="flex-1 ml-3 font-Inter text-base text-black h-full"
                    />
                  </View>

                  {query && (
                    <Animated.View style={cancelStyle}>
                      <Pressable onPress={handleCancel} className="active:opacity-70">
                        <Text className="text-primary font-inter-semibold text-base">Cancel</Text>
                      </Pressable>
                    </Animated.View>
                  )}
                </View>

                <Animated.View style={dropdownStyle} className="mt-10 overflow-hidden">
                  <View className="">
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
                              'flex-row items-center px-4 py-4 rounded-3xl',
                              isSelected ? 'bg-accent border-none' : 'border border-accent/40'
                            )}
                          >
                            <View className="flex-1">
                              <Text className="font-inter-semibold text-base text-black">
                                {estate.name}
                              </Text>
                              {!!estate.location && (
                                <Text className="font-inter-regular text-sm text-grey mt-0.5">
                                  {estate.location}
                                </Text>
                              )}
                            </View>

                            <View
                              className={cn(
                                'w-5 h-5 rounded-full border-2 items-center justify-center mr-3',
                                isSelected ? 'border-primary' : 'border-primary/80'
                              )}
                            >
                              {isSelected && (
                                <View className="w-2.5 h-2.5 rounded-full bg-primary" />
                              )}
                            </View>
                          </Pressable>
                        );
                      })
                    )}
                  </View>
                </Animated.View>
              </Pressable>
            </View>
          </View>
        </View>
      </View>

      {/* Continue button */}
      <Animated.View
        style={continueStyle}
        className="absolute bottom-0 left-0 right-0 px-16 pb-12 pt-4 bg-body"
      >
        <Button
          onPress={handleContinue}
          className="w-full h-14 rounded-full flex-row items-center justify-center"
          size={Platform.select({ ios: 'lg', default: 'lg' })}
        >
          <Text className="text-white font-ubuntu-semibold text-lg">Continue</Text>
        </Button>
      </Animated.View>
    </SafeAreaView>
  );
}
