import { useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useDeleteCode } from '@/src/features/access-codes/hooks/codes';
import { logger } from '@/src/shared/utils/logger';
import {
  inviteShareMessage,
  inviteShareText,
  normalizeInviteCode,
} from '@/src/features/access-codes/utils/invite';

const CANCEL_LABEL = 'Cancel Invite';
const CANCELLING_LABEL = 'Removing...';

type Options = {
  /** Runs once the server has revoked the code. */
  onCancelled: () => void;
  /** Runs when revoking failed; the code still opens the gate. */
  onCancelFailed: () => void;
};

/**
 * Invite share screen (web and mobile): route params, share copy and "Cancel Invite".
 * Cancelling is identical on both platforms: one request at a time, leave only after the server
 * revoked the code, otherwise restore the label and tell the resident.
 */
export function useInvite({ onCancelled, onCancelFailed }: Options) {
  const {
    name,
    code: codeParam,
    date,
    timeframe,
    address,
    from,
    returnTo: returnToParam,
  } = useLocalSearchParams<{
    name?: string | string[];
    code?: string | string[];
    date?: string | string[];
    timeframe?: string | string[];
    address?: string | string[];
    from?: string | string[];
    returnTo?: string | string[];
  }>();
  const deleteCodeMutation = useDeleteCode();
  const [cancelText, setCancelText] = useState(CANCEL_LABEL);

  const code = normalizeInviteCode(codeParam);
  const fromScreen = Array.isArray(from) ? from[0] : from;
  const returnToRaw = Array.isArray(returnToParam) ? returnToParam[0] : returnToParam;
  const returnTo = returnToRaw === 'upcoming' || returnToRaw === 'active' ? returnToRaw : undefined;

  const cancelInvite = async (codeToRemove: string) => {
    if (deleteCodeMutation.isPending) return;
    try {
      setCancelText(CANCELLING_LABEL);
      await deleteCodeMutation.mutateAsync(codeToRemove);
      // Leave only once the server has revoked it: on failure the code still opens the gate.
      onCancelled();
    } catch (error) {
      logger.error('Could not remove code', error);
      setCancelText(CANCEL_LABEL);
      onCancelFailed();
    }
  };

  return {
    name,
    date,
    timeframe,
    address,
    /** Code as it arrived in the route (web shows it as-is). */
    codeParam,
    /** Code without whitespace (mobile). */
    code,
    fromScreen,
    /** After create: `active` → home Active Codes, `upcoming` → History Upcoming. */
    returnTo,
    cancelText,
    cancelInvite,
    shareMessage: () => inviteShareMessage({ name, address, date, timeframe, code }),
    shareText: () => inviteShareText({ name, address, date, timeframe, code: codeParam }),
  };
}
