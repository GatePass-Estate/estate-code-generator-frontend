import type {
  CategoryEdaItem,
  CategoryEdaSection,
  IncidentDemographic,
  IncidentListItem,
  IncidentOverviewEda,
  IncidentPeakTime,
  RatioShare,
} from '@/src/lib/api/incidentReports';
import type { IncidentCategory, IncidentRow } from '@/src/components/incident/incidentTypes';
import { OTHERS_BUCKET_ID } from '@/src/components/incident/incidentTypes';
import {
  formatApiCategoryLabel,
  resolveApiCategory,
} from '@/src/components/incident/categoryIcons';
import { formatIncidentLongDate } from '@/src/components/incident/incidentDetailCache';

/** Display labels for API `peak_time` enum values. */
const PEAK_TIME_LABEL: Record<IncidentPeakTime, string> = {
  morning: 'Mornings',
  afternoon: 'Afternoons',
  evening_night: 'Evenings',
};

function formatCategoryLabel(raw: string): string {
  return formatApiCategoryLabel(raw);
}

/** Normalize API percents that may arrive as 0–1 fractions or 0–100. */
export function normalizePercent(value: number | null | undefined): number {
  if (value == null || Number.isNaN(value)) return 0;
  const n = Number(value);
  if (n >= 0 && n <= 1) return Math.round(n * 1000) / 10;
  return Math.round(n * 10) / 10;
}

function sampleNarrative(item: CategoryEdaItem, _fallbackName: string): string {
  const sample = item.sample_reports?.[0];
  if (!sample) return '';
  const colon = sample.indexOf(':');
  if (colon > 0 && colon < 80) return sample.slice(colon + 1).trim() || sample;
  return sample;
}

function toUiCategory(
  item: CategoryEdaItem,
  total: number,
  subcategories?: IncidentCategory['subcategories']
): IncidentCategory {
  const apiCategory = resolveApiCategory(item.category);
  const name = formatCategoryLabel(item.category);
  const share =
    total > 0
      ? Math.round((item.incident_count / total) * 1000) / 10
      : normalizePercent(item.percentage_share);

  return {
    id: apiCategory,
    name,
    share,
    count: item.incident_count,
    peakTime: PEAK_TIME_LABEL[item.peak_time] ?? item.peak_time,
    peakPct: 0,
    thresholdLabel: share >= 5 ? '> 5%' : '< 5%',
    detail: '',
    narrative: sampleNarrative(item, name),
    apiCategory,
    color: '#113E55',
    subcategories,
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
    return !!(section.top_1 || section.top_2 || section.top_3 || section.other_categories);
  };

  if (looksLikeSection(eda.categories)) return eda.categories;

  const stats = eda.stats as Record<string, unknown> | undefined;
  const statsRecord = (stats ?? {}) as Record<string, any>;
  const nested =
    (stats?.categories as CategoryEdaSection | undefined) ||
    (stats?.category_eda as CategoryEdaSection | undefined) ||
    (findInStats(statsRecord, 'categories') as CategoryEdaSection | undefined) ||
    (findInStats(statsRecord, 'category_eda') as CategoryEdaSection | undefined);

  if (looksLikeSection(nested)) return nested;
  return looksLikeSection(eda.categories) ? eda.categories : null;
}

/**
 * Maps API category EDA (`top_1`…`top_5` + `other_categories`) into UI bubbles.
 *
 * Taxonomy `other` can appear in the top ranks as its own bubble (`id: 'other'`).
 * The leftover `other_categories` group is a separate bubble (`id: others_bucket`)
 * and never lists taxonomy `other` again inside its subcategory stack.
 */
