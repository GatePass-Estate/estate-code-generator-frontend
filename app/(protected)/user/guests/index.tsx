import { Platform } from 'react-native';
import GuestsMobile from './index.native';
import GuestsWeb from './index.web';
import { useEffect, useState } from 'react';
import { Guest } from '@/src/types/guests';
import { deleteMyGuest, getMyGuests } from '@/src/lib/api/guests';

export type GuestsProps = {
	searchQuery: string;
	guests: Guest[];
	loading: boolean;
	deleting: boolean;
	fetchGuests: () => void;
	deleteGuest: (id: string) => void;
	setSearchQuery: (query: string) => void;
	setLoading: (loading: boolean) => void;
	setDeleting: (deleting: boolean) => void;
	filteredGuests: Guest[];
};

export default Platform.select({
	web: GuestsWeb,
	default: GuestsMobile,
});
