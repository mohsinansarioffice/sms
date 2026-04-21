import { create } from 'zustand';
import axios from '../lib/axios';

const SELECTED_STUDENT_KEY = 'parentPortal.selectedStudentId';

const useParentStore = create((set, get) => ({
  children: [],
  dashboard: null,
  selectedStudentId: null,
  isLoading: false,
  error: null,

  setSelectedStudentId: (studentId) => {
    if (studentId) {
      try {
        localStorage.setItem(SELECTED_STUDENT_KEY, studentId);
      } catch {
        /* ignore */
      }
    }
    set({ selectedStudentId: studentId });
  },

  fetchChildren: async () => {
    set({ error: null });
    try {
      const response = await axios.get('/parent/children');
      const students = response?.data?.students || response?.students || [];
      set({ children: students });
      return students;
    } catch (error) {
      set({ error: error.message, children: [] });
      return [];
    }
  },

  fetchDashboard: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const q = studentId ? `?studentId=${encodeURIComponent(studentId)}` : '';
      const response = await axios.get(`/parent/dashboard${q}`);
      set({
        dashboard: response?.data || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        dashboard: null,
      });
    }
  },

  /** Load children, restore or pick default student, then load dashboard. */
  initParentPortal: async () => {
    set({ isLoading: true, error: null, dashboard: null });
    try {
      const response = await axios.get('/parent/children');
      const students = response?.data?.students || response?.students || [];
      set({ children: students });

      let stored = null;
      try {
        stored = localStorage.getItem(SELECTED_STUDENT_KEY);
      } catch {
        stored = null;
      }

      let studentId = null;
      if (students.length === 0) {
        set({ selectedStudentId: null, isLoading: false });
        return;
      }
      if (students.length === 1) {
        studentId = students[0]._id;
      } else if (stored && students.some((s) => String(s._id) === String(stored))) {
        studentId = stored;
      } else {
        studentId = students[0]._id;
      }

      try {
        localStorage.setItem(SELECTED_STUDENT_KEY, studentId);
      } catch {
        /* ignore */
      }
      set({ selectedStudentId: studentId });

      const dashRes = await axios.get(
        `/parent/dashboard?studentId=${encodeURIComponent(studentId)}`,
      );
      set({
        dashboard: dashRes?.data || null,
        isLoading: false,
      });
    } catch (error) {
      set({
        error: error.message,
        isLoading: false,
        dashboard: null,
      });
    }
  },

  selectChildAndRefresh: async (studentId) => {
    const { setSelectedStudentId, fetchDashboard } = get();
    setSelectedStudentId(studentId);
    await fetchDashboard(studentId);
  },
}));

export default useParentStore;
