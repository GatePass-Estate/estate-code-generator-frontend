import * as FileSystem from 'expo-file-system/legacy';
import { getValidAccessToken } from '@/src/lib/authRefresh';
import { DocumentType } from '@/src/types/userDocuments';

/** Keep ID/photo uploads small so admin/profile preview pages stay fast. */
export const MAX_DOCUMENT_UPLOAD_BYTES = 5 * 1024 * 1024;
export const MAX_DOCUMENT_UPLOAD_LABEL = '5 MB';

export function documentUploadTooLargeMessage() {
  return `Choose a file of ${MAX_DOCUMENT_UPLOAD_LABEL} or smaller so document previews load quickly.`;
}

export function isDocumentUploadTooLarge(sizeBytes: number | null | undefined) {
  return typeof sizeBytes === 'number' && sizeBytes > MAX_DOCUMENT_UPLOAD_BYTES;
}

export async function assertDocumentUploadSize(uri: string, knownSize?: number | null) {
  let size = knownSize ?? null;
  if (size == null || size <= 0) {
    const info = await FileSystem.getInfoAsync(uri);
    size = 'size' in info && typeof info.size === 'number' ? info.size : null;
  }
  if (isDocumentUploadTooLarge(size)) {
    throw new Error(documentUploadTooLargeMessage());
  }
}

export function getFilenameFromUri(uri: string, fallback = 'upload.jpg') {
  const name = uri.split('/').pop();
  if (name && name.includes('.')) {
    return decodeURIComponent(name.split('?')[0] ?? name);
  }
  return fallback;
}

export function getMimeTypeFromUri(uri: string, documentType: DocumentType) {
  const ext = uri.split('.').pop()?.toLowerCase().split('?')[0];

  switch (ext) {
    case 'jpg':
    case 'jpeg':
      return 'image/jpeg';
    case 'png':
      return 'image/png';
    case 'webp':
      return 'image/webp';
    case 'heic':
      return 'image/heic';
    case 'heif':
      return 'image/heif';
    case 'pdf':
      return 'application/pdf';
    default:
      return documentType === 'id_card' ? 'application/pdf' : 'image/jpeg';
  }
}

export function resolveDocumentApiUrl(path: string) {
  const rawBaseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL;
  if (!rawBaseUrl) throw new Error('EXPO_PUBLIC_USER_SERVICE_API_URL is missing');
  const baseUrl = rawBaseUrl.replace(/\/$/, '');

  if (path.startsWith('http')) {
    return path;
  }

  if (path.startsWith('/api/v1')) {
    return `${baseUrl}${path}`;
  }

  if (path.startsWith('/')) {
    return `${baseUrl}/api/v1${path}`;
  }

  return `${baseUrl}/api/v1/${path}`;
}

const CONTENT_TYPE_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif',
  'application/pdf': 'pdf',
};

export function extensionFromContentType(contentType?: string | null) {
  if (!contentType) return null;

  const normalized = contentType.toLowerCase().split(';')[0]?.trim();
  return CONTENT_TYPE_TO_EXTENSION[normalized] ?? null;
}

function inferCacheFileExtension(apiPath: string, contentType?: string | null) {
  const fromContentType = extensionFromContentType(contentType);
  if (fromContentType) return fromContentType;

  if (apiPath.includes('profile_picture')) return 'jpg';
  if (apiPath.includes('id_card') || apiPath.includes('/pending/')) return 'jpg';

  return 'bin';
}

export async function fetchAuthenticatedDocumentUri(
  apiPath: string,
  options?: { contentType?: string | null }
) {
  // Raw download, outside the axios interceptors: get a token that is not about to expire.
  const token = await getValidAccessToken();
  const url = resolveDocumentApiUrl(apiPath);
  const extension = inferCacheFileExtension(apiPath, options?.contentType);
  const documentKey = apiPath
    .replace(/^\/+|\/+$/g, '')
    .replace(/[^a-z0-9]+/gi, '-')
    .toLowerCase();
  const uniqueSuffix = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
  const fileUri = `${FileSystem.cacheDirectory}document-${documentKey}-${uniqueSuffix}.${extension}`;

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  if (result.status !== 200) {
    throw new Error(`Failed to download document: ${result.status}`);
  }

  return result.uri;
}
