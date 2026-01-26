import { StateCreator } from 'zustand';

export interface WalletSlice {
  // State
  wallet: string | null;
  connected: boolean;
  balance: number;
  hiddenBalance: number;
  walletLoading: boolean;

  // Actions
  setWallet: (wallet: string | null) => void;
  setConnected: (connected: boolean) => void;
  setBalance: (balance: number) => void;
  setHiddenBalance: (balance: number) => void;
  setWalletLoading: (loading: boolean) => void;
  resetWallet: () => void;
}

const initialWalletState = {
  wallet: null,
  connected: false,
  balance: 0,
  hiddenBalance: 0,
  walletLoading: false,
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

  resetWallet: () =>
    set(initialWalletState),
});
