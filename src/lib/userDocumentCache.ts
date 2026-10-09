import * as FileSystem from 'expo-file-system/legacy';
import { getUserDocumentViewUri } from '@/src/lib/api/userDocuments';
import { useAuthStore } from '@/src/lib/stores/authStore';
import type { DocumentMetadataItem, DocumentType } from '@/src/types/userDocuments';

export type CachedUserDocument = {
  contentType: string | null;
  documentId: string | null;
  uri: string;
};

const documents = new Map<string, CachedUserDocument>();
const supersededFiles = new Set<string>();
let accessToken = useAuthStore.getState().access_token;

const cacheKey = (userId: string, documentType: DocumentType) => `${userId}:${documentType}`;

const discardFile = (uri: string) => {
  void FileSystem.deleteAsync(uri, { idempotent: true }).catch(() => {});
};

const clearDocuments = () => {
  for (const document of documents.values()) discardFile(document.uri);
  for (const uri of supersededFiles) discardFile(uri);
  documents.clear();
  supersededFiles.clear();
};

// Document previews belong to the signed-in account, never the next account on this device.
useAuthStore.subscribe((state) => {
  if (state.access_token === accessToken) return;
  accessToken = state.access_token;
  clearDocuments();
});

export const getCachedUserDocument = (userId: string, documentType: DocumentType) =>
  documents.get(cacheKey(userId, documentType)) ?? null;

export const removeCachedUserDocument = (
  userId: string,
  documentType: DocumentType,
  expectedUri?: string
) => {
  const key = cacheKey(userId, documentType);
  const previous = documents.get(key);
  if (expectedUri && previous?.uri !== expectedUri) return;
  documents.delete(key);
  if (previous) discardFile(previous.uri);
};

export const loadUserDocument = async (
  userId: string,
  documentType: DocumentType,
  metadata: DocumentMetadataItem
): Promise<CachedUserDocument> => {
  const token = useAuthStore.getState().access_token;
  const key = cacheKey(userId, documentType);
  const previous = documents.get(key);

  if (
    metadata.document_id &&
    previous?.documentId === metadata.document_id &&
    previous.contentType === metadata.content_type
  ) {
    const file = await FileSystem.getInfoAsync(previous.uri);
    if (file.exists && useAuthStore.getState().access_token === token) return previous;
  }

  const uri = await getUserDocumentViewUri(userId, documentType, metadata.content_type);
  if (useAuthStore.getState().access_token !== token) {
    discardFile(uri);
    throw new Error('Account changed while loading document');
  }

  const current: CachedUserDocument = {
    contentType: metadata.content_type,
    documentId: metadata.document_id,
    uri,
  };
  documents.set(key, current);
  // Keep the old file until the account changes so the displayed image stays visible
  // while React Native decodes its replacement.
  if (previous && previous.uri !== uri) supersededFiles.add(previous.uri);
  return current;
};
