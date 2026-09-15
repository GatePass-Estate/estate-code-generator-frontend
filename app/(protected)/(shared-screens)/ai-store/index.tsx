import {
  View,
  Text,
  Pressable,
  ScrollView,
  TextInput,
  StyleSheet,
  Dimensions,
  Modal,
  Animated,
  PanResponder,
  ActivityIndicator,
  RefreshControl,
  Platform,
  Image,
} from 'react-native';
import { router, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons, Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { sharedStyles } from '@/src/theme/styles';
import ScreenHeader from '@/src/components/mobile/ScreenHeader';
import Svg, { Path } from 'react-native-svg';
import { ReactNode, useState, useMemo, useEffect, useCallback } from 'react';
import { BlurView } from 'expo-blur';
import { getMarketplaceFeatures, getFeaturePictureUrl } from '@/src/lib/api/aiMarketplace';
import { MarketplaceListItem } from '@/src/types/aiMarketplace';

import IncidentReportSvg from '@/src/assets/images/incidentreportsummary.svg';
import AnomalyDetectionSvg from '@/src/assets/images/anomalydetection.svg';
import AccessVolumePredictionSvg from '@/src/assets/images/accessvolumeprediction.svg';
import TemporaryAnomalyDetectionSvg from '@/src/assets/images/temporaryanomalydetection.svg';
import ExploratoryDataAnalysisSvg from '@/src/assets/images/exploratorydataanalysis.svg';

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 42 - 8) / 2; // screen padding 21*2, gap 8

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

