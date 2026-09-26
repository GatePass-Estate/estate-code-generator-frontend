export type IncidentCategoryId = string;

/** Leftover EDA bucket id (`other_categories`) — not the API taxonomy slug `other`. */
export const OTHERS_BUCKET_ID = 'others_bucket';

export type IncidentCategory = {
  /**
   * Bubble key: API taxonomy slug, or `others_bucket` for the leftover group.
   * Taxonomy `other` (when it ranks in top_1…top_5) stays `other` and is separate from the bucket.
   */
  id: IncidentCategoryId;
  name: string;
  share: number;
  count: number;
  peakTime: string;
  peakPct: number;
  thresholdLabel: string;
  detail: string;
  narrative: string;
  /** API slug driving the category icon (`other` for the leftover bucket too). */
  apiCategory: string;
  color: string;
  /** Only set on the leftover `others_bucket` — never nests taxonomy `other` inside itself. */
  subcategories?: { name: string; pct: number; apiCategory: string }[];
};

export type IncidentRow = {
  id: string;
  reporter: string;
  reportedAt: string;
  /** Long display date for detail screens, e.g. "11th October, 2026". */
  reportedLabel: string;
  category: string;
  categoryId: IncidentCategoryId;
  /** Primary API taxonomy slug for icon mapping. */
  apiCategory: string;
  title: string;
  narrative: string;
};

export type TimeframeId = '24h' | 'week' | 'month' | 'custom';

export type IncidentOrderId = 'newest' | 'oldest' | 'category';
