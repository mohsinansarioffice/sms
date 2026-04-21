import { create } from 'zustand';
import axios from '../lib/axios';

const useFeeStore = create((set, get) => ({
  categories: [],
  structures: [],
  studentFees: [],
  currentStudentFee: null,
  payments: [],
  collectionReport: null,
  defaulters: [],
  total: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,

  // ── CATEGORIES ──
  fetchCategories: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get('/fees/categories');
      set({ categories: res.data?.categories || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createCategory: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/fees/categories', data);
      set({ isLoading: false });
      get().fetchCategories();
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  updateCategory: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.put(`/fees/categories/${id}`, data);
      set({ isLoading: false });
      get().fetchCategories();
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  deleteCategory: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/fees/categories/${id}`);
      set({ isLoading: false });
      get().fetchCategories();
      return { success: true };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  // ── STRUCTURES ──
  fetchStructures: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(k => { if (filters[k]) params.append(k, filters[k]); });
      const res = await axios.get(`/fees/structures?${params.toString()}`);
      set({ structures: res.data?.structures || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createStructure: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/fees/structures', data);
      set({ isLoading: false });
      get().fetchStructures();
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  updateStructure: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.put(`/fees/structures/${id}`, data);
      set({ isLoading: false });
      get().fetchStructures();
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  deleteStructure: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/fees/structures/${id}`);
      set({ isLoading: false });
      get().fetchStructures();
      return { success: true };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  // ── STUDENT FEES ──
  assignFees: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/fees/assign', data);
      set({ isLoading: false });
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  fetchStudentFees: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/fees/student/${studentId}`);
      set({ currentStudentFee: res.data ?? null, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAllStudentFees: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(k => { if (filters[k]) params.append(k, filters[k]); });
      const res = await axios.get(`/fees/students?${params.toString()}`);
      const d = res.data || {};
      set({
        studentFees: d.fees || [],
        total: d.total || 0,
        totalPages: d.totalPages || 1,
        currentPage: d.currentPage || 1,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  updateStudentFee: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.put(`/fees/student-fee/${id}`, data);
      set({ isLoading: false });
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  // ── PAYMENTS ──
  recordPayment: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/fees/payments', data);
      set({ isLoading: false });
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  fetchStudentPayments: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/fees/payments/student/${studentId}`);
      set({ payments: res.data?.payments || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPaymentReceipt: async (paymentId) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/fees/payments/${paymentId}/receipt`);
      set({ isLoading: false });
      return { success: true, data: res.data };
    } catch (error) {
      const msg = error.message;
      set({ error: msg, isLoading: false });
      return { success: false, error: msg };
    }
  },

  // ── REPORTS ──
  fetchCollectionReport: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(k => { if (filters[k]) params.append(k, filters[k]); });
      const res = await axios.get(`/fees/reports/collection?${params.toString()}`);
      set({ collectionReport: res.data || null, isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchDefaulters: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get('/fees/reports/defaulters');
      set({ defaulters: res.data?.defaulters || [], isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({
    categories: [], structures: [], studentFees: [],
    currentStudentFee: null, payments: [], collectionReport: null, defaulters: []
  })
}));

export default useFeeStore;
