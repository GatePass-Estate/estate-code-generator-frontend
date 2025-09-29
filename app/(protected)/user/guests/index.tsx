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

export default function Guests() {
	const [searchQuery, setSearchQuery] = useState('');
	const [guests, setGuests] = useState<Guest[]>([]);
	const [loading, setLoading] = useState(true);
	const [deleting, setDeleting] = useState(false);

	const filteredGuests = guests.filter((guest) => guest.guest_name.toLowerCase().includes(searchQuery.toLowerCase()) || guest.relationship.toLowerCase().includes(searchQuery.toLowerCase()));

	const fetchGuests = async () => {
		setLoading(true);
		try {
			const result = await getMyGuests();
			setGuests(result.items);
		} catch (error) {
		} finally {
			setLoading(false);
		}
	};

	const deleteGuest = async (id: string) => {
		setDeleting(true);
		try {
			await deleteMyGuest(id);
			setGuests((prev) => prev.filter((g) => g.id !== id));
		} catch (error) {
		} finally {
			setDeleting(false);
		}
	};

	useEffect(() => {
		fetchGuests();
	}, []);

	const props = {
		searchQuery,
		guests: filteredGuests,
		loading,
		deleting,
		fetchGuests,
		deleteGuest,
		setSearchQuery,
		setLoading,
		setDeleting,
		filteredGuests,
	};

	const Component = Platform.select({
		web: GuestsWeb,
		default: GuestsMobile,
	});

	if (!Component) {
		return null;
	}

	return Component(props);
}
