import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  Pressable,
  ActivityIndicator,
  ScrollView,
  Alert,
  StyleSheet,
  Image,
  TouchableOpacity,
} from 'react-native';
import { router, Stack, useNavigation } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useUserStore } from '@/src/lib/stores/userStore';
import { useProfileDocumentsStore } from '@/src/lib/stores/profileDocumentsStore';
import { ProfileFieldRow } from '@/src/components/mobile/ProfileFieldRow';
import ResidentAccessCodeQRModal from '@/src/components/mobile/ResidentAccessCodeQRModal';
import ProfilePhotoSheet from '@/src/components/mobile/ProfilePhotoSheet';
import IdentificationSheet from '@/src/components/mobile/IdentificationSheet';
import PendingRequestSheet, {
  PendingRequestSheetData,
} from '@/src/components/mobile/PendingRequestSheet';
import {
  EyeIcon,
  HiddenEyeIcon,
  QrCodeIcon,
  RefreshIcon,
  DownloadIcon,
  CameraIcon,
} from '@/src/assets/svgs';
import { sharedStyles } from '@/src/theme/styles';
import { generateCode, getMyCode } from '@/src/lib/api/codes';
import {
  downloadMyDocument,
  getMyDocumentViewUri,
  getPendingDocumentViewUri,
  uploadUserDocument,
} from '@/src/lib/api/userDocuments';
import { formatDateWithOrdinal } from '@/src/lib/helpers';
import { useProfilePendingFields } from '@/src/hooks/useProfilePendingFields';
import { ProfileFieldKey } from '@/src/lib/profilePendingFields';
import { createIdentificationPendingRequest, downloadFile } from '@/src/lib/pendingRequestHelpers';
import { getFilenameFromUri } from '@/src/lib/userDocumentHelpers';
import { setProfileOnboardingCache } from '@/src/lib/profileOnboardingCache';
import {
  getProfileOnboardingStep,
  ProfileOnboardingBanner,
} from '@/src/components/mobile/ProfileOnboardingBanner';
import { CopiedToast } from '@/src/components/mobile/CopiedToast';

function formatAccessCode(code: string) {
  return code.replace(/\s+/g, '').toUpperCase();
}

