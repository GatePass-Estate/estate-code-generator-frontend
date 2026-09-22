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

export const INCIDENT_TOTAL = 354;

export const INCIDENT_CATEGORIES: IncidentCategory[] = [
  {
    id: 'security',
    name: 'Security',
    share: 30,
    count: 106,
    peakTime: 'Mornings',
    peakPct: 80,
    thresholdLabel: '> 5%',
    detail:
      'Security reports were the largest share this period. Most clustered around morning patrol handovers and the main gate.',
    narrative: 'Residents reported a drone hovering for ~10 minutes. Direction of flight unknown.',
    icon: 'lock',
    color: '#113E55',
    subcategories: [
      { name: 'Gate breach', pct: 12 },
      { name: 'Patrol alert', pct: 9 },
      { name: 'Suspicious person', pct: 5 },
      { name: 'Other', pct: 4 },
    ],
  },
  {
    id: 'medical',
    name: 'Medical Emergency',
    share: 18,
    count: 64,
    peakTime: 'Evenings',
    peakPct: 41,
    thresholdLabel: '> 5%',
    detail:
      'Medical emergencies stayed isolated rather than clustered. Evening hours accounted for the highest share.',
    narrative:
      'A resident required first-aid support near the clubhouse after a fall. EMS was notified promptly.',
    icon: 'medical',
    color: '#113E55',
    subcategories: [
      { name: 'First aid', pct: 8 },
      { name: 'Ambulance', pct: 5 },
      { name: 'Clinic visit', pct: 3 },
      { name: 'Other', pct: 2 },
    ],
  },
  {
    id: 'maintenance',
    name: 'Repairs',
    share: 22,
    count: 78,
    peakTime: 'Mornings',
    peakPct: 55,
    thresholdLabel: '> 5%',
    detail:
      'Repair requests concentrated on lighting, drainage, and generator downtime during weekday working hours.',
    narrative:
      'Streetlight outages were reported along Cedar Close, with generator downtime noted during peak load.',
    icon: 'wrench',
    color: '#113E55',
    subcategories: [
      { name: 'Lighting', pct: 9 },
      { name: 'Drainage', pct: 6 },
      { name: 'Generator', pct: 4 },
      { name: 'Other', pct: 3 },
    ],
  },
  {
    id: 'property',
    name: 'Property Damage',
    share: 16,
    count: 57,
    peakTime: 'Nights',
    peakPct: 48,
    thresholdLabel: '> 5%',
    detail:
      'Property damage reports were driven by vandalism and fence breaches, mostly after dusk near the perimeter.',
    narrative:
      'Fence panel damage was noted near Gate 2 after dusk. No suspects were identified on site.',
    icon: 'home',
    color: '#113E55',
    subcategories: [
      { name: 'Fence', pct: 7 },
      { name: 'Vandalism', pct: 5 },
      { name: 'Vehicle', pct: 3 },
      { name: 'Other', pct: 1 },
    ],
  },
  {
    id: 'access',
    name: 'Access Control',
    share: 9,
    count: 32,
    peakTime: 'Mornings',
    peakPct: 44,
    thresholdLabel: '< 5%',
    detail:
      'Access-control reports stayed below the 5% watch threshold and mostly involved failed guest-code attempts.',
    narrative:
      'Multiple failed guest-code attempts were logged at the boom barrier during morning rush.',
    icon: 'access',
    color: '#113E55',
    subcategories: [
      { name: 'Guest code', pct: 4 },
      { name: 'Boom fault', pct: 3 },
      { name: 'Tag fail', pct: 1 },
      { name: 'Other', pct: 1 },
    ],
  },
  {
    id: 'others',
    name: 'Others',
    share: 5,
    count: 17,
    peakTime: 'Afternoons',
    peakPct: 38,
    thresholdLabel: '< 5%',
    detail: 'Uncategorized reports include noise complaints and miscellaneous estate notices.',
    narrative: 'Residents reported a drone hovering for ~10 minutes. Direction of flight unknown.',
    icon: 'more',
    color: '#113E55',
    subcategories: [
      { name: 'Subcateg....', pct: 4.9 },
      { name: 'Subcateg....', pct: 4.9 },
      { name: 'Subcateg....', pct: 4.9 },
      { name: 'Subcateg....', pct: 4.9 },
    ],
  },
];

export const INCIDENT_ROWS: IncidentRow[] = [
  {
    id: '1',
    reporter: 'Daisy Odien',
    reportedAt: '26 July, 10:23:40',
    category: 'Property Damage',
    categoryId: 'property',
    title: 'Subject title goes here...',
  },
  {
    id: '2',
    reporter: 'Daisy Odien',
    reportedAt: '26 July, 10:23:40',
    category: 'Vandalism',
    categoryId: 'property',
    title: 'Subject title goes here...',
  },
  {
    id: '3',
    reporter: 'Daisy Odien',
    reportedAt: '26 July, 10:23:40',
    category: 'Medical Emergency',
    categoryId: 'medical',
    title: 'Subject title goes here...',
  },
  {
    id: '4',
    reporter: 'Daisy Odien',
    reportedAt: '26 July, 10:23:40',
    category: 'Property Damage',
    categoryId: 'property',
    title: 'Subject title goes here...',
  },
  {
    id: '5',
    reporter: 'Daisy Odien',
    reportedAt: '26 July, 10:23:40',
    category: 'Property Damage',
    categoryId: 'property',
    title: 'Subject title goes here...',
  },
  {
    id: '6',
    reporter: 'Kemi Adewale',
    reportedAt: '25 July, 08:11:02',
    category: 'Security',
    categoryId: 'security',
    title: 'Unauthorized entry at Gate 2',
  },
  {
    id: '7',
    reporter: 'Ibrahim Musa',
    reportedAt: '25 July, 14:44:18',
    category: 'Repairs',
    categoryId: 'maintenance',
    title: 'Streetlight out on Cedar Close',
  },
  {
    id: '8',
    reporter: 'Chioma Okeke',
    reportedAt: '24 July, 19:02:55',
    category: 'Access Control',
    categoryId: 'access',
    title: 'Guest code failed at boom',
  },
];

export const TIMEFRAME_OPTIONS: { id: TimeframeId; label: string }[] = [
  { id: '24h', label: 'Last 24 hours' },
  { id: 'week', label: 'Last Week' },
  { id: 'month', label: 'Last Month' },
  { id: 'custom', label: 'Custom' },
];

export const ORDER_OPTIONS: { id: IncidentOrderId; label: string }[] = [
  { id: 'newest', label: 'Newest first' },
  { id: 'oldest', label: 'Oldest first' },
  { id: 'category', label: 'By category' },
];

export const AI_SUMMARY_PREVIEW =
  'Security incidents led this period, with most reports landing on weekday mornings. Property damage and vandalism remain the recurring themes around the perimeter.';

export const AI_SUMMARY_FULL = `Security-related incidents accounted for the highest share of reports in this window. Most events clustered during morning hours on weekdays, with property damage and vandalism appearing as recurring themes near the perimeter and Gate 2.

Medical emergencies remained isolated rather than clustered. Repair requests concentrated on lighting and generator downtime during working hours. Access-control reports stayed below the 5% watch threshold.

Recommended follow-up: increase morning patrol coverage at the main gate and review lighting on Cedar Close.`;

export const TRENDS = {
  day: {
    pct: 67,
    body: '67% of incidents occurred on weekdays (8) vs weekends (4)',
  },
  time: {
    pct: 92,
    body: '11 occurred during the morning hours; 1 occurred at night.',
  },
};
