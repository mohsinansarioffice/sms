import { create } from 'zustand';
import axios from '../lib/axios';

const useSubscriptionStore = create((set, get) => ({
  plans: [],
  currentPlan: null,
  usage: null,
  isLoading: false,
  error: null,

  fetchPlans: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/subscription/plans');
      set({
        plans: response.data?.plans || [],
        currentPlan: response.data?.currentPlan,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchUsage: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/subscription/usage');
      set({
        usage: response.data || null,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  changePlan: async (newPlan) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/subscription/change-plan', { newPlan });
      set({ isLoading: false });
      // Refresh usage and plans after change
      get().fetchUsage();
      get().fetchPlans();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null })
}));

export default useSubscriptionStore;
