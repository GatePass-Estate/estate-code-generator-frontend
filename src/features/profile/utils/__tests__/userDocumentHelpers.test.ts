import {
  MAX_DOCUMENT_UPLOAD_BYTES,
  documentUploadTooLargeMessage,
  inferCacheFileExtension,
  isDocumentUploadTooLarge,
} from '@/src/features/profile/utils/userDocumentHelpers';

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

it('caches an ID card as a pdf when the server omits a content type', () => {
  expect(inferCacheFileExtension('/users/documents/me/id_card/view', null)).toBe('pdf');
  expect(inferCacheFileExtension('/users/documents/pending/doc-1/view', null)).toBe('pdf');
  expect(inferCacheFileExtension('/users/documents/me/id_card/view', 'image/jpeg')).toBe('jpg');
  expect(inferCacheFileExtension('/users/documents/me/profile_picture/view', null)).toBe('jpg');
});
