import { Pressable, Text, View } from 'react-native';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import { router } from 'expo-router';
import BillingSheet from '@/src/features/billing/components/BillingSheet';
import InfoNote from '@/src/features/billing/components/InfoNote';
import { SegmentedProgress } from '@/src/features/billing/components/SegmentedProgress';
import { useEstateAiTools } from '@/src/features/billing/hooks/billing';
import { formatBillingDate, getCycleProgress } from '@/src/features/billing/utils/billing';
import { cn } from '@/src/shared/utils/cn';
import type { EstateAiTool } from '@/src/features/billing/types/billing';

/** "Started: October 20" — Figma mixes a 9pt medium prefix with the 11.2pt regular date. */
function DateCaption({
  prefix,
  value,
  align,
}: {
  prefix: string;
  value: string;
  align: 'left' | 'right';
}) {
  return (
    <Text
      className={cn(
        'font-inter-regular text-caption leading-[13.6px] text-[#0A1F29]',
        align === 'right' && 'text-right'
      )}
    >
      <Text className="font-inter-medium text-[9px]">{`${prefix}: `}</Text>
      {value}
    </Text>
  );
}

function AiToolCard({ tool }: { tool: EstateAiTool }) {
  // A grant without an expiry never ends (free install), so there is no period to fill.
  const progress = tool.expiresAt ? getCycleProgress(tool.startsAt, tool.expiresAt) : 0;
  const started = formatBillingDate(tool.startsAt, 'short') || '—';
  const ends = tool.expiresAt ? formatBillingDate(tool.expiresAt, 'short') || '—' : 'No expiry';

  return (
    // Figma: 16pt padding, 8pt title→progress frame, bar 8pt into that frame, labels 7pt under it.
    <View className="gap-2 rounded-[20px] bg-white px-4 pb-[29px] pt-4">
      <Text
        className="font-inter-regular text-[17.5px] leading-[21.2px] text-primary"
        numberOfLines={1}
      >
        {tool.name}
      </Text>
      <SegmentedProgress
        className="mt-2"
        progress={progress}
        startLabel={<DateCaption prefix="Started" value={started} align="left" />}
        endLabel={<DateCaption prefix="Ends" value={ends} align="right" />}
      />
    </View>
  );
}

/**
 * "Active AI Tools" bottom sheet: marketplace note, then one validity card per active standalone
 * AI subscription (subscribed to in the AI marketplace; plan-included and free tools not listed).
 */
export default function AiToolsSheet({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  const { tools, isLoading, error, refetch } = useEstateAiTools();
  const activeTools = tools.filter((tool) => tool.status === 'active');

  const openMarketplace = () => {
    onClose();
    router.push('/ai-store');
  };

  let content;
  if (isLoading) {
    content = (
      <View className="items-center py-10">
        <CircleLoader size={32} />
      </View>
    );
  } else if (error) {
    content = (
      <View className="items-center py-8">
        <Text className="mb-4 text-center font-inter-regular text-sm text-danger">
          {error.message || 'Could not load your AI tools.'}
        </Text>
        <Pressable
          onPress={() => void refetch()}
          accessibilityRole="button"
          className="rounded-[24px] bg-primary px-5 py-3"
        >
          <Text className="font-ubuntu-semibold text-sm text-white">Try again</Text>
        </Pressable>
      </View>
    );
  } else if (activeTools.length === 0) {
    content = (
      <View className="items-center gap-4 py-6">
        <Text className="text-center font-inter-regular text-sm text-[#878686]">
          No standalone AI subscriptions. AI tools included in your plan and free AI tools are not
          listed here; subscribe to more in the AI marketplace.
        </Text>
        <Pressable
          onPress={openMarketplace}
          accessibilityRole="button"
          className="rounded-[24px] bg-primary px-5 py-3"
        >
          <Text className="font-ubuntu-semibold text-sm text-white">Go to AI marketplace</Text>
        </Pressable>
      </View>
    );
  } else {
    content = (
      <View className="gap-4">
        {activeTools.map((tool) => (
          <AiToolCard key={`${tool.featureKey}-${tool.name}`} tool={tool} />
        ))}
      </View>
    );
  }

  return (
    <BillingSheet visible={visible} onClose={onClose} scrollable>
      {/* Figma: cards follow 21pt under the note. */}
      <View className="gap-[21px]">
        <Pressable
          onPress={openMarketplace}
          accessibilityRole="link"
          accessibilityHint="Opens the AI marketplace"
        >
          <InfoNote text="To manage subscription on your active AI tools go to AI marketplace." />
        </Pressable>
        {content}
      </View>
    </BillingSheet>
  );
}
