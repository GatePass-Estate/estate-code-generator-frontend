import { useRef } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { useNavigation, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { HistoryIcon, HomeTabIcon } from '@/src/assets/svgs';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { useVerificationGate } from '@/src/hooks/useAccountVerification';

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
  const { requireVerifiedWhenReady } = useVerificationGate();

  const openReport = async () => {
    if (activeTab === 'report' || openingReport.current) return;
    if (!(await requireVerifiedWhenReady())) return;
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
        onPress={() => activeTab !== 'home' && router.dismissTo('/security')}
        style={styles.home}
      >
        <View style={styles.iconContainer}>
          <HomeTabIcon
            width={20}
            height={20}
            color={activeTab === 'home' ? '#113E55' : '#6F91A0'}
            focused={activeTab === 'home'}
          />
        </View>
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
        <View style={styles.iconContainer}>
          <ReportIcon active={activeTab === 'report'} />
        </View>
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
        onPress={() => {
          if (activeTab === 'history') return;
          void requireVerifiedWhenReady().then((verified) => {
            if (!verified) return;
            router.replace('/security/history');
          });
        }}
        style={styles.history}
      >
        <View style={styles.iconContainer}>
          <HistoryIcon
            width={18}
            height={18}
            color={activeTab === 'history' ? '#113E55' : '#6F91A0'}
          />
        </View>
        <Text
          allowFontScaling={false}
          style={[styles.label, activeTab === 'history' && styles.activeLabel]}
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
    flexDirection: 'row',
    height: 60,
    position: 'absolute',
    width: 240,
  },
  home: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  report: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  history: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  iconContainer: { alignItems: 'center', height: 20, justifyContent: 'center' },
  label: {
    color: '#6F91A0',
    fontFamily: 'UbuntuSans-Regular',
    fontSize: 11,
    lineHeight: 14,
    marginTop: 4,
    textAlign: 'center',
  },
  activeLabel: { color: '#113E55', fontFamily: 'UbuntuSans-Medium' },
});
