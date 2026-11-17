/** Bubble layout slots (size/position). Filled from API category order — not hardcoded ids. */
export const BUBBLE_LAYOUT: { size: number; left: number; top: number }[] = [
  { size: 62, left: 102, top: 0 },
  { size: 62, left: 165, top: 41 },
  { size: 54, left: 153, top: 113 },
  { size: 43, left: 101, top: 137 },
  { size: 28, left: 64, top: 117 },
  { size: 25, left: 51, top: 80 },
];

/** Right edge of the Figma bubble cluster (left + size). */
export const BUBBLE_CLUSTER_RIGHT = Math.max(...BUBBLE_LAYOUT.map((b) => b.left + b.size));
export const TOTAL_LABEL_LEFT = 107;
export const TOTAL_LABEL_TOP = 77;
export const SIDE_STACK_RIGHT_INSET = 26;
export const BUBBLE_TO_CARDS_GAP = 12;

/** Chart + side cards: 3×52+2×16=188; Others stack grows with taller cards */
export const CHART_AREA_HEIGHT = 188;
export const SIDE_METRIC_CARD_WIDTH = 120;
export const SUBCATEGORY_CARD_WIDTH = SIDE_METRIC_CARD_WIDTH;
export const SUBCATEGORY_CARD_HEIGHT = 56;
export const SUBCATEGORY_GAP = 6;
/** Side stack shows the top few; the expand sheet lists every Others category. */
export const MAX_SIDE_SUBCATEGORIES = 4;
