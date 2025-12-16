import { create } from 'zustand';
import { api } from '../services/api';
import type {
  SubscriptionPlan,
  MinutePackage,
  MinutesBalance,
  UserSubscription,
  MinuteTransaction,
  PaginationInfo,
} from '../types';

interface SubscriptionState {
  // Data
  plans: SubscriptionPlan[];
  packages: MinutePackage[];
  balance: MinutesBalance | null;
  subscription: UserSubscription | null;
  transactions: MinuteTransaction[];
  transactionsPagination: PaginationInfo | null;

  // Loading states
  isLoadingPlans: boolean;
  isLoadingPackages: boolean;
  isLoadingBalance: boolean;
  isLoadingSubscription: boolean;
  isLoadingTransactions: boolean;
  isActivatingPlan: boolean;
  isPurchasingPackage: boolean;

  // Error states
  error: string | null;

  // Actions
  fetchPlans: () => Promise<void>;
  fetchPackages: () => Promise<void>;
  fetchBalance: () => Promise<void>;
  fetchSubscription: () => Promise<void>;
  fetchTransactions: (page?: number, limit?: number) => Promise<void>;
  activatePlan: (planName: string) => Promise<boolean>;
  purchasePackage: (packageName: string) => Promise<boolean>;
  clearError: () => void;
  reset: () => void;
}

const initialState = {
  plans: [],
  packages: [],
  balance: null,
  subscription: null,
  transactions: [],
  transactionsPagination: null,
  isLoadingPlans: false,
  isLoadingPackages: false,
  isLoadingBalance: false,
  isLoadingSubscription: false,
  isLoadingTransactions: false,
  isActivatingPlan: false,
  isPurchasingPackage: false,
  error: null,
};

export const useSubscriptionStore = create<SubscriptionState>((set, get) => ({
  ...initialState,

  fetchPlans: async () => {
    set({ isLoadingPlans: true, error: null });
    try {
      const response = await api.getPlans();
      if (response.success && response.data) {
        set({ plans: response.data.plans, isLoadingPlans: false });
      } else {
        set({
          error: response.error?.message || 'Failed to fetch plans',
          isLoadingPlans: false,
        });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoadingPlans: false,
      });
    }
  },

  fetchPackages: async () => {
    set({ isLoadingPackages: true, error: null });
    try {
      const response = await api.getPackages();
      if (response.success && response.data) {
        set({ packages: response.data.packages, isLoadingPackages: false });
      } else {
        set({
          error: response.error?.message || 'Failed to fetch packages',
          isLoadingPackages: false,
        });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoadingPackages: false,
      });
    }
  },

  fetchBalance: async () => {
    set({ isLoadingBalance: true, error: null });
    try {
      const response = await api.getBalance();
      if (response.success && response.data) {
        set({ balance: response.data.balance, isLoadingBalance: false });
      } else {
        set({
          error: response.error?.message || 'Failed to fetch balance',
          isLoadingBalance: false,
        });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoadingBalance: false,
      });
    }
  },

  fetchSubscription: async () => {
    set({ isLoadingSubscription: true, error: null });
    try {
      const response = await api.getSubscription();
      if (response.success && response.data) {
        set({ subscription: response.data.subscription, isLoadingSubscription: false });
      } else {
        set({
          error: response.error?.message || 'Failed to fetch subscription',
          isLoadingSubscription: false,
        });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoadingSubscription: false,
      });
    }
  },

  fetchTransactions: async (page = 1, limit = 20) => {
    set({ isLoadingTransactions: true, error: null });
    try {
      const response = await api.getTransactions(page, limit);
      if (response.success && response.data) {
        set({
          transactions: response.data.transactions,
          transactionsPagination: response.data.pagination,
          isLoadingTransactions: false,
        });
      } else {
        set({
          error: response.error?.message || 'Failed to fetch transactions',
          isLoadingTransactions: false,
        });
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isLoadingTransactions: false,
      });
    }
  },

  activatePlan: async (planName: string) => {
    set({ isActivatingPlan: true, error: null });
    try {
      const response = await api.activatePlan(planName);
      if (response.success && response.data) {
        // Check if payment is required (paid plans)
        if (response.data.requiresPayment && response.data.paymentUrl) {
          // Redirect to payment page
          window.open(response.data.paymentUrl, '_blank');
          set({ isActivatingPlan: false });
          return true;
        }
        // Free plan - refresh balance and subscription after activation
        const { fetchBalance, fetchSubscription } = get();
        await Promise.all([fetchBalance(), fetchSubscription()]);
        set({ isActivatingPlan: false });
        return true;
      } else {
        set({
          error: response.error?.message || 'Failed to activate plan',
          isActivatingPlan: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isActivatingPlan: false,
      });
      return false;
    }
  },

  purchasePackage: async (packageName: string) => {
    set({ isPurchasingPackage: true, error: null });
    try {
      const response = await api.purchasePackage(packageName);
      if (response.success && response.data) {
        // Check if payment is required
        if (response.data.requiresPayment && response.data.paymentUrl) {
          // Redirect to payment page
          window.open(response.data.paymentUrl, '_blank');
          set({ isPurchasingPackage: false });
          return true;
        }
        // Refresh balance after purchase
        const { fetchBalance } = get();
        await fetchBalance();
        set({ isPurchasingPackage: false });
        return true;
      } else {
        set({
          error: response.error?.message || 'Failed to purchase package',
          isPurchasingPackage: false,
        });
        return false;
      }
    } catch (error) {
      set({
        error: (error as Error).message,
        isPurchasingPackage: false,
      });
      return false;
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set(initialState),
}));
