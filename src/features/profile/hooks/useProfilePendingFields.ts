import { useCallback, useRef, useState } from 'react';
import { useFocusEffect } from 'expo-router';
import {
  EMPTY_PENDING_FIELD_DETAILS,
  fetchProfilePendingFields,
  ProfilePendingFieldDetails,
  ProfilePendingFields,
  toPendingFieldFlags,
} from '@/src/features/profile/utils/profilePendingFields';

export function useProfilePendingFields(userId?: string | null) {
  const [pendingDetails, setPendingDetails] = useState<ProfilePendingFieldDetails>(
    EMPTY_PENDING_FIELD_DETAILS
  );
  const [pendingFields, setPendingFields] = useState<ProfilePendingFields>({
    firstName: false,
    lastName: false,
    phoneNumber: false,
    email: false,
    address: false,
  });
  const [loadingPending, setLoadingPending] = useState(false);
  const requestId = useRef(0);

  const refreshPendingFields = useCallback(async () => {
    const request = ++requestId.current;
    if (!userId) {
      setPendingDetails(EMPTY_PENDING_FIELD_DETAILS);
      setPendingFields(toPendingFieldFlags(EMPTY_PENDING_FIELD_DETAILS));
      setLoadingPending(false);
      return;
    }

    setLoadingPending(true);
    try {
      const details = await fetchProfilePendingFields(userId);
      if (request !== requestId.current) return;
      setPendingDetails(details);
      setPendingFields(toPendingFieldFlags(details));
    } catch {
    } finally {
      if (request === requestId.current) setLoadingPending(false);
    }
  }, [userId]);

  useFocusEffect(
    useCallback(() => {
      refreshPendingFields();
    }, [refreshPendingFields])
  );

  return {
    pendingDetails,
    pendingFields,
    loadingPending,
    refreshPendingFields,
  };
}
