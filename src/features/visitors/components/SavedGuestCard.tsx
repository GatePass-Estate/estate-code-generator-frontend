import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Guest } from '@/src/features/visitors/types/guests';
import {
  GuestCodeIcon,
  GuestDeleteIcon,
  GuestFemaleIcon,
  GuestMaleIcon,
  GuestUnspecifiedIcon,
} from '@/src/features/visitors/components/guestIcons';

function guestCardTone(gender?: string | null) {
  if (gender === 'female') return { backgroundColor: '#FFF8F5', borderColor: '#F46036' };
  if (gender === 'male') return { backgroundColor: '#F4FFFE', borderColor: '#167A6F' };
  return { backgroundColor: '#F6F7F7', borderColor: '#9B9797' };
}

function formatRelationship(value?: string | null) {
  if (!value) return '';
  return value.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function GuestGenderMark({ gender }: { gender?: string | null }) {
  const Icon =
    gender === 'female'
      ? GuestFemaleIcon
      : gender === 'male'
        ? GuestMaleIcon
        : GuestUnspecifiedIcon;
  return (
    <View style={styles.genderSlot}>
      <Icon />
    </View>
  );
}

export function SavedGuestCard({
  guest,
  onDeletePress,
  onGenerateCode,
}: {
  guest: Guest;
  onDeletePress: () => void;
  onGenerateCode: () => void;
}) {
  return (
    <View style={[styles.card, guestCardTone(guest.gender)]}>
      <View style={styles.guestInfo}>
        <GuestGenderMark gender={guest.gender} />

        <View className="flex-col gap-1">
          <Text className="font-inter-light text-[14px] text-[#0A1F29]">{guest.guest_name}</Text>
          <Text className="font-inter-regular text-[11.2px] text-[#113E55]">
            {formatRelationship(guest.relationship)}
          </Text>
        </View>
      </View>

      <View style={styles.actions}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Delete ${guest.guest_name}`}
          onPress={onDeletePress}
        >
          <GuestDeleteIcon />
        </TouchableOpacity>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`Generate code for ${guest.guest_name}`}
          onPress={onGenerateCode}
        >
          <GuestCodeIcon />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    borderRadius: 8,
    borderWidth: 0.5,
    overflow: 'hidden',
  },
  guestInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    minWidth: 0,
    marginRight: 8,
  },
  genderSlot: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 15,
  },
});
