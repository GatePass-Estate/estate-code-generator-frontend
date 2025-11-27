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
