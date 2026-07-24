import { GenderType } from './general';

export type ReceiverType = 'visitor' | 'resident';

export type ValidityRange = {
  start: string | null;
  end: string | null;
};

export type Codes = {
  user_id: string;
  estate_id: string | null;
  visitor_fullname: string | null;
  relationship_with_resident: string;
  hashed_code: string;
  gender: GenderType;
  estate_name?: string | null;
  valid_until: string;
  validity_period?: ValidityRange | null;
  validity_window?: ValidityRange | null;
  extended?: boolean;
  frozen?: boolean;
  is_expired: boolean;
  is_valid?: boolean;
  receiver: ReceiverType;
};

export type CodesApiResponse = {
  items: Codes[];
};

export type GenerateCodePayload = {
  hashed_code: string;
  valid_until: string;
};
