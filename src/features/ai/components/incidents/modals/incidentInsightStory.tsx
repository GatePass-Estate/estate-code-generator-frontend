import {
  Image,
  type ImageSourcePropType,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

/** Figma frames are 375 wide; the status bar in them is 44 tall. */
const FRAME_WIDTH = 375;
const FRAME_STATUS_BAR = 44;
const IMAGE_HEIGHT = 250;

type Box = { left: number; top: number; width?: number };

type StoryPage = {
  step: number;
  title?: { top: number; text: string };
  subtitle: Box & { text: string };
  /** `gapBelowImage` pins the body under the image (whose height scales with width). */
  body: Box & { text: string; gapBelowImage?: number };
  badge: Box;
  image: { top: number; source: ImageSourcePropType };
};

/** Positions are the Figma frame coordinates (nodes 8322:2952 … 8322:3013). */
const PAGES: StoryPage[] = [
  {
    step: 1,
    title: { top: 174, text: 'How Incident Report Scan Works' },
    badge: { left: 24, top: 316 },
    subtitle: { left: 70, top: 318, width: 181, text: 'What happens ?' },
    body: {
      left: 70,
      top: 343,
      width: 273,
      text: 'When an estate asks for an incident report summary, the system reviews the incidents in that period — titles, categories, and what people wrote — and turns a long list of separate reports into one clear overview.',
    },
    image: { top: 415, source: require('@/src/assets/images/incident-info-1.jpg') },
  },
  {
    step: 2,
    badge: { left: 21, top: 236 },
    subtitle: { left: 67, top: 237, width: 181, text: 'Why it exists ?' },
    body: {
      left: 67,
      top: 262,
      width: 268,
      text: 'Estates often have many incidents over weeks or months. This helps admins and security see what keeps coming up — recurring issues, busy times, or themes — without reading every report one by one.',
    },
    image: { top: 413, source: require('@/src/assets/images/incident-info-2.jpg') },
  },
  {
    step: 3,
    badge: { left: 24, top: 300 },
    subtitle: { left: 73, top: 296, width: 181, text: 'What it looks at ?' },
    body: {
      left: 74,
      top: 320,
      width: 273,
      text: 'It only uses incident reports for that estate in the chosen date range. It looks for patterns across those reports: similar wording, shared categories, and when things tend to happen. It does not pull in unrelated data from outside the estate.',
    },
    image: { top: 413, source: require('@/src/assets/images/incident-info-3.jpg') },
  },
  {
    step: 4,
    badge: { left: 21, top: 203 },
    subtitle: { left: 66, top: 213, width: 181, text: 'What you get ?' },
    body: {
      left: 21,
      top: 479,
      gapBelowImage: 16,
      width: 314,
      text: 'Everyone gets a theme-style overview: the main kinds of incidents that showed up, how common each theme was, and a plain-language summary of timing (for example, weekends or certain times of day). Where the estate has the paid capability, they also get a deeper written summary — key patterns, a severity-style read, suggested follow-ups, and honest notes on what the data can and cannot tell you.',
    },
    image: { top: 213, source: require('@/src/assets/images/incident-info-4.jpg') },
  },
  {
    step: 5,
    badge: { left: 16, top: 193 },
    subtitle: { left: 67, top: 198, width: 181, text: 'What it does not do?' },
    body: {
      left: 66,
      top: 223,
      width: 273,
      text: 'It does not decide guilt, assign blame, or replace a formal investigation. It does not invent incidents or facts that were not in the reports. It supports decision-making by highlighting what the reports collectively suggest — humans still own the final call.',
    },
    image: { top: 329, source: require('@/src/assets/images/incident-info-5.jpg') },
  },
];

export const INCIDENT_INSIGHT_PAGE_COUNT = PAGES.length;

export function IncidentInsightPage({ index }: { index: number }) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const page = PAGES[index];
  const y = (top: number) => top + insets.top - FRAME_STATUS_BAR;
  const imageHeight = (width / FRAME_WIDTH) * IMAGE_HEIGHT;

  if (!page) return null;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      <Image
        source={page.image.source}
        resizeMode="cover"
        style={{
          position: 'absolute',
          left: 0,
          top: y(page.image.top),
          width,
          height: imageHeight,
        }}
      />
      {page.title ? (
        <Text
          allowFontScaling={false}
          className="absolute text-center text-[34.18px] font-ubuntu-bold text-primary"
          style={{ top: y(page.title.top), width: 313, left: (width - 313) / 2 }}
        >
          {page.title.text}
        </Text>
      ) : null}
      <View
        className="absolute w-[37px] items-center justify-center rounded-full bg-accent p-2.5"
        style={{ left: page.badge.left, top: y(page.badge.top) }}
      >
        <Text
          allowFontScaling={false}
          className="w-full text-center text-sm font-inter-medium text-primary"
        >
          {page.step}
        </Text>
      </View>
      <Text
        allowFontScaling={false}
        className="absolute text-sm font-inter-medium text-[#0A1F29]"
        style={{ left: page.subtitle.left, top: y(page.subtitle.top), width: page.subtitle.width }}
      >
        {page.subtitle.text}
      </Text>
      <Text
        allowFontScaling={false}
        className="absolute text-sm font-inter-light text-[#0A1F29]"
        style={{
          left: page.body.left,
          top:
            page.body.gapBelowImage != null
              ? y(page.image.top) + imageHeight + page.body.gapBelowImage
              : y(page.body.top),
          width: page.body.width,
        }}
      >
        {page.body.text}
      </Text>
    </View>
  );
}
