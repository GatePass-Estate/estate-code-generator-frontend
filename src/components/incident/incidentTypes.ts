export type IncidentCategoryId =
  | 'security'
  | 'medical'
  | 'maintenance'
  | 'property'
  | 'access'
  | 'others';

export type IncidentCategory = {
  id: IncidentCategoryId;
  name: string;
  share: number;
  count: number;
  peakTime: string;
  peakPct: number;
  thresholdLabel: string;
  detail: string;
  narrative: string;
  icon: 'lock' | 'medical' | 'wrench' | 'home' | 'access' | 'more';
  color: string;
  subcategories?: { name: string; pct: number }[];
};

export type IncidentRow = {
  id: string;
  reporter: string;
  reportedAt: string;
  category: string;
  categoryId: IncidentCategoryId;
  title: string;
};

export type TimeframeId = '24h' | 'week' | 'month' | 'custom';

export type IncidentOrderId = 'newest' | 'oldest' | 'category';
