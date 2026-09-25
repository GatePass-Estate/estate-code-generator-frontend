import { useState } from 'react';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Button, { BUTTON_MARGIN_BOTTOM } from './Button';
import MonthCalendar from './MonthCalendar';
import TimeWheelColumn from './TimeWheelColumn';
import { UbuntuSans } from '@/src/constants/fonts';
import { sharedStyles } from '@/src/theme/styles';

const PRESETS = [
  { label: '30mins', minutes: 30 },
  { label: '1hr', minutes: 60 },
  { label: '3hrs', minutes: 180 },
  { label: '5hrs', minutes: 300 },
  { label: '8hrs', minutes: 480 },
  { label: '12hrs', minutes: 720 },
] as const;

type CodeDateTimePickerProps = {
  mode: 'start' | 'end';
  value: Date;
  minDate?: Date | null;
  onBack: () => void;
  onSet: (next: Date) => void;
};

export default function CodeDateTimePicker({
  mode,
  value,
  minDate,
  onBack,
  onSet,
}: CodeDateTimePickerProps) {
  const insets = useSafeAreaInsets();
  const { width: screenWidth } = useWindowDimensions();
  const [draft, setDraft] = useState(() => new Date(value));
  const [cursor, setCursor] = useState(() => new Date(value.getFullYear(), value.getMonth(), 1));

  const applyDate = (date: Date) => {
    const next = new Date(draft);
    next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
    setDraft(next);
  };

  const applyPreset = (minutes: number) => {
    const base = mode === 'end' && minDate ? new Date(minDate) : new Date();
    const next = new Date(base.getTime() + minutes * 60_000);
    setDraft(next);
    setCursor(new Date(next.getFullYear(), next.getMonth(), 1));
  };

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
      edges={['top']}
    >
      <Pressable
        onPress={onBack}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <Text className="mt-[25px] text-[27.34px] font-ubuntu-medium text-[#113E55]">
        {mode === 'start' ? 'Set Start Date' : 'Set End Date'}
      </Text>
      <Text className="mt-2 text-sm font-inter-light text-[#878686]">
        {mode === 'start'
          ? 'Select the date and time your guest code starts'
          : 'Select the date and time your guest code ends'}
      </Text>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: BUTTON_MARGIN_BOTTOM + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        <View
          style={{
            marginHorizontal: -20,
            width: screenWidth,
            paddingTop: 45.5,
            paddingBottom: 8,
          }}
        >
          <MonthCalendar
            cursor={cursor}
            onCursorChange={setCursor}
            selectedDates={[draft]}
            onSelectDate={applyDate}
            minDate={minDate}
          />
        </View>

        <View className="flex-row items-center px-[41px] mt-3">
          <View className="h-px flex-1 bg-[#D9D9D9]" />
          <Text className="p-2.5 text-base font-ubuntu-light text-[#9B9797]">
            {mode === 'start' ? 'Set Start Time' : 'Set End Time'}
          </Text>
          <View className="h-px flex-1 bg-[#D9D9D9]" />
        </View>

        <View className="mt-3  items-center rounded-2xl bg-white px-4 py-8">
          <Text className="mb-2 text-[11.2px] font-inter-regular text-[#878686]">
            {mode === 'start' ? 'START TIME' : 'END TIME'}
          </Text>
          <View className="flex-row items-center">
            <TimeWheelColumn
              value={draft.getHours()}
              length={24}
              onChange={(hours) => {
                const next = new Date(draft);
                next.setHours(hours);
                setDraft(next);
              }}
            />
            <Text className="w-2 text-center text-base font-inter-medium text-[#113E55]">:</Text>
            <TimeWheelColumn
              value={draft.getMinutes()}
              length={60}
              onChange={(minutes) => {
                const next = new Date(draft);
                next.setMinutes(minutes);
                setDraft(next);
              }}
            />
          </View>

          <View className="mt-8 w-full">
            <Text
              className="mb-2 ml-[9px] text-[#878686]"
              style={{
                fontFamily: UbuntuSans.regular,
                fontSize: 12,
                lineHeight: 14,
              }}
            >
              Preset
            </Text>
            <View className="flex-row items-center gap-[7px]">
              {PRESETS.map((preset) => (
                <Pressable
                  key={preset.label}
                  onPress={() => applyPreset(preset.minutes)}
                  className="h-[34px] shrink-0 items-center justify-center rounded-2xl bg-[#EFF1F1] px-3"
                >
                  <Text
                    className="text-center text-[#878686]"
                    style={{
                      fontFamily: UbuntuSans.regular,
                      fontSize: 9,
                      lineHeight: 10,
                      includeFontPadding: false,
                    }}
                  >
                    {preset.label}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>
        </View>

        <Button label="Set" className="mt-8 self-center" onPress={() => onSet(draft)} />
      </ScrollView>
    </SafeAreaView>
  );
}
