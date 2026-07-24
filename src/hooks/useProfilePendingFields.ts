import { useCallback, useState } from 'react';
import { useFocusEffect } from '@react-navigation/native';
import {
  EMPTY_PENDING_FIELD_DETAILS,
  fetchProfilePendingFields,
  ProfilePendingFieldDetails,
  ProfilePendingFields,
  toPendingFieldFlags,
} from '@/src/lib/profilePendingFields';

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

  const refreshPendingFields = useCallback(async () => {
    if (!userId) {
      setPendingDetails(EMPTY_PENDING_FIELD_DETAILS);
      setPendingFields(toPendingFieldFlags(EMPTY_PENDING_FIELD_DETAILS));
      return;
    }

    setLoadingPending(true);
    try {
      const details = await fetchProfilePendingFields(userId);
      setPendingDetails(details);
      setPendingFields(toPendingFieldFlags(details));
    } catch (error) {
      console.log('Failed to fetch pending profile fields', error);
    } finally {
      setLoadingPending(false);
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
