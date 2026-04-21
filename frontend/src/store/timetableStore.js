import { create } from 'zustand';
import axios from '../lib/axios';

const useTimetableStore = create((set, get) => ({
  timeSlots: [],
  timetable: [],
  teacherTimetable: [],
  isLoading: false,
  isFetching: false,
  error: null,

  // ============ TIME SLOTS ============
  fetchTimeSlots: async () => {
    set({ isFetching: true, error: null });
    try {
      const response = await axios.get('/timetable/slots');
      set({
        timeSlots: response?.data?.slots || [],
        isFetching: false,
      });
    } catch (error) {
      set({ error: error.message, isFetching: false });
    }
  },

  createTimeSlot: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/timetable/slots', data);
      set({ isLoading: false });
      await get().fetchTimeSlots();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateTimeSlot: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/timetable/slots/${id}`, data);
      set({ isLoading: false });
      await get().fetchTimeSlots();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteTimeSlot: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`/timetable/slots/${id}`);
      set({ isLoading: false });
      await get().fetchTimeSlots();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ============ TIMETABLE ============
  fetchTimetable: async (classId, sectionId, academicYearId) => {
    if (!classId || !academicYearId) return;
    set({ isFetching: true, error: null });
    try {
      const params = new URLSearchParams({ classId, academicYearId });
      if (sectionId) params.append('sectionId', sectionId);

      const response = await axios.get(`/timetable?${params.toString()}`);
      set({
        timetable: response?.data?.timetable || [],
        isFetching: false,
      });
    } catch (error) {
      set({ error: error.message, isFetching: false });
    }
  },

  fetchTeacherTimetable: async (teacherId, academicYearId) => {
    if (!teacherId || !academicYearId) return;
    set({ isFetching: true, error: null });
    try {
      const response = await axios.get(`/timetable/teacher/${teacherId}?academicYearId=${academicYearId}`);
      set({
        teacherTimetable: response?.data?.timetable || [],
        isFetching: false,
      });
    } catch (error) {
      set({ error: error.message, isFetching: false });
    }
  },

  saveTimetableEntry: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/timetable', data);
      set({ isLoading: false });
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteTimetableEntry: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`/timetable/${id}`);
      set({ isLoading: false });
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  bulkCopyTimetable: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/timetable/bulk-copy', data);
      set({ isLoading: false });
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null }),
  reset: () =>
    set({
      timeSlots: [],
      timetable: [],
      teacherTimetable: [],
      error: null,
      isLoading: false,
      isFetching: false,
    }),
}));

export default useTimetableStore;
