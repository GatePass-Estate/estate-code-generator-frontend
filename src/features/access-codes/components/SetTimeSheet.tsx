import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ValidityWindowArrowIcon } from '@/src/assets/svgs';
import Button, { BUTTON_MARGIN_BOTTOM } from '@/src/shared/components/Button';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import TimeWheelColumn from '@/src/features/access-codes/components/TimeWheelColumn';

type SetTimeSheetProps = {
  visible: boolean;
  start: Date;
  end: Date;
  onClose: () => void;
  onDone: (start: Date, end: Date) => void;
};

const cloneTime = (base: Date, hours: number, minutes: number) => {
  const next = new Date(base);
  next.setHours(hours, minutes, 0, 0);
  return next;
};

const sameClock = (a: Date, b: Date) =>
  a.getHours() === b.getHours() && a.getMinutes() === b.getMinutes();

export default function SetTimeSheet({ visible, start, end, onClose, onDone }: SetTimeSheetProps) {
  const insets = useSafeAreaInsets();
  const [startHours, setStartHours] = useState(start.getHours());
  const [startMinutes, setStartMinutes] = useState(start.getMinutes());
  const [endHours, setEndHours] = useState(end.getHours());
  const [endMinutes, setEndMinutes] = useState(end.getMinutes());

  useEffect(() => {
    if (!visible) return;
    setStartHours(start.getHours());
    setStartMinutes(start.getMinutes());
    setEndHours(end.getHours());
    setEndMinutes(end.getMinutes());
  }, [end, start, visible]);

  const draftStart = cloneTime(start, startHours, startMinutes);
  const draftEnd = cloneTime(end, endHours, endMinutes);
  const isSame = sameClock(draftStart, draftEnd);

  const handleDone = () => {
    if (isSame) return;
    onDone(draftStart, draftEnd);
  };

  return (
    <BottomSheet
      visible={visible}
      onClose={onClose}
      scrimClassName="flex-1 justify-end bg-black/80"
      panelClassName="rounded-t-[40px] bg-[#F6F7F7]"
      panelStyle={{ paddingBottom: BUTTON_MARGIN_BOTTOM + insets.bottom }}
    >
      <Text className="mt-[42px] text-center text-heading-sm font-ubuntu-semibold text-primary">
        Set Time
      </Text>

      <View className="mt-[46px] items-center">
        <View className="flex-row items-center">
          <Text className="w-[84px] text-center text-caption font-inter-regular text-[#878686]">
            START TIME
          </Text>
          <View className="w-[57px]" />
          <Text className="w-[84px] text-center text-caption font-inter-regular text-[#878686]">
            END TIME
          </Text>
        </View>

        <View className="mt-2 flex-row items-center">
          <View className="w-[84px] flex-row items-center justify-center">
            <TimeWheelColumn value={startHours} length={24} onChange={setStartHours} />
            <Text className="w-2 text-center text-base font-inter-medium text-primary">:</Text>
            <TimeWheelColumn value={startMinutes} length={60} onChange={setStartMinutes} />
          </View>

          <View className="mx-[18px] h-[10px] w-[14px] items-center justify-center">
            <ValidityWindowArrowIcon width={14} height={10} />
          </View>

          <View className="w-[84px] flex-row items-center justify-center">
            <TimeWheelColumn value={endHours} length={24} onChange={setEndHours} />
            <Text className="w-2 text-center text-base font-inter-medium text-primary">:</Text>
            <TimeWheelColumn value={endMinutes} length={60} onChange={setEndMinutes} />
          </View>
        </View>
      </View>

      {isSame ? (
        <View className="mt-8 h-[33px] w-[289px] self-center items-center justify-center rounded-full border-[0.5px] border-[#FF0C0C] bg-[rgba(255,13,13,0.12)] px-4 py-1">
          <Text className="text-center text-[12px] font-inter-medium-italic italic leading-[14px] text-[#E30404]">
            Start time must be different from end time
          </Text>
        </View>
      ) : (
        <View className="mt-8 h-[33px]" />
      )}

      <Button label="Done" className="mt-8 self-center" onPress={handleDone} />
    </BottomSheet>
  );
}
