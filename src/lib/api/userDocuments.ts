import Api from '.';
import { fetchAuthenticatedDocumentUri, getFilenameFromUri, getMimeTypeFromUri } from '../userDocumentHelpers';
import { getErrorMessage } from '../helpers';
import {
  DocumentType,
  UploadDocumentResponse,
  UserDocumentsMetadataResponse,
} from '@/src/types/userDocuments';

export async function uploadUserDocument(
  uri: string,
  documentType: DocumentType
): Promise<UploadDocumentResponse> {
  try {
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
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not upload document'} `);
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
  } catch (error: any) {
    throw new Error(`${getErrorMessage(error) || 'Could not fetch documents'} `);
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

export async function getPendingDocumentViewUri(
  documentId: string,
  contentType?: string | null
) {
  return fetchAuthenticatedDocumentUri(`/users/documents/pending/${documentId}/view`, {
    contentType,
  });
}

export async function downloadMyDocument(
  documentType: DocumentType,
  contentType?: string | null
) {
  return fetchAuthenticatedDocumentUri(`/users/documents/me/${documentType}/download`, {
    contentType,
  });
}
