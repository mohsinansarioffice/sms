import { create } from 'zustand';
import axios from '../lib/axios';

const useLeaveStore = create((set, get) => ({
  leaves: [],
  isLoading: false,
  error: null,

  fetchLeaves: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await axios.get(`/leaves?${params.toString()}`);
      set({
        leaves: response?.data?.leaves || [],
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createLeave: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/leaves', payload);
      set({ isLoading: false });
      await get().fetchLeaves();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateLeaveStatus: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/leaves/${id}/status`, payload);
      set({ isLoading: false });
      await get().fetchLeaves();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));

export default useLeaveStore;
