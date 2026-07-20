import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, useWindowDimensions, View , Linking } from 'react-native';
import WebSidebar from '@/src/components/web/WebSidebar';
import { menuRoutes } from '../../user/_layout';
import Back from '@/src/components/mobile/Back';
import { getWidthBreakpoint } from '@/src/lib/helpers';
import { useAuth } from '@/src/hooks/useAuthContext';
import { useUserStore } from '@/src/lib/stores/userStore';
import { deleteAccount } from '@/src/lib/api/user';
import icons from '@/src/constants/icons';
import Modal from '@/src/components/web/Modal';
import Icon from 'react-native-vector-icons/Ionicons';
import { RateUsIcon, SendFeedbackIcon, RateStarshipIcon } from '@/src/components/common/FeedbackIcons';
import StarRating from '@/src/components/common/StarRating';

function SettingsRowWeb({
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
      className="flex-row justify-between items-center gap-10 h-14 bg-[#F7F9F9] rounded-[8px] px-5 mb-3 cursor-pointer"
    >
      <View className="flex-row items-center gap-3">
        {leftIcon}
        <Text className="text-base font-inter-medium text-primary">{label}</Text>
      </View>
      {showChevron ? (
        <Image source={icons.rightIcon} style={{ width: 14, height: 14 }} resizeMode="contain" />
      ) : null}
    </Pressable>
  );
}

function SectionTitleWeb({ children }: { children: string }) {
  return (
    <Text className="text-xs font-inter-medium uppercase tracking-wider text-grey mt-6 mb-2">
      {children}
    </Text>
  );
}

