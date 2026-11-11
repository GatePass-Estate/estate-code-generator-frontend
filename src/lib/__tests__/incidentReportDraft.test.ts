import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  clearIncidentReportDraft,
  loadIncidentReportDraft,
  saveIncidentReportDraft,
} from '@/src/lib/incidentReportDraft';

jest.mock('@react-native-async-storage/async-storage', () =>
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

beforeEach(async () => {
  await AsyncStorage.clear();
});

it('restores category and report text only for the author, then clears the submitted draft', async () => {
  await saveIncidentReportDraft('resident-1', {
    categories: ['security_incident'],
    customCategory: '',
    title: 'Broken gate',
    narrative: 'The gate would not close after the visitor left.',
  });

  expect(await loadIncidentReportDraft('resident-1')).toMatchObject({
    categories: ['security_incident'],
    title: 'Broken gate',
    narrative: 'The gate would not close after the visitor left.',
  });
  expect(await loadIncidentReportDraft('resident-2')).toBeNull();

  await clearIncidentReportDraft('resident-1');
  expect(await loadIncidentReportDraft('resident-1')).toBeNull();
});

it('keeps a completed report cleared when an earlier automatic save is still pending', async () => {
  const saving = saveIncidentReportDraft('resident-1', {
    categories: ['security_incident'],
    customCategory: '',
    title: 'Draft',
    narrative: 'Some details',
  });
  const clearing = clearIncidentReportDraft('resident-1');

  await Promise.all([saving, clearing]);
  expect(await loadIncidentReportDraft('resident-1')).toBeNull();
});
