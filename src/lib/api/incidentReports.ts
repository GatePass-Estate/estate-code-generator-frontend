import Api from './index';

/** Shared query window for incident result-page endpoints. */
export type IncidentDateParams = {
  estate_id: string;
  from_date?: string;
  to_date?: string;
};

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
  trends_detected?: string;
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
};

export type IncidentLlmSummary = {
  executive_summary?: string;
  key_patterns?: string[];
  severity_assessment?: string;
  recommended_actions?: string[];
  data_limitations?: string;
  category_eda?: CategoryEdaSection;
};

export type IncidentSummaryResponse = {
  entitled_tier: 'tier1' | 'tier2';
  from_cache?: boolean;
  tier1?: IncidentInhouseSummary | null;
  tier2?: IncidentLlmSummary | null;
};

export type IncidentReportsListParams = IncidentDateParams & {
  category?: string[];
  user_type?: string[];
  page?: number;
  limit?: number;
};

export const incidentReportsApi = {
  getOverview: async ({
    estate_id,
    from_date,
    to_date,
  }: IncidentDateParams): Promise<IncidentOverviewResponse> => {
    const { data } = await Api('ai').get('/incident-reports/result-page/overview', {
      params: { estate_id, from_date, to_date },
      // Category EDA + trends can exceed the default 10s client timeout.
      timeout: 60_000,
    });
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
    const { data } = await Api('ai').get('/incident-reports/result-page/reports', {
      params: {
        estate_id,
        page,
        limit,
        ...(from_date ? { from_date } : {}),
        ...(to_date ? { to_date } : {}),
        ...(category?.length ? { category } : {}),
        ...(user_type?.length ? { user_type } : {}),
      },
      // Repeat params for array filters (FastAPI list query style).
      paramsSerializer: {
        indexes: null,
      },
      timeout: 60_000,
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
    const { data } = await Api('ai').get('/incident-reports/result-page/summary', {
      params: { estate_id, from_date, to_date },
      // Topic modelling + LLM can exceed the default 10s client timeout.
      timeout: 60_000,
    });
    return data;
  },
};
