import { User } from '@/src/types/user';
import { create, StateCreator } from 'zustand';

type State = User;

type Actions = {
	setUser: (user: User) => void;
	clearUser: () => void;
};

type UserStore = State & Actions;

const initialState: State = {
	user_id: '',
	first_name: null,
	last_name: null,
	home_address: null,
	email: null,
	phone_number: null,
	gender: null,
	estate_name: null,
	estate_id: null,
	household_primary_resident: null,
	status: true,
};

const userStoreCreator: StateCreator<UserStore> = (set) => ({
	...initialState,
	setUser: (user: User) => set(user),
	clearUser: () => set(initialState),
});

export const useUserStore = create<UserStore>(userStoreCreator);
