import { useEffect, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type IncidentDatePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply: (start: Date, end: Date) => void;
  initialStart?: Date | null;
  initialEnd?: Date | null;
};

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function firstOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function DateRow({ value, placeholder }: { value: Date | null; placeholder: string }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        backgroundColor: '#FFFFFF',
        paddingHorizontal: 16,
        paddingVertical: 14,
        borderRadius: 12,
      }}
    >
      <MaterialIcons name="calendar-today" size={18} color="#8A9A9D" />
      <Text
        allowFontScaling={false}
        style={{
          fontFamily: 'Inter_18pt-Regular',
          fontSize: 13,
          color: value ? '#04162D' : '#8A9A9D',
        }}
      >
        {value ? formatDate(value) : placeholder}
      </Text>
    </View>
  );
}

export default function IncidentDatePickerModal({
  visible,
  onClose,
  onApply,
  initialStart = null,
  initialEnd = null,
}: IncidentDatePickerModalProps) {
  const [currentMonth, setCurrentMonth] = useState(() => firstOfMonth(initialStart ?? new Date()));
  // Held as start-of-day so day comparisons are exact; the end is widened on apply.
  const [startDate, setStartDate] = useState<Date | null>(
    initialStart ? startOfDay(initialStart) : null
  );
  const [endDate, setEndDate] = useState<Date | null>(initialEnd ? startOfDay(initialEnd) : null);

  useEffect(() => {
    if (!visible) return;
    setStartDate(initialStart ? startOfDay(initialStart) : null);
    setEndDate(initialEnd ? startOfDay(initialEnd) : null);
    setCurrentMonth(firstOfMonth(initialStart ?? new Date()));
  }, [visible, initialStart, initialEnd]);

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDay = new Date(year, month, 1).getDay();
  const trailingSlots = (7 - ((firstDay + daysInMonth) % 7)) % 7;
  const monthLabel = currentMonth.toLocaleDateString('en-US', { month: 'long' });

  const handleDatePress = (day: number) => {
    const selected = new Date(year, month, day);
    if (!startDate || endDate) {
      setStartDate(selected);
      setEndDate(null);
    } else if (selected < startDate) {
      setStartDate(selected);
    } else {
      setEndDate(selected);
    }
  };

  const isSelected = (day: number) => {
    const t = new Date(year, month, day).getTime();
    return t === startDate?.getTime() || t === endDate?.getTime();
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const d = new Date(year, month, day);
    return d > startDate && d < endDate;
  };

  const canApply = !!startDate && !!endDate;

  const handleApply = () => {
    if (!startDate || !endDate) return;
    const end = new Date(endDate);
    end.setHours(23, 59, 59, 999);
    onApply(startDate, end);
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
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
            Set Date
          </Text>

          <View style={{ gap: 12, marginBottom: 24 }}>
            <DateRow value={startDate} placeholder="Enter Start Date" />
            <DateRow value={endDate} placeholder="Enter End Date" />
          </View>

          <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 }}>
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 24,
              }}
            >
              <Pressable onPress={() => setCurrentMonth(new Date(year, month - 1, 1))} hitSlop={10}>
                <MaterialIcons name="chevron-left" size={20} color="#113E55" />
              </Pressable>
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Inter_18pt-Bold', fontSize: 12, color: '#113E55' }}
              >
                {monthLabel}
              </Text>
              <Pressable onPress={() => setCurrentMonth(new Date(year, month + 1, 1))} hitSlop={10}>
                <MaterialIcons name="chevron-right" size={20} color="#113E55" />
              </Pressable>
            </View>

            <View
              style={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between' }}
            >
              {DAYS_OF_WEEK.map((day, i) => (
                <Text
                  key={`h-${i}`}
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Bold',
                    fontSize: 12,
                    color: '#113E55',
                    width: '14%',
                    textAlign: 'center',
                    marginBottom: 16,
                  }}
                >
                  {day}
                </Text>
              ))}

              {Array.from({ length: firstDay }).map((_, i) => (
                <View key={`e-${i}`} style={{ width: '14%', marginBottom: 8 }} />
              ))}

              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const selected = isSelected(day);
                const inRange = isInRange(day);

                return (
                  <Pressable
                    key={`d-${day}`}
                    onPress={() => handleDatePress(day)}
                    style={{ width: '14%', alignItems: 'center', marginBottom: 8 }}
                  >
                    <View
                      style={{
                        width: '100%',
                        height: 24,
                        backgroundColor: inRange ? '#D2E7ED' : 'transparent',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <View
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: 14,
                          backgroundColor: selected ? '#D2E7ED' : 'transparent',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Text
                          allowFontScaling={false}
                          style={{
                            fontFamily: 'Inter_18pt-Regular',
                            fontSize: 12,
                            color: '#113E55',
                          }}
                        >
                          {day}
                        </Text>
                      </View>
                    </View>
                  </Pressable>
                );
              })}

              {Array.from({ length: trailingSlots }).map((_, i) => (
                <View key={`t-${i}`} style={{ width: '14%', marginBottom: 8 }} />
              ))}
            </View>
          </View>

          <Pressable
            onPress={handleApply}
            disabled={!canApply}
            style={{
              width: '100%',
              height: 56,
              backgroundColor: '#113E55',
              borderRadius: 28,
              alignItems: 'center',
              justifyContent: 'center',
              marginTop: 8,
              opacity: canApply ? 1 : 0.5,
            }}
          >
            <Text
              allowFontScaling={false}
              style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#FFFFFF' }}
            >
              Apply Date Range
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
