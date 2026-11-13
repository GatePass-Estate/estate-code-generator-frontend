export type Household = {
  id: string;
  name: string;
  estate_id: string;
  head_user_id: string | null;
  created_at: string;
};

export type SearchHouseholdsResponse = {
  items: Household[];
  total: number;
  page: number;
  limit: number;
};

export type CreateHouseholdPayload = {
  estate_id: string;
  name: string;
  head_user_id?: string | null;
};

export type CreateHouseholdResponse = {
  id: string;
  created_at: string;
};

export type TransferHouseholdPayload = {
  user_id: string;
  household_id: string;
};

export type TransferHouseholdResponse = {
  success: boolean;
  message: string;
};
