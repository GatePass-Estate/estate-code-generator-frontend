import React from 'react';
import { View, Text, Pressable, ScrollView, Modal, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';

type AISummaryModalProps = {
  visible: boolean;
  onClose: () => void;
  executiveSummary?: string;
  detailedInsight?: string;
  keyPatterns?: string[];
  recommendedActions?: string[];
  dataLimitations?: string;
};

function BulletList({ items }: { items: string[] }) {
  if (!items.length) {
    return (
      <Text
        allowFontScaling={false}
        style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 12, color: '#8A9A9D', lineHeight: 20 }}
      >
        No items available for this section.
      </Text>
    );
  }

  return (
    <View style={{ gap: 8 }}>
      {items.map((item) => (
        <View key={item} style={{ flexDirection: 'row', gap: 8 }}>
          <View
            style={{
              width: 4,
              height: 4,
              borderRadius: 2,
              backgroundColor: '#8A9A9D',
              marginTop: 8,
            }}
          />
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Inter_18pt-Regular',
              fontSize: 12,
              color: '#8A9A9D',
              flex: 1,
              lineHeight: 20,
            }}
          >
            {item}
          </Text>
        </View>
      ))}
    </View>
  );
}

export default function AISummaryModal({
  visible,
  onClose,
  executiveSummary,
  detailedInsight,
  keyPatterns = [],
  recommendedActions = [],
  dataLimitations,
}: AISummaryModalProps) {
  if (!visible) return null;

  const body =
    executiveSummary?.trim() ||
    detailedInsight?.trim() ||
    'Summary is not available for this window.';

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
            maxHeight: '90%',
            padding: 24,
          }}
        >
          <View style={{ paddingBottom: 16 }}>
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

          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'UbuntuSans-Medium',
              fontSize: 20,
              color: '#113E55',
              marginBottom: 16,
            }}
          >
            AI SUMMARY
          </Text>
          <View style={{ flexDirection: 'row', gap: 12, marginBottom: 24 }}>
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <MaterialIcons name="schedule" size={12} color="#F46036" />
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 10, color: '#F46036' }}
              >
                2 mins Read
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: 4, alignItems: 'center' }}>
              <MaterialIcons name="security" size={12} color="#1B998B" />
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 10, color: '#1B998B' }}
              >
                Read Fully
              </Text>
            </View>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={{ gap: 16, paddingBottom: 40 }}
          >
            <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}
                >
                  EXECUTIVE SUMMARY
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#113E55" />
              </View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 12,
                  color: '#8A9A9D',
                  lineHeight: 20,
                }}
              >
                {body}
              </Text>
            </View>

            {detailedInsight?.trim() && detailedInsight.trim() !== body ? (
              <View
                style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}
              >
                <View
                  style={{
                    flexDirection: 'row',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    marginBottom: 12,
                  }}
                >
                  <Text
                    allowFontScaling={false}
                    style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}
                  >
                    DETAILED INSIGHT
                  </Text>
                  <MaterialIcons name="keyboard-arrow-down" size={20} color="#113E55" />
                </View>
                <Text
                  allowFontScaling={false}
                  style={{
                    fontFamily: 'Inter_18pt-Regular',
                    fontSize: 12,
                    color: '#8A9A9D',
                    lineHeight: 20,
                  }}
                >
                  {detailedInsight.trim()}
                </Text>
              </View>
            ) : null}

            <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}
                >
                  KEY PATTERNS
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#113E55" />
              </View>
              <BulletList items={keyPatterns} />
            </View>

            <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}
                >
                  RECOMMENDED ACTIONS
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#113E55" />
              </View>
              <BulletList items={recommendedActions} />
            </View>

            <View style={{ paddingBottom: 16, borderBottomWidth: 1, borderBottomColor: '#E5E7EB' }}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  marginBottom: 12,
                }}
              >
                <Text
                  allowFontScaling={false}
                  style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 12, color: '#113E55' }}
                >
                  DATA LIMITATIONS
                </Text>
                <MaterialIcons name="keyboard-arrow-down" size={20} color="#113E55" />
              </View>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 12,
                  color: '#8A9A9D',
                  lineHeight: 20,
                }}
              >
                {dataLimitations?.trim() || 'No data limitations noted for this window.'}
              </Text>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}
