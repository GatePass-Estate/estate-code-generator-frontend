import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  BackHandler,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { Stack, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import Back from '@/src/components/mobile/Back';
import { useFeatureGate } from '@/src/hooks/usePlan';
import {
  leaveIncidentReport,
  parseIncidentReportReturnTo,
} from '@/src/lib/incidentReportNavigation';
import { toggleIncidentType } from '@/src/lib/incidentTypeSelection';

const INCIDENT_TYPES = [
  'Break In and Theft',
  'Vandalism',
  'Environmental Hazards',
  'Unsecured Entry Points',
  'Violence',
  'Other',
] as const;

export default function IncidentReportCategoryScreen() {
  const router = useRouter();
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = parseIncidentReportReturnTo(returnToParam);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState('');

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        leaveIncidentReport(returnTo, router);
        return true;
      });
      return () => subscription.remove();
    }, [returnTo, router])
  );

  useFocusEffect(
    useCallback(() => {
      let active = true;
      void (async () => {
        const allowed = await requestAccessWhenReady(() => active);
        if (!active) return;
        if (allowed) setCheckingAccess(false);
        else router.replace('/user');
      })();
      return () => {
        active = false;
      };
    }, [requestAccessWhenReady, router])
  );

  const toggle = (label: string) => {
    setError('');
    if (label !== 'Other') setOther('');
    setSelected((current) => toggleIncidentType(current, label));
  };

  const continueToDetails = () => {
    if (selected.length === 0) {
      setError('Select at least one incident type.');
      return;
    }
    if (selected.includes('Other') && !other.trim()) {
      setError('Describe the other incident type.');
      return;
    }
    const categories = selected.map((label) => (label === 'Other' ? other.trim() : label));
    router.push({
      pathname: '/(protected)/user/report/create',
      params: { categories: JSON.stringify(categories), returnTo },
    });
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: Math.max(24, 88 - insets.top),
            paddingBottom: Math.max(32, height * (157 / 921) - insets.bottom),
          }}
        >
          <View className="px-[26px]">
            <Back
              type="short-arrow"
              showText={false}
              showBorder
              borderSize={30}
              leftOffset={-9}
              onPress={() => leaveIncidentReport(returnTo, router)}
            />
            <Text className="mt-[23px] font-ubuntu-medium text-[27.34px] leading-[33px] text-[#113E55]">
              Incident Report
            </Text>
            <Text className="ml-[2px] mt-[8px] max-w-[317px] font-inter-light text-[14px] leading-[17px] text-[#878686]">
              Report security related incidents that happened within your Estate. Please confirm
              incident type
            </Text>
            <View className="mt-[40px] gap-[16px]">
              {INCIDENT_TYPES.map((label) => {
                const checked = selected.includes(label);
                return (
                  <TouchableOpacity
                    key={label}
                    onPress={() => toggle(label)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    className="h-6 flex-row items-center"
                  >
                    <View
                      className={`h-[16px] w-[16px] items-center justify-center rounded-[2px] border-[1.5px] border-[#113E55] ${checked ? 'bg-[#113E55]' : ''}`}
                    >
                      {checked && <Feather name="check" size={12} color="#F6F7F7" />}
                    </View>
                    <Text className="ml-[22px] font-ubuntu-regular text-[15px] leading-[18px] text-[#0A1F29]">
                      {label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TextInput
            value={other}
            onChangeText={(value) => {
              setOther(value);
              setError('');
              if (value.trim()) setSelected(['Other']);
            }}
            placeholder={selected.includes('Other') ? 'Describe the incident type' : ''}
            placeholderTextColor="#878686"
            accessibilityLabel="Other incident type"
            className="mx-[21px] h-[43px] rounded-[8px] bg-[#EFF1F1] px-4 font-inter-regular text-[14px] text-[#0A1F29]"
          />

          {error ? (
            <Text className="mx-[26px] mt-3 font-inter-regular text-[13px] text-[#B42318]">
              {error}
            </Text>
          ) : null}
          <View className="flex-1" />
          <TouchableOpacity
            onPress={continueToDetails}
            disabled={checkingAccess}
            accessibilityRole="button"
            className="mx-auto h-[44px] w-[278px] max-w-[80%] items-center justify-center rounded-[24px] bg-[#113E55]"
          >
            <Text className="font-ubuntu-semibold text-[14px] leading-[18px] tracking-[-0.24px] text-[#F6F7F7]">
              Continue
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
