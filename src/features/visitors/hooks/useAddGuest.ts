import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useCreateGuest } from '@/src/features/visitors/hooks/guests';
import { useGenerateCode } from '@/src/features/access-codes/hooks/codes';
import { useUserStore } from '@/src/store/userStore';
import { GenderType, RelationshipType } from '@/src/shared/types/general';
import { timeCalc } from '@/src/shared/utils/helpers';
import { logger } from '@/src/shared/utils/logger';
import {
  GENDER_OPTIONS,
  RELATIONSHIP_OPTIONS,
  addGuestFormError,
  optionLabel,
} from '@/src/features/visitors/utils/addGuestForm';

type Platform = 'native' | 'web';

type Options = {
  platform: Platform;
  /** Validation and request failures (Alert on mobile, modal on web). */
  onError: (message: string) => void;
  /** The code was created but saving the guest failed (web). */
  onWarning?: (message: string) => void;
};

/**
 * Add Guest form (web and mobile): field state, validation, saving the guest and continuing to a
 * code. Mobile continues to the duration screen; web generates the code here.
 */
export function useAddGuest({ platform, onError, onWarning }: Options) {
  const router = useRouter();
  const createGuestMutation = useCreateGuest();
  const generateCodeMutation = useGenerateCode();
  const [name, setName] = useState('');
  const [gender, setGender] = useState<GenderType>(platform === 'web' ? 'female' : null);
  const [relationship, setRelationship] = useState<RelationshipType>(
    platform === 'web' ? 'friend' : null
  );
  const [otherRelationship, setOtherRelationship] = useState('');
  const [saveToList, setSaveToList] = useState(false);
  const [saving, setSaving] = useState(false);

  const validate = (): boolean => {
    const message = addGuestFormError({ name, gender, relationship, otherRelationship }, platform);
    if (message) onError(message);
    return message == null;
  };

  const reset = () => {
    setName('');
    setRelationship(null);
    setGender(null);
    setSaveToList(false);
  };

  const createGuest = () =>
    createGuestMutation.mutateAsync({
      resident_id: useUserStore.getState().user_id,
      // Mobile trims the name; web has always sent it as typed.
      guest_name: platform === 'native' ? name.trim() : name,
      relationship,
      gender,
    });

  /** `canSave` runs after validation (mobile asks the plan gate there). */
  async function saveGuest(canSave: () => boolean = () => true) {
    if (!validate()) return;
    if (!canSave()) return;

    setSaving(true);
    try {
      await createGuest();
      if (platform === 'native') {
        reset();
        router.push({ pathname: '/user/guests', params: { refresh: 'true' } });
      } else {
        router.push('/user');
      }
    } catch {
      onError(
        platform === 'native'
          ? 'Failed to save guest. Please try again.'
          : 'Failed to generate code. Please try again.'
      );
    } finally {
      setSaving(false);
    }
  }

  /** Mobile: pick the code's duration next. */
  function continueToDuration(saveGuest: boolean) {
    if (saving) return;
    if (!validate()) return;

    router.push({
      pathname: '/duration',
      params: {
        visitorName: name.trim(),
        relationship: relationship as string,
        gender: gender as string,
        saveGuest: saveGuest ? 'true' : 'false',
      },
    });
  }

  /** Web: generate the code now, optionally save the guest, then open the invite. */
  async function generateCode() {
    if (!validate()) return;
    setSaving(true);
    try {
      const result = await generateCodeMutation.mutateAsync({
        user_id: useUserStore.getState().user_id,
        estate_id: useUserStore.getState().estate_id ?? '',
        visitor_fullname: name,
        relationship_with_resident: relationship,
        gender,
      });

      // The code already exists at this point. A failed guest save must not fall into the
      // "failed to generate" path, or the resident retries and creates a second live code.
      if (saveToList) {
        try {
          await createGuest();
        } catch (error) {
          logger.error('Could not save guest to list', error);
          onWarning?.('Your code was created, but the guest could not be saved to your list.');
        }
      }

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
      onError('Failed to generate code. Please try again.');
    } finally {
      setSaving(false);
    }
  }

  return {
    name,
    setName,
    gender,
    setGender,
    genderLabel: optionLabel(GENDER_OPTIONS, gender),
    relationship,
    setRelationship,
    relationshipLabel: optionLabel(RELATIONSHIP_OPTIONS, relationship),
    otherRelationship,
    setOtherRelationship,
    saveToList,
    setSaveToList,
    saving,
    saveGuest,
    continueToDuration,
    generateCode,
  };
}
