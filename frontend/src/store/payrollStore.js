import { create } from 'zustand';
import axios from '../lib/axios';

const usePayrollStore = create((set, get) => ({
  records: [],
  totalPaid: 0,
  salarySlip: null,
  isLoading: false,
  error: null,

  fetchPayroll: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await axios.get(`/payroll?${params.toString()}`);
      set({
        records: response?.data?.records || [],
        totalPaid: response?.data?.totalPaid || 0,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createPayroll: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/payroll', payload);
      set({ isLoading: false });
      await get().fetchPayroll();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  fetchSalarySlip: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/payroll/${id}/slip`);
      set({
        salarySlip: response?.data?.slip || null,
        isLoading: false,
      });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));

export default usePayrollStore;
