import { Feather } from '@expo/vector-icons';
import { Text, View } from 'react-native';

type Props = {
  uri: string;
  width: number | '100%';
  height: number | '100%';
  onError: () => void;
};

export default function IdDocumentPdf({ width, height }: Props) {
  return (
    <View style={{ alignItems: 'center', height, justifyContent: 'center', width }}>
      <Feather name="file-text" size={36} color="#C8CECE" />
      <Text style={{ color: '#878686', fontSize: 12, marginTop: 8 }}>
        PDF preview is available in the mobile app
      </Text>
    </View>
  );
}
