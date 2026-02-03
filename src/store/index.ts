import { create } from 'zustand';
import { devtools, persist, subscribeWithSelector } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import { AuthSlice, createAuthSlice } from './slices/auth';
import { UserSlice, createUserSlice } from './slices/user';
import { WalletSlice, createWalletSlice } from './slices/wallet';
import { UISlice, createUISlice } from './slices/ui';
import { RPCSlice, createRPCSlice } from './slices/rpc';

// Combined store type
export type StoreState = AuthSlice & UserSlice & WalletSlice & UISlice & RPCSlice;

// Create the store with all slices
export const useStore = create<StoreState>()(
  devtools(
    subscribeWithSelector(
      persist(
        (set, get, api) => ({
          ...createAuthSlice(set, get, api),
          ...createUserSlice(set, get, api),
          ...createWalletSlice(set, get, api),
          ...createUISlice(set, get, api),
          ...createRPCSlice(set, get, api),
        }),
        {
          name: 'whale-suite-storage',
          partialize: (state) => ({
            // Only persist non-sensitive, non-volatile state
            settings: state.settings,
            sidebarOpen: state.sidebarOpen,
            // RPC settings (persist user preferences)
            activeEndpointId: state.activeEndpointId,
            selectionStrategy: state.selectionStrategy,
            customEndpoints: state.customEndpoints,
            apiKeys: state.apiKeys,
          }),
        }
      )
    ),
    { name: 'WhaleSuiteStore' }
  )
);

// Selector hooks with shallow comparison to prevent infinite loops
export const useAuth = () =>
  useStore(
    useShallow((state) => ({
      isAuthenticated: state.isAuthenticated,
      privyId: state.privyId,
      isLoading: state.isLoading,
      setAuthenticated: state.setAuthenticated,
      setPrivyId: state.setPrivyId,
      setAuthLoading: state.setAuthLoading,
      resetAuth: state.resetAuth,
    }))
  );

export const useUser = () =>
  useStore(
    useShallow((state) => ({
      userNumber: state.userNumber,
      email: state.email,
      badgeTier: state.badgeTier,
      badgeMint: state.badgeMint,
      isPremium: state.isPremium,
      premiumExpiry: state.premiumExpiry,
      privacyScore: state.privacyScore,
      stats: state.stats,
      referralCode: state.referralCode,
      referredBy: state.referredBy,
      settings: state.settings,
      termsAcceptedAt: state.termsAcceptedAt,
      termsVersion: state.termsVersion,
      userLoading: state.userLoading,
      hasSynced: state.hasSynced,
      userNotFound: state.userNotFound,
      setUser: state.setUser,
      setUserNumber: state.setUserNumber,
      setBadgeTier: state.setBadgeTier,
      setPrivacyScore: state.setPrivacyScore,
      setStats: state.setStats,
      setSettings: state.setSettings,
      setTermsAccepted: state.setTermsAccepted,
      setUserLoading: state.setUserLoading,
      setHasSynced: state.setHasSynced,
      setUserNotFound: state.setUserNotFound,
      resetUser: state.resetUser,
    }))
  );

export const useWallet = () =>
  useStore(
    useShallow((state) => ({
      wallet: state.wallet,
      connected: state.connected,
      balance: state.balance,
      hiddenBalance: state.hiddenBalance,
      walletLoading: state.walletLoading,
      balanceRefreshTrigger: state.balanceRefreshTrigger,
      setWallet: state.setWallet,
      setConnected: state.setConnected,
      setBalance: state.setBalance,
      setHiddenBalance: state.setHiddenBalance,
      setWalletLoading: state.setWalletLoading,
      triggerBalanceRefresh: state.triggerBalanceRefresh,
      resetWallet: state.resetWallet,
    }))
  );

export const useUI = () =>
  useStore(
    useShallow((state) => ({
      sidebarOpen: state.sidebarOpen,
      modalOpen: state.modalOpen,
      loading: state.loading,
      notifications: state.notifications,
      toggleSidebar: state.toggleSidebar,
      setSidebarOpen: state.setSidebarOpen,
      openModal: state.openModal,
      closeModal: state.closeModal,
      setLoading: state.setLoading,
      addNotification: state.addNotification,
      removeNotification: state.removeNotification,
      clearNotifications: state.clearNotifications,
    }))
  );

export const useRPC = () =>
  useStore(
    useShallow((state) => ({
      endpoints: state.endpoints,
      activeEndpointId: state.activeEndpointId,
      selectionStrategy: state.selectionStrategy,
      customEndpoints: state.customEndpoints,
      apiKeys: state.apiKeys,
      isTestingPings: state.isTestingPings,
      lastPingTest: state.lastPingTest,
      getActiveEndpoint: state.getActiveEndpoint,
      getEndpointsForNetwork: state.getEndpointsForNetwork,
      getBestEndpoint: state.getBestEndpoint,
      setActiveEndpoint: state.setActiveEndpoint,
      setSelectionStrategy: state.setSelectionStrategy,
      setApiKey: state.setApiKey,
      addCustomEndpoint: state.addCustomEndpoint,
      removeCustomEndpoint: state.removeCustomEndpoint,
      updateEndpointPing: state.updateEndpointPing,
      testAllPings: state.testAllPings,
      selectBestEndpoint: state.selectBestEndpoint,
      rotateEndpoint: state.rotateEndpoint,
      resetToDefaults: state.resetToDefaults,
    }))
  );

// Export types
export type { BadgeTier, UserStats, UserSettings } from './slices/user';
export type { Notification } from './slices/ui';
export type { RPCProvider, NetworkType, RPCEndpoint, RPCSelectionStrategy } from './slices/rpc';
