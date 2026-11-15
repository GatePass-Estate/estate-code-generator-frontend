import { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useGoBack } from '@/src/shared/hooks/useGoBack';
import { errorStatus, userFacingError } from '@/src/shared/services/api/errors';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { useUserStore } from '@/src/store/userStore';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import { useAuth } from '@/src/features/auth/hooks/useAuthContext';
import {
  deactivateUser,
  deleteUser,
  demoteToResident,
  getUserByIdAdmin,
  promoteToAdmin,
  resendEmailVerification,
} from '@/src/features/users/services/user';
import type { User } from '@/src/features/users/types/user';
import { getUserDocuments } from '@/src/features/profile/services/userDocuments';
import {
  getCachedUserDocument,
  loadUserDocument,
  removeCachedUserDocument,
} from '@/src/features/profile/services/userDocumentCache';
import type { DocumentType } from '@/src/features/profile/types/userDocuments';
import { getHouseholdById, transferUserHousehold } from '@/src/features/admin/services/households';
import { transferPrimaryAdmin } from '@/src/features/admin/services/estate';
import type { Household } from '@/src/features/admin/types/household';
import {
  hasApprovedIdDocument,
  PROMOTE_REQUIRES_APPROVED_ID_MESSAGE,
} from '@/src/features/admin/utils/roleChange';
import {
  emptyUser,
  getProfilePermissions,
  profileActionCopy,
  userFromListRow,
  type ProfileAction,
} from '@/src/features/admin/utils/userProfile';

export type DocumentLoadState = 'loading' | 'loaded' | 'missing' | 'pending' | 'error';

type LoadedDocument = { uri: string | null; contentType: string | null; state: DocumentLoadState };

/**
 * The user's active document of this type, loaded through the on-device document cache. A
 * failed request falls back to the cached copy (or the error state); it never throws.
 */
async function fetchProfileDocument(
  userId: string,
  documentType: Extract<DocumentType, 'profile_picture' | 'id_card'>
): Promise<LoadedDocument> {
  const cached = getCachedUserDocument(userId, documentType);
  try {
    const { documents } = await getUserDocuments(userId, documentType, ['active', 'pending']);
    const active = documents.find(
      (document) => document.document_type === documentType && document.document_status === 'active'
    );
    const pending = documents.find(
      (document) =>
        document.document_type === documentType && document.document_status === 'pending'
    );
    if (!active) {
      removeCachedUserDocument(userId, documentType);
      return { uri: null, contentType: null, state: pending ? 'pending' : 'missing' };
    }
    const document = await loadUserDocument(userId, documentType, active);
    return { uri: document.uri, contentType: active.content_type ?? null, state: 'loaded' };
  } catch {
    return {
      uri: cached?.uri ?? null,
      contentType: cached?.contentType ?? null,
      state: cached ? 'loaded' : 'error',
    };
  }
}

/** Profile picture / ID card for the profile: cached copy first, then the latest from the API. */
function useProfileDocument(
  userId: string,
  documentType: Extract<DocumentType, 'profile_picture' | 'id_card'>,
  enabled: boolean
) {
  const query = useQuery({
    queryKey: queryKeys.admin.userDocument(userId, documentType),
    queryFn: () => fetchProfileDocument(userId, documentType),
    enabled: enabled && Boolean(userId),
    // Re-checked on every visit / expand, like the screen always did.
    staleTime: 0,
  });
  // A file that fails to render is dropped from the cache and shows the fallback.
  const [brokenUri, setBrokenUri] = useState<string | null>(null);

  const cached = userId ? getCachedUserDocument(userId, documentType) : null;
  const loaded: LoadedDocument = !enabled
    ? { uri: null, contentType: null, state: 'missing' }
    : (query.data ?? {
        uri: cached?.uri ?? null,
        contentType: cached?.contentType ?? null,
        state: cached ? 'loaded' : 'loading',
      });
  const isBroken = loaded.uri !== null && loaded.uri === brokenUri;

  const onRenderError = () => {
    if (!loaded.uri) return;
    removeCachedUserDocument(userId, documentType, loaded.uri);
    setBrokenUri(loaded.uri);
  };

  return {
    uri: isBroken ? null : loaded.uri,
    contentType: loaded.contentType,
    state: isBroken ? ('error' as const) : loaded.state,
    onRenderError,
  };
}

/**
 * Admin view of one user: the profile (falls back to the cached All Users row when the profile
 * API 404s an inactive user), household name, profile picture and ID card, and the admin actions.
 */
