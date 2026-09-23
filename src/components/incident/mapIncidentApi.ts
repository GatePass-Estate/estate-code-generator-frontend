import type {
  CategoryEdaItem,
  CategoryEdaSection,
  IncidentDemographic,
  IncidentListItem,
  IncidentOverviewEda,
  IncidentPeakTime,
  RatioShare,
} from '@/src/lib/api/incidentReports';
import type {
  IncidentCategory,
  IncidentCategoryId,
  IncidentRow,
} from '@/src/components/incident/incidentTypes';

const PEAK_TIME_LABEL: Record<IncidentPeakTime, string> = {
  morning: 'Mornings',
  afternoon: 'Afternoons',
  evening_night: 'Evenings',
};

export const BUBBLE_CATEGORY_IDS: IncidentCategoryId[] = [
  'security',
  'medical',
  'maintenance',
  'property',
  'access',
  'others',
];

const SLOT_META: Record<IncidentCategoryId, { name: string; icon: IncidentCategory['icon'] }> = {
  security: { name: 'Security', icon: 'lock' },
  medical: { name: 'Medical Emergency', icon: 'medical' },
  maintenance: { name: 'Maintenance', icon: 'wrench' },
  property: { name: 'Property Damage', icon: 'home' },
  access: { name: 'Access Control', icon: 'access' },
  others: { name: 'Others', icon: 'more' },
};

/**
 * API taxonomy → UI bubble id.
 * Unlisted labels roll into Others.
 */
const CATEGORY_META: Record<
  string,
  { id: IncidentCategoryId; name: string; icon: IncidentCategory['icon'] }
> = {
  security: { id: 'security', name: 'Security', icon: 'lock' },
  fire_safety: { id: 'security', name: 'Security', icon: 'lock' },
  medical_emergency: { id: 'medical', name: 'Medical Emergency', icon: 'medical' },
  medical: { id: 'medical', name: 'Medical Emergency', icon: 'medical' },
  maintenance: { id: 'maintenance', name: 'Maintenance', icon: 'wrench' },
  property_damage: { id: 'property', name: 'Property Damage', icon: 'home' },
  property: { id: 'property', name: 'Property Damage', icon: 'home' },
  access_control: { id: 'access', name: 'Access Control', icon: 'access' },
  unauthorized_access: { id: 'access', name: 'Access Control', icon: 'access' },
  other: { id: 'others', name: 'Others', icon: 'more' },
  others: { id: 'others', name: 'Others', icon: 'more' },
  theft: { id: 'others', name: 'Others', icon: 'more' },
  dispute: { id: 'others', name: 'Others', icon: 'more' },
  harassment: { id: 'others', name: 'Others', icon: 'more' },
  noise_disturbance: { id: 'others', name: 'Others', icon: 'more' },
};

function formatCategoryLabel(raw: string): string {
  return raw
    .split('_')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');
}

function resolveUiId(rawCategory: string): IncidentCategoryId {
  return CATEGORY_META[rawCategory.toLowerCase()]?.id ?? 'others';
}

/** Normalize API percents that may arrive as 0–1 fractions or 0–100. */
export function normalizePercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  const n = Number(value);
  if (n >= 0 && n <= 1) return Math.round(n * 1000) / 10; // 0.167 → 16.7
  return Math.round(n * 10) / 10;
}

function emptySlot(id: IncidentCategoryId): IncidentCategory {
  const meta = SLOT_META[id];
  return {
    id,
    name: meta.name,
    share: 0,
    count: 0,
    peakTime: '—',
    peakPct: 0,
    thresholdLabel: '< 5%',
    detail: `No ${meta.name.toLowerCase()} reports in this window.`,
    narrative: `No ${meta.name.toLowerCase()} sample reports for this period.`,
    icon: meta.icon,
    color: '#113E55',
  };
}

function rankedItems(section?: CategoryEdaSection | null): CategoryEdaItem[] {
  if (!section) return [];
  return [section.top_1, section.top_2, section.top_3, section.top_4, section.top_5].filter(
    (item): item is CategoryEdaItem => !!item
  );
}

