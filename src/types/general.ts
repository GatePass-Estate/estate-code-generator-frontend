import { TextInput } from 'react-native';

export type GenderType = 'male' | 'female' | 'prefer_not_to_say' | null;

export type RelationshipType = 'partner' | 'friend' | 'family' | 'taxi' | 'delivery' | 'technician' | 'other' | null;

export type UserRolesType = 'root' | 'primary_admin' | 'admin' | 'resident' | 'security' | 'guest' | null;

export type menuRouteType = { name: string; title: string; link: string; activeIcon?: any; inactiveIcon?: any; role?: UserRolesType; for?: 'web' | 'native' | 'both'; TabIcon?: React.FC<{ focused?: boolean; isMobile?: boolean }> };

export type adminMenuRouteType = { name: string; title: string; link: string; icon?: any };

export type InputRefsStorage = { [key: number]: TextInput | null };

export interface FormData {
	firstName: string;
	lastName: string;
	email: string;
	phoneNumber: string;
	password: string;
	userType: UserRolesType;
	homeAddress: string;
	meansOfIdentification: MeansOfIdType;
	idNumber: string;
}

export interface FormErrors {
	firstName?: string;
	lastName?: string;
	email?: string;
	phoneNumber?: string;
	password?: string;
	homeAddress?: string;
	meansOfIdentification?: string;
	idNumber?: string;
}

export type MeansOfIdType = 'drivers_license' | 'international_passport' | 'national_id' | 'voters_card';

export type AuthBroadcastMessage = { type: 'LOGIN'; payload: { token: string; role: UserRolesType; timestamp: number } } | { type: 'LOGOUT'; payload: { timestamp: number } };
