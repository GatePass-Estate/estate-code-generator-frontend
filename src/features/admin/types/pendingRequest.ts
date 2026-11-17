export type PendingRequestKind = 'field' | 'photo' | 'identification';

export type PendingRequestSheetData = {
  kind: PendingRequestKind;
  requestId: string;
  fieldLabel?: string;
  currentValue?: string;
  newValue?: string;
  currentFileName?: string;
  newFileName?: string;
  currentFileUri?: string | null;
  newFileUri?: string | null;
  lastRemindedAt?: string | null;
};
