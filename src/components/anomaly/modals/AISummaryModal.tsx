import React from 'react';
import {
  View,
  Text,
  Pressable,
  ScrollView,
  Modal,
  StyleSheet,
  Dimensions,
  Platform,
  PanResponder,
  Animated as RNAnimated,
} from 'react-native';
import Animated, { SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import TimeIconSvg from '@/src/assets/images/timeicon.svg';
import ThirdPartySvg from '@/src/assets/images/thirdparty.svg';

type AISummaryModalProps = {
  visible: boolean;
  onClose: () => void;
  summaryData?: any;
  initialIndex?: number;
  tierTwoName?: string;
  tierThreeName?: string;
};

const AccordionItem = ({
  title,
  content,
  isList,
  isLast,
}: {
  title: string;
  content: string | string[];
  isList?: boolean;
  isLast?: boolean;
}) => {
  const [expanded, setExpanded] = React.useState(true);

  if (!content || (Array.isArray(content) && content.length === 0)) return null;

  return (
    <View style={{ flexDirection: 'row', minHeight: 40 }}>
      {/* Timeline Column */}
      <View style={{ width: 24, alignItems: 'center', marginRight: 12 }}>
        <View
          style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#D1D5DB', marginTop: 8 }}
        />
        {!isLast && (
          <View style={{ flex: 1, width: 1, backgroundColor: '#E5E7EB', marginVertical: 4 }} />
        )}
      </View>

      {/* Content Column */}
      <View style={{ flex: 1, paddingBottom: 24 }}>
        <Pressable
          onPress={() => setExpanded(!expanded)}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: expanded ? 12 : 0,
            paddingVertical: 4,
          }}
        >
          <Text
            allowFontScaling={false}
            style={{
              fontFamily: 'Inter_18pt-Light',
              fontSize: 14,
              color: '#0A1F29',
              textTransform: 'uppercase',
            }}
          >
            {title}
          </Text>
          <MaterialIcons
            name={expanded ? 'keyboard-arrow-down' : 'keyboard-arrow-right'}
            size={20}
            color="#8A9A9D"
          />
        </Pressable>
        {expanded && (
          <View style={Array.isArray(content) ? { gap: 8 } : undefined}>
            {Array.isArray(content) ? (
              content.map((item, idx) => (
                <View key={idx} style={{ flexDirection: 'row', gap: 8 }}>
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
              ))
            ) : (
              <Text
                allowFontScaling={false}
                style={{
                  fontFamily: 'Inter_18pt-Regular',
                  fontSize: 12,
                  color: '#8A9A9D',
                  lineHeight: 20,
                }}
              >
                {content as string}
              </Text>
            )}
          </View>
        )}
      </View>
    </View>
  );
};

