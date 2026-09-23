import { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Keyboard,
  Modal,
  Pressable,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AddHouseholdSheet from './AddHouseholdSheet';
import ConfirmHouseholdSheet from './ConfirmHouseholdSheet';
import Back from './Back';
import { createHousehold, householdFromCreation, searchHouseholds } from '@/src/lib/api/households';
import type { Household } from '@/src/types/household';

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

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(query), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [query]);

  const loadHouseholds = useCallback(async () => {
    if (!visible || !estateId) return;

    setLoading(true);
    setError('');
    try {
      const response = await searchHouseholds(debouncedQuery);
      setItems(response.items ?? []);
    } catch (requestError) {
      setItems([]);
      setError(
        requestError instanceof Error ? requestError.message.trim() : 'Could not load households'
      );
    } finally {
      setLoading(false);
    }
  }, [debouncedQuery, estateId, visible]);

  useEffect(() => {
    void loadHouseholds();
  }, [loadHouseholds]);

  useEffect(() => {
    if (!visible) {
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
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View className="flex-1 justify-end bg-black/50">
        <Pressable className="flex-1" onPress={onClose} />
        <View
          className="relative h-[84.4%] rounded-t-[40px] bg-[#F6F7F7]"
          style={{ paddingBottom: Math.max(insets.bottom, 16) }}
        >
          <View className="absolute top-4 h-1 w-16 self-center rounded-full bg-grey/60" />
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
          <Text className="absolute left-[18px] top-[122px] text-[21.88px] leading-[26px] text-primary font-ubuntu-semibold">
            Select Your Household
          </Text>

          <View className="absolute left-0 right-0 top-[172px] h-9">
            <View
              className="absolute left-[7.2%] h-9 w-[69.6%] flex-row items-center rounded-2xl border bg-[#EFF1F1] px-4"
              style={{ borderColor: '#113E55', borderWidth: 0.5 }}
            >
              <Feather name="search" size={20} color="#113E55" />
              <View className="relative ml-2 h-full flex-1 justify-center overflow-hidden">
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  multiline={false}
                  numberOfLines={1}
                  scrollEnabled={false}
                  caretHidden
                  autoComplete="off"
                  importantForAutofill="no"
                  textContentType="none"
                  selectionColor="transparent"
                  cursorColor="transparent"
                  accessibilityLabel="Search household"
                  className="absolute inset-0"
                  style={{
                    includeFontPadding: false,
                    opacity: 0,
                    paddingHorizontal: 0,
                    paddingVertical: 0,
                  }}
                />
                <Text
                  pointerEvents="none"
                  numberOfLines={1}
                  ellipsizeMode="tail"
                  className={`text-[14px] font-inter-light ${
                    query ? 'text-primary' : 'text-[#878686]'
                  }`}
                  style={{ includeFontPadding: false, lineHeight: 17 }}
                >
                  {query || 'Search household'}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={() => setQuery('')}
              disabled={!query}
              className="absolute left-[80%] top-1 h-7 w-[17.6%] items-center justify-center"
            >
              <Text
                className={`text-[14px] leading-[14px] font-inter-medium ${
                  query ? 'text-[#1B998B]' : 'text-grey'
                }`}
              >
                Cancel
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            className="absolute left-[20px] top-[216px] h-[46px] flex-row items-center gap-[10px] rounded-lg px-2 py-4"
            onPress={() => {
              setCreateError('');
              setShowAddHousehold(true);
            }}
          >
            <Feather name="plus" size={16} color="#113E55" />
            <Text className="text-[11.2px] leading-[11.2px] text-primary font-inter-regular">
              Add New Household
            </Text>
          </TouchableOpacity>

          {loading ? (
            <View className="absolute left-[4.8%] top-[278px] h-[400px] w-[88.3%] items-center justify-center">
              <ActivityIndicator color="#113E55" />
              <Text className="mt-3 text-sm text-grey font-inter-regular">
                Loading households...
              </Text>
            </View>
          ) : error ? (
            <View className="absolute left-[4.8%] top-[278px] h-[400px] w-[88.3%] items-center justify-center px-6">
              <Text className="text-center text-sm text-danger font-inter-regular">{error}</Text>
              <TouchableOpacity
                className="mt-4 rounded-xl bg-accent px-5 py-3"
                onPress={loadHouseholds}
              >
                <Text className="text-sm text-primary font-ubuntu-medium">Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : items.length === 0 ? (
            <View className="absolute left-[4.8%] top-[278px] h-[400px] w-[88.3%] items-center justify-center px-6">
              <Text className="text-center text-sm text-grey font-inter-regular">
                {debouncedQuery.trim()
                  ? 'No households match your search.'
                  : 'No households have been added yet.'}
              </Text>
            </View>
          ) : (
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
          )}
        </View>

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
      </View>
    </Modal>
  );
}
