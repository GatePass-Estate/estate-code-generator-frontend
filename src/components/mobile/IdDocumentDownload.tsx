import { downloadFile } from '@/src/lib/pendingRequestHelpers';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';

type Props = {
  uri: string;
};

export default function IdDocumentDownload({ uri }: Props) {
  return (
    <View className="h-full w-full items-center justify-center gap-3">
      <Feather name="file-text" size={32} color="#878686" />
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Download identification PDF"
        className="rounded-full bg-[#E5F6FF] px-6 py-[9px]"
        onPress={() => void downloadFile(uri)}
      >
        <Text className="font-inter-regular text-[11px] text-[#113E55]">Download</Text>
      </Pressable>
    </View>
  );
}
