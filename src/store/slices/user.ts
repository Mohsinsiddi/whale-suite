import { StateCreator } from 'zustand';

export type BadgeTier = 'none' | 'bronze' | 'silver' | 'gold' | 'diamond' | 'legendary';

export interface UserStats {
  hiddenBalance: number;
  privateTransfers: number;
  anonymousBets: number;
  swapVolume: number;
  activeDays: number;
}

export interface UserSettings {
  notifications: boolean;
  emailUpdates: boolean;
  language: string;
  theme: string;
}

export interface UserSlice {
  // State
  userNumber: number | null;
  email: string | null;
  badgeTier: BadgeTier;
  badgeMint: string | null;
  isPremium: boolean;
  premiumExpiry: Date | null;
  privacyScore: number;
  stats: UserStats;
  referralCode: string | null;
  referredBy: string | null;
  settings: UserSettings;
  userLoading: boolean;

  // Actions
  setUser: (user: Partial<UserSlice>) => void;
  setUserNumber: (userNumber: number) => void;
  setBadgeTier: (tier: BadgeTier) => void;
  setPrivacyScore: (score: number) => void;
  setStats: (stats: Partial<UserStats>) => void;
  setSettings: (settings: Partial<UserSettings>) => void;
  setUserLoading: (loading: boolean) => void;
  resetUser: () => void;
}

const initialUserState = {
  userNumber: null,
  email: null,
  badgeTier: 'none' as BadgeTier,
  badgeMint: null,
  isPremium: false,
  premiumExpiry: null,
  privacyScore: 0,
  stats: {
    hiddenBalance: 0,
    privateTransfers: 0,
    anonymousBets: 0,
    swapVolume: 0,
    activeDays: 0,
  },
  referralCode: null,
  referredBy: null,
  settings: {
    notifications: true,
    emailUpdates: false,
    language: 'en',
    theme: 'dark',
  },
  userLoading: false,
};

export const createUserSlice: StateCreator<UserSlice, [], [], UserSlice> = (set) => ({
  ...initialUserState,

  setUser: (user: Partial<UserSlice>) =>
    set((state) => ({
      ...state,
      ...user,
      stats: user.stats ? { ...state.stats, ...user.stats } : state.stats,
      settings: user.settings ? { ...state.settings, ...user.settings } : state.settings,
    })),

  setUserNumber: (userNumber: number) =>
    set({ userNumber }),

  setBadgeTier: (tier: BadgeTier) =>
    set({ badgeTier: tier }),

  setPrivacyScore: (score: number) =>
    set({ privacyScore: score }),

  setStats: (stats: Partial<UserStats>) =>
    set((state) => ({
      stats: { ...state.stats, ...stats },
    })),

  setSettings: (settings: Partial<UserSettings>) =>
    set((state) => ({
      settings: { ...state.settings, ...settings },
    })),

  setUserLoading: (loading: boolean) =>
    set({ userLoading: loading }),

  resetUser: () =>
    set(initialUserState),
});
