import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';

/** API category values for `/incident-reports/result-page/reports`. */
export type IncidentFilterCategory =
  | 'medical_emergency'
  | 'fire_safety'
  | 'dispute'
  | 'maintenance'
  | 'property_damage'
  | 'unauthorized_access'
  | 'harassment'
  | 'other';

export type IncidentFilterUserType = 'guest' | 'resident' | 'security';

export type IncidentFilterSelection = {
  categories: IncidentFilterCategory[];
  userTypes: IncidentFilterUserType[];
};

type IncidentFilterModalProps = {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selection: IncidentFilterSelection) => void;
  current?: IncidentFilterSelection;
};

const CATEGORIES: { id: IncidentFilterCategory; label: string }[] = [
  { id: 'medical_emergency', label: 'Medical Emergency' },
  { id: 'fire_safety', label: 'Fire safety' },
  { id: 'dispute', label: 'Dispute' },
  { id: 'maintenance', label: 'Maintenance' },
  { id: 'property_damage', label: 'Property Damage' },
  { id: 'unauthorized_access', label: 'Unauthorized access' },
  { id: 'harassment', label: 'Harassment' },
  { id: 'other', label: 'Others' },
];

const USER_TYPES: { id: IncidentFilterUserType; label: string }[] = [
  { id: 'guest', label: 'Guest' },
  { id: 'resident', label: 'Resident' },
  { id: 'security', label: 'Security' },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      className={`items-center justify-center rounded-2xl p-3 ${
        selected ? 'bg-[#CEE5ED]' : 'bg-[#EFF1F1]'
      }`}
      hitSlop={4}
    >
      <Text
        allowFontScaling={false}
        className={`text-[11.2px] font-inter-regular ${
          selected ? 'text-[#113E55]' : 'text-[#878686]'
        }`}
      >
        {label}
      </Text>
    </Pressable>
  );
}

/**
 * Figma 6567:4222 — incident report filter sheet.
 * Shell matches CodeActionsSheet (freeze / extend / share): dark scrim + 40px top radius + 134×7 handle.
 */
export default function IncidentFilterModal({
  visible,
  onClose,
  onConfirm,
  current,
}: IncidentFilterModalProps) {
  const [categories, setCategories] = useState<IncidentFilterCategory[]>(current?.categories ?? []);
  const [userTypes, setUserTypes] = useState<IncidentFilterUserType[]>(current?.userTypes ?? []);

  useEffect(() => {
    if (!visible) return;
    setCategories(current?.categories ?? []);
    setUserTypes(current?.userTypes ?? []);
  }, [visible, current?.categories, current?.userTypes]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/80" onPress={onClose}>
        <Pressable
          className="rounded-t-[40px] bg-[#F6F7F7]"
          onPress={() => {}}
          style={{ height: 543 }}
        >
          {/* Same indicator as CodeActionsSheet */}
          <View className="h-[34px] items-center justify-center">
            <View className="h-[7px] w-[134px] rounded-[4px] bg-[#9B9797]" />
          </View>

          <View className="flex-1 px-[33.5px] pt-[46px]">
            <Text
              allowFontScaling={false}
              className="mb-4 pl-3 text-sm font-inter-light text-[#878686]"
            >
              Category
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map((item) => (
                <FilterChip
                  key={item.id}
                  label={item.label}
                  selected={categories.includes(item.id)}
                  onPress={() => setCategories((prev) => toggleValue(prev, item.id))}
                />
              ))}
            </View>

            <View className="my-6 h-px w-full bg-[#D3D3D3]" />

            <Text
              allowFontScaling={false}
              className="mb-4 pl-3 text-sm font-inter-light text-[#878686]"
            >
              User Type
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {USER_TYPES.map((item) => (
                <FilterChip
                  key={item.id}
                  label={item.label}
                  selected={userTypes.includes(item.id)}
                  onPress={() => setUserTypes((prev) => toggleValue(prev, item.id))}
                />
              ))}
            </View>

            <Pressable
              onPress={() => {
                onConfirm({ categories, userTypes });
                onClose();
              }}
              className="mt-auto mb-10 h-12 w-full max-w-[278px] self-center items-center justify-center rounded-3xl border border-[#113E55] bg-[#113E55] px-8"
              hitSlop={8}
            >
              <Text
                allowFontScaling={false}
                className="text-center text-sm font-ubuntu-semibold tracking-[-0.24px] text-[#F6F7F7]"
              >
                Confirm
              </Text>
            </Pressable>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
