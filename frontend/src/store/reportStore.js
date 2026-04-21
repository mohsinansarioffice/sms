import { create } from 'zustand';
import axios from '../lib/axios';

const useReportStore = create((set) => ({
  reportCard: null,
  isLoading: false,
  error: null,

  fetchReportCard: async ({ studentId, academicYearId, examTypeId }) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({ studentId, academicYearId });
      if (examTypeId) params.append('examTypeId', examTypeId);
      const response = await axios.get(`/reports/report-card?${params.toString()}`);
      set({
        reportCard: response?.data?.reportCard || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        reportCard: null,
      });
    }
  },

  clear: () => set({ reportCard: null, error: null }),
}));

export default useReportStore;
