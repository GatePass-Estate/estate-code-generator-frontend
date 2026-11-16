import { describe, expect, it } from '@jest/globals';
import {
  audienceSummary,
  INITIAL_BROADCAST_FORM,
  INITIAL_WEB_BROADCAST_FORM,
  labelFor,
  validateBroadcastMessage,
  validateBroadcastSettings,
  validateWebBroadcastStep,
} from '@/src/features/admin/utils/broadcastForm';

describe('audienceSummary', () => {
  it('summarises the selected audience', () => {
    expect(audienceSummary([])).toBeNull();
    expect(audienceSummary(['residents', 'admins'])).toBe('Residents Only, Admins only');
    expect(audienceSummary(['residents', 'all'])).toBe('All Users');
  });

  it('labels options', () => {
    expect(labelFor([{ label: 'High', value: 'high' }], 'high')).toBe('High');
    expect(labelFor([], 'high')).toBeNull();
  });
});

describe('mobile validation', () => {
  it('requires an audience on step 1', () => {
    expect(validateBroadcastSettings(INITIAL_BROADCAST_FORM)).toEqual({
      userType: 'Select at least one type of user',
    });
    expect(validateBroadcastSettings({ ...INITIAL_BROADCAST_FORM, userType: ['all'] })).toEqual({});
  });

  it('requires subject and body on step 2', () => {
    expect(validateBroadcastMessage({ ...INITIAL_BROADCAST_FORM, subjectLine: ' ' })).toEqual({
      subjectLine: 'Subject line is required',
      bodyText: 'Body text is required',
    });
  });
});

describe('validateWebBroadcastStep', () => {
  it('checks each wizard step', () => {
    expect(validateWebBroadcastStep(1, INITIAL_WEB_BROADCAST_FORM)).toBeNull();
    expect(validateWebBroadcastStep(2, INITIAL_WEB_BROADCAST_FORM)).toBe(
      'Please enter a subject line.'
    );
    expect(validateWebBroadcastStep(2, { ...INITIAL_WEB_BROADCAST_FORM, subjectLine: 'Hi' })).toBe(
      'Please enter a message.'
    );
    expect(validateWebBroadcastStep(3, INITIAL_WEB_BROADCAST_FORM)).toBeNull();
  });
});
