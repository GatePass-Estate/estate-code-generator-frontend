import Api from './index';

export type IncidentReport = {
  id: string;
  title: string | null;
  category: string[];
  custom_category: string | null;
  narrative: string;
  created_at: string;
  is_read: boolean;
  reporter?: {
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
    phone_number?: string | null;
    home_address?: string | null;
  } | null;
};

export type IncidentReportPage = {
  items: IncidentReport[];
  total: number;
  page: number;
  limit: number;
};

export type CreateIncidentReportPayload = {
  title: string;
  category: string[];
  custom_category: string | null;
  narrative: string;
  occurred_at: string;
};

export const incidentManagementApi = {
  create: async (payload: CreateIncidentReportPayload): Promise<void> => {
    await Api().post('/incident-reports', payload);
  },
  list: async (page = 1, limit = 100): Promise<IncidentReportPage> => {
    const response = await Api().get<IncidentReportPage>('/incident-reports', {
      params: { page, limit },
    });
    return response.data;
  },
  listAll: async (): Promise<IncidentReport[]> => {
    const firstPage = await incidentManagementApi.list();
    const items = [...firstPage.items];
    let page = firstPage.page + 1;
    const lastPage = Math.ceil(firstPage.total / firstPage.limit);

    while (items.length < firstPage.total && page <= lastPage) {
      const nextPage = await incidentManagementApi.list(page, firstPage.limit);
      if (nextPage.items.length === 0) break;
      items.push(...nextPage.items);
      page += 1;
    }

    return items;
  },
  listMy: async (page = 1, limit = 100): Promise<IncidentReportPage> => {
    const response = await Api().get<IncidentReportPage>('/incident-reports/my-reports', {
      params: { page, limit },
    });
    return response.data;
  },
  listMyAll: async (): Promise<IncidentReport[]> => {
    const firstPage = await incidentManagementApi.listMy();
    const items = [...firstPage.items];
    let page = firstPage.page + 1;
    const lastPage = Math.ceil(firstPage.total / firstPage.limit);

    while (items.length < firstPage.total && page <= lastPage) {
      const nextPage = await incidentManagementApi.listMy(page, firstPage.limit);
      if (nextPage.items.length === 0) break;
      items.push(...nextPage.items);
      page += 1;
    }

    return items;
  },
  getMy: async (id: string): Promise<IncidentReport> => {
    const response = await Api().get<IncidentReport>(
      `/incident-reports/my-reports/${encodeURIComponent(id)}`
    );
    return response.data;
  },
  get: async (id: string): Promise<IncidentReport> => {
    const response = await Api().get<IncidentReport>(`/incident-reports/${encodeURIComponent(id)}`);
    return response.data;
  },
  markRead: async (id: string): Promise<void> => {
    await Api().post(`/incident-reports/${encodeURIComponent(id)}/read`);
  },
  clearRead: async (): Promise<void> => {
    await Api().delete('/incident-reports/clear-read');
  },
};
