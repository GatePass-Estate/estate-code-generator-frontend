import { ReceiverType } from './codes';
import { GenderType, RelationshipType } from './general';

export type ResidentLogEntry = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  estate_id: string;
  hashed_code: string;
  security_id: string;
  access_time: string;
  full_name?: string | null;
  usage_count?: number | null;
  code_deleted?: boolean | null;
};

export type VisitorLogEntry = {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  estate_id: string;
  visitor_fullname: string;
  relationship_with_resident: RelationshipType;
  gender: GenderType;
  hashed_code: string;
  security_id: string;
  visit_time: string;
  resident_fullname?: string | null;
  usage_count?: number | null;
};

export type ResidentLogListResponse = {
  total: number;
  page: number;
  limit: number;
  items: ResidentLogEntry[];
};

export type VisitorLogListResponse = {
  total: number;
  page: number;
  limit: number;
  items: VisitorLogEntry[];
};

export type ResidentCodeHistoryResponse = ResidentLogListResponse & {
  code_deleted: boolean;
  code_created_at?: string | null;
  code_deleted_at?: string | null;
};

export type AccessLogHistoryParams = {
  page?: number;
  limit?: number;
  from_date?: string;
  to_date?: string;
};

export type SecurityHistoryEntry = {
  id: string;
  name: string;
  category: string;
  hashed_code: string;
  timestamp: string;
  receiver: ReceiverType;
  user_id?: string;
};