export function useAdminUserProfile(routeUserId: string | string[] | undefined) {
  const goBack = useGoBack();
  const { signOut } = useAuth();
  const viewerRole = useAuthStore((state) => state.role);
  const viewerUserId = useUserStore((state) => state.user_id);
  // SEC-21 / PERF-19: pass ID only — never trust a user JSON blob from the route.
  const userId = typeof routeUserId === 'string' ? routeUserId : '';

  const userQuery = useQuery({
    queryKey: queryKeys.users.byIdAdmin(userId),
    queryFn: () => getUserByIdAdmin(userId),
    enabled: Boolean(userId),
    // The All Users row seeded on tap is only a fallback: always ask the API on open.
    refetchOnMount: 'always',
  });
  const status = userQuery.isError ? errorStatus(userQuery.error) : undefined;
  const usingListRow =
    userQuery.isError && Boolean(userQuery.data) && (status === 404 || status === 403);

  const loading = Boolean(userId) && !userQuery.isFetchedAfterMount;
  const error = !userId
    ? 'User not found'
    : userQuery.isError && !usingListRow
      ? userFacingError(userQuery.error, 'Failed to load user data')
      : null;

  const baseUser: User =
    userQuery.data && !loading
      ? usingListRow
        ? userFromListRow(userQuery.data, userId)
        : userQuery.data
      : emptyUser(userId);

  const householdQuery = useQuery({
    queryKey: queryKeys.admin.household(baseUser.household_id ?? ''),
    queryFn: () => getHouseholdById(baseUser.household_id as string),
    enabled: Boolean(baseUser.household_id) && !baseUser.household_name,
  });
  const userData: User =
    !baseUser.household_name && householdQuery.data
      ? { ...baseUser, household_name: householdQuery.data.name }
      : baseUser;

  const permissions = getProfilePermissions({
    user: userData,
    routeUserId: userId,
    viewerRole,
    viewerUserId,
  });

  // The ID section opens for residents, once per profile load.
  const [identificationExpanded, setIdentificationExpanded] = useState(true);
  const expandedInitFor = useRef<string | null>(null);
  const loadedRole = !loading && !error ? userData.role : undefined;
  useEffect(() => {
    if (!loadedRole || expandedInitFor.current === userId) return;
    expandedInitFor.current = userId;
    setIdentificationExpanded(loadedRole === 'resident');
  }, [loadedRole, userId]);

  const picture = useProfileDocument(userId, 'profile_picture', permissions.isVerifiedProfile);
  const identification = useProfileDocument(
    userId,
    'id_card',
    permissions.isVerifiedProfile && identificationExpanded
  );

  const updateCachedUser = (patch: Partial<User>) => {
    queryClient.setQueryData<User>(queryKeys.users.byIdAdmin(userId), (current) =>
      current ? { ...current, ...patch } : current
    );
  };

  const [deactivating, setDeactivating] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [actionError, setActionError] = useState('');
  const [promotionError, setPromotionError] = useState('');
  const [pendingAction, setPendingAction] = useState<ProfileAction | null>(null);
  const [showHouseholdSelector, setShowHouseholdSelector] = useState(false);
  const [transferringHousehold, setTransferringHousehold] = useState(false);

  const handleDeactivate = async () => {
    setDeactivating(true);
    setActionError('');
    try {
      await deactivateUser(userId);
      goBack();
    } catch (err) {
      setActionError(
        err instanceof Error ? err.message : 'Failed to deactivate user. Please try again.'
      );
    } finally {
      setDeactivating(false);
    }
  };

  const handleResendEmail = async () => {
    setProcessing(true);
    setActionError('');
    try {
      await resendEmailVerification(userId);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to resend email.');
    } finally {
      setProcessing(false);
    }
  };

  const handleDeleteUser = async () => {
    setProcessing(true);
    setActionError('');
    try {
      await deleteUser(userId);
      goBack();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete user.');
    } finally {
      setProcessing(false);
    }
  };

  const handlePromoteOrDemote = async (action: 'promote' | 'demote') => {
    setProcessing(true);
    setActionError('');
    if (action === 'promote') setPromotionError('');
    try {
      if (action === 'promote') {
        const { documents } = await getUserDocuments(userId, 'id_card', ['active']);
        if (!hasApprovedIdDocument(documents)) {
          setPromotionError(PROMOTE_REQUIRES_APPROVED_ID_MESSAGE);
          return false;
        }
        await promoteToAdmin(userId);
      } else {
        await demoteToResident(userId);
      }
      updateCachedUser({ role: action === 'promote' ? 'admin' : 'resident' });
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update user role.';
      if (action === 'promote') setPromotionError(message);
      else setActionError(message);
      return false;
    } finally {
      setProcessing(false);
    }
  };

  const handleTransferPrimary = async () => {
    if (!userData.estate_id) {
      setActionError('Estate information is unavailable for this user.');
      return;
    }

    setProcessing(true);
    setActionError('');
    try {
      await transferPrimaryAdmin(userData.estate_id, userId);
      await signOut();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to transfer primary admin.');
    } finally {
      setProcessing(false);
    }
  };

  const confirmProfileAction = async () => {
    const action = pendingAction;
    if (!action) return;
    setPendingAction(null);
    if (action === 'deactivate') {
      await handleDeactivate();
    } else if (action === 'transferPrimary') {
      await handleTransferPrimary();
    } else {
      await handlePromoteOrDemote(action);
    }
  };

  const handleHouseholdTransfer = async (household: Household) => {
    if (household.id === userData.household_id) {
      setShowHouseholdSelector(false);
      setActionError(`${userData.first_name || 'This user'} is already in ${household.name}.`);
      return;
    }

    setTransferringHousehold(true);
    setActionError('');
    try {
      await transferUserHousehold({ user_id: userId, household_id: household.id });
      updateCachedUser({ household_id: household.id, household_name: household.name });
      void queryClient.invalidateQueries({ queryKey: queryKeys.estateUsers.all });
      setShowHouseholdSelector(false);
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to transfer household.');
    } finally {
      setTransferringHousehold(false);
    }
  };

  return {
    userId,
    loading,
    error,
    retry: () => {
      void userQuery.refetch();
    },
    userData,
    ...permissions,
    identificationExpanded,
    toggleIdentification: () => setIdentificationExpanded((current) => !current),
    picture,
    identification,
    deactivating,
    processing,
    actionError,
    promotionError,
    clearPromotionError: () => setPromotionError(''),
    pendingAction,
    setPendingAction,
    confirmationCopy: profileActionCopy(pendingAction),
    confirmProfileAction,
    showHouseholdSelector,
    setShowHouseholdSelector,
    transferringHousehold,
    handleHouseholdTransfer,
    handleResendEmail,
    handleDeleteUser,
  };
}