/** Prefer `eda.categories`; also accept category EDA nested under `stats`. */
export function resolveCategorySection(
  eda?: IncidentOverviewEda | null
): CategoryEdaSection | null {
  if (!eda) return null;

  const looksLikeSection = (value: unknown): value is CategoryEdaSection => {
    if (!value || typeof value !== 'object') return false;
    const section = value as CategoryEdaSection;
    return !!(section.top_1 || section.top_2 || section.other_categories);
  };

  if (looksLikeSection(eda.categories)) return eda.categories;

  const stats = eda.stats as Record<string, unknown> | undefined;
  const nested =
    (stats?.categories as CategoryEdaSection | undefined) ||
    (stats?.category_eda as CategoryEdaSection | undefined) ||
    (findInStats(stats as Record<string, any> | undefined, 'categories') as
      | CategoryEdaSection
      | undefined) ||
    (findInStats(stats as Record<string, any> | undefined, 'category_eda') as
      | CategoryEdaSection
      | undefined);

  if (looksLikeSection(nested)) return nested;
  return looksLikeSection(eda.categories) ? eda.categories : null;
}

type SlotAccum = {
  count: number;
  share: number;
  peak_time: IncidentPeakTime;
  sample_reports: string[];
  subcategories: { name: string; pct: number }[];
};

export function mapCategoryEdaToUi(
  section?: CategoryEdaSection | null,
  totalReports?: number
): IncidentCategory[] {
  const tops = rankedItems(section);
  const otherItems = Object.values(section?.other_categories ?? {});
  const all = [...tops, ...otherItems];

  const slots = new Map<IncidentCategoryId, SlotAccum>();
  const seenApiKeys = new Set<string>();

  for (const item of all) {
    const apiKey = item.category.toLowerCase();
    // Avoid double-counting the same API label if it appears in both tops + other_categories.
    if (seenApiKeys.has(apiKey)) continue;
    seenApiKeys.add(apiKey);

    const id = resolveUiId(item.category);
    const existing = slots.get(id);
    const label = formatCategoryLabel(item.category);
    const share = normalizePercent(item.percentage_share);
    const sub = {
      name: label.length > 10 ? `${label.slice(0, 8)}....` : label,
      pct: share,
    };

    if (!existing) {
      slots.set(id, {
        count: item.incident_count,
        share,
        peak_time: item.peak_time,
        sample_reports: [...(item.sample_reports ?? [])],
        subcategories: id === 'others' ? [sub] : [],
      });
      continue;
    }

    existing.count += item.incident_count;
    existing.share += share;
    if (item.incident_count >= existing.count - item.incident_count) {
      existing.peak_time = item.peak_time;
    }
    existing.sample_reports.push(...(item.sample_reports ?? []));
    if (id === 'others' && existing.subcategories.length < 4) {
      existing.subcategories.push(sub);
    }
  }

  const total =
    totalReports && totalReports > 0
      ? totalReports
      : Array.from(slots.values()).reduce((sum, s) => sum + s.count, 0);

  return BUBBLE_CATEGORY_IDS.map((id) => {
    const slot = slots.get(id);
    if (!slot) return emptySlot(id);

    const meta = SLOT_META[id];
    // Prefer count/total so merged slots stay consistent with Incident Count /total.
    const share =
      total > 0 ? Math.round((slot.count / total) * 1000) / 10 : Math.round(slot.share * 10) / 10;
    const sample = slot.sample_reports[0];
    const narrative = sample
      ? (() => {
          const colon = sample.indexOf(':');
          if (colon > 0 && colon < 80) return sample.slice(colon + 1).trim() || sample;
          return sample;
        })()
      : `No ${meta.name.toLowerCase()} sample reports for this period.`;

    return {
      id,
      name: meta.name,
      share,
      count: slot.count,
      peakTime: PEAK_TIME_LABEL[slot.peak_time] ?? slot.peak_time,
      // API has peak_time label only — don't fake this with category share.
      peakPct: 0,
      thresholdLabel: share >= 5 ? '> 5%' : '< 5%',
      detail: `${meta.name} accounted for ${share}% of reports this period.`,
      narrative,
      icon: meta.icon,
      color: '#113E55',
      subcategories: id === 'others' ? slot.subcategories.slice(0, 4) : undefined,
    };
  });
}

