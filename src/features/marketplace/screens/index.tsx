import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  RefreshControl,
  useWindowDimensions,
  Image,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/shared/theme/styles';
import ScreenHeader from '@/src/shared/components/layout/ScreenHeader';
import BottomSheet from '@/src/shared/components/feedback/BottomSheet';
import { CircleLoader } from '@/src/shared/components/feedback/ScreenLoading';
import Svg, { Path } from 'react-native-svg';
import { ReactNode, useState, useMemo, useCallback } from 'react';
import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/src/shared/services/api/queryKeys';
import { BlurView } from 'expo-blur';
import {
  getMarketplaceFeatures,
  getFeaturePictureUrl,
} from '@/src/features/marketplace/services/aiMarketplace';
import { formatKoboAmount } from '@/src/features/billing/utils/currency';
import {
  MarketplaceListItem,
  type MarketplaceListParams,
  type MarketplaceListResponse,
} from '@/src/features/marketplace/types/aiMarketplace';

import IncidentReportSvg from '@/src/assets/images/incidentreportsummary.svg';
import AnomalyDetectionSvg from '@/src/assets/images/aianormaly.svg';
import AccessVolumePredictionSvg from '@/src/assets/images/accessvolumeprediction.svg';
import TemporaryAnomalyDetectionSvg from '@/src/assets/images/temporaryanomalydetection.svg';
import ExploratoryDataAnalysisSvg from '@/src/assets/images/exploratorydataanalysis.svg';

const RoundedStar = ({ size, color, filled }: { size: number; color: string; filled: boolean }) => (
  <Svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill={filled ? color : 'none'}
    stroke={color}
    strokeWidth={2.5}
  >
    <Path
      d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z"
      strokeLinejoin="round"
      strokeLinecap="round"
    />
  </Svg>
);

function StaticStarRating({
  rating,
  size = 12,
  disabled,
}: {
  rating: number;
  size?: number;
  disabled?: boolean;
}) {
  return (
    <View className="flex-row items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((star) => (
        <RoundedStar
          key={star}
          size={size}
          color={disabled ? '#E5E7EB' : rating === 0 ? '#C4C4C4' : '#F46036'}
          filled={star <= rating}
        />
      ))}
    </View>
  );
}

function getToolIllustration(name: string) {
  const lower = name.toLowerCase();
  if (lower.includes('incident') || lower.includes('report')) {
    return <IncidentReportSvg width={96} height={89} />;
  }
  if (lower.includes('temporary') || lower.includes('temporal')) {
    return <TemporaryAnomalyDetectionSvg width={96} height={89} />;
  }
  if (lower.includes('anomaly')) {
    return <AnomalyDetectionSvg width={96} height={89} />;
  }
  if (lower.includes('volume') || lower.includes('predict') || lower.includes('forecast')) {
    return <AccessVolumePredictionSvg width={96} height={89} />;
  }
  if (lower.includes('exploratory') || lower.includes('eda')) {
    return <ExploratoryDataAnalysisSvg width={96} height={89} />;
  }
  return <AnomalyDetectionSvg width={96} height={89} />;
}

type AITool = {
  id: string;
  title: string;
  isVerified?: boolean;
  price?: string;
  rating: number;
  icon: ReactNode;
  disabled?: boolean;
  category: string;
  isPurchased?: boolean;
};

const toggleFilter = (currentSelection: string[], value: string, allValues: string[]) => {
  if (value === 'all') {
    return ['all'];
  }
  let newSelection = currentSelection.filter((v) => v !== 'all');
  if (newSelection.includes(value)) {
    newSelection = newSelection.filter((v) => v !== value);
  } else {
    newSelection = [...newSelection, value];
  }
  return newSelection;
};

const PURCHASE_OPTIONS = ['purchased', 'not_purchased'];
const CATEGORY_OPTIONS = ['Access Anomaly Detection', 'Incident Report Insights'];

function marketplaceQuery(
  purchaseFilters: string[],
  categoryFilters: string[]
): MarketplaceListParams {
  const params: MarketplaceListParams = {};
  const purchase = purchaseFilters.filter(
    (value): value is 'purchased' | 'not_purchased' =>
      value === 'purchased' || value === 'not_purchased'
  );
  if (purchase.length > 0) params.purchase_status = purchase;
  const categories = categoryFilters.filter((value) => value !== 'all');
  if (categories.length > 0) params.category = categories;
  return params;
}

