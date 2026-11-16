import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { queryClient } from '@/src/shared/services/api/queryClient';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { useUserStore } from '@/src/store/userStore';
import { useProfilePendingFieldsQuery } from '@/src/features/profile/hooks/useProfilePendingFields';
import {
  PROFILE_EDIT_LEAVE_DELAY_MS,
  prefillProfileForm,
  profileFormFromUser,
} from '@/src/features/profile/utils/profileEditForm';
import {
  submitProfileEdits,
  type ProfileEditForm,
  type ProfileEditPendingValues,
} from '@/src/features/profile/utils/submitProfileEdits';

/**
 * Edit Profile form shared by web and native: form values, submit, and the delayed leave after a
 * save. With `prefillPending` (native) the form starts from the user's pending admin requests,
 * fetched fresh on every open, and "unchanged" is measured against them.
 */
export function useProfileEditForm({ prefillPending = false }: { prefillPending?: boolean } = {}) {
  const userId = useUserStore((s) => s.user_id);
  const [formData, setFormData] = useState<ProfileEditForm>(() =>
    profileFormFromUser(useUserStore.getState())
  );
  const [pendingValues, setPendingValues] = useState<ProfileEditPendingValues | undefined>(
    prefillPending ? {} : undefined
  );

  const pendingQuery = useProfilePendingFieldsQuery(prefillPending ? userId : null, {
    refetchOnMount: 'always',
  });
  const prefilled = useRef(false);
  const fetchedFresh = pendingQuery.isFetchedAfterMount;
  const loadingPending = prefillPending && Boolean(userId) && !fetchedFresh;

  // Pre-fill once, from this visit's fetch (not an older cached copy). A failed fetch leaves the
  // form on the current details.
  useEffect(() => {
    if (!prefillPending || !fetchedFresh || prefilled.current) return;
    prefilled.current = true;
    if (pendingQuery.isError || !pendingQuery.data) return;
    const { form, pendingValues: values } = prefillProfileForm(
      useUserStore.getState(),
      pendingQuery.data
    );
    setPendingValues(values);
    setFormData(form);
  }, [fetchedFresh, pendingQuery.data, pendingQuery.isError, prefillPending]);

  const setField = useCallback(
    (field: keyof ProfileEditForm, value: string) =>
      setFormData((current) => ({ ...current, [field]: value })),
    []
  );

  const submit = useMutation({
    mutationFn: () => submitProfileEdits(useUserStore.getState(), formData, pendingValues),
    onSuccess: (result) => {
      if (result.status === 'saved') {
        void queryClient.invalidateQueries({ queryKey: queryKeys.requests.all });
      }
    },
  });

  const leaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(
    () => () => {
      if (leaveTimer.current) clearTimeout(leaveTimer.current);
    },
    []
  );
  const leaveAfterSave = useCallback((leave: () => void) => {
    leaveTimer.current = setTimeout(leave, PROFILE_EDIT_LEAVE_DELAY_MS);
  }, []);

  return {
    formData,
    setField,
    loadingPending,
    submitting: submit.isPending,
    submit: submit.mutateAsync,
    leaveAfterSave,
  };
}
