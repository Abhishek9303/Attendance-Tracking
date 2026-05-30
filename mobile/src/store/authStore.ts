import { create } from 'zustand';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: 'USER' | 'ADMIN';
}

interface AuthState {
  user: IUser | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  setAuth: (user: IUser, token: string, refreshToken: string) => void;
  updateToken: (token: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  refreshToken: null,
  isAuthenticated: false,
  setAuth: (user, token, refreshToken) =>
    set({
      user,
      token,
      refreshToken,
      isAuthenticated: true,
    }),
  updateToken: (token) => set({ token }),
  logout: () =>
    set({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
    }),
}));
