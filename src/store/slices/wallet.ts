import { StateCreator } from 'zustand';

export interface WalletSlice {
  // State
  wallet: string | null;
  connected: boolean;
  balance: number;
  hiddenBalance: number;
  walletLoading: boolean;
  balanceRefreshTrigger: number; // Increment to trigger balance refresh across components

  // Actions
  setWallet: (wallet: string | null) => void;
  setConnected: (connected: boolean) => void;
  setBalance: (balance: number) => void;
  setHiddenBalance: (balance: number) => void;
  setWalletLoading: (loading: boolean) => void;
  triggerBalanceRefresh: () => void;
  resetWallet: () => void;
}

const initialWalletState = {
  wallet: null,
  connected: false,
  balance: 0,
  hiddenBalance: 0,
  walletLoading: false,
  balanceRefreshTrigger: 0,
};

export const createWalletSlice: StateCreator<WalletSlice, [], [], WalletSlice> = (set) => ({
  ...initialWalletState,

  setWallet: (wallet: string | null) =>
    set({ wallet, connected: !!wallet }),

  setConnected: (connected: boolean) =>
    set({ connected }),

  setBalance: (balance: number) =>
    set({ balance }),

  setHiddenBalance: (balance: number) =>
    set({ hiddenBalance: balance }),

  setWalletLoading: (loading: boolean) =>
    set({ walletLoading: loading }),

  triggerBalanceRefresh: () =>
    set((state) => ({ balanceRefreshTrigger: state.balanceRefreshTrigger + 1 })),

  resetWallet: () =>
    set(initialWalletState),
});
