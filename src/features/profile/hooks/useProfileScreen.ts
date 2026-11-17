import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { router, useNavigation } from 'expo-router';
import * as Clipboard from 'expo-clipboard';
import { useUserStore } from '@/src/store/userStore';
import { useProfileDocumentsStore } from '@/src/features/profile/store/profileDocumentsStore';
import type { PendingRequestSheetData } from '@/src/features/admin/types/pendingRequest';
import {
  downloadMyDocument,
  getMyDocumentViewUri,
  getPendingDocumentViewUri,
  uploadUserDocument,
} from '@/src/features/profile/services/userDocuments';
import {
  useAccountVerification,
  useVerificationGate,
} from '@/src/features/auth/hooks/useAccountVerification';
import { useProfilePendingFields } from '@/src/features/profile/hooks/useProfilePendingFields';
import { useResidentAccessCode } from '@/src/features/profile/hooks/useResidentAccessCode';
import { ProfileFieldKey } from '@/src/features/profile/utils/profilePendingFields';
import {
  createIdentificationPendingRequest,
  DEFAULT_PENDING_ID_LABEL,
  downloadFile,
} from '@/src/features/admin/utils/pendingRequestHelpers';
import {
  getFilenameFromUri,
  getMimeTypeFromUri,
} from '@/src/features/profile/utils/userDocumentHelpers';
import { getProfileOnboardingStep } from '@/src/features/profile/components/ProfileOnboardingBanner';
import {
  accessCodeDisplay,
  formatAccessCode,
} from '@/src/features/profile/utils/residentAccessCode';
import {
  identificationDisplayValue,
  identificationPreview,
  profileLockState,
} from '@/src/features/profile/utils/profileIdentification';

/** Platform alert (the screen passes `Alert.alert`). */
type Notify = (title: string, message: string) => void;

/**
 * State and handlers for the native profile screen: access code card, pending edit requests,
 * profile photo / ID uploads, and the onboarding / awaiting-approval gating. The screen only lays
 * these out.
 */
