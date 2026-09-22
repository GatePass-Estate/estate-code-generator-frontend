import { useMemo } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';
import { CalendarChevronLeftIcon, CalendarChevronRightIcon } from '@/src/assets/svgs';

/** Shared with CodeDateTimePicker (Figma 2245:4774 / validity calendar). */
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
  /** When false, out-of-month days stay visible but non-interactive (Figma). */
  allowOutOfMonthSelect?: boolean;
  /** Horizontal inset as fraction of width; default matches validity picker. */
  insetRatio?: number;
  /** Wrap in white rounded card (incident Set Date). */
  card?: boolean;
};

/**
 * Month grid used by validity (CodeDateTimePicker) and incident Set Date.
 * Visual tokens match Figma datepicker 2245:4774 / 6578:4759.
 */
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
  const cells = useMemo(
    () => monthCells(cursor.getFullYear(), cursor.getMonth()),
    [cursor]
  );
  const monthLabel = cursor.toLocaleString('en-GB', { month: 'long' });
  const minDay = minDate ? startOfDay(minDate).getTime() : null;
  /** Card is ~360 on 375; keep the same absolute date inset as validity (11.33% of screen). */
  const cardSideInset = (screenWidth - Math.min(screenWidth - 15, 360)) / 2;
  const gridPad = card
    ? Math.max(12, screenWidth * insetRatio - cardSideInset)
    : screenWidth * insetRatio;
  const weekCount = cells.length / 7;

  const isSelected = (date: Date) =>
    selectedDates.some((d) => d != null && isSameDay(d, date));

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
          onPress={() =>
            onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))
          }
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
        <Text
          allowFontScaling={false}
          className="text-center text-[12px] font-roboto text-[#0A1F29]"
          style={{ flex: 5, fontWeight: '700' }}
        >
          {monthLabel}
        </Text>
        <Pressable
          onPress={() =>
            onCursorChange(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))
          }
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

      <View className="flex-row" style={{ height: WEEKDAY_H, alignItems: 'center' }}>
        {WEEKDAYS.map((day, index) => (
          <View
            key={`${day}-${index}`}
            style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}
          >
            <Text
              allowFontScaling={false}
              className="text-[13px] font-inter-semibold text-[#113E55]"
            >
              {day}
            </Text>
          </View>
        ))}
      </View>

      {Array.from({ length: weekCount }, (_, week) => (
        <View
          key={week}
          className="flex-row"
          style={{ height: DAY_ROW_H, alignItems: 'center' }}
        >
          {cells.slice(week * 7, week * 7 + 7).map((cell) => {
            const selected = cell.inMonth && isSelected(cell.date);
            const disabled =
              (minDay != null && startOfDay(cell.date).getTime() < minDay) ||
              (!allowOutOfMonthSelect && !cell.inMonth);
            const muted = !cell.inMonth || disabled;
            return (
              <Pressable
                key={cell.date.toISOString()}
                onPress={() => {
                  if (disabled) return;
                  if (!cell.inMonth && !allowOutOfMonthSelect) return;
                  onSelectDate(cell.date);
                }}
                style={{
                  flex: 1,
                  height: DAY_ROW_H,
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <View
                  style={{
                    width: SELECTED_W,
                    height: SELECTED_H,
                    borderRadius: 20,
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: selected ? '#CEE5ED' : 'transparent',
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    className="text-[13px] font-inter-light"
                    style={{
                      color: muted ? '#BDBDBD' : selected ? '#113E55' : '#0A1F29',
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
