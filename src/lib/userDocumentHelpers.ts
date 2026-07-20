import * as FileSystem from 'expo-file-system/legacy';
import { useAuthStore } from '@/src/lib/stores/authStore';
import { DocumentType } from '@/src/types/userDocuments';

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
  const baseUrl = process.env.EXPO_PUBLIC_USER_SERVICE_API_URL?.replace(/\/$/, '') ?? '';

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
  const token = useAuthStore.getState().access_token;
  const url = resolveDocumentApiUrl(apiPath);
  const extension = inferCacheFileExtension(apiPath, options?.contentType);
  const fileUri = `${FileSystem.cacheDirectory}document-${Date.now()}.${extension}`;

  const result = await FileSystem.downloadAsync(url, fileUri, {
    headers: token ? { Authorization: `Bearer ${token}` } : undefined,
  });

  return result.uri;
}
