import { GenderType } from './general';

export type ReceiverType = 'visitor' | 'resident';

export type Codes = {
	user_id: string;
	estate_id: string | null;
	visitor_fullname: string | null;
	relationship_with_resident: string;
	hashed_code: string;
	gender: GenderType;
	estate_name: string | null;
	valid_until: string;
	is_expired: boolean;
	receiver: ReceiverType;
};

export type CodesApiResponse = {
	items: Codes[];
};

export type GenerateCodePayload = {
	hashed_code: string;
	valid_until: string;
};
