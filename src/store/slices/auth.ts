import { StateCreator } from 'zustand';

export interface AuthSlice {
  // State
  isAuthenticated: boolean;
  privyId: string | null;
  isLoading: boolean;

  // Actions
  setAuthenticated: (authenticated: boolean) => void;
  setPrivyId: (privyId: string | null) => void;
  setAuthLoading: (loading: boolean) => void;
  resetAuth: () => void;
}

const initialAuthState = {
  isAuthenticated: false,
  privyId: null,
  isLoading: true,
};

export const createAuthSlice: StateCreator<AuthSlice, [], [], AuthSlice> = (set) => ({
  ...initialAuthState,

  setAuthenticated: (authenticated: boolean) =>
    set({ isAuthenticated: authenticated }),

  setPrivyId: (privyId: string | null) =>
    set({ privyId }),

  setAuthLoading: (loading: boolean) =>
    set({ isLoading: loading }),

  resetAuth: () =>
    set(initialAuthState),
});
