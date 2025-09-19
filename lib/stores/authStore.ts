import { create, StateCreator } from 'zustand';
import { persist } from 'zustand/middleware';

export type AuthState = {
	access_token: string | null;
	role: 'primary_admin' | 'root' | 'admin' | 'security' | 'resident' | null;
};

type Actions = {
	getToken: () => string | null;
	clearAuth: () => void;
	setAuth: (access_token: string, role: AuthStore['role']) => void;
};

type AuthStore = AuthState & Actions;

const initialState: AuthState = {
	access_token: null,
	role: null,
};

const authStoreCreator: StateCreator<AuthStore, [['zustand/persist', unknown]]> = (set, get) => ({
	...initialState,
	getToken: () => get().access_token,
	clearAuth: () => set(() => ({ access_token: null, role: null })),
	setAuth: (access_token: string, role: AuthStore['role']) => set(() => ({ access_token, role })),
});

export const useAuthStore = create<AuthStore>()(
	persist(authStoreCreator, {
		name: 'auth-details',
		partialize: (state) => ({
			access_token: state.access_token,
			role: state.role,
		}),
	})
);
