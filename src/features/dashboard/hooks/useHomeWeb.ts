import { useRouter } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Guest } from '@/src/features/visitors/types/index';
import { useDeleteGuest, useMyGuests } from '@/src/features/visitors/hooks/guests';
import { useDeleteCode, useGenerateCode } from '@/src/features/access-codes/hooks/codes';
import { useUserStore } from '@/src/store/userStore';
import { GenderType, RelationshipType } from '@/src/shared/types/general';
import { isDataEqual, timeCalc } from '@/src/shared/utils/helpers';
import { logger } from '@/src/shared/utils/logger';
import { HOME_POLL_MS, useHomeCodes } from '@/src/features/dashboard/hooks/useHomeCodes';
import { pageCount, pageSlice, searchGuests } from '@/src/features/dashboard/utils/homeWeb';

export const CODES_PAGE_SIZE = 3;
export const GUESTS_PAGE_SIZE = 6;

type GenerateInput = {
  name: string;
  gender: GenderType;
  relationship_with_resident: RelationshipType;
  guestId: string;
};

/** Web home: paginated active codes plus the searchable guest list with delete / generate code. */
export function useHomeWeb() {
  const router = useRouter();
  const {
    query: codesQuery,
    codes,
    removeCode,
    isFocused,
  } = useHomeCodes({ excludeUpcoming: false });
  const [searchQuery, setSearchQuery] = useState('');
  const [guests, setGuests] = useState<Guest[]>([]);
  const [guestsTotalCount, setGuestsTotalCount] = useState(0);
  const [codesPage, setCodesPage] = useState<number>(1);
  const [guestsPage, setGuestsPage] = useState<number>(1);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState(false);
  const [confirmModalVisible, setConfirmModalVisible] = useState(false);
  const [pendingGuestId, setPendingGuestId] = useState<string | null>(null);
  const [pendingType, setPendingType] = useState<'guest' | 'code' | null>(null);
  const [running, setRunning] = useState<boolean>(false);
  const [error, setError] = useState('');
  const [generatingGuestId, setGeneratingGuestId] = useState<string | null>(null);
  const guestsQuery = useMyGuests(guestsPage, GUESTS_PAGE_SIZE, {
    refetchInterval: isFocused ? HOME_POLL_MS : false,
  });
  const deleteGuestMutation = useDeleteGuest();
  const deleteCodeMutation = useDeleteCode();
  const generateCodeMutation = useGenerateCode();
  const guestsRef = useRef<Guest[]>(guests);

  useEffect(() => {
    guestsRef.current = guests;
  }, [guests]);

  const filteredGuests = searchGuests(guests, searchQuery);
  const codesTotalPages = pageCount(codes.length, CODES_PAGE_SIZE);
  const guestsTotalPages = pageCount(guestsTotalCount, GUESTS_PAGE_SIZE);
  const codesPaginated = pageSlice(codes, codesPage, CODES_PAGE_SIZE);

  useEffect(() => {
    if (!guestsQuery.data) return;
    if (!isDataEqual(guestsQuery.data.items, guestsRef.current)) {
      setGuests(guestsQuery.data.items);
      setGuestsTotalCount(guestsQuery.data.total);
    }
    setLoading(false);
  }, [guestsQuery.data]);

  useEffect(() => {
    if (codesQuery.data) setLoading(false);
  }, [codesQuery.data]);

  useEffect(() => {
    if (guestsQuery.isError || codesQuery.isError) setLoading(false);
  }, [codesQuery.isError, guestsQuery.isError]);

  useEffect(() => {
    if (codesPage > codesTotalPages) setCodesPage(codesTotalPages);
  }, [codes, codesTotalPages, codesPage]);

  useEffect(() => {
    if (guestsPage > guestsTotalPages) setGuestsPage(guestsTotalPages);
  }, [guestsTotalPages, guestsPage]);

  useEffect(() => {
    setGuestsPage(1);
  }, [searchQuery]);

  const performDeleteGuest = async (id: string) => {
    setDeleting(true);
    try {
      await deleteGuestMutation.mutateAsync(id);
      setGuests((prev) => prev.filter((g) => g.id !== id));
      setGuestsTotalCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      logger.error('Could not delete guest', error);
    } finally {
      setDeleting(false);
    }
  };

  const requestDeleteGuest = (id: string) => {
    setPendingGuestId(id);
    setPendingType('guest');
    setConfirmModalVisible(true);
  };

  const closeConfirm = useCallback(() => {
    setConfirmModalVisible(false);
    setPendingGuestId(null);
    setPendingType(null);
  }, []);

  const confirmDeleteGuest = async () => {
    if (!pendingGuestId) return;
    await performDeleteGuest(pendingGuestId);
    closeConfirm();
  };

  const performRemoveCode = async (code: string) => {
    setDeleting(true);
    try {
      await deleteCodeMutation.mutateAsync(code);
      removeCode(code);
    } catch (error) {
      logger.error('Could not remove code', error);
    } finally {
      setDeleting(false);
    }
  };

  async function handleGenerateCode({
    name,
    relationship_with_resident,
    gender,
    guestId,
  }: GenerateInput) {
    setRunning(true);
    setGeneratingGuestId(guestId);
    try {
      const result = await generateCodeMutation.mutateAsync({
        user_id: useUserStore.getState().user_id,
        estate_id: useUserStore.getState().estate_id ?? '',
        visitor_fullname: name,
        relationship_with_resident,
        gender,
      });

      const { formattedDate, timeframe } = timeCalc(result.valid_until);

      router.push({
        pathname: `/invite`,
        params: {
          code: result.hashed_code,
          name,
          address: `${useUserStore.getState().home_address}, ${useUserStore.getState().estate_name}.`,
          timeframe,
          date: formattedDate,
        },
      });
    } catch {
      setError('Failed to generate code. Please try again.');
    } finally {
      setRunning(false);
      setGeneratingGuestId(null);
    }
  }

  const changeGuestsPage = (page: number) => {
    setLoading(true);
    setGuestsPage(page);
  };

  return {
    loading,
    codes,
    codesPaginated,
    codesPage,
    setCodesPage,
    codesTotalPages,
    removeCode,
    performRemoveCode,
    searchQuery,
    setSearchQuery,
    filteredGuests,
    guestsPage,
    guestsTotalPages,
    changeGuestsPage,
    requestDeleteGuest,
    confirmModalVisible,
    pendingType,
    closeConfirm,
    confirmDeleteGuest,
    deleting,
    running,
    generatingGuestId,
    handleGenerateCode,
    error,
    clearError: () => setError(''),
  };
}
