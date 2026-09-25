export type IncidentCategoryId = string;

export type IncidentCategory = {
  /** API category slug (or `other` for the leftover bucket). */
  id: IncidentCategoryId;
  name: string;
  share: number;
  count: number;
  peakTime: string;
  peakPct: number;
  thresholdLabel: string;
  detail: string;
  narrative: string;
  /** API slug driving the Figma category icon. */
  apiCategory: string;
  color: string;
  subcategories?: { name: string; pct: number; apiCategory: string }[];
};

export type IncidentRow = {
  id: string;
  reporter: string;
  reportedAt: string;
  category: string;
  categoryId: IncidentCategoryId;
  /** Primary API taxonomy slug for icon mapping. */
  apiCategory: string;
  title: string;
};

export type TimeframeId = '24h' | 'week' | 'month' | 'custom';

export type IncidentOrderId = 'newest' | 'oldest' | 'category';
