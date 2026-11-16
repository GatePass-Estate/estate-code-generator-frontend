import { raiseApiError } from '@/src/shared/services/api/errors';
import Api from '@/src/shared/services/api/client';
import {
  assertDocumentUploadSize,
  fetchAuthenticatedDocumentUri,
  getFilenameFromUri,
  getMimeTypeFromUri,
} from '@/src/features/profile/utils/userDocumentHelpers';
import {
  DocumentType,
  DocumentStatus,
  UploadDocumentResponse,
  UserDocumentsMetadataResponse,
} from '@/src/features/profile/types/userDocuments';

export async function uploadUserDocument(
  uri: string,
  documentType: DocumentType
): Promise<UploadDocumentResponse> {
  try {
    await assertDocumentUploadSize(uri);
    const api = Api();
    const formData = new FormData();
    const filename = getFilenameFromUri(
      uri,
      documentType === 'id_card' ? 'identification.pdf' : 'profile-photo.jpg'
    );
    const mimeType = getMimeTypeFromUri(uri, documentType);

    formData.append('file', {
      uri,
      name: filename,
      type: mimeType,
    } as unknown as Blob);
    formData.append('document_type', documentType);

    const axiosRes = await api.post('/users/documents/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      timeout: 60000,
    });

    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not upload document', true);
  }
}

export async function getMyDocuments(
  documentType?: DocumentType
): Promise<UserDocumentsMetadataResponse> {
  try {
    const api = Api();
    const query = documentType ? `?document_type=${documentType}` : '';
    const axiosRes = await api.get(`/users/documents/me${query}`);
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch documents', true);
  }
}

export async function getUserDocuments(
  userId: string,
  documentType?: DocumentType,
  documentStatuses?: DocumentStatus[]
): Promise<UserDocumentsMetadataResponse> {
  try {
    const api = Api();
    const axiosRes = await api.get(`/users/documents/${encodeURIComponent(userId)}`, {
      params: {
        ...(documentType ? { document_type: documentType } : {}),
        ...(documentStatuses?.length ? { document_status: documentStatuses } : {}),
      },
      paramsSerializer: { indexes: null },
    });
    return axiosRes.data;
  } catch (error: unknown) {
    raiseApiError(error, 'Could not fetch user documents', true);
  }
}

export async function getMyDocumentViewUri(
  documentType: DocumentType,
  contentType?: string | null
) {
  return fetchAuthenticatedDocumentUri(`/users/documents/me/${documentType}/view`, {
    contentType,
  });
}

export async function getUserDocumentViewUri(
  userId: string,
  documentType: DocumentType,
  contentType?: string | null
) {
  return fetchAuthenticatedDocumentUri(
    `/users/documents/${encodeURIComponent(userId)}/${documentType}/view`,
    { contentType }
  );
}

export async function getPendingDocumentViewUri(documentId: string, contentType?: string | null) {
  return fetchAuthenticatedDocumentUri(`/users/documents/pending/${documentId}/view`, {
    contentType,
  });
}

export async function downloadMyDocument(documentType: DocumentType, contentType?: string | null) {
  return fetchAuthenticatedDocumentUri(`/users/documents/me/${documentType}/download`, {
    contentType,
  });
}