export function formatReportCount(total?: number): string {
  if (total == null) return '—';
  if (total >= 1000) {
    const k = total / 1000;
    return Number.isInteger(k) ? `${k}k` : `${k.toFixed(1)}k`;
  }
  return String(total);
}

export function mapListItemToRow(item: IncidentListItem): IncidentRow {
  const primary = item.category?.[0]?.toLowerCase() ?? '';
  const meta = CATEGORY_META[primary];
  const when = item.occurred_at || item.created_at;
  const reportedAt = new Date(when).toLocaleString('en-GB', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });

  const categoryLabel =
    item.custom_category ||
    (item.category?.length ? item.category.map(formatCategoryLabel).join(', ') : 'Uncategorized');

  return {
    id: item.id,
    reporter:
      item.reporter_user_type === 'security'
        ? 'Security'
        : item.reporter_user_type === 'resident'
          ? 'Resident'
          : 'Reporter',
    reportedAt,
    category: categoryLabel,
    categoryId: meta?.id ?? 'others',
    title: item.title?.trim() || item.narrative.slice(0, 48) || 'Incident report',
  };
}

export function demographicLocation(demographic?: IncidentDemographic | null): string {
  if (!demographic) return 'N/A';
  const parts = [demographic.state, demographic.country].filter(Boolean);
  return parts.length ? parts.join(', ') : 'N/A';
}

function asRatioShare(value: unknown): RatioShare | null {
  if (value == null) return null;
  if (typeof value === 'number') {
    return { count: 0, percentage: normalizePercent(value) };
  }
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    const percentage = normalizePercent(
      typeof obj.percentage === 'number' ? obj.percentage : Number(obj.percentage)
    );
    const count = typeof obj.count === 'number' ? obj.count : Number(obj.count) || 0;
    return { count, percentage };
  }
  return null;
}

/** Case-insensitive ratio lookup; falls back to count mix when percentage is missing. */
export function ratioPercentage(
  ratio: Record<string, RatioShare> | undefined,
  key: string
): number {
  if (!ratio) return 0;

  const direct = asRatioShare(ratio[key]);
  if (direct && direct.percentage > 0) return Math.round(direct.percentage);

  const matchedKey = Object.keys(ratio).find((k) => k.toLowerCase() === key.toLowerCase());
  const matched = matchedKey ? asRatioShare(ratio[matchedKey]) : null;
  if (matched && matched.percentage > 0) return Math.round(matched.percentage);

  // Derive from counts across resident + security when percentages are absent.
  const resident = asRatioShare(
    ratio.resident ??
      ratio.Resident ??
      Object.entries(ratio).find(([k]) => k.toLowerCase() === 'resident')?.[1]
  );
  const security = asRatioShare(
    ratio.security ??
      ratio.Security ??
      Object.entries(ratio).find(([k]) => k.toLowerCase() === 'security')?.[1]
  );
  const totalCount = (resident?.count ?? 0) + (security?.count ?? 0);
  if (totalCount <= 0) return matched ? Math.round(matched.percentage) : 0;
  const target = key.toLowerCase() === 'resident' ? resident : security;
  if (!target) return 0;
  return Math.round((target.count / totalCount) * 100);
}

export type TrendCardModel = {
  title: string;
  pct: number;
  unitLabel: string;
  body: string;
};

function findInStats(stats: Record<string, any>, key: string): any {
  if (!stats || typeof stats !== 'object') return undefined;
  if (stats[key] != null) return stats[key];
  for (const value of Object.values(stats)) {
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      const nested = (value as Record<string, any>)[key];
      if (nested != null) return nested;
      const deeper = findInStats(value as Record<string, any>, key);
      if (deeper != null) return deeper;
    }
  }
  return undefined;
}

function parseWeekdayPct(text: string): number | null {
  const match = text.match(/(\d+(?:\.\d+)?)\s*%\s*(?:on\s+)?weekdays?/i);
  if (!match) return null;
  return Math.round(Number(match[1]));
}

