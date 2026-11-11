import {
  MAX_DOCUMENT_UPLOAD_BYTES,
  documentUploadTooLargeMessage,
  isDocumentUploadTooLarge,
} from '@/src/lib/userDocumentHelpers';

// userDocumentHelpers reaches AsyncStorage through the auth helpers, which has no native module here.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock')
);

it('rejects uploads over 5 MB', () => {
  expect(isDocumentUploadTooLarge(MAX_DOCUMENT_UPLOAD_BYTES)).toBe(false);
  expect(isDocumentUploadTooLarge(MAX_DOCUMENT_UPLOAD_BYTES + 1)).toBe(true);
  expect(isDocumentUploadTooLarge(null)).toBe(false);
  expect(documentUploadTooLargeMessage()).toContain('5 MB');
});
