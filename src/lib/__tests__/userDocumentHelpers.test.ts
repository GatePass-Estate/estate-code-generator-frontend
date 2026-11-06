import {
  MAX_DOCUMENT_UPLOAD_BYTES,
  documentUploadTooLargeMessage,
  isDocumentUploadTooLarge,
} from '@/src/lib/userDocumentHelpers';

it('rejects uploads over 5 MB', () => {
  expect(isDocumentUploadTooLarge(MAX_DOCUMENT_UPLOAD_BYTES)).toBe(false);
  expect(isDocumentUploadTooLarge(MAX_DOCUMENT_UPLOAD_BYTES + 1)).toBe(true);
  expect(isDocumentUploadTooLarge(null)).toBe(false);
  expect(documentUploadTooLargeMessage()).toContain('5 MB');
});
