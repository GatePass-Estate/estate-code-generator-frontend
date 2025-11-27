import { TextInput } from 'react-native';

export type GenderType = 'male' | 'female' | 'prefer_not_to_say' | null;

export type RelationshipType = 'partner' | 'friend' | 'family' | 'taxi' | 'delivery' | 'technician' | 'other' | null;

export type UserRolesType = 'root' | 'primary_admin' | 'admin' | 'resident' | 'security' | 'guest' | null;

export type menuRouteType = { name: string; title: string; link: string; activeIcon?: any; inactiveIcon?: any; role?: UserRolesType; for?: 'web' | 'native' | 'both'; TabIcon?: React.FC<{ focused?: boolean }> };

export type InputRefsStorage = { [key: number]: TextInput | null };
