import { useCallback, useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Keyboard,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [items, setItems] = useState<Household[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddHousehold, setShowAddHousehold] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState('');
  const [pendingHousehold, setPendingHousehold] = useState<Household | null>(null);
  const hasSearch = query.trim().length > 0;
  // Bumped on every search and when the sheet closes; older responses are ignored.
  const searchIdRef = useRef(0);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const loadHouseholds = useCallback(async () => {
    const searchId = ++searchIdRef.current;
    if (!visible || !estateId) return;

    if (!debouncedQuery.trim()) {
      setItems([]);
      setError('');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await searchHouseholds(debouncedQuery);
      if (searchId !== searchIdRef.current) return;
      setItems(response.items ?? []);
    } catch (requestError) {
      if (searchId !== searchIdRef.current) return;
      setItems([]);
      setError(
        requestError instanceof Error ? requestError.message.trim() : 'Could not load households'
      );
    } finally {
      if (searchId === searchIdRef.current) setLoading(false);
    }
  }, [debouncedQuery, estateId, visible]);

  useEffect(() => {
    void loadHouseholds();
  }, [loadHouseholds]);

  useEffect(() => {
    if (!visible) {
      searchIdRef.current += 1;
      setLoading(false);
      setQuery('');
      setDebouncedQuery('');
      setError('');
      setShowAddHousehold(false);
      setPendingHousehold(null);
    }
  }, [visible]);

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
      panelClassName={`relative rounded-[40px] bg-[#F6F7F7] ${hasSearch ? 'h-[85.6%]' : 'h-[42.1%]'}`}
      panelStyle={{ paddingBottom: Math.max(insets.bottom, 16) }}
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

      <View className={`absolute left-0 right-0 h-9 ${hasSearch ? 'top-[172px]' : 'top-[161px]'}`}>
        <View
          className={`absolute h-9 flex-row items-center rounded-2xl bg-[#EFF1F1] px-4 ${
            hasSearch
              ? 'left-[7.2%] w-[69.6%] border-[0.5px] border-primary'
              : 'left-[21px] right-[21px]'
          }`}
        >
          <Feather name="search" size={20} color="#113E55" />
          <TextInput
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
            className="ml-2 h-full flex-1 text-[14px] leading-[17px] text-primary font-inter-light"
            style={{
              includeFontPadding: false,
              paddingHorizontal: 0,
              paddingVertical: 0,
            }}
          />
        </View>
        {hasSearch && (
          <TouchableOpacity
            onPress={() => setQuery('')}
            className="absolute left-[80%] top-1 h-7 w-[17.6%] items-center justify-center"
          >
            <Text className="text-[14px] leading-[14px] text-teal font-inter-medium">Cancel</Text>
          </TouchableOpacity>
        )}
      </View>

      <TouchableOpacity
        className="absolute left-[20px] top-[216px] h-[46px] flex-row items-center gap-[10px] rounded-lg px-2 py-4"
        onPress={() => {
          setCreateError('');
          setShowAddHousehold(true);
        }}
      >
        <Feather name="plus" size={16} color="#113E55" />
        <Text className="text-caption leading-[11.2px] text-primary font-inter-regular">
          Add New Household
        </Text>
      </TouchableOpacity>

      {hasSearch && loading ? (
        <View className="absolute left-[4.8%] top-[278px] h-[400px] w-[88.3%] items-center justify-center">
          <CircleLoader size={32} />
          <Text className="mt-3 text-sm text-grey font-inter-regular">Loading households...</Text>
        </View>
      ) : hasSearch && error ? (
        <View className="absolute left-[4.8%] top-[278px] h-[400px] w-[88.3%] items-center justify-center px-6">
          <Text className="text-center text-sm text-danger font-inter-regular">{error}</Text>
          <TouchableOpacity
            className="mt-4 rounded-xl bg-accent px-5 py-3"
            onPress={loadHouseholds}
          >
            <Text className="text-sm text-primary font-ubuntu-medium">Try Again</Text>
          </TouchableOpacity>
        </View>
      ) : hasSearch && items.length === 0 ? (
        <View className="absolute left-[4.8%] top-[278px] h-[400px] w-[88.3%] items-center justify-center px-6">
          <Text className="text-center text-sm text-grey font-inter-regular">
            {debouncedQuery.trim()
              ? 'No households match your search.'
              : 'No households have been added yet.'}
          </Text>
        </View>
      ) : hasSearch ? (
        <FlatList
          className="absolute left-[4.8%] top-[278px] h-[400px] w-[88.3%] border-y-[0.5px] border-[#EFF1F1] p-2"
          data={items}
          keyExtractor={(item) => item.id}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ gap: 8, paddingBottom: 8 }}
          renderItem={({ item }) => {
            const isSelected = item.id === selected?.id;
            return (
              <TouchableOpacity
                onPress={() => requestSelection(item)}
                className={`h-12 flex-row items-center justify-between rounded-2xl px-4 ${
                  isSelected ? 'border border-primary bg-accent' : 'bg-[#EFF1F1]'
                }`}
              >
                <Text
                  className="flex-1 text-[14px] leading-[17px] text-primary font-inter-light"
                  style={{ includeFontPadding: false }}
                >
                  {item.name}
                </Text>
                <View className="h-4 w-4 items-center justify-center rounded-full bg-accent">
                  <Feather name="check" size={10} color="#113E55" />
                </View>
              </TouchableOpacity>
            );
          }}
        />
      ) : null}
    </BottomSheet>
  );
}
