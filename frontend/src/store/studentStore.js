import { create } from 'zustand';
import axios from '../lib/axios';

const useStudentStore = create((set, get) => ({
  students: [],
  currentStudent: null,
  total: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    class: '',
    section: '',
    status: 'active'
  },

  // Fetch students with pagination and filters
  fetchStudents: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams({ page, limit: 10 });
      if (filters.search) params.append('search', filters.search);
      if (filters.class) params.append('class', filters.class);
      if (filters.section) params.append('section', filters.section);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(`/students?${params}`);

      set({
        students: response.data?.students || response.students || [],
        total: response.data?.total || response.total || 0,
        currentPage: response.data?.currentPage || response.currentPage || page,
        totalPages: response.data?.totalPages || response.totalPages || 1,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false, students: [] });
    }
  },

  // Fetch single student
  fetchStudent: async (id) => {
    set({ isLoading: true, error: null, currentStudent: null });
    try {
      const response = await axios.get(`/students/${id}`);
      set({
        currentStudent: response.data?.student || response.student || response.data || response,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Create student
  createStudent: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/students', data);
      set({ isLoading: false });
      return { success: true, data: response.data || response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Update student
  updateStudent: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/students/${id}`, data);
      set({ isLoading: false });
      return { success: true, data: response.data || response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  promoteStudents: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/students/promote', data);
      set({ isLoading: false });
      return { success: true, data: response.data || response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  importStudentsCsv: async (file) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const response = await axios.post('/students/import', formData);
      const payload = response.data || response;
      return {
        success: true,
        data: payload,
        created: payload?.created,
        failed: payload?.failed,
        errors: payload?.errors,
        errorsTruncated: payload?.errorsTruncated,
      };
    } catch (error) {
      const data = error.response?.data;
      const msg = data?.message || error.message || 'Import failed';
      return {
        success: false,
        error: msg,
        featureLocked: !!data?.featureLocked,
      };
    }
  },

  createParentAccount: async (data) => {
    set({ error: null });
    try {
      const response = await axios.post('/auth/create-parent', data);
      return {
        success: true,
        message: response.message,
        data: response.data || response,
      };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  checkEmailAvailability: async (email) => {
    try {
      const response = await axios.get(`/auth/check-email?email=${encodeURIComponent(email)}`);
      const payload = response?.data || response || {};
      return {
        success: true,
        available: payload?.available ?? false,
        canRelink: payload?.canRelink ?? false,
        canLinkExistingActiveParent: payload?.canLinkExistingActiveParent ?? false,
        existingUser: payload?.existingUser || null,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  resetParentPassword: async (studentId, newPassword) => {
    set({ error: null });
    try {
      const response = await axios.put(`/auth/parents/${studentId}/password`, { newPassword });
      return { success: true, data: response.data || response };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  unlinkParentAccount: async (studentId) => {
    set({ error: null });
    try {
      const response = await axios.delete(`/auth/parents/${studentId}`);
      return {
        success: true,
        message: response.message,
        data: response.data || response,
      };
    } catch (error) {
      set({ error: error.message });
      return { success: false, error: error.message };
    }
  },

  // Delete student (soft delete)
  deleteStudent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/students/${id}`);
      set({ isLoading: false });
      get().fetchStudents(get().currentPage);
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Set filters and reset to page 1
  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
    get().fetchStudents(1);
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store state
  reset: () => set({
    students: [],
    currentStudent: null,
    total: 0,
    currentPage: 1,
    totalPages: 1,
    filters: { search: '', class: '', section: '', status: 'active' }
  })
}));

export default useStudentStore;
