// types.ts
export type UserRole = 'admin' | 'user' | 'guest';

export interface User {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  token: string;
}

export type AuthContextType = {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
};
