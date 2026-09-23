import React from 'react';
import {
  View,
  Text,
  Pressable,
  Modal,
  StyleSheet,
  Platform,
  ScrollView,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { MaterialIcons } from '@expo/vector-icons';

export type DataInsightItem = {
  title: string;
  description: string;
};

interface DataInsightModalProps {
  visible: boolean;
  onClose: () => void;
  title?: string | null;
  description?: string | null;
  /** Flat bullets from API — split into title + body when possible. */
  bullets?: string[];
  items?: DataInsightItem[];
}

const DEFAULT_DESCRIPTION =
  "No complicated reports. Get simple insights that help you understand what's happening and why.";

const DEFAULT_ITEMS: DataInsightItem[] = [
  {
    title: 'Spot unusual activity',
    description:
      'See unusual patterns early so you can investigate before they become bigger issues.',
  },
  {
    title: 'Focus on what matters',
    description:
      'Instead of reviewing everything, instantly see the people or patterns that deserve your attention.',
  },
  {
    title: 'Simple insights',
    description: DEFAULT_DESCRIPTION,
  },
];

function toItems(bullets: string[], fallback: DataInsightItem[]): DataInsightItem[] {
  if (!bullets.length) return fallback;
  return bullets.map((bullet, index) => {
    const trimmed = bullet.trim();
    const colon = trimmed.indexOf(':');
    if (colon > 0 && colon < 48) {
      return {
        title: trimmed.slice(0, colon).trim(),
        description: trimmed.slice(colon + 1).trim() || DEFAULT_DESCRIPTION,
      };
    }
    const sentenceEnd = trimmed.search(/[.!?]\s/);
    if (sentenceEnd > 8 && sentenceEnd < 56 && trimmed.length > sentenceEnd + 8) {
      return {
        title: trimmed.slice(0, sentenceEnd + 1).trim(),
        description: trimmed.slice(sentenceEnd + 1).trim(),
      };
    }
    return {
      title: fallback[index % fallback.length]?.title || `Insight ${index + 1}`,
      description: trimmed,
    };
  });
}

export default function DataInsightModal({
  visible,
  onClose,
  title,
  description,
  bullets = [],
  items,
}: DataInsightModalProps) {
  if (!visible) return null;

  const rows = items?.length ? items : toItems(bullets, DEFAULT_ITEMS);
  const heading = title?.trim() || 'Data Insight';
  const subcopy = description?.trim() || DEFAULT_DESCRIPTION;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'flex-end' }}>
          {Platform.OS === 'ios' ? (
            <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill} />
          ) : (
            <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill} />
          )}
          <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />

          <Animated.View
            entering={SlideInDown.duration(250)}
            exiting={SlideOutDown}
            style={{
              backgroundColor: '#F9FAFA',
              borderTopLeftRadius: 32,
              borderTopRightRadius: 32,
              paddingHorizontal: 24,
              paddingTop: 32,
              paddingBottom: 40,
              width: '100%',
              maxHeight: '90%',
            }}
          >
            <ScrollView showsVerticalScrollIndicator={false}>
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'UbuntuSans-Medium',
                  fontSize: 24,
                  color: '#113E55',
                  marginBottom: 8,
                }}
              >
                {heading}
              </Text>

              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 13,
                  color: '#8A9A9D',
                  marginBottom: 24,
                  lineHeight: 18,
                }}
              >
                {subcopy}
              </Text>

              <View
                style={{
                  backgroundColor: '#FFFFFF',
                  borderRadius: 16,
                  padding: 16,
                  gap: 20,
                  marginBottom: 24,
                }}
              >
                {rows.map((row, index) => (
                  <View
                    key={`${index}-${row.title.slice(0, 24)}`}
                    style={{ flexDirection: 'row', gap: 12 }}
                  >
                    <MaterialIcons
                      name="help-outline"
                      size={18}
                      color="#113E55"
                      style={{ marginTop: 2 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Medium',
                          fontSize: 14,
                          color: '#4A6B7C',
                          marginBottom: 4,
                        }}
                      >
                        {row.title}
                      </Text>
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'Inter_18pt-Regular',
                          fontSize: 12,
                          color: '#8A9A9D',
                          lineHeight: 16,
                        }}
                      >
                        {row.description}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            </ScrollView>

            <Pressable
              onPress={onClose}
              style={{
                backgroundColor: '#113E55',
                borderRadius: 30,
                paddingVertical: 16,
                alignItems: 'center',
              }}
            >
              <Text
                allowFontScaling={false}
                style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#FFFFFF' }}
              >
                I understand
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}
