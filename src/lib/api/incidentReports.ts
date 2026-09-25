import Api from './index';

/** Shared query window for incident result-page endpoints. */
export type IncidentDateParams = {
  estate_id: string;
  /** ISO-8601 date-time (`format: date-time` in OpenAPI). */
  from_date?: string;
  /** ISO-8601 date-time (`format: date-time` in OpenAPI). */
  to_date?: string;
};

/** Start of local calendar day → ISO date-time for `from_date`. */
export function toIncidentFromDate(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

/** End of local calendar day → ISO date-time for `to_date`. */
export function toIncidentToDate(date: Date): string {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d.toISOString();
}

function buildIncidentDateQuery({ estate_id, from_date, to_date }: IncidentDateParams) {
  return {
    estate_id,
    ...(from_date ? { from_date } : {}),
    ...(to_date ? { to_date } : {}),
  };
}

export type IncidentPeakTime = 'morning' | 'afternoon' | 'evening_night';

export type ReporterUserType = 'resident' | 'security';

export type RatioShare = {
  count: number;
  percentage: number;
};

export type IncidentDemographic = {
  estate_name: string;
  state?: string | null;
  country?: string | null;
  total_reports?: number;
  /** Resident / security counts and percentages. */
  ratio: Record<string, RatioShare>;
};

export type CategoryEdaItem = {
  category: string;
  peak_time: IncidentPeakTime;
  incident_count: number;
  percentage_share: number;
  sample_reports?: string[];
};

export type CategoryEdaSection = {
  top_1?: CategoryEdaItem | null;
  top_2?: CategoryEdaItem | null;
  top_3?: CategoryEdaItem | null;
  top_4?: CategoryEdaItem | null;
  top_5?: CategoryEdaItem | null;
  other_categories?: Record<string, CategoryEdaItem>;
};

export type IncidentOverviewEda = {
  stats?: Record<string, unknown>;
  categories?: CategoryEdaSection;
  /** Narrative trend copy — string or list of trend blurbs from the API. */
  trends_detected?: string | string[];
};

export type IncidentOverviewResponse = {
  demographic: IncidentDemographic;
  eda: IncidentOverviewEda;
  has_tier1_summary?: boolean;
  has_tier2_summary?: boolean;
};

export type IncidentListItem = {
  id: string;
  created_at: string;
  occurred_at?: string | null;
  title?: string | null;
  category?: string[];
  custom_category?: string | null;
  narrative: string;
  reporter_user_type?: ReporterUserType | null;
};

export type IncidentListResponse = {
  items?: IncidentListItem[];
  total?: number;
  page?: number;
  limit?: number;
};

export type IncidentInhouseSummary = {
  executive_summary: string;
  detailed_insight: string;
  category_eda?: CategoryEdaSection;
  /** TF-IDF/NMF topic-modelling payload for the date window. */
  topics?: Record<string, unknown>;
  /** Optional UI meta from API (e.g. "2 mins Read"). */
  read_time?: string;
};

export type IncidentLlmSummary = {
  executive_summary?: string;
  key_patterns?: string[];
  severity_assessment?: string;
  recommended_actions?: string[];
  data_limitations?: string;
  category_eda?: CategoryEdaSection;
  /** Optional UI meta from API (e.g. "2 mins Read"). */
  read_time?: string;
  /** Extra LLM sections the API may return (shown in the accordion as-is). */
  [key: string]: unknown;
};

export type IncidentSummaryResponse = {
  entitled_tier: 'tier1' | 'tier2';
  from_cache?: boolean;
  tier1?: IncidentInhouseSummary | null;
  tier2?: IncidentLlmSummary | null;
  /** Optional UI meta when returned at the root. */
  read_time?: string;
  source_label?: string;
};

export type IncidentReportsListParams = IncidentDateParams & {
  /** Taxonomy values; omit or pass `all` for every category. Repeat = OR. */
  category?: string[];
  /** `resident` | `security` | `all`. Repeat = OR. */
  user_type?: string[];
  page?: number;
  limit?: number;
};

/**
 * OpenAPI: omitted / `all` = unfiltered. Repeat values OR within that filter.
 * Never send `all` as a query value.
 */
function normalizeRepeatFilter(values?: string[]): string[] | undefined {
  if (!values?.length) return undefined;
  if (values.some((v) => v === 'all')) return undefined;
  const cleaned = values.map((v) => v.trim()).filter(Boolean);
  return cleaned.length ? cleaned : undefined;
}

export const incidentReportsApi = {
  getOverview: async ({
    estate_id,
    from_date,
    to_date,
  }: IncidentDateParams): Promise<IncidentOverviewResponse> => {
    const params = buildIncidentDateQuery({ estate_id, from_date, to_date });
    const { data } = await Api('ai').get('/incident-reports/result-page/overview', {
      params,
      // Category EDA + trends can exceed the default 10s client timeout.
      timeout: 60_000,
    });
    console.log('[incident-reports] overview response', { ...params, data });
    return data;
  },

  getReports: async ({
    estate_id,
    from_date,
    to_date,
    category,
    user_type,
    page = 1,
    limit = 10,
  }: IncidentReportsListParams): Promise<IncidentListResponse> => {
    const categoryFilter = normalizeRepeatFilter(category);
    const userTypeFilter = normalizeRepeatFilter(user_type);
    const params = {
      ...buildIncidentDateQuery({ estate_id, from_date, to_date }),
      page,
      limit,
      ...(categoryFilter ? { category: categoryFilter } : {}),
      ...(userTypeFilter ? { user_type: userTypeFilter } : {}),
    };
    const { data } = await Api('ai').get('/incident-reports/result-page/reports', {
      params,
      // Repeat category / user_type for FastAPI list query style (?category=a&category=b).
      paramsSerializer: {
        indexes: null,
      },
      timeout: 60_000,
    });

    console.log('[incident-reports] reports response', {
      ...params,
      data,
    });

    // OpenAPI returns `{ items, total, page, limit }`; tolerate a bare array.
    if (Array.isArray(data)) {
      return { items: data, total: data.length, page, limit };
    }
    return {
      items: Array.isArray(data?.items) ? data.items : [],
      total: data?.total ?? 0,
      page: data?.page ?? page,
      limit: data?.limit ?? limit,
    };
  },

  getSummary: async ({
    estate_id,
    from_date,
    to_date,
  }: IncidentDateParams): Promise<IncidentSummaryResponse> => {
    const params = buildIncidentDateQuery({ estate_id, from_date, to_date });
    const { data } = await Api('ai').get('/incident-reports/result-page/summary', {
      params,
      // Topic modelling + LLM can exceed the default 10s client timeout.
      timeout: 60_000,
    });
    console.log('[incident-reports] summary response', { ...params, data });
    return data;
  },
};
