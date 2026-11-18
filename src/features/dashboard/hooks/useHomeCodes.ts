import { router, useFocusEffect, useIsFocused } from 'expo-router';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react';
import { Codes } from '@/src/features/access-codes/types/codes';
import {
  useActiveCodes,
  useExtendCode,
  useFreezeCode,
} from '@/src/features/access-codes/hooks/codes';
import { useUserStore } from '@/src/store/userStore';
import { errorMessage } from '@/src/shared/services/api/errors';
import {
  formatInvitePeriodDisplay,
  isDataEqual,
  parseLogDate,
  timeCalc,
} from '@/src/shared/utils/helpers';
import {
  applyExtension,
  applyFrozen,
  buildActiveCodeRows,
  filterHomeCodes,
  toggleInSet,
} from '@/src/features/dashboard/utils/homeCodes';

/** Home polls active codes every 30s, only while the screen is focused. */
export const HOME_POLL_MS = 30000;

type Options = {
  /** Mobile leaves upcoming codes to History; web home lists them. */
  excludeUpcoming: boolean;
  /** Mobile refetches every time the tab regains focus. */
  refetchOnFocus?: boolean;
};

/**
 * Active codes on the home screen (web and mobile): the filtered list, the first-load / pull-to-refresh
 * flag and focus-gated polling. The list is local state so freeze, extend and delete can update a row
 * before the next refetch lands.
 */
export function useHomeCodes({ excludeUpcoming, refetchOnFocus = false }: Options) {
  const isFocused = useIsFocused();
  const userId = useUserStore((state) => state.user_id);
  const query = useActiveCodes(userId, { refetchInterval: isFocused ? HOME_POLL_MS : false });
  const [codes, setCodes] = useState<Codes[]>([]);
  const [refreshing, setRefreshing] = useState(true);
  const codesRef = useRef<Codes[]>(codes);

  useEffect(() => {
    codesRef.current = codes;
  }, [codes]);

  useEffect(() => {
    if (!query.data) return;
    const next = filterHomeCodes(query.data.items, excludeUpcoming);
    if (!isDataEqual(next, codesRef.current)) setCodes(next);
    setRefreshing(false);
  }, [query.data, excludeUpcoming]);

  useEffect(() => {
    if (!query.isError) return;
    setRefreshing(false);
  }, [query.isError, query.error]);

  const refetch = query.refetch;
  const refresh = useCallback(
    async (showLoading = true) => {
      if (showLoading) setRefreshing(true);
      try {
        await refetch();
      } catch {
      } finally {
        if (showLoading) setRefreshing(false);
      }
    },
    [refetch]
  );

  const refreshRef = useRef(refresh);
  refreshRef.current = refresh;
  useFocusEffect(
    useCallback(() => {
      if (refetchOnFocus) void refreshRef.current(false);
    }, [refetchOnFocus])
  );

  const removeCode = useCallback((hashedCode: string) => {
    setCodes((prev) => prev.filter((c) => c.hashed_code !== hashedCode));
  }, []);

  return { query, codes, setCodes, refreshing, refresh, removeCode, isFocused };
}

/** Mobile home rows: freeze / extend with optimistic updates and navigation to details / history. */
export function useActiveCodeActions(
  codes: Codes[],
  setCodes: Dispatch<SetStateAction<Codes[]>>,
  { onExtendError }: { onExtendError: (message: string) => void }
) {
  const freezeCodeMutation = useFreezeCode();
  const extendCodeMutation = useExtendCode();
  const [frozenCodes, setFrozenCodes] = useState<Set<string>>(new Set());

  const applyFrozenState = useCallback(
    (hashedCode: string, frozen: boolean, isValid?: boolean) => {
      setFrozenCodes((prev) => toggleInSet(prev, hashedCode, frozen));
      setCodes((prev) => applyFrozen(prev, hashedCode, frozen, isValid));
    },
    [setCodes]
  );

  /** `isCurrentlyFrozen` must match what the card is showing (not a stale item snapshot). */
  const toggleFreeze = useCallback(
    async (hashedCode: string, isCurrentlyFrozen: boolean) => {
      const targetFrozen = !isCurrentlyFrozen;
      applyFrozenState(hashedCode, targetFrozen);
      try {
        const res = await freezeCodeMutation.mutateAsync({
          code: hashedCode,
          frozen: targetFrozen,
        });
        // Keep the requested state on success so a sticky `frozen: true` response can't block unfreeze
        applyFrozenState(hashedCode, targetFrozen, res?.is_valid);
      } catch {
        applyFrozenState(hashedCode, isCurrentlyFrozen);
      }
    },
    [applyFrozenState, freezeCodeMutation]
  );

  const onExtendErrorRef = useRef(onExtendError);
  onExtendErrorRef.current = onExtendError;
  const extend = useCallback(
    async (item: Codes) => {
      try {
        const res = await extendCodeMutation.mutateAsync(item.hashed_code);
        setCodes((prev) => applyExtension(prev, item.hashed_code, res));
      } catch (error: unknown) {
        onExtendErrorRef.current(errorMessage(error)?.trim() || 'Please try again later.');
      }
    },
    [extendCodeMutation, setCodes]
  );

  const openInviteDetails = useCallback((item: Codes) => {
    const { home_address, estate_name } = useUserStore.getState();
    const startRaw = item.validity_period?.start;
    const endRaw = item.validity_period?.end || item.valid_until;
    const start = startRaw ? parseLogDate(startRaw) : null;
    const end = endRaw ? parseLogDate(endRaw) : null;

    let formattedDate = '';
    let timeframe = '';
    if (start && end && !Number.isNaN(start.getTime()) && !Number.isNaN(end.getTime())) {
      ({ formattedDate, timeframe } = formatInvitePeriodDisplay(start, end));
    } else {
      const calc = timeCalc(item.valid_until);
      formattedDate = calc.formattedDate;
      timeframe = calc.timeframe;
    }

    router.push({
      pathname: '/invite',
      params: {
        name: item.visitor_fullname ?? 'Guest',
        code: item.hashed_code,
        date: formattedDate,
        timeframe,
        address: [home_address, estate_name].filter(Boolean).join(', '),
        from: 'home',
      },
    });
  }, []);

  const openHistory = useCallback((item: Codes) => {
    // Root-level route (not the History tab's stack) so Back returns to Home and the History
    // tab keeps showing its Past / Upcoming list instead of this code's detail.
    router.push({
      pathname: '/code-history/[codeId]',
      params: {
        codeId: item.hashed_code,
        name: item.visitor_fullname ?? '',
        category: item.relationship_with_resident ?? '',
        isActive: 'true',
      },
    });
  }, []);

  const rows = useMemo(() => buildActiveCodeRows(codes, frozenCodes), [codes, frozenCodes]);

  return { rows, frozenCodes, toggleFreeze, extend, openInviteDetails, openHistory };
}
