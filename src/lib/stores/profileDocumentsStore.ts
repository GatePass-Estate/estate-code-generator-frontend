import { create } from 'zustand';
import { PendingRequestSheetData } from '@/src/components/mobile/PendingRequestSheet';
import { checkPendingRequests } from '@/src/lib/api/requests';
import {
  getMyDocumentViewUri,
  getMyDocuments,
  getPendingDocumentViewUri,
} from '@/src/lib/api/userDocuments';
import {
  createIdentificationPendingRequest,
  DEFAULT_PENDING_ID_LABEL,
} from '@/src/lib/pendingRequestHelpers';
import {
  getProfileOnboardingCache,
  setProfileOnboardingCache,
} from '@/src/lib/profileOnboardingCache';
import { getFilenameFromUri } from '@/src/lib/userDocumentHelpers';

const STALE_MS = 10 * 60 * 1000;

type OnboardingState = {
  hasIdentification: boolean;
  hasPhoto: boolean;
};

type DocumentItem = Awaited<ReturnType<typeof getMyDocuments>>['documents'][number];

function findProfileDocuments(documents: DocumentItem[]) {
  return {
    activePhoto: documents.find(
      (doc) => doc.document_type === 'profile_picture' && doc.document_status === 'active'
    ),
    activeId: documents.find(
      (doc) => doc.document_type === 'id_card' && doc.document_status === 'active'
    ),
    pendingId: documents.find(
      (doc) => doc.document_type === 'id_card' && doc.document_status === 'pending'
    ),
  };
}

function buildOnboardingState(
  activePhoto?: DocumentItem,
  activeId?: DocumentItem,
  pendingId?: DocumentItem
): OnboardingState {
  return {
    hasIdentification: !!(pendingId || activeId),
    hasPhoto: !!activePhoto,
  };
}

type SyncOptions = {
  force?: boolean;
  skipPhotoClear?: boolean;
};

type ProfileDocumentsStore = {
  userId: string | null;
  profilePhotoUri: string | null;
  identificationUri: string | null;
  identificationPendingRequest: PendingRequestSheetData | null;
  onboarding: OnboardingState | null;
  imagesLoading: boolean;
  photoDocumentId: string | null;
  activeIdDocumentId: string | null;
  pendingIdDocumentId: string | null;
  lastSyncedAt: number | null;
  syncInFlight: boolean;
  clear: () => void;
  markOnboardingStep: (userId: string, partial: Partial<OnboardingState>) => Promise<void>;
  setProfilePhotoUri: (uri: string | null) => void;
  setIdentificationUri: (uri: string | null) => void;
  setIdentificationPendingRequest: (request: PendingRequestSheetData | null) => void;
  syncDocuments: (userId: string, options?: SyncOptions) => Promise<void>;
};

const initialState = {
  userId: null,
  profilePhotoUri: null,
  identificationUri: null,
  identificationPendingRequest: null,
  onboarding: null,
  imagesLoading: false,
  photoDocumentId: null,
  activeIdDocumentId: null,
  pendingIdDocumentId: null,
  lastSyncedAt: null,
  syncInFlight: false,
};

