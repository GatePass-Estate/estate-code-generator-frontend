import {
  USER_TYPES,
  type BroadcastAudienceChoice,
  type BroadcastFormData,
  type BroadcastFormErrors,
} from '@/src/features/notifications/types/broadcast';

export const INITIAL_BROADCAST_FORM: BroadcastFormData = {
  userType: [],
  priorityLevel: 'medium',
  duration: '24_hours',
  subjectLine: '',
  bodyText: '',
};

/** Summarises the multi-select audience for the collapsed field. */
export function audienceSummary(selected: readonly BroadcastAudienceChoice[]): string | null {
  if (selected.length === 0) return null;

  const allOption = USER_TYPES.find((item) => item.selectsAll);
  if (allOption && selected.includes(allOption.value as BroadcastAudienceChoice)) {
    return allOption.label;
  }

  return USER_TYPES.filter((item) => selected.includes(item.value as BroadcastAudienceChoice))
    .map((item) => item.label)
    .join(', ');
}

export function labelFor(items: { label: string; value: string }[], value: string): string | null {
  return items.find((item) => item.value === value)?.label ?? null;
}

/** Mobile step 1: audience, priority and duration. */
export function validateBroadcastSettings(form: BroadcastFormData): BroadcastFormErrors {
  const errors: BroadcastFormErrors = {};
  if (form.userType.length === 0) errors.userType = 'Select at least one type of user';
  if (!form.priorityLevel) errors.priorityLevel = 'Priority level is required';
  if (!form.duration) errors.duration = 'Duration is required';
  return errors;
}

/** Mobile step 2: subject and body. */
export function validateBroadcastMessage(form: BroadcastFormData): BroadcastFormErrors {
  const errors: BroadcastFormErrors = {};
  if (!form.subjectLine.trim()) errors.subjectLine = 'Subject line is required';
  if (!form.bodyText.trim()) errors.bodyText = 'Body text is required';
  return errors;
}

/* Desktop wizard: one recipient, then message, then priority + duration. */

export type WebBroadcastRecipient = 'resident' | 'security' | 'admin' | 'all';
export type WebBroadcastPriority = 'low' | 'medium' | 'high';
export type WebBroadcastDuration = '24_hours' | '3_days' | '7_days' | '14_days' | '30_days';

export type WebBroadcastForm = {
  recipientType: WebBroadcastRecipient;
  subjectLine: string;
  message: string;
  priority: WebBroadcastPriority;
  duration: WebBroadcastDuration;
};

export const INITIAL_WEB_BROADCAST_FORM: WebBroadcastForm = {
  recipientType: 'resident',
  subjectLine: '',
  message: '',
  priority: 'medium',
  duration: '24_hours',
};

/** First validation message for a desktop wizard step, or `null` when the step is valid. */
export function validateWebBroadcastStep(step: 1 | 2 | 3, form: WebBroadcastForm): string | null {
  if (step === 1) {
    return form.recipientType ? null : 'Please select a recipient type.';
  }
  if (step === 2) {
    if (!form.subjectLine.trim()) return 'Please enter a subject line.';
    if (!form.message.trim()) return 'Please enter a message.';
    return null;
  }
  if (!form.priority) return 'Please select a priority level.';
  if (!form.duration) return 'Please select a duration.';
  return null;
}
