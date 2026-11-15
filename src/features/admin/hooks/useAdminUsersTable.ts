import { useEffect, useMemo, useRef, useState } from 'react';
import { keepPreviousData, useMutation, useQuery } from '@tanstack/react-query';
import { errorMessage as thrownMessage } from '@/src/shared/services/api/errors';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { logger } from '@/src/shared/utils/logger';
import { useUserStore } from '@/src/store/userStore';
import { useAuthStore } from '@/src/features/auth/store/authStore';
import {
  deactivateUser,
  deleteUser,
  demoteToResident,
  getAllEstateUsers,
  promoteToAdmin,
  resendEmailVerification,
} from '@/src/features/users/services/user';
import { getUserDocuments } from '@/src/features/profile/services/userDocuments';
import type { AllUsers } from '@/src/features/users/types/user';
import type { UserRolesType } from '@/src/shared/types/general';
import { useEstateUsers } from '@/src/features/users/hooks/estateUsers';
import { useFocusedRefetchInterval } from '@/src/features/admin/hooks/useFocusedRefetchInterval';
import {
  hasApprovedIdDocument,
  PROMOTE_REQUIRES_APPROVED_ID_MESSAGE,
} from '@/src/features/admin/utils/roleChange';
import {
  adminActionHeading,
  adminActionSuccessMessage,
  filterAdminTableUsers,
  tableRoleCounts,
  totalTablePages,
  type AdminTableRoleFilter,
  type AdminUserAction,
} from '@/src/features/admin/utils/usersTable';

export const USERS_PAGE_SIZE = 20;
const USERS_TABLE_POLL_MS = 30_000;

type ModalState = {
  isOpen: boolean;
  message: string;
  heading: string;
  actionType: AdminUserAction | null;
  userId: string | null;
  userName: string;
  isError: boolean;
};

const CLOSED_MODAL: ModalState = {
  isOpen: false,
  message: '',
  heading: '',
  actionType: null,
  userId: null,
  userName: '',
  isError: false,
};

/** Shown instead of running the action (promotion needs an approved ID card first). */
class AdminActionBlockedError extends Error {}

/**
 * Runs one Admin Access table action. The user services refresh the estate-users and users caches
 * themselves (so this table and the admin home pick up the change).
 */
async function runAdminUserAction(action: AdminUserAction, userId: string): Promise<void> {
  if (action === 'promote') {
    const { documents } = await getUserDocuments(userId, 'id_card', ['active']);
    if (!hasApprovedIdDocument(documents)) {
      throw new AdminActionBlockedError(PROMOTE_REQUIRES_APPROVED_ID_MESSAGE);
    }
    await promoteToAdmin(userId);
  } else if (action === 'demote') {
    await demoteToResident(userId);
  } else if (action === 'deactivate') {
    await deactivateUser(userId);
  } else if (action === 'resendVerification') {
    await resendEmailVerification(userId);
  } else if (action === 'deleteUser') {
    await deleteUser(userId);
  }
}

/**
 * Desktop Admin Access: the paged users table (page-based query, previous page kept on screen
 * while the next loads, 30s poll while focused), search/role filters, and the row actions.
 */
