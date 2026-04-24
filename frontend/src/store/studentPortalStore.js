import { create } from 'zustand';
import axios from '../lib/axios';

const useStudentPortalStore = create((set) => ({
  dashboard: null,
  isLoading: false,
  error: null,

  initStudentPortal: async () => {
    set({ isLoading: true, error: null, dashboard: null });
    try {
      const response = await axios.get('/students/portal/dashboard');
      set({
        dashboard: response?.data || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        dashboard: null,
        isLoading: false,
        error: error.message,
      });
    }
  },
}));

export default useStudentPortalStore;