export default function AISummaryModal({
  visible,
  onClose,
  summaryData,
  initialIndex = 0,
  tierTwoName,
  tierThreeName,
}: AISummaryModalProps) {
  const panY = React.useRef(new RNAnimated.Value(0)).current;
  const scrollViewRef = React.useRef<ScrollView>(null);
  const screenWidth = Dimensions.get('window').width;

  React.useEffect(() => {
    if (visible) {
      panY.setValue(0);
      if (initialIndex !== undefined && scrollViewRef.current) {
        setTimeout(() => {
          scrollViewRef.current?.scrollTo({ x: initialIndex * screenWidth, animated: false });
        }, 50);
      }
    }
  }, [visible, panY, initialIndex]);

  const panResponder = React.useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 5,
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dy > 0) {
          panY.setValue(gestureState.dy);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dy > 120 || gestureState.vy > 0.8) {
          onClose();
        } else {
          RNAnimated.spring(panY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View
        style={{
          flex: 1,
          justifyContent: 'flex-end',
        }}
      >
        {Platform.OS === 'ios' ? (
          <BlurView intensity={15} tint="dark" style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </BlurView>
        ) : (
          <BlurView intensity={25} tint="dark" style={StyleSheet.absoluteFill}>
            <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
          </BlurView>
        )}

        <Animated.View
          entering={SlideInDown.duration(250)}
          exiting={SlideOutDown}
          style={{
            maxHeight: '90%',
          }}
        >
          <RNAnimated.View
            style={{
              backgroundColor: '#F6F7F7',
              borderTopLeftRadius: 40,
              borderTopRightRadius: 40,
              paddingHorizontal: 24,
              paddingBottom: 40,
              transform: [{ translateY: panY }],
            }}
          >
            {/* Draggable Handle Area */}
            <View
              {...panResponder.panHandlers}
              style={{ height: 34, alignItems: 'center', justifyContent: 'center' }}
            >
              <View
                style={{
                  width: 134,
                  height: 7,
                  borderRadius: 4,
                  backgroundColor: '#9B9797',
                }}
              />
            </View>

            <ScrollView
              ref={scrollViewRef}
              horizontal
              pagingEnabled
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ paddingBottom: 40 }}
            >
              {(!summaryData?.tier1 && !summaryData?.tier2 ? ['tier1'] : ['tier1', 'tier2']).map(
                (tierKey, idx) => {
                  const actualTierData = summaryData?.[tierKey];
                  if (!actualTierData && (summaryData?.tier1 || summaryData?.tier2)) return null;

                  const tierData = actualTierData || {
                    executive_summary:
                      'This section provides a detailed summary of the anomalous behavior detected for this user. It breaks down the key factors contributing to the anomaly, including unusual entry times, late-night activity, and irregular visitor patterns over the selected timeframe.',
                  };
                  const isTier1 = tierKey === 'tier1';

                  const sections = Object.entries(tierData || {})
                    .map(([key, value]) => ({
                      title: key.replace(/_/g, ' ').toUpperCase(),
                      content: value as any,
                    }))
                    .filter(
                      (sec) =>
                        sec.content && (Array.isArray(sec.content) ? sec.content.length > 0 : true)
                    );

                  return (
                    <View
                      key={tierKey}
                      style={{
                        width: Dimensions.get('window').width - 48,
                        paddingRight:
                          idx === 0 && summaryData?.tier1 && summaryData?.tier2 ? 24 : 0,
                        paddingLeft: idx === 1 && summaryData?.tier1 && summaryData?.tier2 ? 24 : 0,
                      }}
                    >
                      <Text
                        allowFontScaling={false}
                        style={{
                          fontFamily: 'UbuntuSans-Medium',
                          fontSize: 24,
                          color: '#0A1F29',
                          marginTop: 24,
                          marginBottom: 12,
                        }}
                      >
                        AI SUMMARY
                      </Text>
                      <View style={{ flexDirection: 'row', gap: 12, marginBottom: 32 }}>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 4,
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            backgroundColor: '#FFF0F0',
                            borderRadius: 12,
                          }}
                        >
                          <TimeIconSvg width={12} height={12} color="#F46036" />
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontFamily: 'Inter_18pt-Regular',
                              fontSize: 10,
                              color: '#F46036',
                            }}
                          >
                            2 mins Read
                          </Text>
                        </View>
                        <View
                          style={{
                            flexDirection: 'row',
                            gap: 4,
                            alignItems: 'center',
                            paddingHorizontal: 10,
                            paddingVertical: 4,
                            backgroundColor: '#E5F5F3',
                            borderRadius: 12,
                          }}
                        >
                          <ThirdPartySvg width={12} height={12} color="#1B998B" />
                          <Text
                            allowFontScaling={false}
                            style={{
                              fontFamily: 'Inter_18pt-Regular',
                              fontSize: 10,
                              color: '#1B998B',
                            }}
                          >
                            {isTier1 ? 'In house' : 'Third Party'}
                          </Text>
                        </View>
                      </View>

                      <ScrollView showsVerticalScrollIndicator={false}>
                        {sections.map((sec, index) => (
                          <AccordionItem
                            key={sec.title}
                            title={sec.title}
                            content={sec.content}
                            isLast={index === sections.length - 1}
                          />
                        ))}
                      </ScrollView>
                    </View>
                  );
                }
              )}
            </ScrollView>
          </RNAnimated.View>
        </Animated.View>
      </View>
    </Modal>
  );
}