export function mapCategoryEdaToUi(
  section?: CategoryEdaSection | null,
  totalReports?: number
): IncidentCategory[] {
  const tops = rankedItems(section);
  const otherItems = Object.values(section?.other_categories ?? {});
  const seen = new Set<string>();

  const uniqueTops: CategoryEdaItem[] = [];
  for (const item of tops) {
    const key = resolveApiCategory(item.category);
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueTops.push(item);
  }

  // Leftover ranks only — skip anything already in tops, and skip taxonomy `other`
  // so we never nest "Other" inside the "Others" bucket.
  const uniqueOthers: CategoryEdaItem[] = [];
  for (const item of otherItems) {
    const key = resolveApiCategory(item.category);
    if (key === 'other') continue;
    if (seen.has(key)) continue;
    seen.add(key);
    uniqueOthers.push(item);
  }

  const countedTotal = [...uniqueTops, ...uniqueOthers].reduce(
    (sum, item) => sum + (item.incident_count || 0),
    0
  );
  const total = totalReports && totalReports > 0 ? totalReports : countedTotal;

  const categories: IncidentCategory[] = uniqueTops.map((item) => toUiCategory(item, total));

  if (uniqueOthers.length > 0) {
    const otherCount = uniqueOthers.reduce((sum, item) => sum + item.incident_count, 0);
    const otherShare =
      total > 0
        ? Math.round((otherCount / total) * 1000) / 10
        : uniqueOthers.reduce((sum, item) => sum + normalizePercent(item.percentage_share), 0);
    const peakItem = uniqueOthers.reduce((best, item) =>
      item.incident_count >= best.incident_count ? item : best
    );
    const subcategories = uniqueOthers.slice(0, 4).map((item) => {
      const label = formatCategoryLabel(item.category);
      return {
        name: label.length > 10 ? `${label.slice(0, 8)}....` : label,
        pct:
          total > 0
            ? Math.round((item.incident_count / total) * 1000) / 10
            : normalizePercent(item.percentage_share),
        apiCategory: resolveApiCategory(item.category),
      };
    });

    categories.push({
      id: OTHERS_BUCKET_ID,
      name: 'Others',
      share: otherShare,
      count: otherCount,
      peakTime: PEAK_TIME_LABEL[peakItem.peak_time] ?? peakItem.peak_time,
      peakPct: 0,
      thresholdLabel: otherShare >= 5 ? '> 5%' : '< 5%',
      detail: '',
      narrative: sampleNarrative(peakItem, 'Others'),
      apiCategory: 'other',
      color: '#113E55',
      subcategories,
    });
  }

  return categories;
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
  const primary = item.category?.[0] ?? '';
  const apiCategory = resolveApiCategory(primary);
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
    (item.category?.length ? item.category.map(formatCategoryLabel).join(', ') : '');

  return {
    id: item.id,
    reporter:
      item.reporter_user_type === 'security'
        ? 'Security'
        : item.reporter_user_type === 'resident'
          ? 'Resident'
          : '',
    reportedAt,
    reportedLabel: formatIncidentLongDate(when),
    category: categoryLabel,
    categoryId: apiCategory,
    apiCategory,
    title: item.title?.trim() || item.narrative?.trim().slice(0, 48) || '',
    narrative: item.narrative?.trim() || '',
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

/**
 * Trend cards come only from overview `eda.trends_detected` — never derived from stats/categories.
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
  const blurbs = normalizeTrendsDetected(eda?.trends_detected);
  return blurbs.map((body, index) => {
    const pctMatch = body.match(/(\d+(?:\.\d+)?)\s*%/);
    return {
      title: blurbs.length > 1 ? `TREND\n${index + 1}` : 'TRENDS\nDETECTED',
      pct: pctMatch ? Math.round(Number(pctMatch[1])) : 0,
      unitLabel: 'INSIGHT',
      body,
    };
  });
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

const THEME_COLORS = ['#F46036', '#B17000', '#F46036', '#B17000', '#F46036'];

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
    const title = (row.display_name || row.name || row.title || row.topic || '').toString().trim();
    const body =
      themeBodyFromExamples(row.examples || row.example_incidents || row.sample_reports) ||
      (row.description || row.summary || row.narrative || '').toString().trim() ||
      '';
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
