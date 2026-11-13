import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  interpolateColor,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CheckRingDuotone from '@/src/assets/icons/check-ring-duotone.svg';
import AddHouseholdSheet from '@/src/features/admin/components/AddHouseholdSheet';
import ConfirmHouseholdSheet from '@/src/features/admin/components/ConfirmHouseholdSheet';
import Back from '@/src/shared/components/navigation/Back';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import {
  createHousehold,
  householdFromCreation,
  searchHouseholds,
} from '@/src/features/admin/services/households';
import type { Household } from '@/src/features/admin/types/household';

const SEARCH_DEBOUNCE_MS = 300;
/** Same timing as the institution search Cancel / field morph. */
const SEARCH_MOVE_MS = 380;
const SEARCH_MOVE_EASE = Easing.out(Easing.cubic);
const SHEET_IDLE_RATIO = 0.421;
const SHEET_ACTIVE_RATIO = 0.856;

type HouseholdSelectorSheetProps = {
  visible: boolean;
  estateId: string;
  selected: Household | null;
  onClose: () => void;
  onSelect: (household: Household) => void;
  confirmationTitle?: string;
  confirmationActionLabel?: string;
};

export default function HouseholdSelectorSheet({
  visible,
  estateId,
  selected,
  onClose,
  onSelect,
  confirmationTitle,
  confirmationActionLabel,
}: HouseholdSelectorSheetProps) {
  const insets = useSafeAreaInsets();
  const { height: windowHeight } = useWindowDimensions();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  /** Last query that finished loading — same gate as institution search. */
  const [settledQuery, setSettledQuery] = useState('');
  const [items, setItems] = useState<Household[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddHousehold, setShowAddHousehold] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [pendingHousehold, setPendingHousehold] = useState<Household | null>(null);
  const trimmedQuery = query.trim();
  const hasSearch = trimmedQuery.length > 0;
  // Same gate as institution: keep the loader up until THIS query has settled and loading is done.
  const awaitingResults = hasSearch && (trimmedQuery !== settledQuery || loading);
  const showEmpty =
    hasSearch && !awaitingResults && !error && items.length === 0 && settledQuery === trimmedQuery;
  // Bumped on every search and when the sheet closes; older responses are ignored.
  const searchIdRef = useRef(0);
  const inputRef = useRef<TextInput>(null);
  const searchProgress = useSharedValue(0);

  useEffect(() => {
    searchProgress.value = withTiming(hasSearch ? 1 : 0, {
      duration: SEARCH_MOVE_MS,
      easing: SEARCH_MOVE_EASE,
    });
  }, [hasSearch, searchProgress]);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  // As soon as the typed query diverges from what we've settled, show loader only — never empty.
  useEffect(() => {
    if (!trimmedQuery || trimmedQuery === settledQuery) return;
    setLoading(true);
    setItems([]);
    setError('');
  }, [trimmedQuery, settledQuery]);

  const handleCancelSearch = useCallback(() => {
    setQuery('');
    setDebouncedQuery('');
    setSettledQuery('');
    setItems([]);
    setError('');
    setLoading(false);
    inputRef.current?.blur();
    Keyboard.dismiss();
  }, []);

  const fieldStyle = useAnimatedStyle(() => ({
    backgroundColor: interpolateColor(searchProgress.value, [0, 1], ['#EFF1F1', '#F6F7F7']),
    borderColor: interpolateColor(searchProgress.value, [0, 1], ['#EFF1F1', '#113E55']),
  }));

  const cancelStyle = useAnimatedStyle(() => ({
    opacity: searchProgress.value,
    width: searchProgress.value * 66,
    marginLeft: searchProgress.value * 12,
    overflow: 'hidden' as const,
  }));

  const searchRowStyle = useAnimatedStyle(() => ({
    top: interpolate(searchProgress.value, [0, 1], [161, 172]),
    paddingLeft: interpolate(searchProgress.value, [0, 1], [21, 27]),
    paddingRight: interpolate(searchProgress.value, [0, 1], [21, 21]),
  }));

  const sheetHeightStyle = useAnimatedStyle(() => ({
    height: interpolate(
      searchProgress.value,
      [0, 1],
      [windowHeight * SHEET_IDLE_RATIO, windowHeight * SHEET_ACTIVE_RATIO]
    ),
  }));

  const resultsStyle = useAnimatedStyle(() => ({
    opacity: searchProgress.value,
  }));

  const runSearch = useCallback(
    (rawQuery: string) => {
      const trimmed = rawQuery.trim();
      const searchId = ++searchIdRef.current;
      if (!visible || !estateId) return;

      if (!trimmed) {
        setItems([]);
        setSettledQuery('');
        setError('');
        setLoading(false);
        return;
      }

      // Drop previous rows immediately so empty/"no match" never sits under the loader.
      setLoading(true);
      setItems([]);
      setError('');
      void searchHouseholds(trimmed)
        .then((response) => {
          if (searchId !== searchIdRef.current) return;
          setItems(response.items ?? []);
          setSettledQuery(trimmed);
          setLoading(false);
        })
        .catch((requestError) => {
          if (searchId !== searchIdRef.current) return;
          setItems([]);
          setSettledQuery(trimmed);
          setError(
            requestError instanceof Error
              ? requestError.message.trim()
              : 'Could not load households'
          );
          setLoading(false);
        });
    },
    [estateId, visible]
  );

  useEffect(() => {
    runSearch(debouncedQuery);
  }, [debouncedQuery, runSearch]);

  const loadHouseholds = useCallback(() => {
    setSettledQuery('');
    runSearch(query.trim() || debouncedQuery);
  }, [debouncedQuery, query, runSearch]);

  useEffect(() => {
    if (!visible) {
      searchIdRef.current += 1;
      setLoading(false);
      setQuery('');
      setDebouncedQuery('');
      setSettledQuery('');
      setItems([]);
      setError('');
      setShowAddHousehold(false);
      setPendingHousehold(null);
      searchProgress.value = 0;
    }
  }, [visible, searchProgress]);

  const handleSelect = (household: Household) => {
    Keyboard.dismiss();
    // iOS can leave a nested native Modal's transparent host in the view
    // hierarchy when its parent Modal is dismissed in the same render. Close
    // the confirmation first, then dismiss the selector on the next frame.
    setPendingHousehold(null);
    requestAnimationFrame(() => {
      onSelect(household);
      onClose();
    });
  };

  const requestSelection = (household: Household) => {
    Keyboard.dismiss();
    if (confirmationTitle || confirmationActionLabel) {
      setPendingHousehold(household);
      return;
    }

    handleSelect(household);
  };

  const handleCreate = async (name: string) => {
    if (!estateId) {
      setCreateError('Your estate could not be determined.');
      return;
    }

    setCreating(true);
    setCreateError('');
    try {
      const payload = { estate_id: estateId, name };
      const response = await createHousehold(payload);
      const household = householdFromCreation(response, payload);
      setItems((current) => [household, ...current]);
      setShowAddHousehold(false);
      requestSelection(household);
    } catch (requestError) {
      setCreateError(
        requestError instanceof Error ? requestError.message.trim() : 'Could not create household'
      );
    } finally {
      setCreating(false);
    }
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      scrimClassName="flex-1 justify-end bg-black/50"
      panelClassName="relative rounded-[40px] bg-[#F6F7F7]"
      panelStyle={[{ paddingBottom: Math.max(insets.bottom, 16) }, sheetHeightStyle]}
      overlay={
        <>
          <AddHouseholdSheet
            visible={showAddHousehold}
            loading={creating}
            error={createError}
            onCancel={() => !creating && setShowAddHousehold(false)}
            onSave={handleCreate}
          />
          <ConfirmHouseholdSheet
            visible={!!pendingHousehold}
            household={pendingHousehold}
            title={confirmationTitle}
            actionLabel={confirmationActionLabel}
            onCancel={() => setPendingHousehold(null)}
            onConfirm={() => pendingHousehold && handleSelect(pendingHousehold)}
          />
        </>
      }
    >
      <View className="absolute left-[17px] top-[72px]">
        <Back
          type="short-arrow"
          showText={false}
          showBorder
          borderSize={30}
          leftOffset={0}
          iconStyle={{ width: 8.56, height: 12, top: 0 }}
          onPress={onClose}
        />
      </View>
      <Text className="absolute left-[18px] top-[122px] text-heading-sm leading-[26px] text-primary font-ubuntu-semibold">
        Select Your Household
      </Text>

      <Animated.View style={searchRowStyle} className="absolute left-0 right-0">
        <View className="h-9 flex-row items-center">
          <Animated.View
            style={fieldStyle}
            className="h-9 flex-1 flex-row items-center gap-2 rounded-2xl border-[0.5px] px-4 py-1"
          >
            <Feather name="search" size={20} color="#113E55" />
            <TextInput
              ref={inputRef}
              value={query}
              onChangeText={setQuery}
              autoCapitalize="none"
              autoCorrect={false}
              multiline={false}
              numberOfLines={1}
              autoComplete="off"
              importantForAutofill="no"
              textContentType="none"
              selectionColor="#113E55"
              cursorColor="#113E55"
              accessibilityLabel="Search household"
              placeholder="Search Guest List"
              placeholderTextColor="#878686"
              className="h-full flex-1 text-[14px] leading-[17px] text-primary font-inter-light"
              style={{
                includeFontPadding: false,
                paddingHorizontal: 0,
                paddingVertical: 0,
              }}
            />
          </Animated.View>

          <Animated.View style={cancelStyle} className="h-7 justify-center">
            <Pressable
              onPress={handleCancelSearch}
              className="h-7 items-center justify-center active:opacity-70"
            >
              <Text
                numberOfLines={1}
                className="text-center text-[14px] leading-[14px] text-[#167A6F] font-inter-medium"
              >
                Cancel
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Animated.View>

      <TouchableOpacity
        className="absolute left-[18px] top-[224px] h-[46px] flex-row items-center justify-center gap-[10px] overflow-hidden rounded-lg px-2 py-4"
        onPress={() => {
          setCreateError('');
          setShowAddHousehold(true);
        }}
      >
        <Feather name="plus" size={14} color="#113E55" />
        <Text className="text-center text-[11.2px] leading-[11.2px] text-primary font-inter-regular">
          Add New Household
        </Text>
      </TouchableOpacity>

      <Animated.View
        pointerEvents={hasSearch ? 'auto' : 'none'}
        style={resultsStyle}
        className="absolute left-[18px] right-[26px] top-[286px] h-[400px]"
      >
        {hasSearch ? (
          awaitingResults ? (
            <View className="items-center pt-2">
              <CircleLoader size={28} />
            </View>
          ) : error ? (
            <View className="items-center px-6 pt-2">
              <Text className="text-center text-sm font-inter-regular text-danger">{error}</Text>
              <TouchableOpacity
                className="mt-3 rounded-xl bg-accent px-5 py-3"
                onPress={loadHouseholds}
              >
                <Text className="text-sm font-ubuntu-medium text-primary">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : showEmpty ? (
            <View className="items-center px-6 pt-2">
              <Text className="text-center text-sm font-inter-regular text-grey">
                No households match your search.
              </Text>
            </View>
          ) : (
            <FlatList
              className="flex-1"
              data={items}
              keyExtractor={(item) => item.id}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ gap: 8, padding: 8 }}
              renderItem={({ item }) => (
                <TouchableOpacity
                  onPress={() => requestSelection(item)}
                  accessibilityRole="button"
                  accessibilityState={{ selected: item.id === selected?.id }}
                  className="h-12 w-full flex-row items-center justify-between overflow-hidden rounded-2xl bg-[#EFF1F1] p-4"
                >
                  <Text
                    numberOfLines={1}
                    className="mr-3 flex-1 text-[14px] leading-[17px] text-primary font-inter-light"
                    style={{ includeFontPadding: false }}
                  >
                    {item.name}
                  </Text>
                  <View className="h-6 w-6 shrink-0 items-center justify-center overflow-hidden">
                    <CheckRingDuotone width={16} height={16} />
                  </View>
                </TouchableOpacity>
              )}
            />
          )
        ) : null}
      </Animated.View>
    </BottomSheet>
  );
}