export function useAdminUsersTable() {
  const estateId = useUserStore((s) => s.estate_id);
  const myId = useUserStore.getState().user_id;
  const viewerRole = useAuthStore((state) => state.role);

  const [page, setPage] = useState(1);
  const refetchInterval = useFocusedRefetchInterval(USERS_TABLE_POLL_MS);
  const pageQuery = useQuery({
    queryKey: queryKeys.admin.usersTable(estateId || 'session', page, USERS_PAGE_SIZE),
    queryFn: () => getAllEstateUsers(page, USERS_PAGE_SIZE),
    placeholderData: keepPreviousData,
    refetchInterval,
  });

  // The last page that loaded: shown while a page change is in flight or after it fails.
  const pageLoaded = Boolean(pageQuery.data) && !pageQuery.isPlaceholderData;
  const [lastLoaded, setLastLoaded] = useState<{ page: number; data: AllUsers } | null>(null);
  useEffect(() => {
    if (pageLoaded && pageQuery.data) setLastLoaded({ page, data: pageQuery.data });
  }, [pageLoaded, pageQuery.data, page]);
  const users: AllUsers = (pageLoaded ? pageQuery.data : lastLoaded?.data) ??
    pageQuery.data ?? { total: 0, page: 1, limit: USERS_PAGE_SIZE, items: [] };
  const currentPage = pageLoaded ? page : (lastLoaded?.page ?? 1);
  const loading = pageQuery.isLoading || pageQuery.isPlaceholderData;

  useEffect(() => {
    if (pageQuery.isError) logger.error('Could not load estate users', pageQuery.error);
  }, [pageQuery.isError, pageQuery.error]);

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState<AdminTableRoleFilter>(null);
  const isSearching = searchQuery.trim().length > 0;
  // The paged endpoint has no search param, so search runs over every estate user.
  const allUsersQuery = useEstateUsers({ enabled: isSearching });
  const searchSource = isSearching && allUsersQuery.data ? allUsersQuery.data.items : users.items;
  const searchLoading = isSearching && !allUsersQuery.data && allUsersQuery.isPending;
  const filteredUsers = useMemo(
    () => filterAdminTableUsers(searchSource, searchQuery, selectedRole),
    [searchSource, searchQuery, selectedRole]
  );

  const totalPages = totalTablePages(users.total, USERS_PAGE_SIZE);
  const { residents: residentsCount, security: securityCount } = tableRoleCounts(users);

  useEffect(() => {
    if (page > totalPages) setPage(Math.max(1, totalPages));
  }, [totalPages, page]);

  const [modalState, setModalState] = useState<ModalState>(CLOSED_MODAL);
  const successTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (successTimer.current) clearTimeout(successTimer.current);
    },
    []
  );

  const closeModal = () => setModalState(CLOSED_MODAL);

  const showModal = (
    message: string,
    actionType: AdminUserAction | null = null,
    userId: string | null = null,
    userName: string = '',
    isError: boolean = false
  ) => {
    setModalState({
      isOpen: true,
      message,
      heading: adminActionHeading(actionType, isError),
      actionType: isError ? null : actionType,
      userId: isError ? null : userId,
      userName: isError ? '' : userName,
      isError,
    });
  };

  const actionMutation = useMutation({
    mutationFn: ({ action, userId }: { action: AdminUserAction; userId: string }) =>
      runAdminUserAction(action, userId),
  });

  const handleConfirmAction = async () => {
    const { actionType, userId, userName } = modalState;
    if (!actionType || !userId) return;

    try {
      await actionMutation.mutateAsync({ action: actionType, userId });
      setModalState({
        isOpen: true,
        message: adminActionSuccessMessage(actionType, userName),
        heading: 'Success',
        actionType,
        userId: null,
        userName: '',
        isError: false,
      });

      if (successTimer.current) clearTimeout(successTimer.current);
      successTimer.current = setTimeout(() => {
        closeModal();
        // Back to the first page; the user services already invalidated the cached pages.
        setPage(1);
      }, 1500);
    } catch (err: unknown) {
      if (err instanceof AdminActionBlockedError) {
        showModal(err.message, null, null, '', true);
        return;
      }
      showModal(thrownMessage(err) || 'Failed to complete action', null, null, '', true);
    }
  };

  const fullName = (firstName: string, lastName: string) => `${firstName} ${lastName}`.trim();

  const promoteUser = (userId: string, firstName: string, lastName: string) => {
    if (userId === myId) {
      showModal('You cannot promote yourself to admin.', null, null, '', true);
      return;
    }
    showModal(
      'Are you sure you want to promote this user to admin?',
      'promote',
      userId,
      fullName(firstName, lastName)
    );
  };

  const demoteUser = (
    userId: string,
    firstName: string,
    lastName: string,
    userRole: UserRolesType
  ) => {
    if (userId === myId) {
      showModal('You cannot demote yourself from admin.', null, null, '', true);
      return;
    }
    if (userRole === 'primary_admin') {
      showModal('You cannot demote the primary admin.', null, null, '', true);
      return;
    }
    showModal(
      'Are you sure you want to demote this admin?',
      'demote',
      userId,
      fullName(firstName, lastName)
    );
  };

  const deactivate = (userId: string, firstName: string, lastName: string) => {
    if (userId === myId) {
      showModal('You cannot deactivate your own account.', null, null, '', true);
      return;
    }
    showModal(
      'Are you sure you want to deactivate this user?',
      'deactivate',
      userId,
      fullName(firstName, lastName)
    );
  };

  const resendEmail = (userId: string, firstName: string, lastName: string) => {
    showModal(
      'Are you sure you want to resend the verification email to this user?',
      'resendVerification',
      userId,
      fullName(firstName, lastName)
    );
  };

  const deleteAccount = (userId: string, firstName: string, lastName: string) => {
    if (userId === myId) {
      showModal('You cannot delete your own account.', null, null, '', true);
      return;
    }
    showModal(
      'Are you sure you want to permanently delete this user?',
      'deleteUser',
      userId,
      fullName(firstName, lastName)
    );
  };

  return {
    viewerRole,
    users,
    loading,
    searchLoading,
    isSearching,
    searchQuery,
    setSearchQuery,
    selectedRole,
    setSelectedRole,
    filteredUsers,
    residentsCount,
    securityCount,
    currentPage,
    totalPages,
    goToPage: setPage,
    modalState,
    closeModal,
    handleConfirmAction,
    processing: actionMutation.isPending,
    promoteUser,
    demoteUser,
    deactivate,
    resendEmail,
    deleteAccount,
  };
}
