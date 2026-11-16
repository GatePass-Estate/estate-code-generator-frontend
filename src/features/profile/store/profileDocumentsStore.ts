import { create } from 'zustand';
import { PendingRequestSheetData } from '@/src/features/admin/types/pendingRequest';
import { refreshEstateEntitlements } from '@/src/features/billing';
import { checkPendingRequests, getMyRequests } from '@/src/features/admin/services/requests';
import { isPendingIdRejected } from '@/src/features/profile/utils/idRejection';
import {
  getMyDocumentViewUri,
  getMyDocuments,
  getPendingDocumentViewUri,
} from '@/src/features/profile/services/userDocuments';
import {
  createIdentificationPendingRequest,
  DEFAULT_PENDING_ID_LABEL,
} from '@/src/features/admin/utils/pendingRequestHelpers';
import {
  getProfileOnboardingCache,
  setProfileOnboardingCache,
} from '@/src/features/profile/utils/profileOnboardingCache';
import { getFilenameFromUri } from '@/src/features/profile/utils/userDocumentHelpers';

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

/** `null` until the documents have loaded once; only an admin-approved (active) ID is `approved`. */
export type IdApproval = 'none' | 'pending' | 'approved' | null;

function idApprovalOf(activeId?: DocumentItem, pendingId?: DocumentItem): IdApproval {
  if (activeId) return 'approved';
  if (pendingId) return 'pending';
  return 'none';
}

type SyncOptions = {
  force?: boolean;
  skipPhotoClear?: boolean;
};

type ProfileDocumentsStore = {
  userId: string | null;
  profilePhotoUri: string | null;
  identificationUri: string | null;
  identificationContentType: string | null;
  pendingIdentificationContentType: string | null;
  identificationPendingRequest: PendingRequestSheetData | null;
  onboarding: OnboardingState | null;
  idApproval: IdApproval;
  /**
   * The pending ID is one the admin rejected; the user should upload a new one. `null` while that
   * is still being checked, so the profile doesn't show "Waiting Approval" before it knows.
   */
  idRejected: boolean | null;
  /** The pending ID that `idRejected` describes. */
  idRejectionDocumentId: string | null;
  imagesLoading: boolean;
  photoDocumentId: string | null;
  activeIdDocumentId: string | null;
  pendingIdDocumentId: string | null;
  lastSyncedAt: number | null;
  syncInFlight: boolean;
  clear: () => void;
  markOnboardingStep: (userId: string, partial: Partial<OnboardingState>) => Promise<void>;
  setProfilePhotoUri: (uri: string | null) => void;
  setIdentificationUri: (uri: string | null, contentType?: string | null) => void;
  setIdentificationPendingRequest: (request: PendingRequestSheetData | null) => void;
  syncDocuments: (userId: string, options?: SyncOptions) => Promise<void>;
  checkIdRejection: (userId: string, pendingDocumentId: string | null) => Promise<void>;
};

