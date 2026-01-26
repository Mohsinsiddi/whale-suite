import { StateCreator } from 'zustand';

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  duration?: number;
}

export interface UISlice {
  // State
  sidebarOpen: boolean;
  modalOpen: string | null;
  loading: boolean;
  notifications: Notification[];

  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalId: string) => void;
  closeModal: () => void;
  setLoading: (loading: boolean) => void;
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
  clearNotifications: () => void;
}

const initialUIState = {
  sidebarOpen: false,
  modalOpen: null,
  loading: false,
  notifications: [] as Notification[],
};

export const createUISlice: StateCreator<UISlice, [], [], UISlice> = (set) => ({
  ...initialUIState,

  toggleSidebar: () =>
    set((state) => ({ sidebarOpen: !state.sidebarOpen })),

  setSidebarOpen: (open: boolean) =>
    set({ sidebarOpen: open }),

  openModal: (modalId: string) =>
    set({ modalOpen: modalId }),

  closeModal: () =>
    set({ modalOpen: null }),

  setLoading: (loading: boolean) =>
    set({ loading }),

  addNotification: (notification: Omit<Notification, 'id'>) =>
    set((state) => ({
      notifications: [
        ...state.notifications,
        { ...notification, id: crypto.randomUUID() },
      ],
    })),

  removeNotification: (id: string) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),

  clearNotifications: () =>
    set({ notifications: [] }),
});
