export type User = {
	first_name: String | null;
	last_name: String | null;
	home_address: String | null;
	email: String | null;
	phone_number: String | null;
	gender: 'male' | 'female' | 'prefer not to say' | 'other' | null;
	estate_name: String | null;
	household_primary_resident: String | null;
	status: boolean | null;
};
