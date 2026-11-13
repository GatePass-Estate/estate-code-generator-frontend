import { useEffect, useState } from 'react';
import { Image, Platform, Pressable, Text, View } from 'react-native';
import * as FileSystem from 'expo-file-system/legacy';
import * as Sharing from 'expo-sharing';
import { WebView } from 'react-native-webview';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';

type Props = {
  uri: string;
  contentType?: string | null;
};

const PDFJS = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174';

function pdfHtml(base64: string) {
  return `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=3" />
  <style>
    html, body { margin: 0; background: #F6F7F7; }
    canvas { display: block; width: 100%; height: auto; margin: 0 auto 12px; }
  </style>
  <script src="${PDFJS}/pdf.min.js"></script>
</head>
<body>
  <div id="pages"></div>
  <script>
    const pdfjsLib = window['pdfjs-dist/build/pdf'];
    pdfjsLib.GlobalWorkerOptions.workerSrc = '${PDFJS}/pdf.worker.min.js';
    const raw = atob(${JSON.stringify(base64)});
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i += 1) bytes[i] = raw.charCodeAt(i);
    pdfjsLib.getDocument({ data: bytes }).promise.then(async (pdf) => {
      const root = document.getElementById('pages');
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        const page = await pdf.getPage(pageNumber);
        const viewport = page.getViewport({ scale: 1.5 });
        const canvas = document.createElement('canvas');
        canvas.width = viewport.width;
        canvas.height = viewport.height;
        root.appendChild(canvas);
        await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
      }
      window.ReactNativeWebView.postMessage('ready');
    }).catch((error) => {
      window.ReactNativeWebView.postMessage('error:' + (error && error.message ? error.message : 'failed'));
    });
  </script>
</body>
</html>`;
}

function AndroidPdfPreview({ uri }: { uri: string }) {
  const [html, setHtml] = useState<string | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');

  useEffect(() => {
    let cancelled = false;
    setPhase('loading');
    setHtml(null);
    FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 })
      .then((base64) => {
        if (!cancelled) setHtml(pdfHtml(base64));
      })
      .catch(() => {
        if (!cancelled) setPhase('error');
      });
    return () => {
      cancelled = true;
    };
  }, [uri]);

  const openOutside = () => {
    void Sharing.shareAsync(uri, { mimeType: 'application/pdf', UTI: 'com.adobe.pdf' }).catch(
      () => {
        setPhase('error');
      }
    );
  };

  if (phase === 'error') {
    return (
      <View className="h-full w-full items-center justify-center bg-[#F6F7F7] px-6">
        <Text className="text-center font-inter-regular text-sm text-[#878686]">
          Could not preview this PDF.
        </Text>
        <Pressable
          onPress={openOutside}
          accessibilityRole="button"
          className="mt-4 rounded-full bg-primary px-5 py-3"
        >
          <Text className="font-ubuntu-semibold text-sm text-white">Open PDF</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <View className="h-full w-full bg-[#F6F7F7]">
      {html ? (
        <WebView
          source={{ html, baseUrl: `${PDFJS}/` }}
          originWhitelist={['*']}
          className="h-full w-full"
          onMessage={(event) => {
            setPhase(event.nativeEvent.data.startsWith('error') ? 'error' : 'ready');
          }}
          onError={() => setPhase('error')}
          showsHorizontalScrollIndicator={false}
          showsVerticalScrollIndicator={false}
        />
      ) : null}
      {phase === 'loading' ? (
        <View className="absolute inset-0 items-center justify-center bg-[#F6F7F7]">
          <CircleLoader size={48} />
        </View>
      ) : null}
    </View>
  );
}

export default function IdDocumentPreview({ uri, contentType }: Props) {
  const isPdf = contentType === 'application/pdf' || /\.pdf(?:$|[?#])/i.test(uri);

  if (isPdf && Platform.OS === 'android') {
    return <AndroidPdfPreview uri={uri} />;
  }

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
