import { create } from 'zustand';
import axios from '../lib/axios';

const useAttendanceStore = create((set, get) => ({
  attendanceRecords: [],
  currentAttendance: null,
  studentAttendance: null,
  report: null,
  isLoading: false,
  error: null,

  // Mark attendance for a class
  markAttendance: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/attendance', data);
      set({ isLoading: false });
      return { success: true, data: response };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Get attendance by filters
  fetchAttendance: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/attendance?${params}`);
      
      set({
        attendanceRecords: response?.data?.attendance || [],
        isLoading: false
      });
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({ 
        error: message, 
        isLoading: false,
        attendanceRecords: []
      });
    }
  },

  // Update attendance
  updateAttendance: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/attendance/${id}`, data);
      set({ isLoading: false });
      return { success: true, data: response };
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // Get student attendance history
  fetchStudentAttendance: async (studentId, filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams(filters);
      const response = await axios.get(`/attendance/student/${studentId}?${params}`);
      
      set({
        studentAttendance: response?.data || null,
        isLoading: false
      });
    } catch (error) {
      const message = error.response?.data?.message || error.message;
      set({ 
        error: message, 
        isLoading: false,
        studentAttendance: null
      });
    }
  },

  // Get attendance report
  fetchReport: async (filters) => {
    set({ isLoading: true, error: null });
    try {
      // Create a URLSearchParams object but handle object parameters manually
      const params = new URLSearchParams();
      // Add all key-values from filters to params
      Object.keys(filters).forEach(key => {
          if (filters[key]) {
             params.append(key, filters[key]);
          }
      });
      const response = await axios.get(`/attendance/report?${params}`);
      
      set({
        report: response?.data || null,
        isLoading: false
      });
    } catch (error) {
      set({ 
        error: error.message, 
        isLoading: false,
        report: null
      });
    }
  },

  // Delete attendance
  deleteAttendance: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/attendance/${id}`);
      set({ isLoading: false });
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    attendanceRecords: [],
    currentAttendance: null,
    studentAttendance: null,
    report: null
  })
}));

export default useAttendanceStore;