function mapMarketplaceItem(item: MarketplaceListItem): AITool {
  const cat = item.category || 'Access Anomaly Detection';
  const iconUrl = item.display_picture_url || item.picture_path;

  return {
    id: item.id,
    title: item.name,
    isVerified: item.purchased,
    price: item.purchased
      ? undefined
      : item.price != null
        ? formatKoboAmount(item.price, { currency: item.currency_code })
        : undefined,
    rating: item.rating != null ? Math.round(item.rating) : 0,
    icon: iconUrl ? (
      <Image
        source={{ uri: getFeaturePictureUrl(iconUrl) }}
        style={{ width: 96, height: 89 }}
        resizeMode="cover"
      />
    ) : (
      getToolIllustration(item.name)
    ),
    disabled: false,
    category: cat,
    isPurchased: item.purchased,
  };
}

function selectTools(data: MarketplaceListResponse | undefined): AITool[] {
  return (data?.items ?? []).map(mapMarketplaceItem);
}

export default function AIStoreScreen() {
  const { width } = useWindowDimensions();
  const cardWidth = (width - 42 - 8) / 2; // screen padding 21*2, gap 8
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [purchaseFilters, setPurchaseFilters] = useState<string[]>(['all']);
  const [categoryFilters, setCategoryFilters] = useState<string[]>(['all']);

  const listParams = useMemo(
    () => marketplaceQuery(purchaseFilters, categoryFilters),
    [purchaseFilters, categoryFilters]
  );
  // Cached per filter set; purchases/installs/uninstalls invalidate queryKeys.marketplace.all.
  const {
    data: tools = [],
    isPending: isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: queryKeys.marketplace.list(listParams),
    queryFn: () => getMarketplaceFeatures(listParams),
    select: selectTools,
    placeholderData: keepPreviousData,
  });

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // A failed refresh keeps the last good list (the query keeps its data on error).
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const filteredTools = tools.filter((tool) => {
    // Search Filter
    if (searchQuery && !tool.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Purchase Filter
    if (!purchaseFilters.includes('all') && purchaseFilters.length > 0) {
      const isMatch =
        (tool.isPurchased && purchaseFilters.includes('purchased')) ||
        (!tool.isPurchased && purchaseFilters.includes('not_purchased'));
      if (!isMatch) return false;
    }
    // Category Filter
    if (!categoryFilters.includes('all') && categoryFilters.length > 0) {
      if (!categoryFilters.includes(tool.category)) {
        return false;
      }
    }
    return true;
  });

  return (
    <SafeAreaView style={[sharedStyles.container, { backgroundColor: '#F6F7F7' }]}>
      <Stack.Screen options={{ headerShown: false }} />

      <ScreenHeader
        showBack
        containerClassName="mb-4"
        titleClassName="text-heading font-ubuntu-medium text-primary leading-[27.34px]"
        title="Shop Your AI Tools"
      />

      {/* Search and Filter Row */}
      <View className="flex-row items-center gap-[8px] mb-6 mt-1">
        <View
          className="flex-1 flex-row items-center bg-[#EFF1F1] rounded-[16px] px-[16px] gap-[8px]"
          style={{
            height: 36,
            borderRadius: 16,
            paddingLeft: 16,
            paddingRight: 16,
            gap: 8,
            opacity: 1,
          }}
        >
          <Ionicons name="search-outline" size={16} color="#A0A0A0" />
          <TextInput
            placeholder="Search Shop"
            placeholderTextColor="#A0A0A0"
            value={searchQuery}
            onChangeText={setSearchQuery}
            className="flex-1 text-[13px] font-inter-regular text-primary p-0"
            style={{
              paddingVertical: 0,
              paddingTop: 0,
              paddingBottom: 0,
              margin: 0,
              textAlignVertical: 'center',
              transform: [{ translateY: -2 }],
            }}
          />
        </View>
        <Pressable
          onPress={() => setFilterModalVisible(true)}
          className="bg-primary rounded-[16px] px-[16px] py-[4px] gap-[8px] items-center justify-center"
          style={{
            width: 52,
            height: 36,
            borderRadius: 16,
            paddingTop: 4,
            paddingRight: 16,
            paddingBottom: 4,
            paddingLeft: 16,
            gap: 8,
            opacity: 1,
          }}
        >
          <Ionicons name="options-outline" size={18} color="white" />
        </Pressable>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 40 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#113E55']}
            tintColor="#113E55"
          />
        }
      >
        {isLoading && tools.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <CircleLoader size={48} />
          </View>
        ) : isError && tools.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
              Could not load AI tools.
            </Text>
            <Pressable onPress={() => void refetch()} className="mt-3 px-4 py-2">
              <Text className="text-center text-sm font-inter-medium text-[#113E55]">
                Try again
              </Text>
            </Pressable>
          </View>
        ) : filteredTools.length === 0 ? (
          <View className="py-16 items-center justify-center">
            <Text className="text-center text-sm font-inter-regular text-[#6C6C6C]">
              No AI tools to show.
            </Text>
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTools.map((tool) => (
              <Pressable
                key={tool.id}
                onPress={() => {
                  const title = tool.title.toLowerCase();
                  if (title.includes('incident') || title.includes('report')) {
                    router.push({
                      pathname: '/(protected)/(shared-screens)/ai-store/incident-report',
                      params: { featureId: tool.id, title: tool.title },
                    });
                    return;
                  }
                  if (title.includes('anomaly') || tool.id === '2') {
                    router.push({
                      pathname: '/(protected)/(shared-screens)/ai-store/anomaly-detection',
                      params: { featureId: tool.id, title: tool.title },
                    });
                  }
                }}
                style={[styles.card, { width: cardWidth }]}
              >
                {/* Card Header (Price/Badge) */}
                <View style={styles.cardHeader}>
                  {tool.isVerified ? (
                    <MaterialCommunityIcons name="check-decagram" size={20} color="#107569" />
                  ) : tool.price ? (
                    <View className="bg-light-teal px-2 py-[2px] rounded-full justify-center items-center">
                      <Text className="text-[12px] font-inter-medium text-[#107569]">
                        {tool.price}
                      </Text>
                    </View>
                  ) : (
                    <View style={{ height: 20 }} />
                  )}
                </View>

                {/* Illustration */}
                <View style={[styles.illustrationContainer, { opacity: tool.disabled ? 0.15 : 1 }]}>
                  <View style={{ borderRadius: 16, overflow: 'hidden' }}>{tool.icon}</View>
                </View>

                {/* "Coming Soon" Overlay for disabled cards */}
                {tool.disabled && (
                  <View style={[StyleSheet.absoluteFill, { top: 32 }]} className="items-center">
                    <Text className="text-[15px] font-ubuntu-medium text-primary">Coming Soon</Text>
                  </View>
                )}

                {/* Title & Rating */}
                <View className="mt-[12px] flex-col gap-1 w-full items-start">
                  <Text
                    className={`text-[11px] font-inter-regular ${tool.disabled ? 'text-[#C4C4C4]' : 'text-primary'}`}
                    numberOfLines={1}
                  >
                    {tool.title}
                  </Text>
                  <StaticStarRating rating={tool.rating} disabled={tool.disabled} />
                </View>
              </Pressable>
            ))}
          </View>
        )}
      </ScrollView>

      {/* Filter Bottom Sheet Modal */}
      <BottomSheet
        visible={isFilterModalVisible}
        onClose={() => setFilterModalVisible(false)}
        scrimClassName="flex-1 justify-end"
        backdrop={<BlurView intensity={25} tint="light" style={StyleSheet.absoluteFill} />}
        panelClassName="max-h-[90%] px-8 pt-4"
        panelStyle={{ paddingBottom: 32 }}
      >
        <ScrollView
          showsVerticalScrollIndicator={false}
          style={{ flexGrow: 0, flexShrink: 1 }}
          bounces={false}
          contentContainerStyle={{ paddingBottom: 28 }}
        >
          <View className="mb-6">
            <Text className="text-[16px] font-inter-regular text-[#8A9A9D] mb-3">Purchase</Text>
            <View className="flex-row flex-wrap gap-4">
              <Pressable
                onPress={() => setPurchaseFilters(['all'])}
                className={`px-5 py-[10px] rounded-full ${
                  purchaseFilters.includes('all') ? 'bg-[#D2E7ED]' : 'bg-[#EFF1F1]'
                }`}
              >
                <Text
                  className={`text-[14px] font-inter-regular ${
                    purchaseFilters.includes('all') ? 'text-primary' : 'text-[#8A9A9D]'
                  }`}
                >
                  All
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setPurchaseFilters((prev) => toggleFilter(prev, 'purchased', PURCHASE_OPTIONS))
                }
                className={`px-5 py-[10px] rounded-full ${
                  purchaseFilters.includes('purchased') ? 'bg-[#D2E7ED]' : 'bg-[#EFF1F1]'
                }`}
              >
                <Text
                  className={`text-[14px] font-inter-regular ${
                    purchaseFilters.includes('purchased') ? 'text-primary' : 'text-[#8A9A9D]'
                  }`}
                >
                  Purchased
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setPurchaseFilters((prev) =>
                    toggleFilter(prev, 'not_purchased', PURCHASE_OPTIONS)
                  )
                }
                className={`px-5 py-[10px] rounded-full ${
                  purchaseFilters.includes('not_purchased') ? 'bg-[#D2E7ED]' : 'bg-[#EFF1F1]'
                }`}
              >
                <Text
                  className={`text-[14px] font-inter-regular ${
                    purchaseFilters.includes('not_purchased') ? 'text-primary' : 'text-[#8A9A9D]'
                  }`}
                >
                  Not Purchased
                </Text>
              </Pressable>
            </View>
          </View>

          {/* Divider */}
          <View className="h-[1px] w-full bg-[#E5E7EB] mb-6" />

          {/* Category Section */}
          <View className="mb-6">
            <Text className="text-[16px] font-inter-regular text-[#8A9A9D] mb-3">Category</Text>
            <View className="flex-row flex-wrap gap-4">
              <Pressable
                onPress={() => setCategoryFilters(['all'])}
                className={`px-5 py-[10px] rounded-full ${
                  categoryFilters.includes('all') ? 'bg-[#D2E7ED]' : 'bg-[#EFF1F1]'
                }`}
              >
                <Text
                  className={`text-[14px] font-inter-regular ${
                    categoryFilters.includes('all') ? 'text-primary' : 'text-[#8A9A9D]'
                  }`}
                >
                  All
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setCategoryFilters((prev) =>
                    toggleFilter(prev, 'Access Anomaly Detection', CATEGORY_OPTIONS)
                  )
                }
                className={`px-5 py-[10px] rounded-full ${
                  categoryFilters.includes('Access Anomaly Detection')
                    ? 'bg-[#D2E7ED]'
                    : 'bg-[#EFF1F1]'
                }`}
              >
                <Text
                  className={`text-[14px] font-inter-regular ${
                    categoryFilters.includes('Access Anomaly Detection')
                      ? 'text-primary'
                      : 'text-[#8A9A9D]'
                  }`}
                >
                  Access Anomaly Detection
                </Text>
              </Pressable>
              <Pressable
                onPress={() =>
                  setCategoryFilters((prev) =>
                    toggleFilter(prev, 'Incident Report Insights', CATEGORY_OPTIONS)
                  )
                }
                className={`px-5 py-[10px] rounded-full ${
                  categoryFilters.includes('Incident Report Insights')
                    ? 'bg-[#D2E7ED]'
                    : 'bg-[#EFF1F1]'
                }`}
              >
                <Text
                  className={`text-[14px] font-inter-regular ${
                    categoryFilters.includes('Incident Report Insights')
                      ? 'text-primary'
                      : 'text-[#8A9A9D]'
                  }`}
                >
                  Incident Report Insights
                </Text>
              </Pressable>
            </View>
          </View>
        </ScrollView>

        {/* Confirm Button */}
        <Pressable
          onPress={() => setFilterModalVisible(false)}
          className="mt-6 w-full max-w-[278px] min-w-[80px] self-center items-center justify-center rounded-[24px] border border-primary bg-primary px-[32px] py-[16px]"
        >
          <Text className="text-[16px] font-ubuntu-medium text-white leading-[20px]">Confirm</Text>
        </Pressable>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 8,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 20,
    height: 176,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cardHeader: {
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginBottom: 4,
    height: 20,
  },
  illustrationContainer: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    overflow: 'hidden',
  },
});
