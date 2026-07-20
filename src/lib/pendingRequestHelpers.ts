import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { PendingRequestSheetData } from '@/src/components/mobile/PendingRequestSheet';

export const DEFAULT_PENDING_ID_LABEL = 'Previous ID';

export async function downloadFile(uri?: string | null) {
  if (!uri) {
    Alert.alert('Download unavailable', 'No file is available to download yet.');
    return;
  }

  try {
    if (await Sharing.isAvailableAsync()) {
      await Sharing.shareAsync(uri);
      return;
    }

    Alert.alert('Download unavailable', 'Sharing is not available on this device.');
  } catch {
    Alert.alert('Download failed', 'Could not open this file.');
  }
}

export function createIdentificationPendingRequest(params: {
  requestId: string;
  newFileName: string;
  newFileUri?: string | null;
  currentFileName?: string;
  currentFileUri?: string | null;
}): PendingRequestSheetData {
  return {
    kind: 'identification',
    requestId: params.requestId,
    currentFileName: params.currentFileName ?? DEFAULT_PENDING_ID_LABEL,
    newFileName: params.newFileName,
    currentFileUri: params.currentFileUri ?? null,
    newFileUri: params.newFileUri ?? null,
  };
}
