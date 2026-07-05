import { Alert } from 'react-native';
import * as Sharing from 'expo-sharing';
import { PendingRequestSheetData } from '@/src/components/mobile/PendingRequestSheet';

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

export function getFileNameFromUri(uri: string) {
  const parts = uri.split('/');
  return decodeURIComponent(parts[parts.length - 1] || 'document');
}

export function createLocalPhotoPendingRequest(
  newUri: string,
  currentFileName = 'Name of Image title stored as..'
): PendingRequestSheetData {
  return {
    kind: 'photo',
    requestId: `local-photo-${Date.now()}`,
    currentFileName,
    newFileName: getFileNameFromUri(newUri),
    currentFileUri: null,
    newFileUri: newUri,
  };
}

export function createLocalIdentificationPendingRequest(
  newUri: string,
  currentFileName = 'Name of Image title stored as..'
): PendingRequestSheetData {
  return {
    kind: 'identification',
    requestId: `local-identification-${Date.now()}`,
    currentFileName,
    newFileName: getFileNameFromUri(newUri),
    currentFileUri: null,
    newFileUri: newUri,
  };
}
