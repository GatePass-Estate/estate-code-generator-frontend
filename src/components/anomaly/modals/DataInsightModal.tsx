import React, { useState, useEffect } from 'react';
import { View, Text, Pressable, Modal, StyleSheet, Dimensions, SafeAreaView } from 'react-native';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, Easing, runOnJS, cancelAnimation, SharedValue } from 'react-native-reanimated';
import { MaterialIcons } from '@expo/vector-icons';
import Info1Svg from '@/src/assets/images/info1.svg';
import Info2Svg from '@/src/assets/images/info2.svg';
import Info3Svg from '@/src/assets/images/info3.svg';
import Info4Svg from '@/src/assets/images/info4.svg';
import Info5Svg from '@/src/assets/images/info5.svg';

const { width } = Dimensions.get('window');
const DURATION = 6000;

interface DataInsightModalProps {
  visible: boolean;
  onClose: () => void;
}

const PAGES = [
  {
    step: 1,
    title: 'How Anomaly\nScan Works',
    subtitle: 'What happens ?',
    text1: 'When someone validates an access code at the gate, an anomaly scan runs quietly in the background.',
    text2: 'It checks whether this visit fits how things usually work at the estate, not just whether the code was valid.',
    Svg: Info1Svg,
    layout: 'sandwich'
  },
  {
    step: 2,
    subtitle: 'Why it exists ?',
    text1: "The scan helps spot visits that deserve a second look: unusual timing, patterns that don't match what we normally see, or anything that feels out of place. The goal is smarter awareness, not flagging every normal entry.",
    Svg: Info2Svg,
    layout: 'topText'
  },
  {
    step: 3,
    subtitle: 'What it compares ?',
    text1: "It compares the visit to past visits at the same estate that looked normal. If we don't have much history yet, for example, a first-time visitor, that alone is not treated as suspicious.",
    Svg: Info3Svg,
    layout: 'topText'
  },
  {
    step: 4,
    subtitle: 'What happens ?',
    text1: "If a visit stands out enough, we flag it and notify estate admins so they can review it. The result page explains, in plain terms, what looked unusual. However, admins decide what to do next.",
    Svg: Info4Svg,
    layout: 'bottomText'
  },
  {
    step: 5,
    subtitle: 'What it does ?',
    text1: "It does not block the gate, replace human judgment, or treat every unfamiliar person as a threat. It supports admins by surfacing visits worth a closer look.",
    Svg: Info5Svg,
    layout: 'topTextCards'
  }
];

const ProgressBar = ({ index, currentIndex, progress }: { index: number, currentIndex: number, progress: SharedValue<number> }) => {
  const style = useAnimatedStyle(() => {
    if (index < currentIndex) return { width: '100%' };
    if (index > currentIndex) return { width: '0%' };
    return { width: `${progress.value * 100}%` };
  });

  return (
    <View style={{ flex: 1, height: 3, backgroundColor: '#E5E9EA', borderRadius: 2, overflow: 'hidden' }}>
      <Animated.View style={[{ backgroundColor: '#113E55', height: '100%' }, style]} />
    </View>
  );
};

