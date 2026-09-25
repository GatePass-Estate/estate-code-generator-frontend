import React from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import Animated, {
  SlideInDown,
  SlideOutDown,
  FadeIn,
  FadeOut,
} from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type AISummaryModalProps = {
  visible: boolean;
  onClose: () => void;
  summaryData?: any;
};

const AccordionItem = ({ title, content, isList }: { title: string; content: string | string[]; isList?: boolean }) => {
  const [expanded, setExpanded] = React.useState(true);
  
  if (!content || (Array.isArray(content) && content.length === 0)) return null;

  return (
    <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
      <Pressable onPress={() => setExpanded(!expanded)} style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: expanded ? 12 : 0, paddingVertical: 4 }}>
        <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}>{title}</Text>
        <MaterialIcons name={expanded ? "keyboard-arrow-down" : "keyboard-arrow-right"} size={20} color="#113E55" />
      </Pressable>
      {expanded && (
        <View style={isList ? { gap: 8 } : undefined}>
          {isList && Array.isArray(content) ? (
            content.map((item, idx) => (
              <View key={idx} style={{ flexDirection: 'row', gap: 8 }}>
                <View style={{ width: 4, height: 4, borderRadius: 2, backgroundColor: '#8A9A9D', marginTop: 8 }} />
                <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', flex: 1, lineHeight: 20 }}>
                  {item}
                </Text>
              </View>
            ))
          ) : (
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', lineHeight: 20 }}>
              {content as string}
            </Text>
          )}
        </View>
      )}
    </View>
  );
};

export default function AISummaryModal({ visible, onClose, summaryData }: AISummaryModalProps) {
      if (!visible) return null;

  const data = summaryData?.tier2 || summaryData?.tier1;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        <BlurView
          intensity={20}
          style={StyleSheet.absoluteFill}
        >
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        </BlurView>

        <View
          style={[{
            backgroundColor: '#F6F7F7',
            borderTopLeftRadius: 32,
            borderTopRightRadius: 32,
            maxHeight: '90%',
            padding: 24,
          }
        ]}
      >
        {/* Draggable Handle Area */}
                  <View style={{ paddingBottom: 16 }}>
            {/* Handle */}
            <View
              style={{
                width: 100,
                height: 6,
                borderRadius: 3,
                backgroundColor: '#A0A0A0',
                alignSelf: 'center',
              }}
            />
          </View>
                
        <Text allowFontScaling={false} style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 20, color: '#113E55', marginBottom: 16 }}>
          AI SUMMARY
        </Text>
        <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
           <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
             <MaterialIcons name="schedule" size={12} color="#F46036" />
             <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 10, color: '#F46036' }}>2 mins Read</Text>
           </View>
           <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
             <MaterialIcons name="security" size={12} color="#1B998B" />
             <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 10, color: '#1B998B' }}>Read Fully</Text>
           </View>
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ gap: 16, paddingBottom: 40 }}>
          {data ? (
            <>
              <AccordionItem title="EXECUTIVE SUMMARY" content={data.executive_summary} />
              <AccordionItem title="DETAILED INSIGHT" content={data.detailed_insight} />
              <AccordionItem title="RISK DRIVERS" content={data.risk_drivers} isList={true} />
              <AccordionItem title="RECOMMENDED ACTIONS" content={data.recommended_actions} isList={true} />
              <AccordionItem title="DATA LIMITATIONS" content={data.data_limitations} />
            </>
          ) : (
            <Text allowFontScaling={false} style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 13, color: '#8A9A9D' }}>
              No summary data available.
            </Text>
          )}
        </ScrollView>
      </View>
    </View>
  </Modal>
  );
}
