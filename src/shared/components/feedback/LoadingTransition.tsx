import { useEffect, useRef } from 'react';
import { Animated, Easing, Image, Platform, Text, useWindowDimensions, View } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import mark from '@/src/assets/images/gatepass-mark-white.png';
import wordmark from '@/src/assets/images/gatepass-wordmark-white.png';

/** Frame 5010:8218 is 812pt tall; the wordmark starts at y = 607. */
const WORDMARK_TOP_RATIO = 607 / 812;

/** Navy launch screen shown before the institution search opens. */
const LoadingTransition = () => {
  const { height } = useWindowDimensions();
  const scale = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(scale, {
          toValue: 1.08,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(scale, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [scale]);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Loading - GatePass';
  }, []);

  return (
    <View className="flex-1" style={{ backgroundColor: '#113E55' }}>
      <StatusBar style="light" />
      <Animated.Image
        source={mark}
        resizeMode="contain"
        style={{
          position: 'absolute',
          width: 170,
          height: 170,
          top: '50%',
          marginTop: -85,
          alignSelf: 'center',
          transform: [{ scale }],
        }}
      />
      <View
        className="absolute left-0 right-0 items-center"
        style={{ top: height * WORDMARK_TOP_RATIO }}
      >
        <Image source={wordmark} resizeMode="contain" style={{ width: 154, height: 42 }} />
        <Text className="font-inter-light text-sm text-white">For Smart Access Management</Text>
      </View>
    </View>
  );
};

export default LoadingTransition;
