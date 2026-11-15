import {
  View,
  Text,
  Pressable,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Back from '@/src/shared/components/navigation/Back';
import { useUserStore } from '@/src/store/userStore';
import { ProfileFieldRow } from '@/src/features/profile/components/ProfileFieldRow';
import ResidentAccessCodeQRModal from '@/src/features/profile/components/ResidentAccessCodeQRModal';
import ProfilePhotoSheet from '@/src/features/profile/components/ProfilePhotoSheet';
import IdentificationSheet from '@/src/features/profile/components/IdentificationSheet';
import PendingRequestSheet from '@/src/features/admin/components/PendingRequestSheet';
import {
  EyeIcon,
  HiddenEyeIcon,
  QrCodeIcon,
  RefreshIcon,
  DownloadIcon,
  CameraIcon,
} from '@/src/assets/svgs';
import { sharedStyles } from '@/src/shared/theme/styles';
import {
  ProfileOnboardingBanner,
  ProfileOnboardingStep,
} from '@/src/features/profile/components/ProfileOnboardingBanner';
import { CopiedToast } from '@/src/shared/components/feedback/CopiedToast';
import IdDocumentPreview from '@/src/features/profile/components/IdDocumentPreview';
import { useProfileScreen } from '@/src/features/profile/hooks/useProfileScreen';

const notify = (title: string, message: string) => Alert.alert(title, message);

const WAITING_APPROVAL_COPY = {
  title: 'Waiting Approval',
  description: 'Your documents are currently being reviewed by Admin.',
};

const ID_REJECTED_COPY = {
  title: 'ID Rejected',
  description:
    'Admin could not approve your ID. Please upload a clear, valid government-issued ID.',
};

const ONBOARDING_COPY: Record<
  Exclude<ProfileOnboardingStep, null>,
  { title: string; description: string }
> = {
  id: {
    title: 'Verify Your ID',
    description: 'Please upload your government issued ID to generate your access code.',
  },
  photo: {
    title: 'Upload Your Photo',
    description: 'Please upload your passport to generate your access code.',
  },
};

export default function ProfileScreen() {
  // PERF-16: select only what this screen needs (useShallow so the object is stable).
  const first_name = useUserStore((s) => s.first_name);
  const last_name = useUserStore((s) => s.last_name);
  const home_address = useUserStore((s) => s.home_address);
  const household_name = useUserStore((s) => s.household_name);
  const household_primary_resident = useUserStore((s) => s.household_primary_resident);
  const email = useUserStore((s) => s.email);
  const phone_number = useUserStore((s) => s.phone_number);
  const {
    navigation,
    showAccessCode,
    accessCode: { code, noCode, formattedDate, handleGenerateCode },
    codeVisible,
    codeDisplay,
    canCopyCode,
    loading,
    handleCopyCode,
    toggleCodeVisible,
    handleQrPress,
    openAccessLog,
    openEditProfile,
    pendingDetails,
    pendingFields,
    openPendingRequestSheet,
    profilePhotoUri,
    documentsImagesLoading,
    uploadingPhoto,
    identificationUri,
    identificationPendingRequest,
    identificationDisplayValue,
    identificationPreviewUri,
    identificationPreviewContentType,
    idRejected,
    onboardingStep,
    isProfileLocked,
    isAwaitingApproval,
    handleAvatarPress,
    handlePhotoSelected,
    handleIdentificationPress,
    handleIdentificationPendingPress,
    handleIdentificationSelected,
    handleIdentificationDownload,
    handleOnboardingUpload,
    showQrModal,
    setShowQrModal,
    showPhotoSheet,
    setShowPhotoSheet,
    showIdentificationSheet,
    setShowIdentificationSheet,
    showIdentificationPreview,
    setShowIdentificationPreview,
    showCopiedToast,
    pendingRequestSheet,
    showPendingRequestSheet,
    closePendingRequestSheet,
    handlePendingRequestDeleted,
    uploadingIdentification,
  } = useProfileScreen({ notify });

  const renderProfileContent = (isPreview = false) => (
    <>
      <View className={`items-center ${isPreview ? 'mt-0' : 'mt-6'}`}>
        <Pressable onPress={handleAvatarPress}>
          <View
            style={{
              width: 87,
              height: 87,
              borderRadius: 100,

              backgroundColor: '#F4FFFE',
              overflow: 'hidden',
            }}
          >
            {profilePhotoUri ? (
              <Image
                source={{ uri: profilePhotoUri }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-light-teal"></View>
            )}

            {uploadingPhoto || documentsImagesLoading ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  { alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <CircleLoader size={32} />
              </View>
            ) : null}

            <View
              style={{
                position: 'absolute',
                bottom: 0,
                left: 4,
                width: 79,
                height: 28,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={[StyleSheet.absoluteFill, { backgroundColor: 'rgba(27, 153, 139, 0.5)' }]}
              />
              <CameraIcon width={20} height={20} />
            </View>
          </View>
        </Pressable>

        <Text className="pt-[13px] text-[24px] leading-[30px] font-ubuntu-medium text-primary">
          Hi {first_name ?? 'there'}
        </Text>
      </View>

      <View pointerEvents={isPreview ? 'none' : 'auto'}>
        {showAccessCode ? (
          <View className="mt-8 flex-row items-stretch justify-between rounded-[16px] bg-white p-4">
            <View className="flex-1 justify-between gap-2 ">
              <View className="gap-2">
                <Text className="text-[11px] font-inter-regular text-[#6C6C6C]">
                  My Access Code
                </Text>

                <View
                  className="flex-row items-center gap-1"
                  style={{ minHeight: isPreview ? 28 : 22 }}
                >
                  {!isPreview ? (
                    <>
                      <TouchableOpacity
                        onLongPress={handleCopyCode}
                        delayLongPress={400}
                        activeOpacity={0.6}
                        disabled={!canCopyCode || loading}
                        hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                        style={{ minHeight: 28, justifyContent: 'center' }}
                      >
                        <View
                          style={
                            !loading && codeDisplay === '******'
                              ? { transform: [{ translateY: 5 }] }
                              : undefined
                          }
                        >
                          <Text
                            className={`text-[24px]   ${
                              !loading && codeDisplay === '******'
                                ? 'font-ubuntu-normal text-primary/90 tracking-[3.5px] '
                                : 'font-ubuntu-medium text-primary'
                            }`}
                            style={{
                              lineHeight: 28,
                              includeFontPadding: false,
                              minWidth: 109,
                            }}
                          >
                            {loading ? '------' : codeDisplay}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <View className="h-8 w-8 items-center justify-center">
                        {code && !noCode && !loading ? (
                          <Pressable
                            onPress={toggleCodeVisible}
                            hitSlop={8}
                            className="h-8 w-8 items-center justify-center rounded-full bg-[#E0FFFC80]"
                          >
                            {codeVisible ? (
                              <EyeIcon width={18} height={18} />
                            ) : (
                              <HiddenEyeIcon width={18} height={18} />
                            )}
                          </Pressable>
                        ) : null}
                      </View>
                    </>
                  ) : null}
                </View>
              </View>

              <View>
                {isPreview || loading ? (
                  <Text className="text-[11px] font-inter-regular text-[#6C6C6C]">
                    Code expires on —
                  </Text>
                ) : formattedDate ? (
                  <Text className="text-[11px] font-inter-regular text-[#6C6C6C]">
                    Code expires on {formattedDate}
                  </Text>
                ) : noCode ? (
                  <Text className="text-[11px] font-inter-regular text-grey">
                    You do not have a code yet. Tap refresh to generate one.
                  </Text>
                ) : (
                  <Text className="text-[11px] font-inter-regular text-[#6C6C6C]">
                    Code expires on —
                  </Text>
                )}
              </View>
            </View>

            <View className="items-end justify-between">
              <Pressable onPress={openAccessLog} hitSlop={8}>
                <Text className="text-[11px] font-inter-semibold text-primary">View History</Text>
              </Pressable>

              <View className="flex-row gap-3">
                <Pressable
                  onPress={handleGenerateCode}
                  disabled={loading}
                  hitSlop={8}
                  className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#E0FFFC80]"
                >
                  {loading ? <CircleLoader size={32} /> : <RefreshIcon width={16} height={16} />}
                </Pressable>

                <Pressable
                  onPress={handleQrPress}
                  className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#E0FFFC80]"
                  disabled={loading}
                  hitSlop={8}
                >
                  <QrCodeIcon width={20} height={20} />
                </Pressable>
              </View>
            </View>
          </View>
        ) : null}

        <View className="mt-4 flex-col gap-2 rounded-[16px] bg-white py-4 mb-6">
          <ProfileFieldRow
            label="First Name"
            value={first_name}
            pendingValue={pendingDetails.firstName.newValue}
            onEdit={openEditProfile}
            onPendingPress={() => openPendingRequestSheet('firstName', 'First Name')}
            hasPendingRequest={pendingFields.firstName}
          />
          <ProfileFieldRow
            label="Last Name"
            value={last_name}
            pendingValue={pendingDetails.lastName.newValue}
            onEdit={openEditProfile}
            onPendingPress={() => openPendingRequestSheet('lastName', 'Last Name')}
            hasPendingRequest={pendingFields.lastName}
          />
          <ProfileFieldRow label="Phone Number" value={phone_number} onEdit={openEditProfile} />
          <ProfileFieldRow
            label="Email Address"
            value={email}
            pendingValue={pendingDetails.email.newValue}
            onEdit={openEditProfile}
            onPendingPress={() => openPendingRequestSheet('email', 'Email Address')}
            hasPendingRequest={pendingFields.email}
            isLast
          />
        </View>

        <View className=" flex-col gap-2 rounded-[16px] bg-white py-4">
          <ProfileFieldRow label="Household" value={household_name ?? null} />
          <ProfileFieldRow label="Primary Resident" value={household_primary_resident ?? null} />
          <ProfileFieldRow
            label="Address"
            value={home_address}
            pendingValue={pendingDetails.address.newValue}
            onEdit={openEditProfile}
            onPendingPress={() => openPendingRequestSheet('address', 'Address')}
            hasPendingRequest={pendingFields.address}
            isLast
          />
        </View>

        <View className="mt-6 flex-row items-center gap-3.5">
          <View className="flex-1 rounded-[16px] bg-white">
            <ProfileFieldRow
              label="Identification"
              value={identificationDisplayValue}
              pendingValue={identificationPendingRequest ? 'Awaiting approval' : undefined}
              onEdit={handleIdentificationPress}
              onPendingPress={handleIdentificationPendingPress}
              hasPendingRequest={!!identificationPendingRequest}
            />
          </View>

          <View className="flex-row gap-2">
            <Pressable
              onPress={() => setShowIdentificationPreview(true)}
              disabled={!identificationPreviewUri}
              accessibilityRole="button"
              accessibilityLabel="Preview identification"
              className={`h-10 w-10 items-center justify-center rounded-full bg-white ${!identificationPreviewUri ? 'opacity-40' : ''}`}
            >
              <MaterialIcons name="visibility" size={17} color="#113E55" />
            </Pressable>
            <Pressable
              onPress={handleIdentificationDownload}
              accessibilityRole="button"
              accessibilityLabel="Download identification"
              className="h-10 w-10 items-center justify-center rounded-full bg-white"
            >
              <DownloadIcon width={10} height={12} />
            </Pressable>
          </View>
        </View>
      </View>
    </>
  );

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7' }]}
      className="relative flex-1"
    >
      <Stack.Screen options={{ headerShown: false }} />

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ flexGrow: 1, paddingBottom: 40 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="flex-row items-center justify-between">
          <Back type="short-arrow" onPress={() => navigation.goBack()} />

          {isProfileLocked ? (
            <Text className="text-[11px] font-inter-regular text-[#0A1F29]">
              {onboardingStep === 'photo' ? '1/2' : '2/2'}
            </Text>
          ) : (
            <View className="h-[30px] w-[30px]" />
          )}
        </View>

        {isProfileLocked && onboardingStep ? (
          <View className="w-full flex-1 justify-center">
            <View className="w-full items-center px-1">
              <ProfileOnboardingBanner
                {...ONBOARDING_COPY[onboardingStep]}
                onUpload={handleOnboardingUpload}
              />
            </View>

            {/* Only the avatar stays tappable, so the photo can be uploaded before the ID. */}
            <View style={{ opacity: 0.35 }} pointerEvents="box-none" className="mt-6 w-full">
              {renderProfileContent(true)}
            </View>
          </View>
        ) : isAwaitingApproval ? (
          <View className="w-full flex-1 justify-center">
            <View className="w-full items-center px-1">
              {idRejected === null ? (
                // Still checking whether the admin rejected this ID: show neither banner yet.
                <View
                  className="mb-[30px] w-full items-center justify-center pt-12"
                  style={{ height: 230 }}
                >
                  <CircleLoader size={32} />
                </View>
              ) : (
                <ProfileOnboardingBanner
                  {...(idRejected ? ID_REJECTED_COPY : WAITING_APPROVAL_COPY)}
                  buttonLabel={idRejected ? 'Re-upload' : 'Re-submit'}
                  onUpload={() => setShowIdentificationSheet(true)}
                />
              )}
            </View>

            <View style={{ opacity: 0.4 }} pointerEvents="box-none" className="mt-6 w-full">
              {renderProfileContent(true)}
            </View>
          </View>
        ) : (
          renderProfileContent()
        )}
      </ScrollView>

      <CopiedToast visible={showCopiedToast} />

      {code ? (
        <ResidentAccessCodeQRModal
          visible={showQrModal}
          code={code.replace(/\s+/g, '')}
          onClose={() => setShowQrModal(false)}
        />
      ) : null}

      <ProfilePhotoSheet
        visible={showPhotoSheet}
        photoUri={profilePhotoUri}
        onClose={() => setShowPhotoSheet(false)}
        onPhotoSelected={handlePhotoSelected}
        uploading={uploadingPhoto}
      />

      <IdentificationSheet
        visible={showIdentificationSheet}
        identificationUri={identificationUri}
        onClose={() => setShowIdentificationSheet(false)}
        onIdentificationSelected={handleIdentificationSelected}
        uploading={uploadingIdentification}
      />

      <Modal
        visible={showIdentificationPreview && Boolean(identificationPreviewUri)}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={() => setShowIdentificationPreview(false)}
      >
        <View className="flex-1 items-center justify-center bg-black/60 px-5">
          <Pressable
            onPress={() => setShowIdentificationPreview(false)}
            accessibilityRole="button"
            accessibilityLabel="Close identification preview"
            style={StyleSheet.absoluteFill}
          />
          <View className="h-[70%] w-full max-w-[360px] overflow-hidden rounded-[24px] bg-white p-4">
            {identificationPreviewUri ? (
              <View className="flex-1 overflow-hidden rounded-[16px]">
                <IdDocumentPreview
                  uri={identificationPreviewUri}
                  contentType={identificationPreviewContentType}
                />
              </View>
            ) : null}
            <Pressable
              onPress={() => setShowIdentificationPreview(false)}
              accessibilityRole="button"
              className="mt-4 h-11 items-center justify-center rounded-3xl bg-primary"
            >
              <Text className="font-ubuntu-semibold text-[14px] text-white">Close</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <PendingRequestSheet
        visible={showPendingRequestSheet}
        request={pendingRequestSheet}
        onClose={closePendingRequestSheet}
        onDeleted={handlePendingRequestDeleted}
      />
    </SafeAreaView>
  );
}
