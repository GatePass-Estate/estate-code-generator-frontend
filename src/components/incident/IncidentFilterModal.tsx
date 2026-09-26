import { useEffect, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import {
  formatApiCategoryLabel,
  INCIDENT_API_CATEGORIES,
  IncidentCategoryIcon,
  type IncidentApiCategory,
} from '@/src/components/incident/categoryIcons';
import { incidentReportsApi } from '@/src/lib/api/incidentReports';

/** API category values for `/incident-reports/result-page/reports`. */
export type IncidentFilterCategory = IncidentApiCategory | string;

/**
 * UI user-type chips. API only accepts `resident` | `security` | `all`;
 * `guest` is shown for design parity and omitted from the request.
 */
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

const FALLBACK_CATEGORIES: { id: string; label: string }[] = INCIDENT_API_CATEGORIES.map((id) => ({
  id,
  label: formatApiCategoryLabel(id),
}));

const USER_TYPES: { id: IncidentFilterUserType; label: string }[] = [
  { id: 'guest', label: 'Guest' },
  { id: 'resident', label: 'Resident' },
  { id: 'security', label: 'Security' },
];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Filter chip: inactive #EFF1F1 / #878686, active #CEE5ED / #113E55 */
function FilterChip({
  label,
  categoryId,
  selected,
  onPress,
}: {
  label: string;
  categoryId?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const color = selected ? '#113E55' : '#878686';
  return (
    <Pressable
      onPress={onPress}
      hitSlop={4}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: selected ? '#CEE5ED' : '#EFF1F1',
      }}
    >
      {categoryId ? (
        <IncidentCategoryIcon category={categoryId} color={color} size={14} filled={selected} />
      ) : null}
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'Inter_18pt-Regular',
          fontSize: 11.2,
          lineHeight: 14,
          textAlign: 'center',
          color,
        }}
      >
        {label}
      </Text>
    </Pressable>
  );
}

export default function IncidentFilterModal({
  visible,
  onClose,
  onConfirm,
  current,
}: IncidentFilterModalProps) {
  const [categories, setCategories] = useState<IncidentFilterCategory[]>(current?.categories ?? []);
  const [userTypes, setUserTypes] = useState<IncidentFilterUserType[]>(current?.userTypes ?? []);
  const [categoryOptions, setCategoryOptions] =
    useState<{ id: string; label: string }[]>(FALLBACK_CATEGORIES);

  const allSelected = categories.length === 0;

  useEffect(() => {
    if (!visible) return;
    setCategories(current?.categories ?? []);
    setUserTypes(current?.userTypes ?? []);
  }, [visible, current?.categories, current?.userTypes]);

  useEffect(() => {
    if (!visible) return;
    let cancelled = false;
    void (async () => {
      try {
        const list = await incidentReportsApi.getCategories();
        if (cancelled || !list.length) return;
        setCategoryOptions(
          list.map((id) => ({
            id,
            label: formatApiCategoryLabel(id),
          }))
        );
      } catch {
        // Keep taxonomy fallback chips.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [visible]);

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/80" onPress={onClose}>
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: '#F6F7F7',
            borderTopLeftRadius: 40,
            borderTopRightRadius: 40,
            height: 620,
          }}
        >
          {/* indicator */}
          <View style={{ height: 34, alignItems: 'center', justifyContent: 'center' }}>
            <View
              style={{
                width: 134,
                height: 7,
                borderRadius: 4,
                backgroundColor: '#9B9797',
              }}
            />
          </View>

          <View style={{ flex: 1, paddingTop: 46, paddingHorizontal: 34 }}>
            <View style={{ flex: 1 }}>
              <Text
                allowFontScaling={false}
                style={{
                  marginBottom: 16,
                  paddingLeft: 12,
                  fontFamily: 'Inter_18pt-Light',
                  fontSize: 14,
                  color: '#878686',
                }}
              >
                Category
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
                <FilterChip
                  label="All"
                  selected={allSelected}
                  onPress={() => setCategories([])}
                />
                {categoryOptions.map((item) => (
                  <FilterChip
                    key={item.id}
                    label={item.label}
                    categoryId={item.id}
                    selected={categories.includes(item.id)}
                    onPress={() =>
                      setCategories((prev) => toggleValue(prev, item.id as IncidentFilterCategory))
                    }
                  />
                ))}
              </View>

              <View
                style={{
                  marginVertical: 24,
                  height: 0.5,
                  width: '100%',
                  backgroundColor: '#D3D3D3',
                }}
              />

              <Text
                allowFontScaling={false}
                style={{
                  marginBottom: 16,
                  paddingLeft: 12,
                  fontFamily: 'Inter_18pt-Light',
                  fontSize: 14,
                  color: '#878686',
                }}
              >
                User Type
              </Text>
              <View
                style={{
                  flexDirection: 'row',
                  flexWrap: 'wrap',
                  gap: 8,
                }}
              >
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
                hitSlop={8}
                style={{
                  marginTop: 'auto',
                  marginBottom: 40,
                  height: 48,
                  width: '100%',
                  maxWidth: 278,
                  alignSelf: 'center',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: 24,
                  borderWidth: 1,
                  borderColor: '#113E55',
                  backgroundColor: '#113E55',
                  paddingHorizontal: 32,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'UbuntuSans-SemiBold',
                    fontSize: 14,
                    letterSpacing: -0.24,
                    color: '#F6F7F7',
                    textAlign: 'center',
                  }}
                >
                  Confirm
                </Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
