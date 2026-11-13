import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Keyboard,
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
import { useFeatureGate } from '@/src/features/billing/hooks/usePlan';
import {
  leaveIncidentReport,
  parseIncidentReportReturnTo,
} from '@/src/features/ai/utils/incidentReportNavigation';
import { toggleIncidentType } from '@/src/features/ai/utils/incidentTypeSelection';
import SecurityTabBar from '@/src/features/scanner/components/SecurityTabBar';
import { useUserStore } from '@/src/store/userStore';
import { formatApiCategoryLabel } from '@/src/features/ai/components/incidents/categoryIcons';
import {
  type IncidentReportDraft,
  clearIncidentReportDraft,
  loadIncidentReportDraft,
  saveIncidentReportDraft,
} from '@/src/features/ai/utils/incidentReportDraft';
import {
  INCIDENT_CATEGORY_PLACEHOLDER,
  useIncidentCategories,
} from '@/src/features/ai/hooks/incidents';

export default function IncidentReportCategoryScreen() {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const otherFocused = useRef(false);
  const { returnTo: returnToParam } = useLocalSearchParams<{ returnTo?: string }>();
  const returnTo = parseIncidentReportReturnTo(returnToParam);
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const { requestAccessWhenReady } = useFeatureGate('incident_report', { notice: 'floating' });
  const [selected, setSelected] = useState<string[]>([]);
  const [other, setOther] = useState('');
  const [checkingAccess, setCheckingAccess] = useState(true);
  const [error, setError] = useState('');
  const [draftLoaded, setDraftLoaded] = useState(false);
  const [deletingDraft, setDeletingDraft] = useState(false);
  const [storedDraft, setStoredDraft] = useState<IncidentReportDraft | null>(null);
  const userId = useUserStore((state) => state.user_id);
  const isSecurity = useUserStore((state) => state.role === 'security');
  const { data: categoryIds = [] } = useIncidentCategories();
  const incidentTypes = useMemo(
    () => (categoryIds.length > 0 ? categoryIds : INCIDENT_CATEGORY_PLACEHOLDER),
    [categoryIds]
  );
  const hasStoredDraft = Boolean(storedDraft);

  useEffect(() => {
    const subscription = Keyboard.addListener('keyboardDidShow', () => {
      if (otherFocused.current) scrollViewRef.current?.scrollToEnd({ animated: true });
    });
    return () => subscription.remove();
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setDraftLoaded(false);
      void loadIncidentReportDraft(userId)
        .then((draft) => {
          if (!active) return;
          setStoredDraft(draft);
          setSelected(draft?.customCategory ? ['other'] : (draft?.categories ?? []));
          setOther(draft?.customCategory ?? '');
        })
        .catch(() => undefined)
        .finally(() => {
          if (active) setDraftLoaded(true);
        });
      return () => {
        active = false;
      };
    }, [userId])
  );

  useEffect(() => {
    if (!draftLoaded || !userId) return;
    if (!storedDraft) return;
    const timer = setTimeout(() => {
      void saveIncidentReportDraft(userId, {
        categories: selected.includes('other') ? [] : selected,
        customCategory: selected.includes('other') ? other.trim() : '',
        title: storedDraft?.title ?? '',
        narrative: storedDraft?.narrative ?? '',
      }).catch(() => setError('Unable to save your draft. Please try again.'));
    }, 300);
    return () => clearTimeout(timer);
  }, [draftLoaded, other, selected, storedDraft, userId]);

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
        else leaveIncidentReport(returnTo, router);
      })();
      return () => {
        active = false;
      };
    }, [requestAccessWhenReady, returnTo, router])
  );

  const toggle = (label: string) => {
    setError('');
    if (label !== 'other') setOther('');
    setSelected((current) => toggleIncidentType(current, label));
  };

  const continueToDetails = async () => {
    if (!userId) {
      setError('Unable to save your draft. Please sign in again.');
      return;
    }
    if (selected.length === 0) {
      setError('Select at least one incident type.');
      return;
    }
    if (selected.includes('other') && !other.trim()) {
      setError('Describe the other incident type.');
      return;
    }
    if (storedDraft) {
      try {
        await saveIncidentReportDraft(userId, {
          categories: selected.includes('other') ? [] : selected,
          customCategory: selected.includes('other') ? other.trim() : '',
          title: storedDraft.title,
          narrative: storedDraft.narrative,
        });
      } catch {
        setError('Unable to save your draft. Please try again.');
        return;
      }
    }
    router.push({
      pathname: '/(protected)/user/report/create',
      params: {
        categories: JSON.stringify(selected.includes('other') ? [] : selected),
        customCategory: selected.includes('other') ? other.trim() : '',
        returnTo,
      },
    });
  };

  const deleteDraft = async () => {
    if (!userId || deletingDraft) return;
    setDraftLoaded(false);
    setDeletingDraft(true);
    try {
      await clearIncidentReportDraft(userId);
      setStoredDraft(null);
      setSelected([]);
      setOther('');
      setError('');
    } catch {
      setError('Unable to delete your draft. Please try again.');
    } finally {
      setDeletingDraft(false);
      setDraftLoaded(true);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F6F7F7]" edges={['top', 'bottom']}>
      <Stack.Screen options={{ headerShown: false, gestureEnabled: false }} />
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollViewRef}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{
            flexGrow: 1,
            paddingTop: 19,
            paddingBottom: Math.max(isSecurity ? 96 : 32, height * (157 / 921) - insets.bottom),
          }}
        >
          <View className="pl-[21px] pr-[30px]">
            <Text className="ml-[5px] mt-[16px] font-ubuntu-medium text-heading leading-[33px] text-primary">
              Incident Report
            </Text>
            <Text className="ml-[7px] mt-[8px] font-inter-light text-[14px] leading-[17px] text-[#878686]">
              Report security related incidents that happened within your Estate. Please confirm
              incident type
            </Text>
            {hasStoredDraft ? (
              <View className="ml-[7px] mt-3 flex-row items-center justify-between">
                <Text className="mr-3 flex-shrink font-inter-medium text-[12px] text-primary">
                  Draft saved on this device
                </Text>
                <Text
                  accessibilityRole="link"
                  onPress={() => void deleteDraft()}
                  className="font-inter-medium text-[12px] text-primary underline"
                >
                  Delete draft
                </Text>
              </View>
            ) : null}
            <View className={hasStoredDraft ? 'mt-[16px] gap-[12px]' : 'mt-[40px] gap-[16px]'}>
              {incidentTypes.map((categoryId) => {
                const checked = selected.includes(categoryId);
                return (
                  <TouchableOpacity
                    key={categoryId}
                    onPress={() => toggle(categoryId)}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked }}
                    className="h-6 flex-row items-center"
                  >
                    <View
                      className={`h-[16px] w-[16px] items-center justify-center rounded-[2px] border-[1.5px] border-primary ${checked ? 'bg-primary' : ''}`}
                    >
                      {checked && <Feather name="check" size={12} color="#F6F7F7" />}
                    </View>
                    <Text className="ml-[22px] font-ubuntu-regular text-[15px] leading-[18px] text-[#0A1F29]">
                      {formatApiCategoryLabel(categoryId)}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <TextInput
            value={other}
            onFocus={() => {
              otherFocused.current = true;
            }}
            onBlur={() => {
              otherFocused.current = false;
            }}
            onChangeText={(value) => {
              setOther(value);
              setError('');
              if (value.trim()) setSelected(['other']);
            }}
            placeholder={selected.includes('other') ? 'Describe the incident type' : ''}
            placeholderTextColor="#878686"
            accessibilityLabel="Other incident type"
            className="mx-[21px] mt-3 h-[43px] rounded-[8px] bg-[#EFF1F1] px-4 font-inter-regular text-[14px] text-[#0A1F29]"
          />

          {error ? (
            <Text className="mx-[26px] mt-3 font-inter-regular text-[13px] text-[#B42318]">
              {error}
            </Text>
          ) : null}
          <View className="flex-1" />
          <TouchableOpacity
            onPress={() => void continueToDetails()}
            disabled={checkingAccess || !draftLoaded || deletingDraft}
            accessibilityRole="button"
            className="mx-auto mt-5 h-[44px] w-[278px] max-w-[80%] items-center justify-center rounded-[24px] bg-primary"
          >
            <Text className="font-ubuntu-semibold text-[14px] leading-[18px] tracking-[-0.24px] text-[#F6F7F7]">
              {hasStoredDraft ? 'Continue Draft' : 'Continue'}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
      {isSecurity ? <SecurityTabBar activeTab="report" /> : null}
    </SafeAreaView>
  );
}
