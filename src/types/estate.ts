import { GenderType, RelationshipType } from './general';

export type Codes = {
  user_id: string;
  estate_id: string | null;
  visitor_fullname: string | null;
  relationship_with_resident: RelationshipType;
  hashed_code: string;
  gender: GenderType;
  estate_name: string | null;
  valid_until: string;
  is_expired: boolean;
};

export type CodesApiResponse = {
  items: Codes[];
};

export type Estate = {
  id: string;
  name: string;
  location: string;
  estate_type?: string | null;
  lga?: string | null;
  state?: string | null;
  country?: string | null;
  postal_code?: string | null;
};

export type PublicEstateListResponse = {
  total: number;
  page: number;
  limit: number;
  items: Estate[];
};
