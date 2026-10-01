import { useState } from 'react';
import { ActivityIndicator, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import Svg, { Path } from 'react-native-svg';
import type { RegistrationIdDocument } from '@/src/types/registration';

type RegistrationIdPickerProps = {
  value: RegistrationIdDocument | null;
  error?: string;
  onChange: (document: RegistrationIdDocument | null) => void;
};

function GovernmentIdUploadIcon() {
  return (
    <Svg width={30} height={30} viewBox="0 0 30 30" fill="none">
      <Path
        d="M12.5 1.1C5.9 2.25 1 8 1 15s4.9 12.75 11.5 13.9M18.5 1.1c1.85.33 3.55 1.05 5 2.1M27 7.2c1 1.55 1.68 3.2 2 4.8M29 18c-.32 1.8-1 3.45-2 5M23.5 26.8c-1.45 1.05-3.15 1.77-5 2.1M15 22V8M9 14l6-6 6 6"
        stroke="#878686"
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export default function RegistrationIdPicker({
  value,
  error,
  onChange,
}: RegistrationIdPickerProps) {
  const [selecting, setSelecting] = useState(false);
  const [pickerError, setPickerError] = useState('');

  const selectDocument = async () => {
    if (selecting) return;

    setSelecting(true);
    setPickerError('');
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['image/*', 'application/pdf'],
        copyToCacheDirectory: true,
        multiple: false,
      });

      if (!result.canceled && result.assets[0]) {
        const asset = result.assets[0];
        onChange({
          uri: asset.uri,
          name: asset.name || 'Identification document',
          mimeType: asset.mimeType ?? null,
          size: asset.size ?? null,
        });
      }
    } catch {
      setPickerError('The document could not be selected. Please try again.');
    } finally {
      setSelecting(false);
    }
  };

  return (
    <View className="mt-4">
      <Text className="h-[11px] text-[9px] leading-[9px] tracking-[-0.24px] text-[#878686] font-inter-regular">
        Upload your government issued ID
      </Text>

      <Pressable
        onPress={selectDocument}
        disabled={selecting}
        style={{ borderWidth: 0.5 }}
        accessibilityRole="button"
        accessibilityLabel={
          value ? 'Replace identification document' : 'Select identification document'
        }
        className={`mt-2 h-[192px] w-full items-center justify-center rounded-[24px] border-dashed px-2 py-4 ${
          error || pickerError ? 'border-danger bg-red-50' : 'border-[#878686] bg-[#EFF1F1]'
        } ${selecting ? 'opacity-60' : ''}`}
      >
        {selecting ? (
          <ActivityIndicator color="#113E55" />
        ) : value ? (
          <>
            <Feather name="file-text" size={34} color="#113E55" />
            <Text
              className="mt-3 text-center text-sm text-primary font-inter-medium"
              numberOfLines={2}
            >
              {value.name}
            </Text>
            <Text className="mt-2 text-center text-xs text-grey font-inter-regular">
              Tap to choose a different file
            </Text>
          </>
        ) : (
          <>
            <GovernmentIdUploadIcon />
            <Text className="mt-[10px] h-[14px] w-[245px] text-center text-[12px] leading-[12px] tracking-[-0.24px] text-[#848080] font-ubuntu-regular">
              Upload an ID that verifies the information given
            </Text>
          </>
        )}
      </Pressable>

      {!!value && (
        <TouchableOpacity
          onPress={() => onChange(null)}
          accessibilityRole="button"
          className="mt-3 self-end py-1"
        >
          <Text className="text-xs text-danger font-inter-medium">Remove document</Text>
        </TouchableOpacity>
      )}

      {!!(error || pickerError) && (
        <Text className="mt-2 text-xs text-danger font-inter-regular">{error || pickerError}</Text>
      )}
    </View>
  );
}
