import { create } from 'zustand';
import axios from '../lib/axios';

const useDiaryStore = create((set, get) => ({
  entries: [],
  currentEntry: null,
  classEntries: [],
  classGrouped: { homework: [], classwork: [], notice: [], remark: [] },
  total: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,

  fetchEntries: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
      const res = await axios.get(`/diary?${query.toString()}`);
      const d = res?.data?.data ?? res?.data ?? res ?? {};
      set({
        entries: d.entries || [],
        total: d.total ?? 0,
        currentPage: d.currentPage || 1,
        totalPages: d.totalPages || 1,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchClassDiary: async (params = {}) => {
    set({ isLoading: true, error: null });
    try {
      const query = new URLSearchParams();
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') query.set(k, String(v));
      });
      const res = await axios.get(`/diary/class?${query.toString()}`);
      const d = res?.data?.data ?? res?.data ?? res ?? {};
      set({
        classEntries: d.entries || [],
        classGrouped: d.grouped || { homework: [], classwork: [], notice: [], remark: [] },
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/diary/${id}`);
      const inner = res?.data?.data ?? res?.data ?? res ?? {};
      set({ currentEntry: inner.entry || null, isLoading: false });
    } catch (error) {
      set({ currentEntry: null, error: error.message, isLoading: false });
    }
  },

  createEntry: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/diary', data);
      set({ isLoading: false });
      return { success: true, data: res.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateEntry: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.put(`/diary/${id}`, data);
      set({ isLoading: false });
      return { success: true, data: res.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/diary/${id}`);
      set({
        entries: get().entries.filter((e) => String(e._id) !== String(id)),
        isLoading: false
      });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      entries: [],
      currentEntry: null,
      classEntries: [],
      classGrouped: { homework: [], classwork: [], notice: [], remark: [] },
      total: 0,
      currentPage: 1,
      totalPages: 1
    })
}));

export default useDiaryStore;
