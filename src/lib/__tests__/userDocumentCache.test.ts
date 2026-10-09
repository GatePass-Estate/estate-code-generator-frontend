import * as FileSystem from 'expo-file-system/legacy';
import { getUserDocumentViewUri } from '@/src/lib/api/userDocuments';
import { useAuthStore } from '@/src/lib/stores/authStore';
import {
  getCachedUserDocument,
  loadUserDocument,
  removeCachedUserDocument,
} from '@/src/lib/userDocumentCache';
import type { DocumentMetadataItem } from '@/src/types/userDocuments';

jest.mock('expo-file-system/legacy', () => ({
  deleteAsync: jest.fn().mockResolvedValue(undefined),
  getInfoAsync: jest.fn().mockResolvedValue({ exists: true }),
}));

jest.mock('@/src/lib/api/userDocuments', () => ({
  getUserDocumentViewUri: jest.fn(),
}));

const metadata = (documentId: string): DocumentMetadataItem => ({
  document_id: documentId,
  document_status: 'active',
  document_type: 'id_card',
  content_type: 'application/pdf',
  view_url: null,
  download_url: null,
});

const download = getUserDocumentViewUri as jest.MockedFunction<typeof getUserDocumentViewUri>;

beforeEach(() => {
  useAuthStore.getState().clearAuth();
  useAuthStore.getState().setAuth('test-session', 'admin');
  removeCachedUserDocument('test-user', 'id_card');
  jest.clearAllMocks();
});

it('reuses the local file when the active document has not changed', async () => {
  download.mockResolvedValueOnce('file:///cached-id.pdf');

  const first = await loadUserDocument('test-user', 'id_card', metadata('id-1'));
  const second = await loadUserDocument('test-user', 'id_card', metadata('id-1'));

  expect(first).toBe(second);
  expect(download).toHaveBeenCalledTimes(1);
  expect(FileSystem.getInfoAsync).toHaveBeenCalledWith('file:///cached-id.pdf');
});

it('keeps the old preview while a replacement downloads', async () => {
  download.mockResolvedValueOnce('file:///old-id.pdf');
  await loadUserDocument('test-user', 'id_card', metadata('id-1'));

  let finishDownload: (uri: string) => void = () => {};
  download.mockImplementationOnce(
    () =>
      new Promise<string>((resolve) => {
        finishDownload = resolve;
      })
  );
  const replacement = loadUserDocument('test-user', 'id_card', metadata('id-2'));

  expect(getCachedUserDocument('test-user', 'id_card')?.uri).toBe('file:///old-id.pdf');
  finishDownload('file:///new-id.pdf');
  await expect(replacement).resolves.toMatchObject({ uri: 'file:///new-id.pdf' });
  expect(getCachedUserDocument('test-user', 'id_card')?.uri).toBe('file:///new-id.pdf');
});

it('clears cached previews when the signed-in account changes', async () => {
  download.mockResolvedValueOnce('file:///cached-id.pdf');
  await loadUserDocument('test-user', 'id_card', metadata('id-1'));

  useAuthStore.getState().clearAuth();

  expect(getCachedUserDocument('test-user', 'id_card')).toBeNull();
  expect(FileSystem.deleteAsync).toHaveBeenCalledWith('file:///cached-id.pdf', {
    idempotent: true,
  });
});
