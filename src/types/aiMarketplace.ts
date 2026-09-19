export interface RatingSample {
  user_id: string;
  score: number;
  comment?: string | null;
  created_at?: string | null;
}

export interface UserRating {
  id: string;
  user_id: string;
  score: number;
  comment?: string | null;
  created_at?: string | null;
  updated_at?: string | null;
}

export interface MarketplaceListItem {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  picture_path?: string | null;
  rating?: number | null;
  rating_count?: number;
  rating_samples?: Record<string, RatingSample[]>;
  purchased?: boolean;
  price?: number | null;
  currency_code?: string | null;
  ai_feature_ids?: string[];
}

export interface MarketplaceListResponse {
  items: MarketplaceListItem[];
  total: number;
  page: number;
  limit: number;
}

export interface MarketplaceTier {
  tier: string;
  ai_feature_id: string;
  feature_key?: string | null;
  name?: string | null;
  description?: string | null;
  is_free?: boolean;
  price?: number | null;
  currency_code?: string | null;
  status: string;
  is_installed?: boolean;
}

export interface MarketplaceDetailResponse {
  id: string;
  name: string;
  category: string;
  description?: string | null;
  rating?: number | null;
  rating_count?: number;
  rating_samples?: Record<string, RatingSample[]>;
  tiers: MarketplaceTier[];
  display_picture_url?: string | null;
  video_url?: string | null;
}

export interface RatingRequest {
  score: number;
  comment?: string | null;
}

export interface RatingResponse {
  id: string;
  rating?: number | null;
  rating_count: number;
  rating_samples?: Record<string, RatingSample[]>;
  user_rating: UserRating;
}

export interface SubscribeRequest {
  ai_feature_id: string;
  period_months?: number;
}

export interface SubscribeResponse {
  estate_id: string;
  ai_feature_id: string;
  feature_key: string;
  quote?: Record<string, any> | null;
  activation: Record<string, any>;
}

export interface MarketplaceListParams {
  purchase_status?: ('purchased' | 'not_purchased')[] | 'purchased' | 'not_purchased';
  category?: string[] | string;
  page?: number;
  limit?: number;
}
