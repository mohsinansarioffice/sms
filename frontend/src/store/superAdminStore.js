import { create } from 'zustand';
import axios from '../lib/axios';

const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

const useSuperAdminStore = create((set, get) => ({
  overview: null,
  paymentAlerts: null,
  schools: [],
  total: 0,
  currentPage: 1,
  totalPages: 1,
  search: '',
  schoolDetail: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get('/superadmin/overview');
      set({ overview: unwrap(res), isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPaymentAlerts: async () => {
    try {
      const res = await axios.get('/superadmin/payment-alerts');
      const d = unwrap(res);
      set({
        paymentAlerts: {
          dueOrOverdue: d.dueOrOverdue || [],
          awaitingPayment: d.awaitingPayment || [],
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  fetchSchools: async (page = 1, search = '') => {
    set({ isLoading: true, error: null, search });
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (search && search.trim()) params.set('search', search.trim());
      const res = await axios.get(`/superadmin/schools?${params.toString()}`);
      const d = unwrap(res);
      set({
        schools: d.schools || [],
        total: d.total ?? 0,
        currentPage: d.currentPage || page,
        totalPages: d.totalPages || 1,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchSchool: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/superadmin/schools/${id}`);
      set({ schoolDetail: unwrap(res), isLoading: false });
    } catch (error) {
      set({ schoolDetail: null, error: error.message, isLoading: false });
    }
  },

  updateSchoolPlan: async (id, payload) => {
    try {
      const body =
        typeof payload === 'string'
          ? { newPlan: payload }
          : { newPlan: payload.newPlan, paymentDueDate: payload.paymentDueDate };
      await axios.patch(`/superadmin/schools/${id}/plan`, body);
      await get().fetchSchool(id);
      await get().fetchSchools(get().currentPage, get().search);
      await get().fetchPaymentAlerts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateSchoolFeature: async (id, payload) => {
    try {
      await axios.patch(`/superadmin/schools/${id}/features`, payload);
      await get().fetchSchool(id);
      await get().fetchSchools(get().currentPage, get().search);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateSchoolActive: async (id, isActive) => {
    try {
      await axios.patch(`/superadmin/schools/${id}/active`, { isActive });
      await get().fetchSchools(get().currentPage, get().search);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createSuperAdmin: async (payload) => {
    try {
      await axios.post('/superadmin/admins', payload);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }
}));

export default useSuperAdminStore;
