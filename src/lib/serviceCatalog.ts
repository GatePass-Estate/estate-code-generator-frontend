/**
 * GatePass Service Catalog — mirrors the "Catalog" sheet in the GatePass Service Catalog spreadsheet.
 * Keep this in sync with the sheet; `serviceKey` values are what the backend and plan checks use.
 */

export type ServiceCategory = 'free' | 'paid' | 'ai_paid';

export type ServiceCatalogEntry = {
  sn: string;
  serviceKey: string;
  aiParentFeature: string | null;
  label: string;
  description: string;
  category: ServiceCategory;
  /** Shown in the admin Upgrade Plan modal. Falls back to a generic message built from `label`. */
  upgradeCopy?: string;
};

export const SERVICE_CATALOG = {
  GPF1: {
    sn: 'GPF1',
    serviceKey: 'visitor_access_code',
    aiParentFeature: null,
    label: "Visitor's Access Code",
    description:
      'A time-limited code a resident or staff generates for a visitor, defaulting to a 1-hour validity window.',
    category: 'free',
  },
  GPF2: {
    sn: 'GPF2',
    serviceKey: 'resident_access_code',
    aiParentFeature: null,
    label: "Resident's Access Code",
    description:
      'A time-limited code a resident or staff generates for themself, set to a 1-month validity window.',
    category: 'free',
  },
  GPF3: {
    sn: 'GPF3',
    serviceKey: 'basic_historical_records',
    aiParentFeature: null,
    label: 'Recent Historical Records',
    description:
      'A log of who entered, when, and by which code, viewable by a resident for their own activity and by admin or security for the whole estate. The length of history is limited to 14 days at this level.',
    category: 'free',
  },
  GPF4: {
    sn: 'GPF4',
    serviceKey: 'household_department_management',
    aiParentFeature: null,
    label: 'Household/Department Management',
    description:
      'The grouping structure for residents (household) or staff (department), each with a designated head or manager.',
    category: 'free',
  },
  GPF5: {
    sn: 'GPF5',
    serviceKey: 'kyc_id_verification',
    aiParentFeature: null,
    label: 'KYC Identity Verification',
    description:
      'Upload and admin approval of a government-issued ID, creating a compliance record of who is actually using the platform.',
    category: 'free',
  },

  GPPF1: {
    sn: 'GPPF1',
    serviceKey: 'extended_historical_record',
    aiParentFeature: null,
    label: 'Extended Historical Records',
    description: 'This feature allows users access logs from longer historical periods',
    category: 'paid',
  },
  GPPF2: {
    sn: 'GPPF2',
    serviceKey: 'guest_management',
    aiParentFeature: null,
    label: 'Guest Management',
    description: 'This feature allows users to save guest for quick/repeated access management',
    category: 'paid',
    upgradeCopy: 'Unlock Save Guest Profile to quickly reuse guest details for future visits.',
  },
  GPPF3: {
    sn: 'GPPF3',
    serviceKey: 'incident_report',
    aiParentFeature: null,
    label: 'Incident Reporting and Review',
    description:
      'This feature allows users to report incidents, and admins are able to view reported reports and manage them.',
    category: 'paid',
  },
  GPPF4: {
    sn: 'GPPF4',
    serviceKey: 'admin_broadcast',
    aiParentFeature: null,
    label: 'Broadcasts and Announcements',
    description:
      'This feature allows facility admins to broadcast messages to specified users in the same facility',
    category: 'paid',
  },
  GPPF5: {
    sn: 'GPPF5',
    serviceKey: 'advanced_code_management',
    aiParentFeature: null,
    label: 'Advanced Code Management',
    description:
      'This feature introduces complete flexibility to access management. Users are able to schedule code for a future point in time, create access code valid for extended periods, extend access codes close to expiry without regeneration, set daily validity periods for an access code during generation, freeze and unfreeze and active code, and regenerate code from the history log.',
    category: 'paid',
    upgradeCopy:
      'Unlock the flexibility to schedule your access code beyond the standard one-hour window.',
  },

  GPAIF1: {
    sn: 'GPAIF1',
    serviceKey: 'access_anomaly_detection_tier_1',
    aiParentFeature: 'Access Anomaly Detection',
    label: 'Access Code Anomaly Scan',
    description:
      "This feature runs anomaly scans in the background and triggers an alerts whenever a suspicious access is detected. It also allows admins to review all analysed instances in one place, with insights and transparency as to how the AI agent came to it's conclusion on each case.",
    category: 'ai_paid',
  },
  GPAIF2: {
    sn: 'GPAIF2',
    serviceKey: 'access_anomaly_detection_tier_2',
    aiParentFeature: 'Access Anomaly Detection',
    label: 'Anomaly Scan Results In-house AI Review',
    description:
      'This feature helps the admin quickly review each analysed case and generates a human readable report using our in-house AI Agents',
    category: 'ai_paid',
  },
  GPAIF3: {
    sn: 'GPAIF3',
    serviceKey: 'access_anomaly_detection_tier_3',
    aiParentFeature: 'Access Anomaly Detection',
    label: 'Anomaly Scan Results Third-Party AI Review',
    description:
      'This feature helps the admin quickly review each analysed case and generates a human readable report using advanced third-party AI agents',
    category: 'ai_paid',
  },
  GPAIF4: {
    sn: 'GPAIF4',
    serviceKey: 'incident_report_summary_tier_1',
    aiParentFeature: 'Incident Report Insights',
    label: 'Incident Report Summary and Insights',
    description:
      'This feature helps admin to review incident reports all in one place with added insight from analysis conducted on the reports',
    category: 'ai_paid',
  },
  GPAIF5: {
    sn: 'GPAIF5',
    serviceKey: 'incident_report_summary_tier_2',
    aiParentFeature: 'Incident Report Insights',
    label: 'Incident Report In-house AI Review',
    description:
      'This feature employs our in-house AI agents to quickly generate insight and uncover trends existing in the reports',
    category: 'ai_paid',
  },
  GPAIF6: {
    sn: 'GPAIF6',
    serviceKey: 'incident_report_summary_tier_3',
    aiParentFeature: 'Incident Report Insights',
    label: 'Incident Report Third-Party AI Review',
    description:
      'This feature employs third-party AI agents to quickly generate insight and uncover trends existing in the reports',
    category: 'ai_paid',
  },
} as const satisfies Record<string, ServiceCatalogEntry>;

export type ServiceSn = keyof typeof SERVICE_CATALOG;
export type ServiceKey = (typeof SERVICE_CATALOG)[ServiceSn]['serviceKey'];

export type Service = ServiceCatalogEntry & { sn: ServiceSn; serviceKey: ServiceKey };

export const SERVICE_CATALOG_LIST: readonly Service[] = Object.values(SERVICE_CATALOG);

const SERVICES_BY_KEY = Object.fromEntries(
  SERVICE_CATALOG_LIST.map((service) => [service.serviceKey, service])
) as Record<ServiceKey, Service>;

export function getServiceByKey(serviceKey: ServiceKey): Service {
  return SERVICES_BY_KEY[serviceKey];
}

export function getServicesByCategory(category: ServiceCategory): Service[] {
  return SERVICE_CATALOG_LIST.filter((service) => service.category === category);
}
