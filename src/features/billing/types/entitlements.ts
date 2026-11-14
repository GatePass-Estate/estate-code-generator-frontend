/** `GET {revenue}/api/v1/entitlements/estate/{estate_id}` */
export type EstateEntitlementsResponse = {
  estate_id: string;
  /** Keyed by catalog `service_key`. */
  entitlements?: Record<string, unknown>;
  locked?: boolean;
  reason?: string | null;
  covered_users?: number | null;
  subscription_status?: string | null;
  tier_slug?: string | null;
};
