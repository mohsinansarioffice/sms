import { create } from 'zustand';
import axios from '../lib/axios';

const useTeacherStore = create((set, get) => ({
  teachers: [],
  currentTeacher: null,
  total: 0,
  currentPage: 1,
  totalPages: 1,
  isLoading: false,
  error: null,
  filters: {
    search: '',
    department: '',
    status: 'active',
  },

  // Fetch teachers with pagination and filters
  fetchTeachers: async (page = 1) => {
    set({ isLoading: true, error: null });
    try {
      const { filters } = get();
      const params = new URLSearchParams({ page, limit: 10 });
      if (filters.search) params.append('search', filters.search);
      if (filters.department) params.append('department', filters.department);
      if (filters.status) params.append('status', filters.status);

      const response = await axios.get(`/teachers?${params}`);

      set({
        teachers: response.data?.teachers || response.teachers || [],
        total: response.data?.total || response.total || 0,
        currentPage: response.data?.currentPage || response.currentPage || page,
        totalPages: response.data?.totalPages || response.totalPages || 1,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false, teachers: [] });
    }
  },

  // Fetch single teacher
  fetchTeacher: async (id) => {
    set({ isLoading: true, error: null, currentTeacher: null });
    try {
      const response = await axios.get(`/teachers/${id}`);
      set({
        currentTeacher: response.data?.teacher || response.teacher || response.data || response,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  // Create teacher
  createTeacher: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/teachers', data);
      set({ isLoading: false });
      return { success: true, data: response.data || response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Update teacher
  updateTeacher: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/teachers/${id}`, data);
      set({ isLoading: false });
      return { success: true, data: response.data || response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Delete teacher (soft delete)
  deleteTeacher: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/teachers/${id}`);
      set({ isLoading: false });
      get().fetchTeachers(get().currentPage);
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // Set filters and reset to page 1
  setFilters: (newFilters) => {
    set({ filters: { ...get().filters, ...newFilters } });
    get().fetchTeachers(1);
  },

  // Clear error
  clearError: () => set({ error: null }),

  // Reset store state
  reset: () =>
    set({
      teachers: [],
      currentTeacher: null,
      total: 0,
      currentPage: 1,
      totalPages: 1,
      filters: { search: '', department: '', status: 'active' },
    }),
}));

export default useTeacherStore;
