export interface BroadcastFormData {
	userType: 'residents' | 'admin' | 'security' | 'users';
	priorityLevel: 'low' | 'medium' | 'high' | 'urgent';
	duration: '1_hour' | '6_hours' | '24_hours' | '7_days';
	subjectLine: string;
	bodyText: string;
}

export interface BroadcastFormErrors {
	userType?: string;
	priorityLevel?: string;
	duration?: string;
	subjectLine?: string;
	bodyText?: string;
}

export const USER_TYPES = [
	{ label: 'Residents Only', value: 'residents' },
	{ label: 'Admins Only', value: 'admins' },
	{ label: 'Security Personnel Only', value: 'security' },
	{ label: 'All Users', value: 'users' },
];

export const PRIORITY_LEVELS = [
	{ label: 'Low', value: 'low' },
	{ label: 'Medium', value: 'medium' },
	{ label: 'High', value: 'high' },
];

export const DURATIONS = [
	{ label: '24 Hours', value: '24_hours' },
	{ label: '3 Days', value: '3_days' },
	{ label: '7 Days', value: '7_days' },
	{ label: '14 Days', value: '14_days' },
	{ label: '30 Days', value: '30_days' },
];
