import type { ScrollView, View } from 'react-native';

/**
 * Scrolls `card` into view inside `scroll`, whole. A card that fits is shown with a margin above
 * it; one taller than the screen is lined up by its bottom, so its last control (e.g. an Activate
 * button) is always on screen.
 */
export function scrollCardIntoView(
  scroll: ScrollView | null,
  card: View | null,
  viewportHeight: number,
  margin = 16
) {
  const content = scroll?.getInnerViewRef?.();
  if (!scroll || !card || !content) return;

  card.measureLayout(
    content as never,
    (_x, y, _width, height) => {
      const fits = height + margin * 2 <= viewportHeight;
      const target = fits ? y - margin : y + height - viewportHeight + margin;
      scroll.scrollTo({ y: Math.max(target, 0), animated: true });
    },
    () => {}
  );
}