/**
 * Builds trend cards from overview EDA — day/time when present, every
 * `trends_detected` blurb, and each category signal (not capped at 2).
 */
export function mapTrendsFromEda(
  eda:
    | {
        stats?: Record<string, unknown>;
        categories?: CategoryEdaSection | null;
        trends_detected?: string | string[];
      }
    | null
    | undefined
): TrendCardModel[] {
  const cards: TrendCardModel[] = [];
  const stats = (eda?.stats ?? {}) as Record<string, any>;

  const weekend = findInStats(stats, 'weekend_vs_weekday') ?? {};
  const weekdayCount = Number(weekend.weekday ?? weekend.weekdays ?? 0);
  const weekendCount = Number(weekend.weekend ?? weekend.weekends ?? 0);
  const dayTotal = weekdayCount + weekendCount;

  const trendBlurbs = normalizeTrendsDetected(eda?.trends_detected);
  const timelineRaw = findInStats(stats, 'timeline_summary');
  const timeline =
    typeof timelineRaw === 'string' && timelineRaw.trim()
      ? timelineRaw.trim()
      : trendBlurbs[0] || '';

  const parsedWeekday = parseWeekdayPct(timeline) ?? parseWeekdayPct(trendBlurbs.join(' '));
  const dayPct =
    dayTotal > 0
      ? Math.round((weekdayCount / dayTotal) * 100)
      : parsedWeekday != null
        ? parsedWeekday
        : 0;

  if (dayTotal > 0 || parsedWeekday != null) {
    cards.push({
      title: 'DAY\nDISTRIBUTION',
      pct: dayPct,
      unitLabel: 'INCIDENT',
      body:
        timeline ||
        (dayTotal > 0
          ? `${weekdayCount} weekdays · ${weekendCount} weekends`
          : ''),
    });
  }

  const temporal = findInStats(stats, 'temporal_overview') ?? {};
  const hourBucket = temporal.hour_bucket ?? findInStats(stats, 'hour_bucket') ?? {};
  const morning = Number(hourBucket.morning ?? 0);
  const afternoon = Number(hourBucket.afternoon ?? 0);
  const night = Number(hourBucket.night ?? hourBucket.evening_night ?? 0);
  const timeTotal = morning + afternoon + night;
  const peak = Math.max(morning, afternoon, night, 0);
  const timePct = timeTotal > 0 ? Math.round((peak / timeTotal) * 100) : 0;

  if (timeTotal > 0) {
    cards.push({
      title: 'TIME\nDISTRIBUTION',
      pct: timePct,
      unitLabel: 'INCIDENTS',
      body: `${morning} morning · ${afternoon} afternoon · ${night} night`,
    });
  }

  trendBlurbs.forEach((blurb, index) => {
    const pctMatch = blurb.match(/(\d+(?:\.\d+)?)\s*%/);
    cards.push({
      title: trendBlurbs.length > 1 ? `TREND\n${index + 1}` : 'TRENDS\nDETECTED',
      pct: pctMatch ? Math.round(Number(pctMatch[1])) : dayPct || timePct || 0,
      unitLabel: 'INSIGHT',
      body: blurb,
    });
  });

  const categorySection = eda?.categories ?? null;
  const categoryItems = [
    ...rankedItems(categorySection),
    ...Object.values(categorySection?.other_categories ?? {}),
  ];
  const seenCategories = new Set<string>();
  for (const item of categoryItems) {
    const key = item.category.toLowerCase();
    if (seenCategories.has(key)) continue;
    seenCategories.add(key);
    const label = formatCategoryLabel(item.category);
    const sample = item.sample_reports?.find((s) => s?.trim())?.trim() || '';
    const peakLabel = (item.peak_time || '').replace(/_/g, ' ');
    cards.push({
      title: formatTrendTitle(label),
      pct: Math.round(Number(item.percentage_share) || 0),
      unitLabel: Number(item.incident_count) === 1 ? 'INCIDENT' : 'INCIDENTS',
      body:
        sample ||
        (peakLabel
          ? `${item.incident_count} reports · peaks ${peakLabel}`
          : `${item.incident_count} reports`),
    });
  }

  return cards;
}

