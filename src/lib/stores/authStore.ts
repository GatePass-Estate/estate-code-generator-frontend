import { UserRolesType } from '@/src/types/general';
import { create, StateCreator } from 'zustand';

export type AuthState = {
  access_token: string | null;
  role: UserRolesType;
  /** Session this device is signed in with, used to mark it in Linked Devices. */
  session_id?: string | null;
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
  session_id: null,
};

const authStoreCreator: StateCreator<AuthStore> = (set, get) => ({
  ...initialState,
  getToken: () => get().access_token,
  clearAuth: () => set(() => ({ access_token: null, role: null, session_id: null })),
  setAuth: (access_token: string, role: AuthStore['role']) => set(() => ({ access_token, role })),
});

export const useAuthStore = create<AuthStore>(authStoreCreator);