export const useProfileDocumentsStore = create<ProfileDocumentsStore>((set, get) => ({
  ...initialState,

  clear: () => set(initialState),

  markOnboardingStep: async (userId, partial) => {
    const current = get().onboarding ?? { hasIdentification: false, hasPhoto: false };
    set({ onboarding: { ...current, ...partial } });
    await setProfileOnboardingCache(userId, partial);
  },

  setProfilePhotoUri: (uri) => set({ profilePhotoUri: uri }),

  setIdentificationUri: (uri) => set({ identificationUri: uri }),

  setIdentificationPendingRequest: (request) => set({ identificationPendingRequest: request }),

  syncDocuments: async (userId, { force = false, skipPhotoClear = false } = {}) => {
    const state = get();

    if (state.userId && state.userId !== userId) {
      set({ ...initialState, userId });
    } else if (!state.userId) {
      set({ userId });
    }

    const current = get();
    if (
      !force &&
      current.userId === userId &&
      current.lastSyncedAt &&
      Date.now() - current.lastSyncedAt < STALE_MS
    ) {
      return;
    }

    if (current.syncInFlight) return;

    set({ syncInFlight: true });

    const cached = await getProfileOnboardingCache(userId);
    if (cached) {
      set({ onboarding: cached });
    }

    let activePhoto: DocumentItem | undefined;
    let activeId: DocumentItem | undefined;
    let pendingId: DocumentItem | undefined;

    try {
      const { documents } = await getMyDocuments();
      ({ activePhoto, activeId, pendingId } = findProfileDocuments(documents));

      const onboarding = buildOnboardingState(activePhoto, activeId, pendingId);
      set({ onboarding });
      await setProfileOnboardingCache(userId, onboarding);

      if (pendingId?.document_id) {
        let requestId = `local-identification-${pendingId.document_id}`;
        try {
          const pendingCheck = await checkPendingRequests('id_change');
          requestId = pendingCheck.pending_request?.id ?? requestId;
        } catch {
          // Fall back to the local request id from document metadata.
        }

        const existingPending = get().identificationPendingRequest;
        set({
          identificationPendingRequest:
            existingPending?.requestId === requestId
              ? existingPending
              : createIdentificationPendingRequest({
                  requestId,
                  newFileName: existingPending?.newFileName ?? 'Uploaded ID',
                  newFileUri: existingPending?.newFileUri ?? null,
                  currentFileName: existingPending?.currentFileName ?? DEFAULT_PENDING_ID_LABEL,
                  currentFileUri: existingPending?.currentFileUri ?? null,
                }),
          identificationUri:
            get().activeIdDocumentId === activeId?.document_id ? get().identificationUri : null,
        });
      } else if (activeId) {
        set({ identificationPendingRequest: null });
      } else {
        set({ identificationUri: null, identificationPendingRequest: null });
      }

      if (!activePhoto && !skipPhotoClear) {
        set({ profilePhotoUri: null, photoDocumentId: null });
      }
    } catch {
      set({ syncInFlight: false });
      return;
    }

    const photoId = activePhoto?.document_id ?? null;
    const activeIdDocId = activeId?.document_id ?? null;
    const pendingIdDocId = pendingId?.document_id ?? null;

    const imageTasks: Promise<void>[] = [];
    const snapshot = get();

    const shouldFetchPhoto =
      photoId && (photoId !== snapshot.photoDocumentId || !snapshot.profilePhotoUri);
    const shouldFetchActiveId =
      !pendingIdDocId &&
      activeIdDocId &&
      (activeIdDocId !== snapshot.activeIdDocumentId || !snapshot.identificationUri);
    const shouldFetchPendingId =
      pendingIdDocId &&
      (pendingIdDocId !== snapshot.pendingIdDocumentId ||
        !snapshot.identificationPendingRequest?.newFileUri);

    if (shouldFetchPhoto && activePhoto) {
      imageTasks.push(
        getMyDocumentViewUri('profile_picture', activePhoto.content_type)
          .then((uri) => {
            set({ profilePhotoUri: uri, photoDocumentId: photoId });
          })
          .catch(() => {})
      );
    }

    if (shouldFetchPendingId && pendingId) {
      imageTasks.push(
        (async () => {
          let pendingUri: string | null = null;
          let currentUri: string | null = null;

          try {
            pendingUri = await getPendingDocumentViewUri(
              pendingId.document_id!,
              pendingId.content_type
            );
          } catch {
            // Preview can load later.
          }

          if (activeId) {
            try {
              currentUri = await getMyDocumentViewUri('id_card', activeId.content_type);
            } catch {
              // Ignore view fetch errors for the current active ID.
            }
          }

          set((prev) => ({
            identificationPendingRequest: prev.identificationPendingRequest
              ? {
                  ...prev.identificationPendingRequest,
                  newFileName: pendingUri
                    ? getFilenameFromUri(pendingUri, 'Uploaded ID')
                    : prev.identificationPendingRequest.newFileName,
                  newFileUri: pendingUri,
                  currentFileName: currentUri
                    ? 'Current ID'
                    : prev.identificationPendingRequest.currentFileName,
                  currentFileUri: currentUri,
                }
              : prev.identificationPendingRequest,
            identificationUri: currentUri,
            activeIdDocumentId: activeIdDocId,
            pendingIdDocumentId: pendingIdDocId,
          }));
        })()
      );
    } else if (shouldFetchActiveId && activeId) {
      imageTasks.push(
        getMyDocumentViewUri('id_card', activeId.content_type)
          .then((uri) => {
            set({
              identificationUri: uri,
              activeIdDocumentId: activeIdDocId,
              pendingIdDocumentId: null,
            });
          })
          .catch(() => set({ identificationUri: null }))
      );
    } else {
      set({
        photoDocumentId: photoId ?? get().photoDocumentId,
        activeIdDocumentId: activeIdDocId,
        pendingIdDocumentId: pendingIdDocId,
      });
    }

    if (imageTasks.length > 0) {
      set({ imagesLoading: true });
      try {
        await Promise.all(imageTasks);
      } finally {
        set({ imagesLoading: false });
      }
    }

    set({
      lastSyncedAt: Date.now(),
      syncInFlight: false,
      photoDocumentId: photoId ?? get().photoDocumentId,
      activeIdDocumentId: activeIdDocId,
      pendingIdDocumentId: pendingIdDocId,
    });
  },
}));
