import { Modal, Pressable, StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import InvalidCodeClose from '@/src/assets/icons/invalid-code-close.svg';
import { Inter } from '@/src/constants/fonts';
import type { ScanWarningSeverity } from '@/src/lib/securityScanWarning';

export default function AnomalousScanOverlay({
  severity,
  onAcknowledge,
}: {
  severity: ScanWarningSeverity;
  onAcknowledge: () => void;
}) {
  const isHigh = severity === 'high';
  const { width, height } = useWindowDimensions();

  return (
    <Modal
      visible
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onAcknowledge}
    >
      <Pressable
        accessibilityLabel="Close anomalous scan warning"
        onPress={onAcknowledge}
        style={styles.anomalyBackdrop}
      >
        <View style={[styles.anomalyCard, { width: Math.min(337, width - 42) }]}>
          <View style={styles.anomalyMessageGroup}>
            <View style={styles.anomalyHeadingGroup}>
              {isHigh ? (
                <Svg width={40} height={40} viewBox="0 0 1024 1024">
                  <Path
                    fill="#E30404"
                    d="M955.7 856l-416-720c-6.2-10.7-16.9-16-27.7-16s-21.6 5.3-27.7 16l-416 720C56 877.4 71.4 904 96 904h832c24.6 0 40-26.6 27.7-48zm-783.5-27.9L512 239.9l339.8 588.2H172.2z"
                  />
                  <Path
                    fill="#EE988A"
                    fillOpacity={0.15}
                    d="M172.2 828.1h679.6L512 239.9 172.2 828.1zM560 720a48.01 48.01 0 0 1-96 0 48.01 48.01 0 0 1 96 0zm-16-304v184c0 4.4-3.6 8-8 8h-48c-4.4 0-8-3.6-8-8V416c0-4.4 3.6-8 8-8h48c4.4 0 8 3.6 8 8z"
                  />
                  <Path
                    fill="#E30404"
                    d="M464 720a48 48 0 1 0 96 0 48 48 0 1 0-96 0zm16-304v184c0 4.4 3.6 8 8 8h48c4.4 0 8-3.6 8-8V416c0-4.4-3.6-8-8-8h-48c-4.4 0-8 3.6-8 8z"
                  />
                </Svg>
              ) : (
                <Svg width={40} height={40} viewBox="0 0 256 256" fill="#B17000">
                  <Path d="M224,128a96,96,0,1,1-96-96A96,96,0,0,1,224,128Z" opacity={0.2} />
                  <Path d="M128,24A104,104,0,1,0,232,128,104.11,104.11,0,0,0,128,24Zm0,192a88,88,0,1,1,88-88A88.1,88.1,0,0,1,128,216Zm-8-80V80a8,8,0,0,1,16,0v56a8,8,0,0,1-16,0Zm20,36a12,12,0,1,1-12-12A12,12,0,0,1,140,172Z" />
                </Svg>
              )}
              <Text allowFontScaling={false} style={styles.anomalyTitle}>
                Warning !
              </Text>
            </View>
            <Text allowFontScaling={false} style={styles.anomalyMessage}>
              {`Possible Anomalous Scan with ${isHigh ? 'High' : 'Medium'} Severity detected. This event has been flagged.`}
            </Text>
          </View>
          <View style={styles.anomalyButton}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Acknowledge anomalous scan"
              onPress={onAcknowledge}
              style={styles.anomalyButtonTouchable}
            >
              <Text allowFontScaling={false} style={styles.anomalyButtonText}>
                Got it !
              </Text>
            </Pressable>
          </View>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close anomalous scan warning"
          onPress={onAcknowledge}
          style={[styles.anomalyCloseButton, { top: Math.min(height / 2 + 248, height - 52) }]}
        >
          <InvalidCodeClose width={32} height={32} />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  anomalyBackdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.58)',
    flex: 1,
    justifyContent: 'center',
  },
  anomalyCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#CEE5ED',
    borderRadius: 24,
    borderWidth: 0.5,
    height: 305,
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 40,
    transform: [{ translateY: -42 }],
  },
  anomalyMessageGroup: {
    alignItems: 'center',
    gap: 16,
    width: '100%',
  },
  anomalyHeadingGroup: {
    alignItems: 'center',
    gap: 8,
  },
  anomalyTitle: {
    color: '#0A1F29',
    fontFamily: 'UbuntuSans-Medium',
    fontSize: 27.34,
    lineHeight: 33,
    textAlign: 'center',
  },
  anomalyMessage: {
    color: '#878686',
    fontFamily: Inter.light,
    fontSize: 14,
    lineHeight: 16.5,
    maxWidth: 237,
    textAlign: 'center',
  },
  anomalyButton: {
    alignItems: 'center',
    backgroundColor: '#113E55',
    borderColor: '#113E55',
    borderRadius: 24,
    borderWidth: 1,
    height: 44,
    justifyContent: 'center',
    maxWidth: 278,
    width: '100%',
  },
  anomalyButtonTouchable: {
    alignItems: 'center',
    height: '100%',
    justifyContent: 'center',
    width: '100%',
  },
  anomalyButtonText: {
    color: '#F6F7F7',
    fontFamily: 'UbuntuSans-SemiBold',
    fontSize: 14,
    letterSpacing: -0.24,
  },
  anomalyCloseButton: {
    alignItems: 'center',
    height: 32,
    justifyContent: 'center',
    position: 'absolute',
    width: 32,
  },
});