export default function ProfileScreen() {
  const navigation = useNavigation();
  const {
    first_name,
    last_name,
    home_address,
    estate_name,
    email,
    phone_number,
    user_id,
    estate_id,
    role,
  } = useUserStore();

  const [code, setCode] = useState<string | null>(null);
  const [expiry, setExpiry] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [noCode, setNoCode] = useState(false);
  const [codeVisible, setCodeVisible] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [showIdentificationSheet, setShowIdentificationSheet] = useState(false);
  const profilePhotoUri = useProfileDocumentsStore((state) => state.profilePhotoUri);
  const identificationUri = useProfileDocumentsStore((state) => state.identificationUri);
  const identificationPendingRequest = useProfileDocumentsStore(
    (state) => state.identificationPendingRequest
  );
  const onboardingCache = useProfileDocumentsStore((state) => state.onboarding);
  const documentsImagesLoading = useProfileDocumentsStore((state) => state.imagesLoading);
  const syncDocuments = useProfileDocumentsStore((state) => state.syncDocuments);
  const hydrateOnboarding = useProfileDocumentsStore((state) => state.hydrateOnboarding);
  const setProfilePhotoUri = useProfileDocumentsStore((state) => state.setProfilePhotoUri);
  const setIdentificationUri = useProfileDocumentsStore((state) => state.setIdentificationUri);
  const setIdentificationPendingRequest = useProfileDocumentsStore(
    (state) => state.setIdentificationPendingRequest
  );
  const patchOnboarding = useProfileDocumentsStore((state) => state.patchOnboarding);
  const [pendingRequestSheet, setPendingRequestSheet] = useState<PendingRequestSheetData | null>(
    null
  );
  const [showPendingRequestSheet, setShowPendingRequestSheet] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingIdentification, setUploadingIdentification] = useState(false);
  const copiedToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const uploadingPhotoRef = useRef(false);
  const { pendingDetails, pendingFields, refreshPendingFields } = useProfilePendingFields(user_id);

  const showAccessCode = role !== 'security';

  const fetchMyCode = useCallback(async () => {
    if (!user_id) return;
    setLoading(true);
    try {
      const { hashed_code, valid_until } = await getMyCode(user_id);
      setCode(hashed_code);
      setNoCode(false);
      setExpiry(valid_until);
    } catch {
      setCode(null);
      setExpiry(null);
      setNoCode(true);
    } finally {
      setLoading(false);
    }
  }, [user_id]);

  const handleGenerateCode = useCallback(async () => {
    if (!user_id) return;
    setLoading(true);
    try {
      const { hashed_code, valid_until } = await generateCode(
        { user_id, estate_id: estate_id ?? '' },
        'resident'
      );
      setCode(hashed_code);
      setExpiry(valid_until);
      setNoCode(false);
      setCodeVisible(true);
    } catch {
      Alert.alert('Could not generate code', 'Please try again later.');
    } finally {
      setLoading(false);
    }
  }, [user_id, estate_id]);

  useEffect(() => {
    if (!user_id) return;
    hydrateOnboarding(user_id);
    syncDocuments(user_id);
  }, [user_id, hydrateOnboarding, syncDocuments]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (showAccessCode) fetchMyCode();
    });
    return unsubscribe;
  }, [navigation, fetchMyCode, showAccessCode]);

  const formattedDate = useMemo(() => {
    if (!expiry) return null;
    return formatDateWithOrdinal(new Date(expiry));
  }, [expiry]);

  const openEditProfile = () => router.push('/profile/edit');

  const openPendingSheet = useCallback((data: PendingRequestSheetData) => {
    setPendingRequestSheet(data);
    setShowPendingRequestSheet(true);
  }, []);

  const openPendingRequestSheet = useCallback(
    (fieldKey: ProfileFieldKey, fieldLabel: string) => {
      const detail = pendingDetails[fieldKey];
      if (!detail.hasPending || !detail.requestId) return;

      openPendingSheet({
        kind: 'field',
        fieldLabel,
        currentValue: detail.oldValue?.trim() || '—',
        newValue: detail.newValue?.trim() || '—',
        requestId: detail.requestId,
      });
    },
    [openPendingSheet, pendingDetails]
  );

  const handleAvatarPress = () => {
    // Profile photos apply immediately — always open the picker, never the review sheet.
    setShowPhotoSheet(true);
  };

  const handlePhotoSelected = async (uri: string) => {
    uploadingPhotoRef.current = true;
    setUploadingPhoto(true);
    setProfilePhotoUri(uri);

    try {
      const result = await uploadUserDocument(uri, 'profile_picture');

      if (user_id) {
        patchOnboarding({ hasPhoto: true });
        await setProfileOnboardingCache(user_id, { hasPhoto: true });
      }

      try {
        const photoUri = await getMyDocumentViewUri('profile_picture', result.content_type);
        setProfilePhotoUri(photoUri);
        useProfileDocumentsStore.setState({
          photoDocumentId: result.document_id,
          lastSyncedAt: Date.now(),
        });
      } catch {
        // Keep the local picker URI if the authenticated view fetch fails.
      }

      setShowPhotoSheet(false);
    } catch (error: any) {
      setProfilePhotoUri(null);
      Alert.alert('Upload failed', error?.message?.trim() || 'Could not upload profile photo.');
    } finally {
      uploadingPhotoRef.current = false;
      setUploadingPhoto(false);
    }
  };

  const handleIdentificationPress = () => {
    if (identificationPendingRequest) {
      openPendingSheet(identificationPendingRequest);
      return;
    }

    setShowIdentificationSheet(true);
  };

  const handleIdentificationSelected = async (uri: string) => {
    setUploadingIdentification(true);
    try {
      const result = await uploadUserDocument(uri, 'id_card');

      if (user_id) {
        patchOnboarding({ hasIdentification: true });
        await setProfileOnboardingCache(user_id, { hasIdentification: true });
      }

      if (result.document_status === 'pending') {
        let pendingUri: string | null = uri;
        if (result.document_id) {
          try {
            pendingUri = await getPendingDocumentViewUri(result.document_id, result.content_type);
          } catch {
            // Local picker URI is enough until preview loads later.
          }
        }

        setIdentificationPendingRequest(
          createIdentificationPendingRequest({
            requestId: result.edit_request_id ?? `local-identification-${result.document_id}`,
            newFileName: getFilenameFromUri(uri),
            newFileUri: pendingUri,
            currentFileUri: identificationUri,
            currentFileName: identificationUri ? 'Current ID' : 'Name of Image title stored as..',
          })
        );
        useProfileDocumentsStore.setState({
          pendingIdDocumentId: result.document_id,
          lastSyncedAt: Date.now(),
        });
      } else {
        let activeUri: string = uri;
        if (result.view_url) {
          try {
            activeUri = await getMyDocumentViewUri('id_card', result.content_type);
          } catch {
            // Keep local picker URI if view fetch fails.
          }
        }
        setIdentificationUri(activeUri);
        setIdentificationPendingRequest(null);
        useProfileDocumentsStore.setState({
          activeIdDocumentId: result.document_id,
          pendingIdDocumentId: null,
          lastSyncedAt: Date.now(),
        });
      }

      setShowIdentificationSheet(false);
    } catch (error: any) {
      Alert.alert('Upload failed', error?.message?.trim() || 'Could not upload identification.');
    } finally {
      setUploadingIdentification(false);
    }
  };

  const handleIdentificationDownload = async () => {
    if (identificationPendingRequest?.newFileUri) {
      await downloadFile(identificationPendingRequest.newFileUri);
      return;
    }

    if (identificationUri) {
      await downloadFile(identificationUri);
      return;
    }

    try {
      const uri = await downloadMyDocument('id_card');
      await downloadFile(uri);
    } catch {
      Alert.alert('Download unavailable', 'No identification file is available to download yet.');
    }
  };

  const closePendingRequestSheet = () => {
    setShowPendingRequestSheet(false);
    setPendingRequestSheet(null);
  };

  const handlePendingRequestDeleted = (deleted: PendingRequestSheetData) => {
    if (deleted.kind === 'field') {
      refreshPendingFields();
      return;
    }

    setIdentificationPendingRequest(null);
    if (deleted.newFileUri && deleted.newFileUri === identificationUri) {
      setIdentificationUri(null);
    }

    if (user_id) {
      syncDocuments(user_id, { force: true });
    }
  };

  const codeDisplay = useMemo(() => {
    if (noCode || !code) return '------';
    if (!codeVisible) return '******';
    return formatAccessCode(code);
  }, [code, codeVisible, noCode]);

  const canCopyCode = Boolean(code && !noCode);

  const handleCopyCode = useCallback(async () => {
    if (!canCopyCode) {
      Alert.alert('No access code', 'Generate an access code first, then long-press it to copy.');
      return;
    }

    await Clipboard.setStringAsync(formatAccessCode(code!));
    setShowCopiedToast(true);

    if (copiedToastTimer.current) {
      clearTimeout(copiedToastTimer.current);
    }

    copiedToastTimer.current = setTimeout(() => {
      setShowCopiedToast(false);
    }, 2000);
  }, [canCopyCode, code]);

  useEffect(() => {
    return () => {
      if (copiedToastTimer.current) {
        clearTimeout(copiedToastTimer.current);
      }
    };
  }, []);

  const hasIdentification =
    !!(identificationUri || identificationPendingRequest || onboardingCache?.hasIdentification) &&
    (!uploadingIdentification || !!onboardingCache?.hasIdentification);
  const hasPhoto =
    !!(profilePhotoUri || onboardingCache?.hasPhoto) &&
    (!uploadingPhoto || !!onboardingCache?.hasPhoto);
  const onboardingStep = getProfileOnboardingStep(hasIdentification, hasPhoto);
  const isProfileLocked = onboardingStep !== null && !uploadingPhoto && !uploadingIdentification;

  const identificationDisplayValue = identificationPendingRequest
    ? identificationPendingRequest.newFileName || 'Uploaded'
    : identificationUri
      ? 'Uploaded'
      : 'Passport or ID card only';

  const handleOnboardingUpload = () => {
    if (onboardingStep === 'id') {
      setShowIdentificationSheet(true);
      return;
    }

    if (onboardingStep === 'photo') {
      setShowPhotoSheet(true);
    }
  };

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
                style={StyleSheet.absoluteFillObject}
                resizeMode="cover"
              />
            ) : (
              <View className="flex-1 items-center justify-center bg-[#F4FFFE]"></View>
            )}

            {uploadingPhoto || documentsImagesLoading ? (
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFillObject,
                  { alignItems: 'center', justifyContent: 'center' },
                ]}
              >
                <ActivityIndicator color="#1B998B" />
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
                style={[
                  StyleSheet.absoluteFillObject,
                  { backgroundColor: 'rgba(27, 153, 139, 0.5)' },
                ]}
              />
              <CameraIcon width={20} height={20} />
            </View>
          </View>
        </Pressable>

        <Text className="pt-[13px] text-[24px] leading-6 font-ubuntu-medium text-[#113E55]">
          Hi {first_name ?? 'there'}
        </Text>
      </View>

      {showAccessCode ? (
        <View className="mt-8 flex-row items-stretch justify-between rounded-[16px] bg-white p-4">
          <View className="flex-1 gap-2 ">
            <Text className="text-[11px] font-inter-regular text-[#6C6C6C]">My Access Code</Text>

            <View
              className="flex-row items-center gap-1"
              style={{ minHeight: isPreview ? 22 : 23 }}
            >
              {!isPreview ? (
                <>
                  <TouchableOpacity
                    onLongPress={handleCopyCode}
                    delayLongPress={400}
                    activeOpacity={0.6}
                    disabled={!canCopyCode}
                    hitSlop={{ top: 8, bottom: 8, left: 4, right: 4 }}
                    style={{ minHeight: 23, justifyContent: 'center' }}
                  >
                    <Text
                      className="text-[24px] font-ubuntu-medium text-primary"
                      style={{ lineHeight: 28, includeFontPadding: false, minWidth: 109 }}
                    >
                      {codeDisplay}
                    </Text>
                  </TouchableOpacity>
                  {code && !noCode ? (
                    <Pressable
                      onPress={() => setCodeVisible((visible) => !visible)}
                      hitSlop={8}
                      className="-mt-2"
                    >
                      <View className="h-4 w-4 items-center justify-center rounded-full bg-[#E0FFFC80]">
                        {codeVisible ? (
                          <EyeIcon width={9} height={9} />
                        ) : (
                          <HiddenEyeIcon width={9} height={9} />
                        )}
                      </View>
                    </Pressable>
                  ) : null}
                </>
              ) : null}
            </View>

            {isPreview ? (
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
            ) : null}
          </View>

          <View className="items-end justify-between">
            <Pressable onPress={() => router.push('/profile/access-log')} hitSlop={8}>
              <Text className="text-[11px] font-inter-semibold text-primary">View History</Text>
            </Pressable>

            <View className="flex-row gap-3">
              <Pressable
                onPress={handleGenerateCode}
                disabled={loading}
                hitSlop={8}
                className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#E0FFFC80]"
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#1B998B" />
                ) : (
                  <RefreshIcon width={16} height={16} />
                )}
              </Pressable>

              <Pressable
                onPress={() => {
                  if (code) setShowQrModal(true);
                  else handleGenerateCode();
                }}
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

      <View className="mt-4 flex-col gap-2 rounded-[16px] bg-white py-4">
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
        <ProfileFieldRow
          label="Phone Number"
          value={phone_number}
          pendingValue={pendingDetails.phoneNumber.newValue}
          onEdit={openEditProfile}
          onPendingPress={() => openPendingRequestSheet('phoneNumber', 'Phone Number')}
          hasPendingRequest={pendingFields.phoneNumber}
        />
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
        <ProfileFieldRow label="House Hold" value={estate_name} />
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

      <View className="mt-4 flex-row items-center gap-3.5">
        <View className="flex-1 rounded-[16px] bg-white">
          <ProfileFieldRow
            label="Identification"
            value={identificationDisplayValue}
            pendingValue={identificationPendingRequest?.newFileName}
            onEdit={handleIdentificationPress}
            onPendingPress={() => {
              if (identificationPendingRequest) {
                openPendingSheet(identificationPendingRequest);
              }
            }}
            hasPendingRequest={!!identificationPendingRequest}
          />
        </View>

        <Pressable
          onPress={handleIdentificationDownload}
          className="h-10 w-10 items-center justify-center rounded-full bg-white"
        >
          <DownloadIcon width={10} height={12} />
        </Pressable>
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
          <Pressable
            onPress={() => navigation.goBack()}
            className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1]"
          >
            <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
          </Pressable>

          {isProfileLocked ? (
            <Text className="text-[11px] font-inter-regular text-[#0A1F29]">
              {onboardingStep === 'id' ? '1/2' : '2/2'}
            </Text>
          ) : (
            <View className="h-[30px] w-[30px]" />
          )}
        </View>

        {isProfileLocked ? (
          <View className="w-full flex-1 justify-center ">
            {onboardingStep === 'id' ? (
              <View className="w-full items-center px-1">
                <ProfileOnboardingBanner
                  title="Verify Your ID"
                  description="Please upload your government issued ID to generate your access code."
                  onUpload={handleOnboardingUpload}
                />
              </View>
            ) : null}

            {onboardingStep === 'photo' ? (
              <View className="w-full items-center px-1">
                <ProfileOnboardingBanner
                  title="Upload Your Photo"
                  description="Please upload your passport to generate your access code."
                  onUpload={handleOnboardingUpload}
                />
              </View>
            ) : null}

            <View style={{ opacity: 0.35 }} pointerEvents="none" className="mt-6 w-full">
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

      <PendingRequestSheet
        visible={showPendingRequestSheet}
        request={pendingRequestSheet}
        onClose={closePendingRequestSheet}
        onDeleted={handlePendingRequestDeleted}
      />
    </SafeAreaView>
  );
}
