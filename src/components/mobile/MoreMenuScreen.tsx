import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  ActivityIndicator,
  Modal,
  StyleSheet,
  Linking,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { router, Stack, useNavigation } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Feather, MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Path } from 'react-native-svg';
import { useState, ReactNode } from 'react';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useUserStore } from '@/src/lib/stores/userStore';
import { deleteAccount } from '@/src/lib/api/user';
import { sharedStyles } from '@/src/theme/styles';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import StarRating from '@/src/components/common/StarRating';
import {
  RateUsIcon,
  SendFeedbackIcon,
  RateStarshipIcon,
} from '@/src/components/common/FeedbackIcons';
import * as StoreReview from 'expo-store-review';
import Constants, { ExecutionEnvironment } from 'expo-constants';
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

type MoreMenuScreenProps = {
  title?: string;
  subtitle?: string;
};

function SectionTitle({ children, first = false }: { children: string; first?: boolean }) {
  return (
    <Text className="mb-2 text-[10px] font-inter-regular uppercase  text-[#113E55]">
      {children}
    </Text>
  );
}

function MoreMenuRow({
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
      className="flex-row items-center justify-between rounded-[8px] border-[0.5px] border-[#CEE5ED]  px-4 py-[18px]"
    >
      <View className="flex-row items-center gap-4">
        {icon}
        <Text className="text-sm font-inter-light text-primary">{label}</Text>
      </View>
      {showNavigateNext ? <NavigateNextIcon /> : null}
    </Pressable>
  );
}

function SparklesIcon({ size = 20, color = 'white' }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M13 5L14.5 10.5L20 12L14.5 13.5L13 19L11.5 13.5L6 12L11.5 10.5L13 5Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <Path
        d="M7 2L7.7 4.3L10 5L7.7 5.7L7 8L6.3 5.7L4 5L6.3 4.3L7 2Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function BannerCard({
  colors,
  icon,
  title,
  subtitle,
  onPress,
}: {
  colors: readonly [string, string, ...string[]];
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress}>
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 0 }}
        style={{ borderRadius: 8, marginBottom: 8 }}
      >
        <View className="flex-row items-center justify-between p-4">
          <View className="flex-row items-center gap-3 flex-1 pr-4">
            <View>{icon}</View>
            <View className="flex-1 flex-col">
              <Text className="text-[17px] font-inter-medium text-white mb-1">{title}</Text>
              <Text className="text-[12px] font-inter-regular text-white opacity-90 leading-tight">
                {subtitle}
              </Text>
            </View>
          </View>
          <Feather name="chevron-right" size={20} color="white" />
        </View>
      </LinearGradient>
    </Pressable>
  );
}

function SquareCard({
  colors,
  icon,
  title,
  subtitle,
  onPress,
}: {
  colors: readonly [string, string, ...string[]];
  icon: ReactNode;
  title: string;
  subtitle: string;
  onPress?: () => void;
}) {
  return (
    <Pressable onPress={onPress} className="flex-1">
      <LinearGradient
        colors={colors}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ borderRadius: 8 }}
      >
        <View className="px-[10px] py-3 flex-col justify-between min-h-[105px]">
          <View className="flex-row items-start gap-[6px]">
            <View>{icon}</View>
            <View className="flex-1 flex-col mt-[1px]">
              <Text className="text-[12px] font-inter-regular text-white mb-1" numberOfLines={1}>{title}</Text>
              <Text className="text-[10px] font-inter-regular text-white opacity-90 leading-tight">
                {subtitle}
              </Text>
            </View>
          </View>
          <View className="items-end mt-1">
            <View
              className="w-5 h-5 rounded-full items-center justify-center"
              style={{ borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.6)' }}
            >
              <Feather name="arrow-up-right" size={12} color="white" style={{ opacity: 0.9 }} />
            </View>
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}

