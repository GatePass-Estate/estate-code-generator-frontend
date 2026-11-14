import { useEffect, useRef, useState } from 'react';
import { ScrollView, View, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { NarrativeCard } from '@/src/features/ai/components/incidents/result/CategoryExpandSheet';
import {
  type IncidentCategory,
  type IncidentCategoryId,
} from '@/src/features/ai/components/incidents/incidentTypes';

export function NarrativeSnippetSlider({
  selectedId,
  onSelect,
  categories,
}: {
  selectedId: IncidentCategoryId;
  onSelect: (id: IncidentCategoryId) => void;
  categories: IncidentCategory[];
}) {
  const scrollRef = useRef<ScrollView>(null);
  const [pageWidth, setPageWidth] = useState(0);
  /** Only a finger swipe changes the category; programmatic scrolls never feed back. */
  const userSwiping = useRef(false);
  const selectedIndex = categories.findIndex((c) => c.id === selectedId);

  useEffect(() => {
    if (pageWidth <= 0 || selectedIndex < 0 || userSwiping.current) return;
    scrollRef.current?.scrollTo({ x: selectedIndex * pageWidth, animated: true });
  }, [selectedId, selectedIndex, pageWidth]);

  const selectPageAt = (offsetX: number) => {
    if (pageWidth <= 0) return;
    const next = Math.round(offsetX / pageWidth);
    const cat = categories[next];
    if (cat && cat.id !== selectedId) onSelect(cat.id);
  };

  /**
   * Android does not always emit momentum-end for a slow paging swipe, so also settle
   * from onScroll once the pager lands exactly on a page.
   */
  const onScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!userSwiping.current || pageWidth <= 0) return;
    const x = e.nativeEvent.contentOffset.x;
    if (Math.abs(x - Math.round(x / pageWidth) * pageWidth) < 1) {
      selectPageAt(x);
      userSwiping.current = false;
    }
  };

  const onSwipeEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (!userSwiping.current) return;
    selectPageAt(e.nativeEvent.contentOffset.x);
    userSwiping.current = false;
  };

  return (
    <View
      style={{ marginTop: 16 }}
      onLayout={(e) => {
        const w = Math.round(e.nativeEvent.layout.width);
        if (w > 0 && w !== pageWidth) setPageWidth(w);
      }}
    >
      {pageWidth > 0 ? (
        <ScrollView
          ref={scrollRef}
          horizontal
          pagingEnabled
          nestedScrollEnabled
          directionalLockEnabled
          decelerationRate="fast"
          showsHorizontalScrollIndicator={false}
          scrollEventThrottle={16}
          onScrollBeginDrag={() => {
            userSwiping.current = true;
          }}
          onScroll={onScroll}
          onMomentumScrollEnd={onSwipeEnd}
        >
          {categories.map((cat) => (
            <View key={cat.id} style={{ width: pageWidth }} className="px-[26px]">
              <NarrativeCard text={cat.narrative} />
            </View>
          ))}
        </ScrollView>
      ) : (
        <View className="px-[26px]">
          <NarrativeCard
            text={
              categories.find((c) => c.id === selectedId)?.narrative ??
              categories[0]?.narrative ??
              ''
            }
          />
        </View>
      )}
    </View>
  );
}