export default function SettingsWeb() {
  const router = useRouter();
  const { signOut } = useAuth();
  const user_id = useUserStore((s) => s.user_id);
  const { width } = useWindowDimensions();
  const isLargeScreen = width > getWidthBreakpoint();
  const [deleting, setDeleting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  
  const [feedbackPopupStep, setFeedbackPopupStep] = useState<'NONE' | 'SELECT' | 'RATE_US'>('NONE');
  const [starRating, setStarRating] = useState(0);

  useEffect(() => {
    if (Platform.OS === 'web') document.title = 'Settings - GatePass';
  }, []);

  const handleDeleteAccount = () => {
    void (async () => {
      if (!user_id) return;
      setDeleting(true);
      try {
        await deleteAccount();
        await signOut();
      } catch (e: any) {
        setDeleteError(e?.message ?? 'Could not delete account.');
      } finally {
        setDeleting(false);
        setShowDeleteModal(false);
      }
    })();
  };

  return (
    <div className="flex h-full w-screen overflow-y-scroll bg-body">
      {isLargeScreen && (
        <WebSidebar routes={menuRoutes} onNavigate={(route) => router.push(route as any)} />
      )}
      <div className="web-body">
        <div className={`flex flex-col ${isLargeScreen ? 'mt-20 px-4 w-full' : 'mt-5 md:px-5'}`}>
          {!isLargeScreen && <Back type="short-arrow" />}

          <Text
            className={`text-primary font-ubuntu-bold mt-8 ${isLargeScreen ? 'text-4xl' : 'text-2xl'}`}
          >
            Settings
          </Text>

          <SectionTitleWeb>Account</SectionTitleWeb>
          <SettingsRowWeb label="My Profile" onPress={() => router.push('/profile')} />
          <SettingsRowWeb
            label="Account Security"
            onPress={() => router.push('/account-security')}
          />

          <SectionTitleWeb>About</SectionTitleWeb>
          <SettingsRowWeb
            label="Terms of Use"
            onPress={() =>
              router.push({
                pathname: '/auth/tos',
                params: { readonly: 'true' },
              })
            }
          />
          <SettingsRowWeb
            label="Data Privacy"
            onPress={() =>
              router.push({
                pathname: '/auth/data-protection-policy',
                params: { source: 'settings' },
              })
            }
          />

          <SectionTitleWeb>Feedback</SectionTitleWeb>
          <SettingsRowWeb
            label="Rating and Feedback"
            onPress={() => setFeedbackPopupStep('SELECT')}
            leftIcon={<Icon name="star-outline" size={20} color="#2A4B5A" />}
          />

          <SectionTitleWeb>Sign out</SectionTitleWeb>
          <Pressable
            onPress={signOut}
            className="border border-grey rounded-xl px-4 py-4 bg-white mb-3 cursor-pointer"
          >
            <Text className="text-base font-inter-medium text-primary text-center">Log Out</Text>
          </Pressable>

          <Pressable
            onPress={() => setShowDeleteModal(true)}
            disabled={deleting}
            className="mt-8 items-center py-2 cursor-pointer"
          >
            <Text className="text-base font-inter-medium text-tertiary">
              {deleting ? 'Deleting…' : 'Delete Account'}
            </Text>
          </Pressable>
        </div>
      </div>

      {showDeleteModal && (
        <Modal
          heading="Delete Account"
          message="This will permanently remove your account and sign you out. This action cannot be undone."
          cancelText="Cancel"
          actionText="Delete"
          runningText="Deleting..."
          actionRunnig={deleting}
          btnDisabled={deleting}
          closeModal={() => {
            if (!deleting) setShowDeleteModal(false);
          }}
          action={handleDeleteAccount}
        />
      )}

      {deleteError ? (
        <Modal
          heading="Delete failed"
          message={deleteError}
          cancelText="Close"
          closeModal={() => setDeleteError('')}
        />
      ) : null}

      {feedbackPopupStep === 'SELECT' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setFeedbackPopupStep('NONE')}
          />
          <div className="bg-white rounded-3xl z-10 w-[337px] h-[333px] p-8 flex flex-col justify-center relative">
            <h4 className="text-[28px] font-ubuntu-bold text-[#081E27] text-center mb-2">
              Feedback
            </h4>
            <p className="text-base font-inter-regular text-[#113E55] text-center mb-8">
              Enjoying the app?
            </p>

            <div className="flex flex-col gap-4">
              <button
                className="flex flex-row justify-between items-center bg-[#F2F4F5] rounded-2xl px-5 h-14 hover:bg-gray-200 transition"
                onClick={() => setFeedbackPopupStep('RATE_US')}
              >
                <span className="text-base font-inter-regular text-[#113E55]">Rate Us</span>
                <RateUsIcon size={20} color="#113E55" />
              </button>
              <button
                className="flex flex-row justify-between items-center bg-[#F2F4F5] rounded-2xl px-5 h-14 hover:bg-gray-200 transition"
                onClick={() => {
                  setFeedbackPopupStep('NONE');
                  router.push('/rating-feedback' as any);
                }}
              >
                <span className="text-base font-inter-regular text-[#113E55]">Send Feedback</span>
                <SendFeedbackIcon size={20} color="#113E55" />
              </button>
            </div>
          </div>
        </div>
      )}

      {feedbackPopupStep === 'RATE_US' && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
            onClick={() => setFeedbackPopupStep('NONE')}
          />
          <div className="bg-white rounded-[24px] z-10 w-[337px] h-[333px] pt-6 pb-8 px-6 flex flex-col items-center relative">
            <div className="mb-3 shrink-0">
              <RateStarshipIcon size={52} />
            </div>
            <h4 className="text-[20px] font-ubuntu-bold text-center text-[#081E27] leading-[26px] mb-4">
              Are you loving your experience with us so far?
            </h4>
            
            <div className="w-full bg-[#F7F9F9] rounded-lg py-3 flex flex-col items-center mb-4">
              <StarRating rating={starRating} onRatingChange={setStarRating} size={32} />
              <span className="text-xs font-inter-regular text-[#888] mt-2">Give us a rating</span>
            </div>

            <div className="flex-1" />
            <button
              className="w-full bg-[#113E55] text-white font-ubuntu-bold text-base rounded-full py-2 h-12 hover:opacity-90 transition"
              onClick={() => {
                const userAgent = window.navigator.userAgent.toLowerCase();
                const androidPackageName = 'com.gatepassng.gms';
                const appleAppId = '6766627688'; 
                
                if (/android/i.test(userAgent)) {
                  window.open(`https://play.google.com/store/apps/details?id=${androidPackageName}`, '_blank');
                } else if (/iphone|ipad|ipod/i.test(userAgent)) {
                  window.open(`https://apps.apple.com/app/id${appleAppId}?action=write-review`, '_blank');
                } else {
                  // Fallback for desktop
                  window.open(`https://play.google.com/store/apps/details?id=${androidPackageName}`, '_blank');
                }
                setFeedbackPopupStep('NONE');
              }}
            >
              Submit
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
