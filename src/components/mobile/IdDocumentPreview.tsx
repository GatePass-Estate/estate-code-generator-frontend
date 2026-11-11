import { Image, View } from 'react-native';
import { WebView } from 'react-native-webview';

type Props = {
  uri: string;
  contentType?: string | null;
};

export default function IdDocumentPreview({ uri, contentType }: Props) {
  const isPdf = contentType === 'application/pdf' || /\.pdf(?:$|[?#])/i.test(uri);

  if (isPdf) {
    return (
      <WebView
        source={{ uri }}
        className="h-full w-full"
        originWhitelist={['*']}
        allowingReadAccessToURL={uri}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  return (
    <View className="h-full w-full bg-[#F6F7F7]">
      <Image source={{ uri }} className="h-full w-full" resizeMode="contain" />
    </View>
  );
}
