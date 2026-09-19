import React, { useState } from 'react';
import { View, Text, Pressable } from 'react-native';
import Animated, { SlideInDown, SlideOutDown, FadeIn, FadeOut } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { GestureDetector } from 'react-native-gesture-handler';
import { useSwipeDown } from './useSwipeDown';

type DatePickerModalProps = {
  visible: boolean;
  onClose: () => void;
  onApply?: (startDate: Date | null, endDate: Date | null) => void;
};

const DAYS_OF_WEEK = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

export default function DatePickerModal({ visible, onClose, onApply }: DatePickerModalProps) {
  const { panGesture, animatedStyle, translateY } = useSwipeDown(onClose);
  React.useEffect(() => {
    if (visible) translateY.value = 0;
  }, [visible]);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const daysInMonth = getDaysInMonth(currentMonth);
  const firstDay = getFirstDayOfMonth(currentMonth);

  const prevMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDatePress = (day: number) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (!startDate || (startDate && endDate)) {
      setStartDate(selectedDate);
      setEndDate(null);
    } else if (startDate && !endDate) {
      if (selectedDate < startDate) {
        setStartDate(selectedDate);
      } else {
        setEndDate(selectedDate);
      }
    }
  };

  const isSelected = (day: number) => {
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    if (startDate && d.getTime() === startDate.getTime()) return true;
    if (endDate && d.getTime() === endDate.getTime()) return true;
    return false;
  };

  const isInRange = (day: number) => {
    if (!startDate || !endDate) return false;
    const d = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return d > startDate && d < endDate;
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Select Date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const monthName = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  if (!visible) return null;

  return (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100, justifyContent: 'flex-end' }}
    >
      <BlurView intensity={20} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}>
        <Pressable style={{ flex: 1 }} onPress={onClose} />
      </BlurView>

      <Animated.View
        entering={SlideInDown.springify().damping(20).stiffness(90)}
        exiting={SlideOutDown}
        style={[
          animatedStyle,
          { backgroundColor: '#F6F7F7', borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 24, paddingBottom: 40 }
        ]}
      >
        <GestureDetector gesture={panGesture}>
          <View style={{ paddingBottom: 24 }}>
            <View style={{ width: 40, height: 4, backgroundColor: '#E5E7EB', borderRadius: 2, alignSelf: 'center' }} />
          </View>
        </GestureDetector>
        
        <View style={{ marginBottom: 24 }}>
          <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 20, color: '#113E55' }}>Set Date</Text>
        </View>

        <View style={{ gap: 12, marginBottom: 24 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12 }}>
            <MaterialIcons name="calendar-today" size={18} color="#8A9A9D" />
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: startDate ? '#04162D' : '#8A9A9D' }}>
              {startDate ? formatDate(startDate) : 'Enter Start Date'}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#FFFFFF', paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12 }}>
            <MaterialIcons name="calendar-today" size={18} color="#8A9A9D" />
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: endDate ? '#04162D' : '#8A9A9D' }}>
              {endDate ? formatDate(endDate) : 'Enter End Date'}
            </Text>
          </View>
        </View>

        {/* Calendar */}
        <View style={{ backgroundColor: '#FFFFFF', borderRadius: 24, padding: 24 }}>
           <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
             <Pressable onPress={prevMonth} hitSlop={10}>
               <MaterialIcons name="chevron-left" size={20} color="#113E55" />
             </Pressable>
             <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Bold', fontSize: 12, color: '#113E55' }}>
               {monthName.split(' ')[0]} {/* Just the month name, e.g. June */}
             </Text>
             <Pressable onPress={nextMonth} hitSlop={10}>
               <MaterialIcons name="chevron-right" size={20} color="#113E55" />
             </Pressable>
           </View>
           
           {/* Grid */}
           <View style={{ flexWrap: 'wrap', flexDirection: 'row', justifyContent: 'space-between' }}>
             {DAYS_OF_WEEK.map((day, i) => (
               <Text key={`h-${i}`} allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Bold', fontSize: 12, color: '#113E55', width: '14%', textAlign: 'center', marginBottom: 16 }}>
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
                 <Pressable key={`d-${day}`} onPress={() => handleDatePress(day)} style={{ width: '14%', alignItems: 'center', marginBottom: 8 }}>
                    <View style={{ 
                      width: '100%', 
                      height: 24, 
                      backgroundColor: inRange ? '#D2E7ED' : 'transparent',
                      alignItems: 'center', 
                      justifyContent: 'center' 
                    }}>
                        <View style={{ 
                        width: 28, 
                        height: 28, 
                        borderRadius: 14, 
                        backgroundColor: selected ? '#D2E7ED' : 'transparent', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                      }}>
                        <Text allowFontScaling={false} style={{ 
                          fontFamily: 'Inter_18pt-Regular', 
                          fontSize: 12, 
                          color: '#113E55' 
                        }}>
                          {day.toString()}
                        </Text>
                      </View>
                    </View>
                 </Pressable>
               );
             })}

             {/* Trailing empty slots to fix space-between alignment on the last row */}
             {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
               <View key={`trailing-${i}`} style={{ width: '14%', marginBottom: 8 }} />
             ))}
           </View>
        </View>

      </Animated.View>
    </Animated.View>
  );
}
