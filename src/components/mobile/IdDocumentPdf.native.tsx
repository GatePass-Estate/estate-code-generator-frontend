import Pdf from 'react-native-pdf';

type Props = {
  uri: string;
  width: number | '100%';
  height: number | '100%';
  onError: () => void;
};

export default function IdDocumentPdf({ uri, width, height, onError }: Props) {
  return (
    <Pdf
      source={{ uri }}
      page={1}
      singlePage
      fitPolicy={0}
      spacing={0}
      enablePaging={false}
      enableAnnotationRendering={false}
      style={{ height, width }}
      onError={onError}
    />
  );
}