/** Keep trend titles on consistent 1–2 lines so first lines align across cards. */
function formatTrendTitle(label: string): string {
  const words = label.trim().toUpperCase().split(/\s+/).filter(Boolean);
  if (words.length <= 1) return words[0] || '';
  if (words.length === 2) return `${words[0]}\n${words[1]}`;
  return `${words[0]}\n${words.slice(1).join(' ')}`;
}

function normalizeTrendsDetected(value: string | string[] | null | undefined): string[] {
  if (Array.isArray(value)) {
    return value.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof value === 'string' && value.trim()) {
    return [value.trim()];
  }
  return [];
}

const THEME_COLORS = ['#F46036', '#A67C52', '#C4A35A', '#1B998B', '#113E55'];

export type ThemeCardModel = {
  label: string;
  title: string;
  body: string;
  pct: number;
  color: string;
};

export type InhouseInsightModel = {
  timelineSummary: string;
  themes: ThemeCardModel[];
};

function asRecord(value: unknown): Record<string, any> | null {
  return value && typeof value === 'object' && !Array.isArray(value)
    ? (value as Record<string, any>)
    : null;
}

function themeBodyFromExamples(examples: unknown): string {
  if (!Array.isArray(examples) || examples.length === 0) return '';
  const titles = examples
    .map((ex) => {
      if (typeof ex === 'string') return ex.trim();
      const row = asRecord(ex);
      return (row?.title || row?.narrative_snippet || '').toString().trim();
    })
    .filter(Boolean)
    .slice(0, 3);
  if (!titles.length) return '';
  if (titles.length === 1) return `${titles[0]} is the top event contributing to this theme`;
  const head = titles.slice(0, -1).join(', ');
  return `${head}, ${titles[titles.length - 1]} are the top events contributing to this theme`;
}

function normalizeThemeList(raw: unknown): any[] {
  if (Array.isArray(raw)) return raw;
  const obj = asRecord(raw);
  if (!obj) return [];
  if (Array.isArray(obj.themes)) return obj.themes;
  if (Array.isArray(obj.items)) return obj.items;
  return Object.values(obj).filter((v) => v && typeof v === 'object');
}

/** Maps tier1 `topics` payload into the In-house overlay (timeline + theme cards). */
export function mapInhouseInsightFromTopics(
  topics: Record<string, unknown> | null | undefined,
  fallbackTimeline = ''
): InhouseInsightModel {
  const root = asRecord(topics) ?? {};
  const human = asRecord(root.human_report) ?? asRecord(root.report) ?? root;
  const timeline =
    (typeof root.timeline_summary === 'string' && root.timeline_summary.trim()) ||
    (typeof human.timeline_summary === 'string' && human.timeline_summary.trim()) ||
    fallbackTimeline.trim() ||
    '';

  const list = normalizeThemeList(
    human.themes ?? root.themes ?? root.topic_list ?? root.topics ?? human.topic_list
  );

  const themes: ThemeCardModel[] = list.slice(0, 5).map((raw, index) => {
    const row = asRecord(raw) ?? {};
    const pctRaw = Number(
      row.share_percent ?? row.sharePercent ?? row.percentage ?? row.pct ?? row.weight ?? 0
    );
    const pct = Number.isFinite(pctRaw)
      ? Math.round(pctRaw <= 1 && pctRaw > 0 ? pctRaw * 100 : pctRaw)
      : 0;
    const title =
      (row.display_name || row.name || row.title || row.topic || `Theme ${index + 1}`)
        .toString()
        .trim() || `Theme ${index + 1}`;
    const body =
      themeBodyFromExamples(row.examples || row.example_incidents || row.sample_reports) ||
      (row.description || row.summary || row.narrative || '').toString().trim() ||
      'No sample events for this theme.';
    return {
      label: `Theme ${index + 1}`,
      title,
      body,
      pct,
      color: THEME_COLORS[index % THEME_COLORS.length],
    };
  });

  return { timelineSummary: timeline, themes };
}