const initialState = {
  userId: null,
  profilePhotoUri: null,
  identificationUri: null,
  identificationContentType: null,
  pendingIdentificationContentType: null,
  identificationPendingRequest: null,
  onboarding: null,
  idApproval: null as IdApproval,
  idRejected: null as boolean | null,
  idRejectionDocumentId: null as string | null,
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

  setIdentificationUri: (uri, contentType) =>
    set({
      identificationUri: uri,
      identificationContentType:
        uri == null
          ? null
          : contentType !== undefined
            ? contentType
            : get().identificationContentType,
    }),

  setIdentificationPendingRequest: (request) => set({ identificationPendingRequest: request }),

  checkIdRejection: async (userId, pendingDocumentId) => {
    // Only a first ID still waiting for approval can be "rejected"; anything else clears it.
    if (!pendingDocumentId) {
      set({ idRejected: false, idRejectionDocumentId: null });
      return;
    }
    // A different ID than last time: its answer isn't known yet.
    if (get().idRejectionDocumentId !== pendingDocumentId) {
      set({ idRejected: null, idRejectionDocumentId: pendingDocumentId });
    }
    try {
      const { items } = await getMyRequests(1, 20);
      if (get().userId === userId && get().idRejectionDocumentId === pendingDocumentId) {
        set({ idRejected: isPendingIdRejected(items, pendingDocumentId) });
      }
    } catch {
      // Requests unavailable: fall back to "Waiting Approval" rather than loading forever.
      if (get().idRejected === null) set({ idRejected: false });
    }
  },

  syncDocuments: async (userId, { force = false, skipPhotoClear = false } = {}) => {
    const state = get();

    if (state.userId && state.userId !== userId) {
      set({ ...initialState, userId });
    } else if (!state.userId) {
      set({ userId });
    }

    const current = get();
    // Until the ID is approved an admin can approve or reject it at any moment, so only an approved
    // user's documents are served from the cache.
    if (
      !force &&
      current.idApproval === 'approved' &&
      current.userId === userId &&
      current.lastSyncedAt &&
      Date.now() - current.lastSyncedAt < STALE_MS
    ) {
      return;
    }

    if (current.syncInFlight) return;

    set({ syncInFlight: true });

    // Every write below happens after an await. If the user signed out (clear()) or another
    // account started syncing meanwhile, this sync's results belong to nobody on screen now.
    const setForUser = (
      partial:
        | Partial<ProfileDocumentsStore>
        | ((state: ProfileDocumentsStore) => Partial<ProfileDocumentsStore>)
    ) => {
      if (get().userId === userId) set(partial);
    };

    const cached = await getProfileOnboardingCache(userId);
    if (cached) {
      setForUser({ onboarding: cached });
    }

    let activePhoto: DocumentItem | undefined;
    let activeId: DocumentItem | undefined;
    let pendingId: DocumentItem | undefined;

    try {
      const { documents } = await getMyDocuments();
      ({ activePhoto, activeId, pendingId } = findProfileDocuments(documents));

      // A rejected ID change stays `pending` in the documents, so ask the request itself. Once the
      // admin has rejected it, the user's approved ID stands and nothing is waiting any more.
      if (activeId && pendingId?.document_id) {
        try {
          const { items } = await getMyRequests(1, 20);
          if (isPendingIdRejected(items, pendingId.document_id)) pendingId = undefined;
        } catch {
          // Requests unavailable: keep showing it as pending.
        }
      }

      const onboarding = buildOnboardingState(activePhoto, activeId, pendingId);
      const previousApproval = get().idApproval;
      const idApproval = idApprovalOf(activeId, pendingId);
      setForUser({ onboarding, idApproval });
      // The server withholds the estate plan until the ID is approved, so whatever was cached
      // (a refusal) is out of date the moment it is.
      if (
        idApproval === 'approved' &&
        (previousApproval === 'none' || previousApproval === 'pending')
      ) {
        refreshEstateEntitlements();
      }
      void get().checkIdRejection(userId, activeId ? null : (pendingId?.document_id ?? null));
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
        setForUser({
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
          identificationContentType:
            get().activeIdDocumentId === activeId?.document_id
              ? get().identificationContentType
              : null,
          pendingIdentificationContentType: pendingId?.content_type ?? null,
        });
      } else if (activeId) {
        setForUser({
          identificationPendingRequest: null,
          pendingIdentificationContentType: null,
        });
      } else {
        setForUser({
          identificationUri: null,
          identificationContentType: null,
          pendingIdentificationContentType: null,
          identificationPendingRequest: null,
        });
      }

      if (!activePhoto && !skipPhotoClear) {
        setForUser({ profilePhotoUri: null, photoDocumentId: null });
      }
    } catch {
      setForUser({ syncInFlight: false });
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
            setForUser({ profilePhotoUri: uri, photoDocumentId: photoId });
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

          setForUser((prev) => ({
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
            identificationContentType: currentUri ? (activeId?.content_type ?? null) : null,
            pendingIdentificationContentType: pendingId.content_type ?? null,
            activeIdDocumentId: activeIdDocId,
            pendingIdDocumentId: pendingIdDocId,
          }));
        })()
      );
    } else if (shouldFetchActiveId && activeId) {
      imageTasks.push(
        getMyDocumentViewUri('id_card', activeId.content_type)
          .then((uri) => {
            setForUser({
              identificationUri: uri,
              identificationContentType: activeId.content_type ?? null,
              pendingIdentificationContentType: null,
              activeIdDocumentId: activeIdDocId,
              pendingIdDocumentId: null,
            });
          })
          .catch(() => setForUser({ identificationUri: null, identificationContentType: null }))
      );
    } else {
      setForUser({
        photoDocumentId: photoId ?? get().photoDocumentId,
        activeIdDocumentId: activeIdDocId,
        pendingIdDocumentId: pendingIdDocId,
      });
    }

    if (imageTasks.length > 0) {
      setForUser({ imagesLoading: true });
      try {
        await Promise.all(imageTasks);
      } finally {
        setForUser({ imagesLoading: false });
      }
    }

    setForUser({
      lastSyncedAt: Date.now(),
      syncInFlight: false,
      photoDocumentId: photoId ?? get().photoDocumentId,
      activeIdDocumentId: activeIdDocId,
      pendingIdDocumentId: pendingIdDocId,
    });
  },
}));
