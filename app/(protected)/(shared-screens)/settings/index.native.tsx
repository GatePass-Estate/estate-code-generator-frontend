import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Image,
  Modal,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useState, ReactNode } from 'react';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useUserStore } from '@/src/lib/stores/userStore';
import { deleteAccount } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import StarRating from '@/src/components/common/StarRating';
import {
  RateUsIcon,
  SendFeedbackIcon,
  RateStarshipIcon,
} from '@/src/components/common/FeedbackIcons';
import * as StoreReview from 'expo-store-review';
import Constants, { ExecutionEnvironment } from 'expo-constants';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import {
  AccountSecurityIcon,
  DeleteAccountIcon,
  IncidentReportIcon,
  LinkedDevicesIcon,
  LogOutIcon,
  MyProfileIcon,
  NavigateNextIcon,
  PrivacyPolicyIcon,
  RatingsFeedbackIcon,
  TermsOfServiceIcon,
} from '@/src/assets/svgs';

function SectionTitle({ children, first = false }: { children: string; first?: boolean }) {
  return (
    <Text className={`text-[10px] font-inter-medium uppercase tracking-wider text-[#113E55] mb-2 ${first ? '' : 'mt-[32px]'}`}>
      {children}
    </Text>
  );
}

function SettingsRow({
  icon,
  label,
  onPress,
  showNavigateNext = true,
}: {
  icon: ReactNode;
  label: string;
  onPress: () => void;
  showNavigateNext?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-[8px] border-[0.5px] border-[#CEE5ED] bg-white px-4 py-[18px] mb-2"
    >
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-sm font-inter-light text-primary">{label}</Text>
      </View>
      {showNavigateNext ? <NavigateNextIcon /> : null}
    </Pressable>
  );
}

function AdminAccessButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between rounded-[8px] bg-[#113E55] px-4 py-[18px] mb-6"
    >
      <Text className="text-[13px] font-inter-regular text-[#EFF1F1]">Do More as an Admin</Text>
      <NavigateNextIcon color="#FFFFFF" width={20} height={20} />
    </Pressable>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const user_id = useUserStore((s) => s.user_id);
  const role = useUserStore((s) => s.role);
  const [deleting, setDeleting] = useState(false);

  const [feedbackPopupStep, setFeedbackPopupStep] = useState<'NONE' | 'SELECT' | 'RATE_US'>('NONE');
  const [starRating, setStarRating] = useState(0);

  const isAdmin = role === 'admin' || role === 'primary_admin';

  const confirmDelete = () => {
    Alert.alert(
      'Delete account',
      'This will permanently remove your account and sign you out. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!user_id) return;
            setDeleting(true);
            try {
              await deleteAccount();
              await signOut();
            } catch (e: any) {
              Alert.alert('Could not delete account', e?.message ?? 'Please try again later.');
            } finally {
              setDeleting(false);
            }
          },
        },
      ]
    );
  };

  const iconColor = '#113E55';

  return (
    <SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />
      
      <Pressable
        onPress={() => router.back()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader
        containerClassName="mt-6 mb-6"
        titleClassName="text-[21px] font-ubuntu-semibold text-[#113E55]"
        title="More"
        subtitle="Adjust Gatepass to your preference, manage account."
      />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 46, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        {isAdmin && <AdminAccessButton onPress={() => router.replace('/admin')} />}

        <SectionTitle first={!isAdmin}>Account</SectionTitle>
        <SettingsRow
          icon={<MyProfileIcon color={iconColor} />}
          label="My Profile"
          onPress={() => router.push('/profile')}
        />
        <SettingsRow
          icon={<AccountSecurityIcon color={iconColor} />}
          label="Account Security"
          onPress={() => router.push('/account-security')}
        />
        <SettingsRow
          icon={<IncidentReportIcon color={iconColor} />}
          label="Incident Report"
          onPress={() => Alert.alert('Coming soon', 'Incident reporting is not available yet.')}
        />
        <SettingsRow
          icon={<LinkedDevicesIcon color={iconColor} />}
          label="Linked Devices"
          onPress={() => Alert.alert('Coming soon', 'Linked devices is not available yet.')}
        />

        <SectionTitle>About</SectionTitle>
        <SettingsRow
          icon={<TermsOfServiceIcon color={iconColor} />}
          label="Terms of Service"
          onPress={() => router.push({ pathname: '/auth/tos', params: { readonly: 'true' } })}
        />
        <SettingsRow
          icon={<PrivacyPolicyIcon color={iconColor} />}
          label="Privacy Policy"
          onPress={() => router.push({ pathname: '/auth/data-protection-policy', params: { source: 'settings' } })}
        />
        <SettingsRow
          icon={<RatingsFeedbackIcon color={iconColor} />}
          label="Rating and Feedback"
          onPress={() => setFeedbackPopupStep('SELECT')}
        />

        <SectionTitle>Sign out</SectionTitle>
        <SettingsRow
          icon={<LogOutIcon color={iconColor} />}
          label="Log Out"
          onPress={signOut}
          showNavigateNext={false}
        />
        <SettingsRow
          icon={<LogOutIcon color={iconColor} />}
          label="Log Out of All Devices"
          onPress={signOut}
          showNavigateNext={false}
        />

        <Pressable
          onPress={confirmDelete}
          disabled={deleting}
          className="flex-row items-center gap-4 rounded-[8px] border border-[#E30404] bg-white px-4 py-[18px] mt-6"
        >
          {deleting ? (
            <ActivityIndicator color="#E30404" />
          ) : (
            <>
              <DeleteAccountIcon />
              <Text className="text-[13px] font-inter-regular text-[#E30404]">Delete Account</Text>
            </>
          )}
        </Pressable>
      </ScrollView>

      {/* Select Feedback Type Modal */}
      <Modal
        visible={feedbackPopupStep === 'SELECT'}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackPopupStep('NONE')}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFeedbackPopupStep('NONE')}>
          <Pressable style={styles.modalContent}>
            <Text style={styles.modalTitle}>Feedback</Text>
            <Text style={styles.modalSubtitle}>Enjoying the app?</Text>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => setFeedbackPopupStep('RATE_US')}
            >
              <Text style={styles.modalButtonText}>Rate Us</Text>
              <RateUsIcon size={20} color="#113E55" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalButton}
              onPress={() => {
                setFeedbackPopupStep('NONE');
                router.push('/rating-feedback' as any);
              }}
            >
              <Text style={styles.modalButtonText}>Send Feedback</Text>
              <SendFeedbackIcon size={20} color="#113E55" />
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>

      {/* Rate Us Modal */}
      <Modal
        visible={feedbackPopupStep === 'RATE_US'}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackPopupStep('NONE')}
      >
        <Pressable style={styles.modalOverlay} onPress={() => setFeedbackPopupStep('NONE')}>
          <Pressable style={[styles.modalContent, { alignItems: 'center' }]}>
            <View style={{ marginBottom: 12 }}>
              <RateStarshipIcon size={52} />
            </View>

            <Text style={styles.rateUsTitle}>Are you loving your experience with us so far?</Text>

            <View style={styles.ratingBox}>
              <StarRating rating={starRating} onRatingChange={setStarRating} size={32} />
              <Text style={styles.ratingSubtitle}>Give us a rating</Text>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={async () => {
                try {
                  const isExpoGo =
                    Constants.executionEnvironment === ExecutionEnvironment.StoreClient;

                  if (!isExpoGo && (await StoreReview.hasAction())) {
                    await StoreReview.requestReview();
                  } else {
                    // Fallback to external linking if native in-app review is not available
                    if (Platform.OS === 'android') {
                      const androidPackageName = 'com.gatepassng.gms';
                      const marketUrl = `market://details?id=${androidPackageName}`;
                      const webUrl = `https://play.google.com/store/apps/details?id=${androidPackageName}`;

                      const canOpen = await Linking.canOpenURL(marketUrl);
                      if (canOpen) {
                        await Linking.openURL(marketUrl);
                      } else {
                        await Linking.openURL(webUrl);
                      }
                    } else if (Platform.OS === 'ios') {
                      // Use actual Apple App Store ID
                      const appleAppId = '6766627688';
                      const itunesUrl = `itms-apps://itunes.apple.com/app/id${appleAppId}?action=write-review`;
                      const webUrl = `https://apps.apple.com/app/id${appleAppId}?action=write-review`;

                      const canOpen = await Linking.canOpenURL(itunesUrl);
                      if (canOpen) {
                        await Linking.openURL(itunesUrl);
                      } else {
                        await Linking.openURL(webUrl);
                      }
                    }
                  }
                } catch (error) {
                  console.error('Error opening app store', error);
                }
                setFeedbackPopupStep('NONE');
              }}
            >
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFF',
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    width: 337,
    height: 333,
    justifyContent: 'center',
    position: 'relative',
  },
  modalTitle: {
    fontSize: 28,
    fontFamily: 'UbuntuSans-Bold',
    color: '#081E27',
    marginBottom: 8,
    textAlign: 'center',
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#113E55',
    marginBottom: 32,
    textAlign: 'center',
  },
  modalButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F2F4F5',
    borderRadius: 16,
    paddingHorizontal: 20,
    height: 56,
    marginBottom: 16,
  },
  modalButtonText: {
    fontSize: 16,
    fontFamily: 'Inter-Regular',
    color: '#113E55',
  },
  iconCircleGradient: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  rateUsTitle: {
    fontSize: 20,
    fontFamily: 'UbuntuSans-Bold',
    color: '#081E27',
    textAlign: 'center',
    lineHeight: 26,
    marginBottom: 16,
  },
  ratingBox: {
    width: '100%',
    backgroundColor: '#F7F9F9',
    borderRadius: 8,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingSubtitle: {
    fontSize: 12,
    fontFamily: 'Inter-Regular',
    color: '#888',
    marginTop: 8,
  },
  submitButton: {
    backgroundColor: '#113E55',
    borderRadius: 28,
    height: 48,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: 'UbuntuSans-Bold',
  },
});

