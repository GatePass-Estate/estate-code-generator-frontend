import { Text, View, useWindowDimensions } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Info1Svg from '@/src/assets/images/info1.svg';
import Info2Svg from '@/src/assets/images/info2.svg';
import Info3Svg from '@/src/assets/images/info3.svg';
import Info4Svg from '@/src/assets/images/info4.svg';
import Info5Svg from '@/src/assets/images/info5.svg';

const PAGES = [
  {
    step: 1,
    title: 'How Anomaly\nScan Works',
    subtitle: 'What happens ?',
    text1:
      'When someone validates an access code at the gate, an anomaly scan runs quietly in the background.',
    text2:
      'It checks whether this visit fits how things usually work at the estate, not just whether the code was valid.',
    Svg: Info1Svg,
    layout: 'sandwich',
  },
  {
    step: 2,
    subtitle: 'Why it exists ?',
    text1:
      "The scan helps spot visits that deserve a second look: unusual timing, patterns that don't match what we normally see, or anything that feels out of place. The goal is smarter awareness, not flagging every normal entry.",
    Svg: Info2Svg,
    layout: 'topText',
  },
  {
    step: 3,
    subtitle: 'What it compares ?',
    text1:
      "It compares the visit to past visits at the same estate that looked normal. If we don't have much history yet, for example, a first-time visitor, that alone is not treated as suspicious.",
    Svg: Info3Svg,
    layout: 'topText',
  },
  {
    step: 4,
    subtitle: 'What happens ?',
    text1:
      'If a visit stands out enough, we flag it and notify estate admins so they can review it. The result page explains, in plain terms, what looked unusual. However, admins decide what to do next.',
    Svg: Info4Svg,
    layout: 'bottomText',
  },
  {
    step: 5,
    subtitle: 'What it does ?',
    text1:
      'It does not block the gate, replace human judgment, or treat every unfamiliar person as a threat. It supports admins by surfacing visits worth a closer look.',
    Svg: Info5Svg,
    layout: 'topTextCards',
  },
] as const;

export const ANOMALY_INSIGHT_PAGE_COUNT = PAGES.length;

export function AnomalyInsightPage({ index }: { index: number }) {
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const page = PAGES[index];
  if (!page) return null;
  const SvgImage = page.Svg;
  const imageAspect = 250 / 375;

  return (
    <View
      style={{
        flex: 1,
        paddingHorizontal: 24,
        paddingTop: insets.top + 36,
        paddingBottom: 24,
        justifyContent: 'center',
      }}
      pointerEvents="none"
    >
      {'title' in page && page.title ? (
        <Text
          style={{
            fontFamily: 'UbuntuSans-Bold',
            fontSize: 34.18,
            color: '#113E55',
            textAlign: 'center',
            marginBottom: 32,
            lineHeight: 34.18,
          }}
        >
          {page.title}
        </Text>
      ) : null}
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
        <View
          style={{
            width: 28,
            height: 28,
            borderRadius: 14,
            backgroundColor: '#DFEBF1',
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: 12,
          }}
        >
          <Text style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 14, color: '#113E55' }}>
            {page.step}
          </Text>
        </View>
        <Text style={{ fontFamily: 'UbuntuSans-Medium', fontSize: 16, color: '#113E55' }}>
          {page.subtitle}
        </Text>
      </View>
      {page.layout === 'sandwich' && 'text2' in page ? (
        <View>
          <Text style={bodyText}>{page.text1}</Text>
          <View style={{ width: '100%', alignItems: 'center', marginVertical: 16 }}>
            <SvgImage width={width - 48} height={(width - 48) * imageAspect} />
          </View>
          <Text style={[bodyText, { marginBottom: 0 }]}>{page.text2}</Text>
        </View>
      ) : null}
      {page.layout === 'topText' ? (
        <View>
          <Text style={[bodyText, { marginBottom: 24 }]}>{page.text1}</Text>
          <View style={{ width, marginLeft: -24, alignItems: 'center' }}>
            <SvgImage width={width} height={width * imageAspect} />
          </View>
        </View>
      ) : null}
      {page.layout === 'bottomText' ? (
        <View>
          <View
            style={{
              width,
              marginLeft: -24,
              alignItems: 'center',
              marginBottom: 24,
              marginTop: 16,
            }}
          >
            <SvgImage width={width} height={width * imageAspect} />
          </View>
          <Text style={bodyText}>{page.text1}</Text>
        </View>
      ) : null}
      {page.layout === 'topTextCards' ? (
        <View style={{ marginHorizontal: -24, paddingHorizontal: 24 }}>
          <Text style={[bodyText, { marginBottom: 16 }]}>{page.text1}</Text>
          <View style={{ width, marginLeft: -24, alignItems: 'center', marginBottom: 16 }}>
            <SvgImage width={width} height={width * imageAspect} />
          </View>
        </View>
      ) : null}
    </View>
  );
}

const bodyText = {
  fontFamily: 'Inter_18pt-Regular',
  fontSize: 15,
  color: '#4A6B7C',
  lineHeight: 22,
  marginBottom: 16,
} as const;
