import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import { CalendarChevronLeftIcon, CalendarChevronRightIcon } from '@/src/assets/svgs';

/** Shared with CodeDateTimePicker. */
export const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
export const DATE_INSET = 0.1133;
export const DAY_ROW_H = 36;
export const WEEKDAY_H = 32;
export const MONTH_ROW_H = 18;
export const SELECTED_W = 21;
export const SELECTED_H = 20;
export const CHEVRON_W = 7;
export const CHEVRON_H = 13;

export const startOfDay = (date: Date) => {
  const next = new Date(date);
  next.setHours(0, 0, 0, 0);
  return next;
};

export const isSameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

type Cell = { date: Date; inMonth: boolean };

export function monthCells(year: number, month: number): Cell[] {
  const first = new Date(year, month, 1);
  const startOffset = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevMonthDays = new Date(year, month, 0).getDate();
  const cells: Cell[] = [];

  for (let i = startOffset - 1; i >= 0; i -= 1) {
    cells.push({ date: new Date(year, month - 1, prevMonthDays - i), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push({ date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1].date;
    cells.push({
      date: new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1),
      inMonth: false,
    });
  }
  return cells;
}

type MonthCalendarProps = {
  cursor: Date;
  onCursorChange: (next: Date) => void;
  /** Dates highlighted with the #CEE5ED pill (start/end/single). */
  selectedDates?: (Date | null | undefined)[];
  onSelectDate: (date: Date) => void;
  minDate?: Date | null;
  /** When false, out-of-month days stay visible but non-interactive. */
  allowOutOfMonthSelect?: boolean;
  /** Horizontal inset as fraction of width; default matches validity picker. */
  insetRatio?: number;
  /** Wrap in white rounded card (incident Set Date). */
  card?: boolean;
};

const monthTitle = (date: Date) => date.toLocaleString('en-GB', { month: 'long' });

const sameMonth = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();

const SLIDE_MS = 240;

/** Month grid used by validity (CodeDateTimePicker) and incident Set Date. */
export default function MonthCalendar({
  cursor,
  onCursorChange,
  selectedDates = [],
  onSelectDate,
  minDate,
  allowOutOfMonthSelect = false,
  insetRatio = DATE_INSET,
  card = false,
}: MonthCalendarProps) {
  const { width: screenWidth } = useWindowDimensions();
  const minDay = minDate ? startOfDay(minDate).getTime() : null;
  /** Card is ~360 on 375; keep the same absolute date inset as validity (11.33% of screen). */
  const cardSideInset = (screenWidth - Math.min(screenWidth - 15, 360)) / 2;
  const gridPad = card
    ? Math.max(12, screenWidth * insetRatio - cardSideInset)
    : screenWidth * insetRatio;

  const [shown, setShown] = useState(() => new Date(cursor.getFullYear(), cursor.getMonth(), 1));
  const [slide, setSlide] = useState<{ to: Date; dir: 1 | -1 } | null>(null);
  const animating = useRef(false);
  const shift = useSharedValue(0);
  const daysW = useSharedValue(0);
  const labelW = useSharedValue(0);

  useEffect(() => {
    if (animating.current) return;
    setShown((prev) =>
      sameMonth(prev, cursor) ? prev : new Date(cursor.getFullYear(), cursor.getMonth(), 1)
    );
  }, [cursor]);

  const generation = useRef(0);

  const commit = useCallback(
    (year: number, month: number, token: number) => {
      if (token !== generation.current) return;
      const to = new Date(year, month, 1);
      animating.current = false;
      setSlide(null);
      setShown(to);
      onCursorChange(to);
    },
    [onCursorChange]
  );

  useEffect(() => {
    if (slide) return;
    shift.value = 0;
  }, [shift, slide]);

  useEffect(() => {
    if (!slide) return;
    const token = ++generation.current;
    const year = slide.to.getFullYear();
    const month = slide.to.getMonth();
    const end = slide.dir > 0 ? -1 : 0;
    shift.value = withTiming(
      end,
      { duration: SLIDE_MS, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) runOnJS(commit)(year, month, token);
      }
    );
  }, [commit, shift, slide]);

  const go = (dir: 1 | -1) => {
    if (animating.current || daysW.value <= 0) return;
    animating.current = true;
    const to = new Date(shown.getFullYear(), shown.getMonth() + dir, 1);
    shift.value = dir > 0 ? 0 : -1;
    setSlide({ to, dir });
  };

  const daysStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value * daysW.value }],
  }));

  const labelStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: shift.value * labelW.value }],
  }));

  const [daysPane, setDaysPane] = useState(0);
  const [labelPane, setLabelPane] = useState(0);
  const pages = slide ? (slide.dir > 0 ? [shown, slide.to] : [slide.to, shown]) : [shown];
  const dayRows = Math.max(
    ...pages.map((page) => monthCells(page.getFullYear(), page.getMonth()).length / 7)
  );

  const grid = (
    <View style={{ paddingHorizontal: gridPad }}>
      <View
        style={{
          height: MONTH_ROW_H,
          marginBottom: card ? 20 : 37,
          flexDirection: 'row',
          alignItems: 'center',
        }}
      >
        <Pressable
          onPress={() => go(-1)}
          hitSlop={16}
          style={{
            flex: 1,
            height: MONTH_ROW_H,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarChevronLeftIcon width={CHEVRON_W} height={CHEVRON_H} />
        </Pressable>
        <View
          style={{ flex: 5, height: MONTH_ROW_H, overflow: 'hidden', justifyContent: 'center' }}
          onLayout={(event) => {
            const next = event.nativeEvent.layout.width;
            if (next <= 0 || labelPane > 0) return;
            labelW.value = next;
            setLabelPane(next);
          }}
        >
          {slide && labelPane > 0 ? (
            <Animated.View
              style={[
                {
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  height: MONTH_ROW_H,
                  width: labelPane * 2,
                  flexDirection: 'row',
                },
                labelStyle,
              ]}
            >
              {pages.map((page) => (
                <View
                  key={page.toISOString()}
                  style={{ width: labelPane, height: MONTH_ROW_H, justifyContent: 'center' }}
                >
                  <Text
                    allowFontScaling={false}
                    className="text-center text-[12px] font-roboto text-[#0A1F29]"
                    style={{ fontWeight: '700' }}
                  >
                    {monthTitle(page)}
                  </Text>
                </View>
              ))}
            </Animated.View>
          ) : (
            <Text
              allowFontScaling={false}
              className="text-center text-[12px] font-roboto text-[#0A1F29]"
              style={{ fontWeight: '700' }}
            >
              {monthTitle(shown)}
            </Text>
          )}
        </View>
        <Pressable
          onPress={() => go(1)}
          hitSlop={16}
          style={{
            flex: 1,
            height: MONTH_ROW_H,
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <CalendarChevronRightIcon width={CHEVRON_W} height={CHEVRON_H} />
        </Pressable>
      </View>

      <View
        className="flex-row"
        style={{ height: WEEKDAY_H, alignItems: 'center' }}
        onLayout={(event) => {
          const next = event.nativeEvent.layout.width;
          if (next <= 0 || daysPane > 0) return;
          daysW.value = next;
          setDaysPane(next);
        }}
      >
        {WEEKDAYS.map((day, index) => (
          <View
            key={`${day}-${index}`}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text allowFontScaling={false} className="text-[13px] font-inter-semibold text-primary">
              {day}
            </Text>
          </View>
        ))}
      </View>

      <View style={{ overflow: 'hidden', height: dayRows * DAY_ROW_H, width: '100%' }}>
        {slide && daysPane > 0 ? (
          <Animated.View
            style={[
              {
                position: 'absolute',
                top: 0,
                left: 0,
                width: daysPane * 2,
                flexDirection: 'row',
              },
              daysStyle,
            ]}
          >
            {pages.map((page) => (
              <View key={`days-${page.toISOString()}`} style={{ width: daysPane }}>
                <MonthDays
                  month={page}
                  selectedDates={selectedDates}
                  onSelectDate={onSelectDate}
                  minDay={minDay}
                  allowOutOfMonthSelect={allowOutOfMonthSelect}
                />
              </View>
            ))}
          </Animated.View>
        ) : (
          <MonthDays
            month={shown}
            selectedDates={selectedDates}
            onSelectDate={onSelectDate}
            minDay={minDay}
            allowOutOfMonthSelect={allowOutOfMonthSelect}
          />
        )}
      </View>
    </View>
  );

  if (!card) return grid;

  return (
    <View
      className="self-center overflow-hidden rounded-2xl bg-white pb-4 pt-8"
      style={{ width: Math.min(screenWidth - 15, 360) }}
    >
      {grid}
    </View>
  );
}

function MonthDays({
  month,
  selectedDates,
  onSelectDate,
  minDay,
  allowOutOfMonthSelect,
}: {
  month: Date;
  selectedDates: (Date | null | undefined)[];
  onSelectDate: (date: Date) => void;
  minDay: number | null;
  allowOutOfMonthSelect: boolean;
}) {
  const cells = useMemo(() => monthCells(month.getFullYear(), month.getMonth()), [month]);
  const weekCount = cells.length / 7;
  const range = useMemo(() => {
    const times = selectedDates
      .filter((date): date is Date => date != null)
      .map((date) => startOfDay(date).getTime());
    if (times.length < 2) return null;
    const start = Math.min(...times);
    const end = Math.max(...times);
    return start === end ? null : { start, end };
  }, [selectedDates]);
  const isSelected = (date: Date) => selectedDates.some((d) => d != null && isSameDay(d, date));
  const inRange = (date: Date) => {
    if (!range) return false;
    const time = startOfDay(date).getTime();
    return time >= range.start && time <= range.end;
  };

  return (
    <>
      {Array.from({ length: weekCount }, (_, week) => (
        <View
          key={week}
          className="flex-row"
          style={{ height: DAY_ROW_H, width: '100%', alignItems: 'center' }}
        >
          {cells.slice(week * 7, week * 7 + 7).map((cell) => {
            const time = startOfDay(cell.date).getTime();
            const isStart = range != null && time === range.start;
            const isEnd = range != null && time === range.end;
            const active = inRange(cell.date);
            const selected = !active && cell.inMonth && isSelected(cell.date);
            const disabled =
              (minDay != null && time < minDay) || (!allowOutOfMonthSelect && !cell.inMonth);
            const muted = !active && (!cell.inMonth || disabled);
            return (
              <Pressable
                key={cell.date.toISOString()}
                onPress={() => {
                  if (disabled) return;
                  if (!cell.inMonth && !allowOutOfMonthSelect) return;
                  onSelectDate(cell.date);
                }}
                android_ripple={{ color: 'transparent' }}
                style={{
                  flex: 1,
                  height: DAY_ROW_H,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {active ? (
                  <View
                    pointerEvents="none"
                    style={{
                      position: 'absolute',
                      top: (DAY_ROW_H - SELECTED_H) / 2,
                      height: SELECTED_H,
                      backgroundColor: '#CEE5ED',
                      left: isStart && !isEnd ? '50%' : 0,
                      right: isEnd && !isStart ? '50%' : 0,
                    }}
                  />
                ) : null}
                <View
                  style={{
                    width: SELECTED_W,
                    height: SELECTED_H,
                    borderRadius: SELECTED_H / 2,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: isStart || isEnd || selected ? '#CEE5ED' : 'transparent',
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    className="text-[13px] font-inter-light"
                    style={{
                      color: muted ? '#BDBDBD' : active || selected ? '#113E55' : '#0A1F29',
                    }}
                  >
                    {cell.date.getDate()}
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </View>
      ))}
    </>
  );
}
