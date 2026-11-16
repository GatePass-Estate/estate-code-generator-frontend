import { GenderType, RelationshipType } from '@/src/shared/types/general';

export const GENDER_OPTIONS: { label: string; value: Exclude<GenderType, null> }[] = [
  { label: 'Female', value: 'female' },
  { label: 'Male', value: 'male' },
  { label: "I'd prefer not to say", value: 'prefer_not_to_say' },
];

export const RELATIONSHIP_OPTIONS: { label: string; value: Exclude<RelationshipType, null> }[] = [
  { label: 'Partner', value: 'partner' },
  { label: 'Friend', value: 'friend' },
  { label: 'Family', value: 'family' },
  { label: 'Taxi', value: 'taxi' },
  { label: 'Delivery', value: 'delivery' },
  { label: 'Technician', value: 'technician' },
  { label: 'Other', value: 'other' },
];

export type AddGuestForm = {
  name: string;
  gender: GenderType;
  relationship: RelationshipType;
  otherRelationship: string;
};

/**
 * First problem with the form, or null when it can be submitted.
 * Mobile picks gender and relationship from sheets (both start empty); web starts with
 * female / friend selected and asks for free text when "other" is chosen.
 */
export function addGuestFormError(form: AddGuestForm, platform: 'native' | 'web'): string | null {
  if (!form.name.trim()) return "Please enter the guest's name.";

  if (platform === 'native') {
    if (form.relationship == null) return 'Please select your relationship with the guest.';
    if (form.gender == null) return 'Please select a gender.';
    return null;
  }

  if (!form.gender) return 'Please select a gender.';
  if (form.relationship === 'other' && !form.otherRelationship.trim()) {
    return 'Please select or enter a relationship.';
  }
  return null;
}

export function optionLabel<T>(options: { label: string; value: T }[], value: T | null) {
  return options.find((option) => option.value === value)?.label;
}
