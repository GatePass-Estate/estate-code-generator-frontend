import { View, Text, Pressable, ScrollView, Alert, ActivityIndicator, Image, Modal, StyleSheet, Linking, TouchableOpacity, Platform } from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Icon from 'react-native-vector-icons/Ionicons';
import { useState } from 'react';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useUserStore } from '@/src/lib/stores/userStore';
import { deleteAccount } from '@/src/lib/api/user';
import Back from '@/src/components/mobile/Back';
import { sharedStyles } from '@/src/theme/styles';
import { LinearGradient } from 'expo-linear-gradient';
import icons from '@/src/constants/icons';
import StarRating from '@/src/components/common/StarRating';
import { RateUsIcon, SendFeedbackIcon, RateStarshipIcon } from '@/src/components/common/FeedbackIcons';
import * as StoreReview from 'expo-store-review';
import Constants, { ExecutionEnvironment } from 'expo-constants';
function SettingsRow({
  label,
  onPress,
  showChevron = true,
  leftIcon,
}: {
  label: string;
  onPress: () => void;
  showChevron?: boolean;
  leftIcon?: React.ReactNode;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-row items-center justify-between border border-[#CEE5ED] rounded-[8px] px-4 h-[52px] bg-white "
    >
      <View className="flex-row items-center gap-3">
        {leftIcon}
        <Text className="text-[13px] font-inter-regular text-primary">{label}</Text>
      </View>
      {showChevron ? (
        <View className="w-5 h-5">
          <Image source={icons.slideUp} style={{ width: 20, height: 20 }} resizeMode="contain" />
        </View>
      ) : null}
    </Pressable>
  );
}

function SectionTitle({ children }: { children: string }) {
  return (
    <Text className="text-xs font-inter-medium uppercase tracking-wider text-grey mt-6 mb-2">
      {children}
    </Text>
  );
}

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const user_id = useUserStore((s) => s.user_id);
  const [deleting, setDeleting] = useState(false);
  
  const [feedbackPopupStep, setFeedbackPopupStep] = useState<'NONE' | 'SELECT' | 'RATE_US'>('NONE');
  const [starRating, setStarRating] = useState(0);

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

  return (
    <SafeAreaView style={[sharedStyles.container, sharedStyles.modalContainer]}>
      <Stack.Screen options={{ headerShown: false }} />
      <Back type="short-arrow" />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 46, flexGrow: 1 }}
        showsVerticalScrollIndicator={false}
      >
        <Text className=" text-primary mb-1 font-ubuntu-bold mt-7" style={{ fontSize: 22 }}>
          Settings
        </Text>

        <Text className="text-[10px] font-inter-medium uppercase tracking-wider text-grey mt-6 mb-3">
          Account
        </Text>
        <View className="flex flex-col gap-2">
          <SettingsRow label="My Profile" onPress={() => router.push('/profile')} />
          <SettingsRow label="Account Security" onPress={() => router.push('/account-security')} />
        </View>

        <Text className="text-[10px] font-inter-medium uppercase tracking-wider text-grey mt-12 mb-2">
          About
        </Text>
        <View className="flex flex-col gap-2">
          <SettingsRow
            label="Terms of Service"
            onPress={() =>
              router.push({
                pathname: '/auth/tos',
                params: { readonly: 'true' },
              })
            }
          />
          <SettingsRow
            label="Privacy Policy"
            onPress={() =>
              router.push({
                pathname: '/auth/data-protection-policy',
                params: { source: 'settings' },
              })
            }
          />
        </View>

        <Text className="text-[10px] font-inter-medium uppercase tracking-wider text-grey mt-12 mb-2">
          Feedback
        </Text>
        <View className="flex flex-col gap-2">
          <SettingsRow
            label="Rating and Feedback"
            onPress={() => setFeedbackPopupStep('SELECT')}
            leftIcon={<Icon name="star-outline" size={20} color="#2A4B5A" />}
          />
        </View>

        <Text className="text-[10px] font-inter-medium uppercase tracking-wider text-grey mt-[42px] mb-2">
          Sign out
        </Text>
        <Pressable
          onPress={signOut}
          className="flex-row items-center  border border-[#CEE5ED] rounded-[8px] px-4 h-[52px] bg-white"
        >
          <Text className="text-[13px] font-inter-regular text-primary text-center">Log Out</Text>
        </Pressable>

        <View className="mt-auto pt-8">
          <Pressable
            onPress={confirmDelete}
            disabled={deleting}
            className="px-4 h-[52px] flex justify-center items-center"
          >
            {deleting ? (
              <ActivityIndicator color="#F46036" />
            ) : (
              <Text className="text-[15px] font-inter-medium text-[#F46036]">Delete Account</Text>
            )}
          </Pressable>
        </View>
      </ScrollView>

      {/* Select Feedback Type Modal */}
      <Modal
        visible={feedbackPopupStep === 'SELECT'}
        transparent
        animationType="fade"
        onRequestClose={() => setFeedbackPopupStep('NONE')}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setFeedbackPopupStep('NONE')}
        >
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
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setFeedbackPopupStep('NONE')}
        >
          <Pressable style={[styles.modalContent, { alignItems: 'center' }]}>

            <View style={{ marginBottom: 12 }}>
              <RateStarshipIcon size={52} />
            </View>

            <Text style={styles.rateUsTitle}>
              Are you loving your experience with us so far?
            </Text>

            <View style={styles.ratingBox}>
              <StarRating rating={starRating} onRatingChange={setStarRating} size={32} />
              <Text style={styles.ratingSubtitle}>Give us a rating</Text>
            </View>

            <View style={{ flex: 1 }} />

            <TouchableOpacity 
              style={styles.submitButton}
              onPress={async () => {
                try {
                  const isExpoGo = Constants.executionEnvironment === ExecutionEnvironment.StoreClient;
                  
                  if (!isExpoGo && await StoreReview.hasAction()) {
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

