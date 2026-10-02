import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type IncidentTimeframeModalProps = {
  visible: boolean;
  onClose: () => void;
  selectedLabel: string;
  onSelect: (label: string, start: Date, end: Date) => void;
  onCustomSelect: () => void;
};

const OPTIONS = ['Last Week', 'Last Month', 'Last Quarter', 'Custom'] as const;

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function rangeForOption(opt: string): { start: Date; end: Date } {
  const end = endOfDay(new Date());
  const start = startOfDay(new Date());
  if (opt === 'Last Week') start.setDate(start.getDate() - 7);
  else if (opt === 'Last Month') start.setMonth(start.getMonth() - 1);
  else if (opt === 'Last Quarter') start.setMonth(start.getMonth() - 3);
  return { start: startOfDay(start), end };
}

function TimeframeOption({
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
      accessibilityRole="button"
      accessibilityState={{ selected }}
      style={{
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        backgroundColor: selected ? '#D2E7ED' : '#F6F7F7',
        borderWidth: 1,
        borderColor: selected ? '#A2C0C6' : '#EFF1F3',
        paddingHorizontal: 20,
        paddingVertical: 16,
        borderRadius: 16,
      }}
    >
      <Text
        allowFontScaling={false}
        numberOfLines={1}
        style={{
          flexShrink: 1,
          fontFamily: 'Inter_18pt-Medium',
          fontSize: 13,
          color: selected ? '#113E55' : '#8A9A9D',
        }}
      >
        {label}
      </Text>
      <View
        style={{
          width: 20,
          height: 20,
          marginLeft: 8,
          borderRadius: 10,
          backgroundColor: selected ? '#113E55' : '#EFF1F3',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <MaterialIcons name="check" size={12} color={selected ? '#FFFFFF' : '#113E55'} />
      </View>
    </Pressable>
  );
}

export default function IncidentTimeframeModal({
  visible,
  onClose,
  selectedLabel,
  onSelect,
  onCustomSelect,
}: IncidentTimeframeModalProps) {
  const handleSelect = (opt: (typeof OPTIONS)[number]) => {
    if (opt === 'Custom') {
      onCustomSelect();
      return;
    }
    const { start, end } = rangeForOption(opt);
    onSelect(opt, start, end);
    onClose();
  };

  return (
    <Modal transparent visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, justifyContent: 'flex-end' }}>
        <BlurView intensity={20} style={StyleSheet.absoluteFill}>
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </BlurView>

        <View
          style={{
            backgroundColor: '#F6F7F7',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            padding: 24,
            paddingBottom: 40,
          }}
        >
          <View style={{ paddingBottom: 24 }}>
            <View
              style={{
                width: 40,
                height: 4,
                backgroundColor: '#E5E7EB',
                borderRadius: 2,
                alignSelf: 'center',
              }}
            />
          </View>

          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'UbuntuSans-Medium',
              fontSize: 20,
              color: '#113E55',
              marginBottom: 24,
            }}
          >
            Set Timeframe
          </Text>

          <View style={{ gap: 12 }}>
            {OPTIONS.map((opt) => (
              <TimeframeOption
                key={opt}
                label={opt}
                selected={selectedLabel === opt}
                onPress={() => handleSelect(opt)}
              />
            ))}
          </View>
        </View>
      </View>
    </Modal>
  );
}