function StaticStarRating({ rating, size = 12, disabled }: { rating: number, size?: number, disabled?: boolean }) {
  return (
    <View className="flex-row items-center gap-[2px]">
      {[1, 2, 3, 4, 5].map((star) => (
        <RoundedStar
          key={star}
          size={size}
          color={disabled ? '#E5E7EB' : (rating === 0 ? '#C4C4C4' : '#F46036')}
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
  category: 'incident' | 'traffic';
  isPurchased?: boolean;
};

export default function AIStoreScreen() {
  const [tools, setTools] = useState<AITool[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFilterModalVisible, setFilterModalVisible] = useState(false);
  const [purchaseFilter, setPurchaseFilter] = useState<'purchased' | 'all'>('all');
  const [categoryFilter, setCategoryFilter] = useState<'incident' | 'traffic' | 'all'>('all');

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const params: any = {};
        if (purchaseFilter === 'purchased') {
          params.purchase_status = 'purchased';
        }
        if (categoryFilter !== 'all') {
          params.category = categoryFilter;
        }
        const data = await getMarketplaceFeatures(params);
        console.log('\n================== [AI MARKETPLACE API RESPONSE] ==================');
        console.log(JSON.stringify(data, null, 2));
        console.log('===================================================================\n');

        if (isMounted && data && data.items && data.items.length > 0) {
          const liveTools: AITool[] = data.items.map((item: MarketplaceListItem) => {
            const cat = item.category?.toLowerCase().includes('traffic') ? 'traffic' : 'incident';
            const iconUrl = (item as any).display_picture_url || item.picture_path;
            
            return {
              id: item.id,
              title: item.name,
              isVerified: item.purchased,
              price: item.purchased
                ? undefined
                : item.price != null
                ? `${item.currency_code === 'NGN' ? '₦' : '$'}${item.price}`
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
          });
          setTools(liveTools);
        }
      } catch (err: any) {
        console.log('AI Marketplace API note:', err?.message || err);
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, [purchaseFilter, categoryFilter]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const params: any = {};
      if (purchaseFilter === 'purchased') {
        params.purchase_status = 'purchased';
      }
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      const data = await getMarketplaceFeatures(params);

      if (data && data.items && data.items.length > 0) {
        const liveTools: AITool[] = data.items.map((item: MarketplaceListItem) => {
          const cat = item.category?.toLowerCase().includes('traffic') ? 'traffic' : 'incident';
          const iconUrl = (item as any).display_picture_url || item.picture_path;
          
          return {
            id: item.id,
            title: item.name,
            isVerified: item.purchased,
            price: item.purchased
              ? undefined
              : item.price != null
              ? `${item.currency_code === 'NGN' ? '₦' : '$'}${item.price}`
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
        });
        setTools(liveTools);
      }
    } catch (err: any) {
      console.log('AI Marketplace API refresh note:', err?.message || err);
    } finally {
      setRefreshing(false);
    }
  }, [purchaseFilter, categoryFilter]);

  // Drag-to-close animation state
  const [panY] = useState(() => new Animated.Value(0));
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gestureState) => gestureState.dy > 0,
        onPanResponderMove: (_, gestureState) => {
          if (gestureState.dy > 0) {
            panY.setValue(gestureState.dy);
          }
        },
        onPanResponderRelease: (_, gestureState) => {
          if (gestureState.dy > 150 || gestureState.vy > 1.5) {
            Animated.timing(panY, {
              toValue: Dimensions.get('window').height,
              duration: 200,
              useNativeDriver: true,
            }).start(() => {
              setFilterModalVisible(false);
              panY.setValue(0);
            });
          } else {
            Animated.spring(panY, {
              toValue: 0,
              useNativeDriver: true,
              bounciness: 0,
            }).start();
          }
        },
      }),
    [panY]
  );

  const filteredTools = tools.filter((tool) => {
    // Search Filter
    if (searchQuery && !tool.title.toLowerCase().includes(searchQuery.toLowerCase())) {
      return false;
    }
    // Purchase Filter
    if (purchaseFilter === 'purchased' && !tool.isPurchased) {
      return false;
    }
    // Category Filter
    if (categoryFilter !== 'all' && tool.category !== categoryFilter) {
      return false;
    }
    return true;
  });

  return (
    <SafeAreaView
      style={[sharedStyles.container, sharedStyles.modalContainer, { backgroundColor: '#F6F7F7', paddingHorizontal: 21 }]}
    >
      <Stack.Screen options={{ headerShown: false }} />

      <Pressable
        onPress={() => router.back()}
        className="h-[30px] w-[30px] items-center justify-center rounded-full bg-[#EFF1F1] mt-2"
      >
        <MaterialIcons name="keyboard-arrow-left" size={24} color="#113E55" />
      </Pressable>

      <ScreenHeader
        containerClassName="mt-6 mb-4"
        titleClassName="text-[27.34px] font-ubuntu-medium text-[#113E55] leading-[27.34px]"
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
            className="flex-1 text-[13px] font-inter-regular text-[#113E55] p-0"
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
          onPress={() => {
            panY.setValue(0);
            setFilterModalVisible(true);
          }}
          className="bg-[#113E55] rounded-[16px] px-[16px] py-[4px] gap-[8px] items-center justify-center"
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
            <ActivityIndicator size="small" color="#113E55" />
          </View>
        ) : (
          <View style={styles.grid}>
            {filteredTools.map((tool) => (
              <Pressable
                key={tool.id}
                onPress={() => {
                  if (tool.title.toLowerCase().includes('anomaly') || tool.id === '2') {
                    router.push({
                      pathname: '/(protected)/(shared-screens)/ai-store/anomaly-detection',
                      params: { featureId: tool.id, title: tool.title },
                    });
                  }
                }}
                style={[
                  styles.card,
                  { width: CARD_WIDTH },
                ]}
              >
              {/* Card Header (Price/Badge) */}
              <View style={styles.cardHeader}>
                {tool.isVerified ? (
                  <MaterialCommunityIcons name="check-decagram" size={20} color="#107569" />
                ) : tool.price ? (
                  <View className="bg-[#F4FFFE] px-2 py-[2px] rounded-full justify-center items-center">
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
                <View style={{ width: 96, height: 89, borderRadius: 12, overflow: 'hidden' }}>
                  {tool.icon}
                </View>
              </View>

              {/* "Coming Soon" Overlay for disabled cards */}
              {tool.disabled && (
                <View style={[StyleSheet.absoluteFill, { top: 32 }]} className="items-center">
                  <Text className="text-[15px] font-ubuntu-medium text-[#113E55]">
                    Coming Soon
                  </Text>
                </View>
              )}

              {/* Title & Rating */}
              <View className="mt-[12px] flex-col gap-1 w-full items-start">
                <Text
                  className={`text-[11px] font-inter-regular ${tool.disabled ? 'text-[#C4C4C4]' : 'text-[#113E55]'}`}
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
      <Modal
        visible={isFilterModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setFilterModalVisible(false)}
      >
        <View className="flex-1 justify-end">
          <BlurView 
            intensity={25} 
            tint="light" 
            style={StyleSheet.absoluteFill} 
          />
          <Pressable 
            style={StyleSheet.absoluteFill} 
            onPress={() => setFilterModalVisible(false)} 
          />
          <Animated.View 
            {...panResponder.panHandlers}
            style={{ transform: [{ translateY: panY }], maxHeight: '90%' }}
            className="bg-[#F6F7F7] w-full rounded-t-[40px] px-8 pb-8 pt-4 flex-col"
          >
            {/* Drag Handle */}
            <View className="w-[100px] h-[6px] bg-[#A0A0A0] rounded-full self-center mb-6" />

            <ScrollView 
              showsVerticalScrollIndicator={false}
              bounces={false}
              contentContainerStyle={{ paddingBottom: 16 }}
            >
              {/* Purchase Section */}
              <View className="mb-6">
                <Text className="text-[16px] font-inter-regular text-[#8A9A9D] mb-3">
                  Purchase
                </Text>
                <View className="flex-row flex-wrap gap-4">
                  <Pressable
                    onPress={() => setPurchaseFilter('purchased')}
                    className={`px-5 py-[10px] rounded-full ${
                      purchaseFilter === 'purchased' ? 'bg-[#D2E7ED]' : 'bg-[#EFF1F1]'
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-inter-regular ${
                        purchaseFilter === 'purchased' ? 'text-[#113E55]' : 'text-[#8A9A9D]'
                      }`}
                    >
                      Purchased Only
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setPurchaseFilter('all')}
                    className={`px-5 py-[10px] rounded-full ${
                      purchaseFilter === 'all' ? 'bg-[#D2E7ED]' : 'bg-[#EFF1F1]'
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-inter-regular ${
                        purchaseFilter === 'all' ? 'text-[#113E55]' : 'text-[#8A9A9D]'
                      }`}
                    >
                      All AI Tools
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Divider */}
              <View className="h-[1px] w-full bg-[#E5E7EB] mb-6" />

              {/* Category Section */}
              <View className="mb-6">
                <Text className="text-[16px] font-inter-regular text-[#8A9A9D] mb-3">
                  Category
                </Text>
                <View className="flex-row flex-wrap gap-4">
                  <Pressable
                    onPress={() => setCategoryFilter(prev => prev === 'incident' ? 'all' : 'incident')}
                    className={`px-5 py-[10px] rounded-full ${
                      categoryFilter === 'incident' ? 'bg-[#D2E7ED]' : 'bg-[#EFF1F1]'
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-inter-regular ${
                        categoryFilter === 'incident' ? 'text-[#113E55]' : 'text-[#8A9A9D]'
                      }`}
                    >
                      Incident Tools
                    </Text>
                  </Pressable>
                  <Pressable
                    onPress={() => setCategoryFilter(prev => prev === 'traffic' ? 'all' : 'traffic')}
                    className={`px-5 py-[10px] rounded-full ${
                      categoryFilter === 'traffic' ? 'bg-[#D2E7ED]' : 'bg-[#EFF1F1]'
                    }`}
                  >
                    <Text
                      className={`text-[14px] font-inter-regular ${
                        categoryFilter === 'traffic' ? 'text-[#113E55]' : 'text-[#8A9A9D]'
                      }`}
                    >
                      Traffic Tools
                    </Text>
                  </Pressable>
                </View>
              </View>
            </ScrollView>

            {/* Confirm Button */}
            <Pressable
              onPress={() => setFilterModalVisible(false)}
              className="w-full max-w-[278px] min-w-[80px] bg-[#113E55] rounded-[24px] border border-[#113E55] px-[32px] py-[16px] self-center items-center justify-center mt-2"
            >
              <Text className="text-[16px] font-ubuntu-medium text-white leading-[20px]">
                Confirm
              </Text>
            </Pressable>
          </Animated.View>
        </View>
      </Modal>
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
