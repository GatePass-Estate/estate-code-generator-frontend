import Api from './index';

interface BaseParams {
  estate_id: string;
  from_date?: string;
  to_date?: string;
}

export const anomalyApi = {
  // Get Result Page Overview (Spider plot, factor lists, demographic counts)
  getOverview: async ({ estate_id, from_date, to_date }: BaseParams) => {
    const { data } = await Api('ai').get('/spatial-anomaly/result-page/overview', {
      params: { estate_id, from_date, to_date },
    });
    console.log('OVERVIEW API RESPONSE:', JSON.stringify(data, null, 2));
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
  }) => {
    // Axios handles serializing arrays to multiple query params e.g. `severity=high&severity=medium` if configured,
    // but the backend expects repeatable query params. We will pass params directly, and if Axios needs help:
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
    });
    console.log('PREDICTIONS API RESPONSE:', JSON.stringify(data, null, 2));
    return data;
  },

  // Case Demographic
  getCaseDemographic: async (estate_id: string, prediction_id: string) => {
    const { data } = await Api('ai').get(`/spatial-anomaly/result-page/cases/${prediction_id}/demographic`, {
      params: { estate_id },
    });
    return data;
  },

  // Case History
  getCaseHistory: async (estate_id: string, prediction_id: string, history_limit: number = 5) => {
    const { data } = await Api('ai').get(`/spatial-anomaly/result-page/cases/${prediction_id}/history`, {
      params: { estate_id, history_limit },
    });
    return data;
  },

  // Case Summary (LLM)
  getCaseSummary: async (estate_id: string, prediction_id: string) => {
    const { data } = await Api('ai').get(`/spatial-anomaly/result-page/cases/${prediction_id}/summary`, {
      params: { estate_id },
    });
    return data;
  },

  // Case Results (Spider plot & contributing factors for one user)
  getCaseResults: async (estate_id: string, prediction_id: string, from_date?: string, to_date?: string) => {
    const { data } = await Api('ai').get(`/spatial-anomaly/result-page/cases/${prediction_id}/results`, {
      params: { estate_id, from_date, to_date },
    });
    return data;
  },
};
