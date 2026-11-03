import { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { HistoryIcon, HomeTabIcon } from '@/src/assets/svgs';
import { useFeatureGate } from '@/src/hooks/usePlan';

type SecurityTab = 'home' | 'report' | 'history';

function ReportIcon({ active }: { active: boolean }) {
  const color = active ? '#113E55' : '#6F91A0';
  return (
    <Svg width={20} height={20} viewBox="0 0 48 48" fill="none">
      <Path
        d="M36 35H12V21c0-6.627 5.373-12 12-12s12 5.373 12 12z"
        stroke={color}
        strokeWidth={4}
        strokeLinejoin="round"
      />
      <Path
        d="M8 42h32M4 13l3 1m6-10l1 3m-4 3L7 7"
        stroke={color}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function SecurityTabBar({ activeTab }: { activeTab: SecurityTab }) {
  const router = useRouter();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const openingReport = useRef(false);
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });

  const openReport = async () => {
    if (activeTab === 'report' || openingReport.current) return;
    openingReport.current = true;
    try {
      const allowed = await requestAccessWhenReady(() => navigation.isFocused());
      if (!allowed || !navigation.isFocused()) return;
      const returnTo = activeTab === 'history' ? '/security/history' : '/security';
      router.push({ pathname: '/user/report', params: { returnTo } });
    } finally {
      openingReport.current = false;
    }
  };

  return (
    <View
      style={[styles.bar, { bottom: Math.max(insets.bottom, Platform.OS === 'ios' ? 0 : 16) + 7 }]}
    >
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Home"
        accessibilityState={{ selected: activeTab === 'home' }}
        onPress={() => activeTab !== 'home' && router.replace('/security')}
        style={styles.home}
      >
        <HomeTabIcon
          width={20}
          height={20}
          color={activeTab === 'home' ? '#113E55' : '#6F91A0'}
          focused={activeTab === 'home'}
        />
        <Text
          allowFontScaling={false}
          style={[styles.label, activeTab === 'home' && styles.activeLabel]}
        >
          Home
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Report"
        accessibilityState={{ selected: activeTab === 'report' }}
        onPress={() => void openReport()}
        style={styles.report}
      >
        <ReportIcon active={activeTab === 'report'} />
        <Text
          allowFontScaling={false}
          style={[styles.label, activeTab === 'report' && styles.activeLabel]}
        >
          Report
        </Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="History"
        accessibilityState={{ selected: activeTab === 'history' }}
        onPress={() => activeTab !== 'history' && router.replace('/security/history')}
        style={styles.history}
      >
        <HistoryIcon
          width={18}
          height={18}
          color={activeTab === 'history' ? '#113E55' : '#6F91A0'}
        />
        <Text
          allowFontScaling={false}
          style={[styles.label, styles.historyLabel, activeTab === 'history' && styles.activeLabel]}
        >
          History
        </Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    alignSelf: 'center',
    backgroundColor: '#CEE5ED',
    borderColor: '#CEE5ED',
    borderRadius: 24,
    borderWidth: 0.5,
    height: 49,
    position: 'absolute',
    width: 227,
  },
  home: { alignItems: 'center', left: 27, position: 'absolute', top: 7, width: 32 },
  report: { alignItems: 'center', left: 99, position: 'absolute', top: 8, width: 29 },
  history: { alignItems: 'center', left: 168, position: 'absolute', top: 9, width: 30 },
  label: {
    color: '#6F91A0',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 9,
    lineHeight: 11,
    marginTop: 4,
    textAlign: 'center',
  },
  activeLabel: { color: '#113E55', fontFamily: 'UbuntuSans-Medium' },
  historyLabel: { marginTop: 2.67 },
});
