import { Pressable, Text, View } from 'react-native';
import AiSummaryTimeSvg from '@/src/assets/icons/ai-summary-time.svg';
import AiSummaryThirdPartySvg from '@/src/assets/icons/ai-summary-third-party.svg';

const LABEL_STYLE = { includeFontPadding: false, textAlignVertical: 'center' } as const;

/** Read-time + source pills shared by the AI Summary card and its bottom drawer. */
export default function AISummaryMetaChips({
  readTimeLabel,
  sourceLabel,
  onSourcePress,
  className,
}: {
  readTimeLabel?: string | null;
  sourceLabel?: string | null;
  onSourcePress?: () => void;
  className?: string;
}) {
  const time = readTimeLabel?.trim();
  const source = sourceLabel?.trim();
  if (!time && !source) return null;

  return (
    <View className={`flex-row items-center gap-1 ${className ?? ''}`}>
      {!!time && (
        <View className="h-5 flex-row items-center justify-center gap-1 rounded-lg bg-[#FFF8F5] px-1">
          <AiSummaryTimeSvg width={12} height={12} />
          <Text
            allowFontScaling={false}
            className="text-[8.96px] font-inter-medium leading-[12px] text-[#F46036]"
            style={LABEL_STYLE}
          >
            {time}
          </Text>
        </View>
      )}
      {!!source && (
        <Pressable
          onPress={onSourcePress}
          disabled={!onSourcePress}
          className="h-5 flex-row items-center justify-center gap-1 rounded-lg bg-[#F4FFFE] px-1"
          hitSlop={8}
        >
          <AiSummaryThirdPartySvg width={12} height={12} />
          <Text
            allowFontScaling={false}
            className="text-[8.96px] font-inter-medium leading-[12px] text-[#167A6F]"
            style={LABEL_STYLE}
          >
            {source}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
