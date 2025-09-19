import { User } from '@/types/user';
import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

type State = User;

type Actions = {
	setUser: (user: User) => void;
	clearUser: () => void;
};

type UserStore = State & Actions;

const initialState: State = {
	first_name: null,
	last_name: null,
	home_address: null,
	email: null,
	phone_number: null,
	gender: null,
	estate_name: null,
	household_primary_resident: null,
	status: true,
};

const userStoreCreator: StateCreator<UserStore, [['zustand/persist', unknown]]> = (set) => ({
	...initialState,
	setUser: (user: User) => set(user),
	clearUser: () => set(initialState),
});

export const useUserStore = create<UserStore>()(
	persist(userStoreCreator, {
		name: 'user-details',
		partialize: (state) => ({
			first_name: state.first_name,
			last_name: state.last_name,
			home_address: state.home_address,
			email: state.email,
			phone_number: state.phone_number,
			gender: state.gender,
			estate_name: state.estate_name,
			household_primary_resident: state.household_primary_resident,
			status: state.status,
		}),
	})
);
