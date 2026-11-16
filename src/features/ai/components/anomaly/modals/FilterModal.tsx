import { useEffect, useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';

/** Display labels kept for callers; API gets lowercase via AnomalyResultView. */
export type Severity = 'Low' | 'Medium' | 'High';
export type Gender = 'Female' | 'Male' | 'Prefer not to say';
export type UserType = 'Guest' | 'Resident';

interface FilterModalProps {
  visible: boolean;
  onClose: () => void;
  onApply: (severity: Severity[], gender: Gender[], userType: UserType[]) => void;
  currentSeverity: Severity[];
  currentGender: Gender[];
  currentUserType: UserType[];
}

const SEVERITIES: Severity[] = ['Low', 'Medium', 'High'];
const GENDERS: Gender[] = ['Female', 'Male', 'Prefer not to say'];
const USER_TYPES: UserType[] = ['Guest', 'Resident'];

function toggleValue<T>(list: T[], value: T): T[] {
  return list.includes(value) ? list.filter((item) => item !== value) : [...list, value];
}

/** Same chip style as IncidentFilterModal: inactive #EFF1F1 / #878686, active #CEE5ED / #113E55 */
function FilterChip({
  label,
  selected,
  onPress,
}: {
  label: string;
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
        paddingVertical: 12,
        paddingHorizontal: 12,
        borderRadius: 16,
        backgroundColor: selected ? '#CEE5ED' : '#EFF1F1',
      }}
    >
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

function SectionLabel({ children }: { children: string }) {
  return (
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
      {children}
    </Text>
  );
}

function SectionDivider() {
  return (
    <View
      style={{
        marginVertical: 24,
        height: 0.5,
        width: '100%',
        backgroundColor: '#D3D3D3',
      }}
    />
  );
}

export default function FilterModal({
  visible,
  onClose,
  onApply,
  currentSeverity,
  currentGender,
  currentUserType,
}: FilterModalProps) {
  const [selectedSeverity, setSelectedSeverity] = useState<Severity[]>(currentSeverity || []);
  const [selectedGender, setSelectedGender] = useState<Gender[]>(currentGender || []);
  const [selectedUserType, setSelectedUserType] = useState<UserType[]>(currentUserType || []);

  useEffect(() => {
    if (!visible) return;
    setSelectedSeverity(currentSeverity || []);
    setSelectedGender(currentGender || []);
    setSelectedUserType(currentUserType || []);
  }, [visible, currentSeverity, currentGender, currentUserType]);

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      scrimClassName="flex-1 justify-end bg-black/80"
      panelStyle={{
        backgroundColor: '#F6F7F7',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        paddingBottom: 8,
      }}
    >
      <View style={{ paddingTop: 46, paddingHorizontal: 34, paddingBottom: 8 }}>
        <SectionLabel>Severity</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {SEVERITIES.map((item) => (
            <FilterChip
              key={item}
              label={item}
              selected={selectedSeverity.includes(item)}
              onPress={() => setSelectedSeverity((prev) => toggleValue(prev, item))}
            />
          ))}
        </View>

        <SectionDivider />

        <SectionLabel>Gender</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {GENDERS.map((item) => (
            <FilterChip
              key={item}
              label={item}
              selected={selectedGender.includes(item)}
              onPress={() => setSelectedGender((prev) => toggleValue(prev, item))}
            />
          ))}
        </View>

        <SectionDivider />

        <SectionLabel>User Type</SectionLabel>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 40 }}>
          {USER_TYPES.map((item) => (
            <FilterChip
              key={item}
              label={item}
              selected={selectedUserType.includes(item)}
              onPress={() => setSelectedUserType((prev) => toggleValue(prev, item))}
            />
          ))}
        </View>

        <Pressable
          onPress={() => {
            onApply(selectedSeverity, selectedGender, selectedUserType);
            onClose();
          }}
          hitSlop={8}
          style={{
            marginBottom: 40,
            height: 48,
            width: '100%',
            maxWidth: 278,
            alignSelf: 'center',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: 9999,
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
    </BottomSheet>
  );
}
