/** Server-cache keys. Values match the keys already used before this module existed. */
export const queryKeys = {
  guests: {
    all: ['guests'] as const,
    list: (page = 1, limit = 6) => ['guests', 'list', page, limit] as const,
    infinite: (limit: number) => ['guests', 'infinite', limit] as const,
    detail: (id: string) => ['guests', 'detail', id] as const,
  },
  auth: {
    verifyEmailActivationToken: (token: string) =>
      ['verify-email-activation-token', token] as const,
  },
  billing: {
    all: ['billing'] as const,
    tiers: () => ['billing', 'tiers'] as const,
    subscription: (estateId: string) => ['billing', 'subscription', estateId] as const,
    cycle: (estateId: string) => ['billing', 'cycle', estateId] as const,
    quote: (params: unknown) => ['billing', 'quote', params] as const,
    seatEligibility: (estateId: string) => ['billing', 'seat-eligibility', estateId] as const,
    renewalEligibility: (estateId: string) => ['billing', 'renewal-eligibility', estateId] as const,
    seatProrate: (estateId: string, seatsAdded: number) =>
      ['billing', 'seat-prorate', estateId, seatsAdded] as const,
    aiGrants: (estateId: string) => ['billing', 'ai-grants', estateId] as const,
    aiMarketplace: (estateId: string) => ['billing', 'ai-marketplace', estateId] as const,
  },
  entitlements: {
    all: ['entitlements'] as const,
    estate: (estateId: string) => ['entitlements', 'estate', estateId] as const,
    tier: (estateId: string) => ['entitlements', 'tier', estateId] as const,
  },
  estateUsers: {
    all: ['estate-users'] as const,
    estate: (estateId: string) => ['estate-users', estateId] as const,
  },
  anomaly: {
    all: ['anomaly'] as const,
    overview: (estateId: string, fromDate?: string, toDate?: string) =>
      ['anomaly', 'overview', estateId, fromDate, toDate] as const,
    predictions: (estateId: string, params?: unknown) =>
      ['anomaly', 'predictions', estateId, params] as const,
    caseDemographic: (estateId: string, predictionId: string) =>
      ['anomaly', 'case-demographic', estateId, predictionId] as const,
    caseHistory: (estateId: string, predictionId: string) =>
      ['anomaly', 'case-history', estateId, predictionId] as const,
    caseSummary: (estateId: string, predictionId: string) =>
      ['anomaly', 'case-summary', estateId, predictionId] as const,
    caseResults: (estateId: string, predictionId: string, fromDate?: string, toDate?: string) =>
      ['anomaly', 'case-results', estateId, predictionId, fromDate, toDate] as const,
  },
  incidents: {
    all: ['incident-reports'] as const,
    overview: (estateId: string, fromDate?: string, toDate?: string) =>
      ['incident-reports', 'overview', estateId, fromDate, toDate] as const,
    reports: (estateId: string, params?: unknown) =>
      ['incident-reports', 'reports', estateId, params] as const,
    categories: () => ['incident-reports', 'categories'] as const,
    summary: (estateId: string, fromDate?: string, toDate?: string) =>
      ['incident-reports', 'summary', estateId, fromDate, toDate] as const,
    managed: (scope: 'all' | 'mine') => ['incident-reports', 'managed', scope] as const,
    managedDetail: (id: string) => ['incident-reports', 'managed', 'detail', id] as const,
  },
  codes: {
    all: ['codes'] as const,
    active: (userId: string) => ['codes', 'active', userId] as const,
    upcoming: (userId: string) => ['codes', 'upcoming', userId] as const,
    resident: (userId: string) => ['codes', 'resident', userId] as const,
  },
  accessLogs: {
    all: ['access-logs'] as const,
    myVisitor: (params?: unknown) => ['access-logs', 'my-visitor', params] as const,
    myResident: (params?: unknown) => ['access-logs', 'my-resident', params] as const,
    myVisitorCode: (code: string, params?: unknown) =>
      ['access-logs', 'my-visitor-code', code, params] as const,
    myResidentCode: (code: string, params?: unknown) =>
      ['access-logs', 'my-resident-code', code, params] as const,
    estateVisitor: (params?: unknown) => ['access-logs', 'estate-visitor', params] as const,
    estateResident: (params?: unknown) => ['access-logs', 'estate-resident', params] as const,
    estateVisitorCode: (code: string, params?: unknown) =>
      ['access-logs', 'estate-visitor-code', code, params] as const,
    estateResidentCode: (code: string, params?: unknown) =>
      ['access-logs', 'estate-resident-code', code, params] as const,
  },
  users: {
    all: ['users'] as const,
    byId: (userId: string) => ['users', 'by-id', userId] as const,
    byIdAdmin: (userId: string) => ['users', 'by-id-admin', userId] as const,
  },
  requests: {
    all: ['edit-requests'] as const,
    list: (params?: unknown) => ['edit-requests', 'list', params] as const,
    detail: (id: string) => ['edit-requests', 'detail', id] as const,
  },
  broadcasts: {
    all: ['broadcasts'] as const,
    list: (page: number, limit: number) => ['broadcasts', 'list', page, limit] as const,
    detail: (id: string) => ['broadcasts', 'detail', id] as const,
  },
  marketplace: {
    all: ['marketplace'] as const,
    list: (params?: unknown) => ['marketplace', 'list', params] as const,
    detail: (id: string) => ['marketplace', 'detail', id] as const,
  },
};