export default function DataInsightModal({ visible, onClose }: DataInsightModalProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const progress = useSharedValue(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (visible) {
      setCurrentPage(0);
      progress.value = 0;
      setIsPaused(false);
      startAnimation();
    } else {
      progress.value = 0;
      cancelAnimation(progress);
    }
  }, [visible]);

  useEffect(() => {
    if (visible) {
      if (isPaused) {
        cancelAnimation(progress);
      } else {
        startAnimation();
      }
    }
  }, [isPaused, currentPage, visible]);

  const startAnimation = () => {
    const currentProgress = progress.value >= 1 ? 0 : progress.value;
    progress.value = currentProgress;
    const remainingDuration = DURATION * (1 - currentProgress);
    
    progress.value = withTiming(1, { duration: remainingDuration, easing: Easing.linear }, (finished) => {
      if (finished) {
        runOnJS(goToNextPage)();
      }
    });
  };

  const goToNextPage = () => {
    cancelAnimation(progress);
    progress.value = 0;
    if (currentPage < PAGES.length - 1) {
      setCurrentPage((prev) => prev + 1);
    } else {
      onClose();
    }
  };

  const goToPrevPage = () => {
    cancelAnimation(progress);
    progress.value = 0;
    if (currentPage > 0) {
      setCurrentPage((prev) => prev - 1);
    } else {
      startAnimation();
    }
  };

  if (!visible) return null;

  const renderPage = (index: number) => {
    const page = PAGES[index];
    const SvgImage = page.Svg;
    const imageAspect = 250 / 375;

    return (
      <View style={{ flex: 1, paddingHorizontal: 24, paddingBottom: 24, justifyContent: 'center' }}>
        {page.title && (
          <Text style={{ 
            fontFamily: 'UbuntuSans-Bold', 
            fontSize: 34.18, 
            color: '#113E55', 
            textAlign: 'center', 
            marginBottom: 32, 
            lineHeight: 34.18,
            letterSpacing: 0,
          }}>
            {page.title}
          </Text>
        )}

        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
          <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: '#DFEBF1', alignItems: 'center', justifyContent: 'center', marginRight: 12 }}>
            <Text style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 14, color: '#113E55' }}>{page.step}</Text>
          </View>
          <Text style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#113E55' }}>{page.subtitle}</Text>
        </View>

        {page.layout === 'sandwich' && (
          <View>
            <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 15, color: '#4A6B7C', lineHeight: 22, marginBottom: 16 }}>{page.text1}</Text>
            <View style={{ width: '100%', alignItems: 'center', marginVertical: 16 }}>
              <SvgImage width={width - 48} height={(width - 48) * imageAspect} />
            </View>
            <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 15, color: '#4A6B7C', lineHeight: 22 }}>{page.text2}</Text>
          </View>
        )}

        {page.layout === 'topText' && (
          <View>
            <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 15, color: '#4A6B7C', lineHeight: 22, marginBottom: 24 }}>{page.text1}</Text>
            <View style={{ width: width, marginLeft: -24, alignItems: 'center' }}>
              <SvgImage width={width} height={width * imageAspect} />
            </View>
          </View>
        )}

        {page.layout === 'bottomText' && (
          <View>
            <View style={{ width: width, marginLeft: -24, alignItems: 'center', marginBottom: 24, marginTop: 16 }}>
              <SvgImage width={width} height={width * imageAspect} />
            </View>
            <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 15, color: '#4A6B7C', lineHeight: 22 }}>{page.text1}</Text>
          </View>
        )}

        {page.layout === 'topTextCards' && (
          <View style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
            <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 15, color: '#4A6B7C', lineHeight: 22, marginBottom: 16 }}>{page.text1}</Text>
            <View style={{ width: width, marginLeft: -24, alignItems: 'center', marginBottom: 16 }}>
              <SvgImage width={width} height={width * imageAspect} />
            </View>
            <Text style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 18, color: '#113E55', marginBottom: 12 }}>What data does it need?</Text>
            {[1, 2].map((item, i) => (
              <View key={i} style={{ backgroundColor: '#F9FAFA', borderRadius: 12, padding: 12, flexDirection: 'row', gap: 12, marginBottom: 8, borderWidth: 1, borderColor: '#EFF1F3' }}>
                <MaterialIcons name="help" size={16} color="#113E55" style={{ marginTop: 2 }} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontFamily: 'Inter_18pt-Medium', fontSize: 13, color: '#4A6B7C', marginBottom: 4 }}>Financial Info</Text>
                  <Text style={{ fontFamily: 'Inter_18pt-Regular', fontSize: 11, color: '#8A9A9D', lineHeight: 14 }}>
                    No complicated reports. Get simple insights that help you understand what's happening and why.
                  </Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <SafeAreaView style={{ flex: 1, backgroundColor: '#FFFFFF' }}>
        <View style={{ flexDirection: 'row', paddingHorizontal: 16, gap: 4, marginTop: 10, marginBottom: 10 }}>
          {PAGES.map((_, i) => (
            <ProgressBar key={i} index={i} currentIndex={currentPage} progress={progress} />
          ))}
        </View>

        <View style={{ flex: 1, marginTop: 8 }}>
          {renderPage(currentPage)}

          <View style={[StyleSheet.absoluteFill, { flexDirection: 'row' }]} pointerEvents="box-none">
            <Pressable 
              style={{ flex: 0.3 }} 
              onPress={goToPrevPage} 
              onPressIn={() => setIsPaused(true)} 
              onPressOut={() => setIsPaused(false)} 
            />
            <Pressable 
              style={{ flex: 0.7 }} 
              onPress={goToNextPage} 
              onPressIn={() => setIsPaused(true)} 
              onPressOut={() => setIsPaused(false)} 
            />
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
}