export function useProfileScreen({ notify }: { notify: Notify }) {
  // Until the ID is approved only the photo and ID uploads work here; anything else shows the
  // Complete KYC modal.
  const { requireVerified } = useVerificationGate();
  const { approval: idApproval, blocked: verificationBlocked } = useAccountVerification();
  const navigation = useNavigation();
  const user_id = useUserStore((s) => s.user_id);
  const role = useUserStore((s) => s.role);
  const showAccessCode = role !== 'security';

  const [codeVisible, setCodeVisible] = useState(false);
  const accessCode = useResidentAccessCode({
    enabled: showAccessCode,
    canGenerate: requireVerified,
    onGenerated: useCallback(() => setCodeVisible(true), []),
    onGenerateError: useCallback(
      () => notify('Could not generate code', 'Please try again later.'),
      [notify]
    ),
  });
  const { code, noCode, loading, fetchMyCode } = accessCode;

  const [showQrModal, setShowQrModal] = useState(false);
  const [showPhotoSheet, setShowPhotoSheet] = useState(false);
  const [showIdentificationSheet, setShowIdentificationSheet] = useState(false);
  const [showIdentificationPreview, setShowIdentificationPreview] = useState(false);
  const profilePhotoUri = useProfileDocumentsStore((state) => state.profilePhotoUri);
  const identificationUri = useProfileDocumentsStore((state) => state.identificationUri);
  const identificationContentType = useProfileDocumentsStore(
    (state) => state.identificationContentType
  );
  const pendingIdentificationContentType = useProfileDocumentsStore(
    (state) => state.pendingIdentificationContentType
  );
  const identificationPendingRequest = useProfileDocumentsStore(
    (state) => state.identificationPendingRequest
  );
  const onboardingCache = useProfileDocumentsStore((state) => state.onboarding);
  const documentsImagesLoading = useProfileDocumentsStore((state) => state.imagesLoading);
  const idRejected = useProfileDocumentsStore((state) => state.idRejected);
  const syncDocuments = useProfileDocumentsStore((state) => state.syncDocuments);
  const markOnboardingStep = useProfileDocumentsStore((state) => state.markOnboardingStep);
  const setProfilePhotoUri = useProfileDocumentsStore((state) => state.setProfilePhotoUri);
  const setIdentificationUri = useProfileDocumentsStore((state) => state.setIdentificationUri);
  const setIdentificationPendingRequest = useProfileDocumentsStore(
    (state) => state.setIdentificationPendingRequest
  );
  const [pendingRequestSheet, setPendingRequestSheet] = useState<PendingRequestSheetData | null>(
    null
  );
  const [showPendingRequestSheet, setShowPendingRequestSheet] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [uploadingIdentification, setUploadingIdentification] = useState(false);
  const copiedToastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pendingDetails, pendingFields, refreshPendingFields } = useProfilePendingFields(user_id);

  useEffect(() => {
    if (!user_id) return;
    syncDocuments(user_id);
  }, [user_id, syncDocuments]);

  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (showAccessCode) fetchMyCode();
    });
    return unsubscribe;
  }, [navigation, fetchMyCode, showAccessCode]);

  // The admin may have approved or rejected the ID since the last visit: refresh on every visit.
  // `force` skips the 10-minute freshness window (a rejection would otherwise stay hidden for that
  // long); approved users' document images still come from the cache.
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      if (user_id) void syncDocuments(user_id, { force: true });
    });
    return unsubscribe;
  }, [navigation, user_id, syncDocuments]);

  const openEditProfile = () => {
    if (!requireVerified()) return;
    router.push('/profile/edit');
  };

  const openAccessLog = () => {
    if (!requireVerified()) return;
    router.push('/profile/access-log');
  };

  const toggleCodeVisible = () => {
    if (!requireVerified()) return;
    setCodeVisible((visible) => !visible);
  };

  const handleQrPress = () => {
    if (!requireVerified()) return;
    if (code) setShowQrModal(true);
    else accessCode.handleGenerateCode();
  };

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
    setShowPhotoSheet(true);
  };

  const handlePhotoSelected = async (uri: string) => {
    const previousPhotoUri = useProfileDocumentsStore.getState().profilePhotoUri;
    setUploadingPhoto(true);
    setProfilePhotoUri(uri);

    try {
      const result = await uploadUserDocument(uri, 'profile_picture');

      if (user_id) {
        await markOnboardingStep(user_id, { hasPhoto: true });
      }

      useProfileDocumentsStore.setState({
        photoDocumentId: result.document_id,
        lastSyncedAt: Date.now(),
      });
      setShowPhotoSheet(false);
      setUploadingPhoto(false);

      // Refresh authenticated preview in the background; local URI is already shown.
      void getMyDocumentViewUri('profile_picture', result.content_type)
        .then((photoUri) => {
          setProfilePhotoUri(photoUri);
        })
        .catch(() => {
          // Keep the local picker URI if the authenticated view fetch fails.
        });
    } catch (error: unknown) {
      setProfilePhotoUri(previousPhotoUri);
      setUploadingPhoto(false);
      notify('Upload failed', thrownMessage(error)?.trim() || 'Could not upload profile photo.');
    }
  };

  const handleIdentificationPress = () => {
    if (identificationPendingRequest) {
      openPendingSheet(identificationPendingRequest);
      return;
    }

    setShowIdentificationSheet(true);
  };

  const handleIdentificationPendingPress = () => {
    if (identificationPendingRequest) {
      openPendingSheet(identificationPendingRequest);
    }
  };

  const handleIdentificationSelected = async (uri: string) => {
    setUploadingIdentification(true);
    try {
      // The server attaches a re-submitted ID to the existing request itself; nothing more to call.
      const result = await uploadUserDocument(uri, 'id_card');

      if (user_id) {
        await markOnboardingStep(user_id, { hasIdentification: true });
      }

      const requestId = result.edit_request_id ?? `local-identification-${result.document_id}`;
      const fileName = getFilenameFromUri(uri, 'Uploaded ID');

      if (result.document_status === 'pending') {
        setIdentificationPendingRequest(
          createIdentificationPendingRequest({
            requestId,
            newFileName: fileName,
            newFileUri: uri,
            currentFileUri: identificationUri,
            currentFileName: identificationUri ? 'Current ID' : DEFAULT_PENDING_ID_LABEL,
          })
        );
        // The server says the ID now waits for an admin: reflect that straight away so this screen
        // shows "Waiting Approval" and the Complete KYC modal sends the user back here. A user whose
        // ID is already approved is only changing it: they stay verified while the request is open.
        const alreadyApproved = useProfileDocumentsStore.getState().idApproval === 'approved';
        useProfileDocumentsStore.setState({
          pendingIdDocumentId: result.document_id,
          pendingIdentificationContentType:
            result.content_type ?? getMimeTypeFromUri(uri, 'id_card'),
          idApproval: alreadyApproved ? 'approved' : 'pending',
          // A just-uploaded ID hasn't been reviewed, so it can't be rejected yet.
          idRejected: false,
          idRejectionDocumentId: result.document_id,
          lastSyncedAt: Date.now(),
        });
        if (user_id) {
          void useProfileDocumentsStore.getState().checkIdRejection(user_id, result.document_id);
        }
      } else {
        setIdentificationUri(uri, getMimeTypeFromUri(uri, 'id_card'));
        setIdentificationPendingRequest(null);
        useProfileDocumentsStore.setState({
          activeIdDocumentId: result.document_id,
          pendingIdDocumentId: null,
          lastSyncedAt: Date.now(),
        });
      }

      setShowIdentificationSheet(false);
      setUploadingIdentification(false);

      // Refresh authenticated preview in the background; local URI is already shown.
      if (result.document_status === 'pending' && result.document_id) {
        void getPendingDocumentViewUri(result.document_id, result.content_type)
          .then((pendingUri) => {
            const current = useProfileDocumentsStore.getState().identificationPendingRequest;
            if (current?.requestId === requestId) {
              setIdentificationPendingRequest({
                ...current,
                newFileUri: pendingUri,
                newFileName: getFilenameFromUri(pendingUri, fileName),
              });
            }
          })
          .catch(() => {
            // Local picker URI is enough until preview loads later.
          });
      } else if (result.document_status !== 'pending') {
        void getMyDocumentViewUri('id_card', result.content_type)
          .then((activeUri) => {
            setIdentificationUri(activeUri, result.content_type);
          })
          .catch(() => {
            // Keep local picker URI if view fetch fails.
          });
      }
    } catch (error: unknown) {
      setUploadingIdentification(false);
      notify('Upload failed', thrownMessage(error)?.trim() || 'Could not upload identification.');
    }
  };

  const handleIdentificationDownload = async () => {
    if (!requireVerified()) return;
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
      notify('Download unavailable', 'No identification file is available to download yet.');
    }
  };

  const { uri: identificationPreviewUri, contentType: identificationPreviewContentType } =
    identificationPreview(
      identificationPendingRequest,
      identificationUri,
      identificationContentType,
      pendingIdentificationContentType
    );

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

  const codeDisplay = useMemo(
    () => accessCodeDisplay(code, noCode, codeVisible),
    [code, codeVisible, noCode]
  );

  const canCopyCode = Boolean(code && !noCode);

  const handleCopyCode = useCallback(async () => {
    if (!requireVerified()) return;
    if (!canCopyCode) {
      notify('No access code', 'Generate an access code first, then long-press it to copy.');
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
  }, [canCopyCode, code, notify, requireVerified]);

  useEffect(() => {
    return () => {
      if (copiedToastTimer.current) {
        clearTimeout(copiedToastTimer.current);
      }
    };
  }, []);

  const hasIdentification = Boolean(
    identificationUri || identificationPendingRequest || onboardingCache?.hasIdentification
  );
  const hasPhoto = Boolean(profilePhotoUri || onboardingCache?.hasPhoto);
  // Always the user's real step (photo, then ID), however the screen was opened.
  const onboardingStep = getProfileOnboardingStep(hasIdentification, hasPhoto);
  // Photo and ID are in, the ID is waiting for an admin: show "Waiting Approval" over a faded profile.
  const { isProfileLocked, isAwaitingApproval } = profileLockState({
    onboardingStep,
    uploading: uploadingPhoto || uploadingIdentification,
    verificationBlocked,
    idPending: idApproval === 'pending' || !!identificationPendingRequest,
  });

  const handleOnboardingUpload = () => {
    if (onboardingStep === 'id') {
      setShowIdentificationSheet(true);
      return;
    }

    if (onboardingStep === 'photo') {
      setShowPhotoSheet(true);
    }
  };

  return {
    navigation,
    showAccessCode,
    accessCode,
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
    uploadingIdentification,
    identificationUri,
    identificationPendingRequest,
    identificationDisplayValue: identificationDisplayValue(
      identificationPendingRequest,
      identificationUri
    ),
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
  };
}
