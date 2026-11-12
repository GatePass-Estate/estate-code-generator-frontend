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

it('does not keep a draft when only a category was selected or all details were removed', async () => {
  const emptyDetails = {
    categories: ['security_incident'],
    customCategory: '',
    title: ' ',
    narrative: '',
  };

  await saveIncidentReportDraft('resident-1', emptyDetails);
  expect(await AsyncStorage.getItem('gatepass-incident-draft:resident-1')).toBeNull();

  await AsyncStorage.setItem(
    'gatepass-incident-draft:resident-1',
    JSON.stringify({ ...emptyDetails, updatedAt: new Date().toISOString() })
  );
  expect(await loadIncidentReportDraft('resident-1')).toBeNull();
  expect(await AsyncStorage.getItem('gatepass-incident-draft:resident-1')).toBeNull();

  await saveIncidentReportDraft('resident-1', { ...emptyDetails, title: 'A report started' });
  expect(await loadIncidentReportDraft('resident-1')).not.toBeNull();

  await saveIncidentReportDraft('resident-1', emptyDetails);
  expect(await loadIncidentReportDraft('resident-1')).toBeNull();
});
