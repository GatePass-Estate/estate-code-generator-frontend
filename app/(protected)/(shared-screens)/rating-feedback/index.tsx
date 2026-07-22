import { Platform } from 'react-native';
import RatingFeedbackNative from './index.native';
import RatingFeedbackWeb from './index.web';

export default function RatingFeedback() {
  const Component = Platform.select({
    web: () => <RatingFeedbackWeb />,
    default: () => <RatingFeedbackNative />,
  });

  return <Component />;
}
