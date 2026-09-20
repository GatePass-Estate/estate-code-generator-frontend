import Api from './index';

export interface BaseParams {
  estate_id: string;
  from_date?: string;
  to_date?: string;
}

export interface AnomalyOverviewResponse {
  demographic: {
    estate_name: string;
    state: string;
    country: string;
    total_users: number;
    total_guests: number;
    ratio: {
      guest: { count: number; percentage: number };
      resident: { count: number; percentage: number };
      security: { count: number; percentage: number };
    };
    total_anomalous_instances: number;
    total_high_risk_instances: number;
  };
  evidence_summary: {
    total_anomalous_residents_instances: number;
    total_anomalous_visitors_instances: number;
  };
  anomaly_overview: {
    spider_plot: {
      feature_name: string;
      description: string;
      weight: number | null;
      normal_value: number;
      scale: number;
      percentage: number;
      instance_percentage?: number; // Might only appear in individual result
      instance_value?: number;      // Might only appear in individual result
    }[];
    top_contributing_factors: {
      feature_name: string;
      description: string;
      weight: number | null;
      normal_value: number;
      scale: number;
      percentage: number;
    }[];
    contributing_factors: {
      name: string;
      description: string;
      normal_value: number;
      weight: number | null;
      scale: number;
      percentage: number;
      sub_factors: {
        feature_name: string;
        description: string;
        normal_value: number;
        weight: number | null;
        scale: number;
        percentage: number;
      }[];
    }[];
  };
}

export interface AnomalyPrediction {
  id: string;
  created_at: string;
  prediction_type: string;
  user_type: string;
  gender: string;
  display_name: string;
  final_score: number;
  is_anomalous: boolean;
  severity: string;
  anomaly_type: string;
  has_tier1_summary: boolean;
  has_tier2_summary: boolean;
}

export interface AnomalyPredictionResponse {
  items: AnomalyPrediction[];
  total: number;
  page: number;
  limit: number;
  sort_order: string;
}

export interface AnomalyCaseDemographicResponse {
  prediction_id: string;
  display_name: string;
  user_type: string;
  user_id: string;
  total_entries: number;
  average_entry_per_week: number;
  has_tier1_summary: boolean;
  has_tier2_summary: boolean;
}

export interface AnomalyCaseHistoryRecord {
  id: string;
  validated_at: string;
  validated_code: string;
  severity: string;
  is_anomalous: boolean;
  final_score: number;
}

export interface AnomalyCaseHistoryResponse {
  items: AnomalyCaseHistoryRecord[];
}

export interface AnomalyCaseSummaryResponse {
  entitled_tier: string;
  from_cache: boolean;
  tier1?: {
    executive_summary: string;
    detailed_insight: string;
  };
  tier2?: {
    executive_summary: string;
    detailed_insight: string;
    risk_drivers: string[];
    recommended_actions: string[];
    data_limitations: string;
  };
}

export interface AnomalyCaseResultsResponse {
  prediction_id: string;
  final_score: number;
  is_anomalous: boolean;
  severity: string;
  anomaly_overview: {
    spider_plot: {
      feature_name: string;
      description: string;
      weight: number | null;
      normal_value: number;
      instance_value: number;
      scale: number;
      percentage: number;
      instance_percentage: number;
    }[];
    contributing_factors: {
      name: string;
      description: string;
      instance_value: number;
      scale: number;
      percentage: number;
      sub_factors: {
        feature_name: string;
        description: string;
        instance_value: number;
        scale: number;
        percentage: number;
      }[];
    }[];
  };
}

export const anomalyApi = {
  // Get Result Page Overview (Spider plot, factor lists, demographic counts)
  getOverview: async ({ estate_id, from_date, to_date }: BaseParams): Promise<AnomalyOverviewResponse> => {
    const { data } = await Api('ai').get('/spatial-anomaly/result-page/overview', {
      params: { estate_id, from_date, to_date },
    });
    return data;
  },

  // List Predictions (Main lists)
  getPredictions: async ({
    estate_id,
    from_date,
    to_date,
    severity,
    gender,
    user_type,
    sort_order,
    page = 1,
    limit = 10,
  }: BaseParams & {
    severity?: string[];
    gender?: string[];
    user_type?: string[];
    sort_order?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  }): Promise<AnomalyPredictionResponse> => {
    const { data } = await Api('ai').get('/spatial-anomaly/result-page/predictions', {
      params: {
        estate_id,
        ...(from_date && { from_date }),
        ...(to_date && { to_date }),
        ...(severity && { severity }),
        ...(gender && { gender }),
        ...(user_type && { user_type }),
        ...(sort_order && { sort_order }),
        page,
        limit,
      },
      paramsSerializer: {
        indexes: null,
      },
    });
    return data;
  },

  // Case Demographic
  getCaseDemographic: async (estate_id: string, prediction_id: string): Promise<AnomalyCaseDemographicResponse> => {
    const { data } = await Api('ai').get(`/spatial-anomaly/result-page/cases/${prediction_id}/demographic`, {
      params: { estate_id },
    });
    return data;
  },

  // Case History
  getCaseHistory: async (estate_id: string, prediction_id: string, history_limit: number = 5): Promise<AnomalyCaseHistoryResponse> => {
    const { data } = await Api('ai').get(`/spatial-anomaly/result-page/cases/${prediction_id}/history`, {
      params: { estate_id, history_limit },
    });
    return data;
  },

  // Case Summary (LLM)
  getCaseSummary: async (estate_id: string, prediction_id: string): Promise<AnomalyCaseSummaryResponse> => {
    const { data } = await Api('ai').get(`/spatial-anomaly/result-page/cases/${prediction_id}/summary`, {
      params: { estate_id },
    });
    return data;
  },

  // Case Results (Spider plot & contributing factors for one user)
  getCaseResults: async (estate_id: string, prediction_id: string, from_date?: string, to_date?: string): Promise<AnomalyCaseResultsResponse> => {
    const { data } = await Api('ai').get(`/spatial-anomaly/result-page/cases/${prediction_id}/results`, {
      params: { estate_id, from_date, to_date },
    });
    return data;
  },
};
