import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
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
import Back from '@/src/components/mobile/Back';
import ActionConfirmModal from '@/src/components/mobile/ActionConfirmModal';
import { useFeatureGate } from '@/src/hooks/usePlan';
import { incidentManagementApi } from '@/src/lib/api/incidentManagement';
import { parseIncidentReportReturnTo } from '@/src/lib/incidentReportNavigation';
import { useUserStore } from '@/src/lib/stores/userStore';

function parseCategories(value: string | string[] | undefined): string[] {
  if (typeof value !== 'string') return [];
  try {
    const parsed: unknown = JSON.parse(value);
    return Array.isArray(parsed)
      ? parsed.filter((item): item is string => typeof item === 'string' && Boolean(item.trim()))
      : [];
  } catch {
    return [];
  }
}

export default function IncidentReportCreateScreen() {
  const router = useRouter();
  const { categories: categoryParam, returnTo: returnToParam } = useLocalSearchParams<{
    categories?: string;
    returnTo?: string;
  }>();
  const returnTo = parseIncidentReportReturnTo(returnToParam);
  const categories = useMemo(() => parseCategories(categoryParam), [categoryParam]);
  const role = useUserStore((state) => state.role);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [title, setTitle] = useState('');
  const [narrative, setNarrative] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [error, setError] = useState('');
  const hasDraft = Boolean(title.trim() || narrative.trim());

  useFocusEffect(
    useCallback(() => {
      let active = true;
      if (
        role !== 'resident' &&
        role !== 'security' &&
        role !== 'admin' &&
        role !== 'primary_admin'
      ) {
        router.replace('/user/report');
        return () => {
          active = false;
        };
      }
      void (async () => {
        const allowed = await requestAccessWhenReady(() => active);
        if (!active) return;
        if (allowed) setCheckingAccess(false);
        else router.replace('/user');
      })();
      return () => {
        active = false;
      };
    }, [requestAccessWhenReady, role, router])
  );

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS !== 'android') return;
      const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
        if (submitting) return true;
        if (!hasDraft) {
          router.replace({ pathname: '/user/report/category', params: { returnTo } });
          return true;
        }
        setConfirmDiscard(true);
        return true;
      });
      return () => subscription.remove();
    }, [hasDraft, returnTo, router, submitting])
  );

  const requestExit = () => {
    if (submitting) return;
    if (hasDraft) {
      setConfirmDiscard(true);
      return;
    }
    router.replace({ pathname: '/user/report/category', params: { returnTo } });
  };

  const requestSubmit = () => {
    if (submitting || checkingAccess) return;
    if (categories.length === 0 || !title.trim() || !narrative.trim()) {
      setError('Enter a title and details before submitting your report.');
      return;
    }
    setError('');
    setConfirmSubmit(true);
  };

  const submit = async () => {
    if (submitting || checkingAccess || !confirmSubmit) return;
    setSubmitting(true);
    setError('');
    try {
      await incidentManagementApi.create({
        title: title.trim(),
        category: [],
        custom_category: categories.join(', '),
        narrative: narrative.trim(),
        occurred_at: new Date().toISOString(),
      });
      setConfirmSubmit(false);
      router.replace('/user');
    } catch {
      setConfirmSubmit(false);
      setError('Unable to submit your report. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: !hasDraft }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: Math.max(16, 88 - insets.top),
            paddingBottom: Math.max(32, height * (126 / 847) - insets.bottom),
          }}
        >
          <View className="px-5">
            <Back
              type="short-arrow"
              showText={false}
              showBorder
              borderSize={30}
              leftOffset={-3}
              onPress={requestExit}
            />
            <Text className="-ml-[3px] mt-[22px] font-ubuntu-medium text-[27.34px] leading-[33px] text-[#113E55]">
              Incident Report
            </Text>
            <Text className="ml-[1px] mt-[22px] font-inter-medium text-[8.96px] leading-[11px] text-[#878686]">
              Describe your issue
            </Text>
            <TextInput
              value={title}
              onChangeText={(value) => {
                setTitle(value);
                setError('');
              }}
              placeholder="Give a short title of the incident"
              placeholderTextColor="#878686"
              accessibilityLabel="Incident title"
              maxLength={160}
              className="ml-[1px] mt-[8px] h-12 rounded-[16px] bg-[#EFF1F1] px-4 font-inter-light text-[14px] text-[#0A1F29]"
            />
            <TextInput
              value={narrative}
              onChangeText={(value) => {
                setNarrative(value);
                setError('');
              }}
              placeholder="Give more details about the incident"
              placeholderTextColor="#878686"
              accessibilityLabel="Incident details"
              multiline
              textAlignVertical="top"
              className="ml-[1px] mt-[16px] h-[289px] rounded-[16px] bg-[#EFF1F1] p-4 font-inter-light text-[14px] leading-[17px] text-[#0A1F29]"
            />
            {error ? (
              <Text className="mt-3 font-inter-regular text-[13px] text-[#B42318]">{error}</Text>
            ) : null}
          </View>

          <View className="flex-1" />
          <TouchableOpacity
            onPress={requestSubmit}
            disabled={submitting || checkingAccess}
            accessibilityRole="button"
            className="mx-auto h-[44px] w-[278px] max-w-[80%] items-center justify-center rounded-[24px] bg-[#113E55]"
          >
            {submitting ? (
              <ActivityIndicator color="#F6F7F7" size="small" />
            ) : (
              <Text className="font-ubuntu-semibold text-[14px] leading-[18px] tracking-[-0.24px] text-[#F6F7F7]">
                Submit
              </Text>
            )}
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      <ActionConfirmModal
        visible={confirmSubmit}
        title="Submit Incident Report?"
        message="Send this incident report to your estate administrators?"
        confirmLabel="Submit Report"
        busy={submitting}
        onConfirm={() => void submit()}
        onCancel={() => setConfirmSubmit(false)}
      />
      <ActionConfirmModal
        visible={confirmDiscard}
        title="Discard Report?"
        message="Leave this screen? Your unsent report details will be lost."
        confirmLabel="Discard"
        onConfirm={() => {
          setConfirmDiscard(false);
          router.replace({ pathname: '/user/report/category', params: { returnTo } });
        }}
        onCancel={() => setConfirmDiscard(false)}
      />
    </SafeAreaView>
  );
}
