export type DocumentType = 'profile_picture' | 'id_card';

export type DocumentStatus = 'pending' | 'active' | 'archived';

export type DocumentMetadataItem = {
  document_type: DocumentType;
  content_type: string;
  document_status: DocumentStatus | null;
  document_id: string | null;
  view_url: string | null;
  download_url: string | null;
};

export type UserDocumentsMetadataResponse = {
  documents: DocumentMetadataItem[];
};

export type UploadDocumentResponse = {
  document_type: DocumentType;
  content_type: string;
  file_size_bytes: number;
  document_id: string;
  document_status: DocumentStatus | null;
  view_url: string | null;
  edit_request_id: string | null;
};
