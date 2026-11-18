import { useEffect, useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { userFacingError } from '@/src/shared/services/api/errors';
import type { FormData, FormErrors } from '@/src/shared/types/general';
import { useUserStore } from '@/src/store/userStore';
import { registerUser } from '@/src/features/users/services/user';
import { getEstateById } from '@/src/features/admin/services/estate';
import { usePendingSeatReduction } from '@/src/features/admin/hooks/usePendingSeatReduction';
import type { Household } from '@/src/features/admin/types/household';
import {
  buildRegisterUserPayload,
  validateRegistrationAddress,
  validateRegistrationPersonalDetails,
  validateRegistrationPersonalField,
} from '@/src/features/auth/utils/registrationValidation';

const LIVE_VALIDATED_FIELDS = ['firstName', 'lastName', 'email', 'phoneNumber'] as const;

export function initialRegisterForm(userType: FormData['userType']): FormData {
  return {
    firstName: '',
    lastName: '',
    email: '',
    phoneNumber: '',
    gender: null,
    userType,
    homeAddress: '',
    householdId: null,
    householdName: '',
    apartmentNumber: '',
    apartmentName: '',
    city: '',
    state: '',
    postalCode: '',
    identificationUri: null,
    identificationName: '',
  };
}

export type RegisterUserResult = { ok: true } | { ok: false; message: string };

/**
 * Register User (admin): two-step form state, validation, the estate address prefill, the
 * seat-reduction block, and the register call. Web and mobile render it differently and decide
 * what happens after a successful registration.
 */
export function useRegisterUserForm({
  initialUserType,
}: {
  /** Mobile starts with no role picked; desktop defaults to Resident. */
  initialUserType: FormData['userType'];
}) {
  const estateId = useUserStore((state) => state.estate_id) || '';
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(() => initialRegisterForm(initialUserType));
  const [errors, setErrors] = useState<FormErrors>({});
  const [selectedHousehold, setSelectedHousehold] = useState<Household | null>(null);
  const [householdSelectorVisible, setHouseholdSelectorVisible] = useState(false);

  // City, state and postal code come from the estate and are read-only in the form.
  const estateQuery = useQuery({
    queryKey: queryKeys.admin.estate(estateId),
    queryFn: () => getEstateById(estateId),
    enabled: Boolean(estateId),
  });
  const estate = estateQuery.data;
  useEffect(() => {
    if (!estate) return;
    setFormData((current) => ({
      ...current,
      city: current.city || estate.city || estate.lga || '',
      state: current.state || estate.state || '',
      postalCode: current.postalCode || estate.postal_code || '',
    }));
  }, [estate]);

  const hasPendingSeatReduction = usePendingSeatReduction();
  const [seatReductionVisible, setSeatReductionVisible] = useState(false);
  useEffect(() => {
    if (hasPendingSeatReduction) setSeatReductionVisible(true);
  }, [hasPendingSeatReduction]);

  /** Shows the seat-reduction notice instead of continuing; true when blocked. */
  const blockIfSeatReductionPending = (): boolean => {
    if (!hasPendingSeatReduction) return false;
    setSeatReductionVisible(true);
    return true;
  };

  /** Sets a field without touching its error. */
  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  const clearFieldError = (field: keyof FormErrors) => {
    if (errors[field]) setErrors((current) => ({ ...current, [field]: undefined }));
  };

  /** Sets a field and re-validates personal details as they are typed (mobile). */
  const updateField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setField(key, value);
    if (
      typeof value === 'string' &&
      (LIVE_VALIDATED_FIELDS as readonly string[]).includes(key as string)
    ) {
      const fieldError = validateRegistrationPersonalField(
        key as (typeof LIVE_VALIDATED_FIELDS)[number],
        value
      );
      setErrors((prev) => ({ ...prev, [key]: fieldError }));
    } else {
      clearFieldError(key as keyof FormErrors);
    }
  };

  const selectHousehold = (household: Household) => {
    setSelectedHousehold(household);
    setFormData((current) => ({
      ...current,
      householdId: household.id,
      householdName: household.name,
    }));
    setErrors((current) => ({ ...current, householdId: undefined }));
  };

  const validatePersonalDetails = (): boolean => {
    const next = validateRegistrationPersonalDetails(formData);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const validateAddress = (): boolean => {
    const next = validateRegistrationAddress(formData);
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const resetForm = () => {
    setFormData(initialRegisterForm(initialUserType));
    setSelectedHousehold(null);
    setStep(1);
  };

  const registerMutation = useMutation({ mutationFn: registerUser });

  /** Registers the user (the users service refreshes the estate-users caches). */
  const submit = async (): Promise<RegisterUserResult> => {
    const { estate_id } = useUserStore.getState();
    try {
      const registered = await registerMutation.mutateAsync(
        buildRegisterUserPayload({
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phoneNumber: formData.phoneNumber,
          role: formData.userType,
          gender: formData.gender,
          estateId: estate_id || '',
          householdId: formData.householdId,
          address: formData,
        })
      );
      // Register API returns `user_id`; `id` is optional on User.
      if (registered && (registered.id || registered.user_id)) return { ok: true };
      return { ok: false, message: 'Failed to register user. Please try again.' };
    } catch (error) {
      return {
        ok: false,
        message: userFacingError(error, 'An error occurred while registering user'),
      };
    }
  };

  return {
    estateId,
    step,
    setStep,
    formData,
    setField,
    updateField,
    errors,
    setErrors,
    clearFieldError,
    selectedHousehold,
    selectHousehold,
    householdSelectorVisible,
    setHouseholdSelectorVisible,
    hasPendingSeatReduction,
    seatReductionVisible,
    setSeatReductionVisible,
    blockIfSeatReductionPending,
    validatePersonalDetails,
    validateAddress,
    resetForm,
    submit,
    saving: registerMutation.isPending,
  };
}