export default function MoreMenuScreen({
  title = 'More',
  subtitle = 'Adjust Gatepass to your preference, manage account.',
}: MoreMenuScreenProps) {
  const navigation = useNavigation();
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
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        onPress={() => navigation.goBack()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader
        containerClassName="mt-11"
        titleClassName="text-[21px] font-ubuntu-semibold text-[#113E55]"
        title={title}
        subtitle={subtitle || undefined}
      />

      <ScrollView
        contentContainerStyle={{
          paddingBottom: 40,
          paddingTop: isAdmin ? 24 : 40,
          flexGrow: 0,
        }}
        showsVerticalScrollIndicator={false}
      >
        <View className="mb-6">
          <BannerCard
            colors={['#185A75', '#5796AB']}
            icon={<Ionicons name="diamond-outline" size={24} color="white" />}
            title="Current Plan"
            subtitle="Upgrade your account plan to get exclusive features including Freeze, Scheduling and more"
            onPress={() => {}}
          />
          <View className="flex-row gap-2">
            {isAdmin && (
              <SquareCard
                colors={['#F05E3E', '#F99573']}
                icon={<MaterialCommunityIcons name="account-cog-outline" size={20} color="white" />}
                title="ADMIN TOOLS"
                subtitle="Control and manage access on your dashboard"
                onPress={() => router.replace('/admin')}
              />
            )}
            <SquareCard
              colors={['#129B85', '#49CCB8']}
              icon={<SparklesIcon size={20} color="white" />}
              title="AI STORE"
              subtitle="Get AI assistance on your dashboard"
              onPress={() => router.push('/ai-store')}
            />
          </View>
        </View>
        <View className="flex-col gap-10">
          <View>
            <SectionTitle first>Account</SectionTitle>
            <View className="flex-col gap-2">
              <MoreMenuRow
                icon={<MyProfileIcon color={iconColor} />}
                label="My Profile"
                onPress={() => router.push('/profile')}
              />
              <MoreMenuRow
                icon={<AccountSecurityIcon color={iconColor} />}
                label="Account Security"
                onPress={() => router.push('/account-security')}
              />
              <MoreMenuRow
                icon={<Ionicons name="diamond-outline" size={22} color={iconColor} />}
                label="Billing and Subscription"
                onPress={() => Alert.alert('Coming soon', 'Billing and subscription is not available yet.')}
              />
              <MoreMenuRow
                icon={<IncidentReportIcon color={iconColor} />}
                label="Incident Report"
                onPress={() =>
                  Alert.alert('Coming soon', 'Incident reporting is not available yet.')
                }
              />
              <MoreMenuRow
                icon={<LinkedDevicesIcon color={iconColor} />}
                label="Linked Devices"
                onPress={() => Alert.alert('Coming soon', 'Linked devices is not available yet.')}
              />
            </View>
          </View>

          <View>
            <SectionTitle>About</SectionTitle>
            <View className="flex-col gap-2">
              <MoreMenuRow
                icon={<TermsOfServiceIcon color={iconColor} />}
                label="Terms of Service"
                onPress={() =>
                  router.push({
                    pathname: '/auth/tos',
                    params: { readonly: 'true' },
                  })
                }
              />
              <MoreMenuRow
                icon={<PrivacyPolicyIcon color={iconColor} />}
                label="Privacy Policy"
                onPress={() =>
                  router.push({
                    pathname: '/auth/data-protection-policy',
                    params: { source: 'settings' },
                  })
                }
              />
            </View>
          </View>

          <View>
            <SectionTitle>Help</SectionTitle>
            <View className="flex-col gap-1">
              <MoreMenuRow
                icon={<RatingsFeedbackIcon color={iconColor} />}
                label="Ratings and Feedback"
                onPress={() => setFeedbackPopupStep('SELECT')}
              />
            </View>
          </View>

          <View>
            <SectionTitle>Sign out</SectionTitle>
            <View className="flex-col gap-[7px]">
              <MoreMenuRow
                icon={<LogOutIcon color={iconColor} />}
                label="Log Out"
                onPress={signOut}
                showNavigateNext={false}
              />
              <MoreMenuRow
                icon={<LogOutIcon color={iconColor} />}
                label="Log Out of All Devices"
                onPress={signOut}
                showNavigateNext={false}
              />
            </View>
          </View>
        </View>
        <Pressable
          onPress={confirmDelete}
          disabled={deleting}
          className="flex-row items-center gap-4 rounded-[8px] border border-[#E30404] bg-white px-4 py-[18px] mt-6"
        >
          {deleting ? (
            <ActivityIndicator color="#ED0808" />
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
