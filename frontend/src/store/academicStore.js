import { create } from 'zustand';
import axios from '../lib/axios';

const useAcademicStore = create((set, get) => ({
  academicYears: [],
  classes: [],
  sections: [],
  subjects: [],
  isLoading: false,
  isFetching: false,
  error: null,

  // ============ ACADEMIC YEARS ============

  fetchAcademicYears: async () => {
    set({ isFetching: true, error: null });
    try {
      const response = await axios.get('/academic/years');
      set({ academicYears: response?.data?.years || [], isFetching: false });
    } catch (error) {
      set({ error: error.message, isFetching: false });
    }
  },

  createAcademicYear: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/academic/years', data);
      set({ isLoading: false });
      get().fetchAcademicYears();
      return { success: true, data: response };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateAcademicYear: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/academic/years/${id}`, data);
      set({ isLoading: false });
      get().fetchAcademicYears();
      return { success: true, data: response };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteAcademicYear: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`/academic/years/${id}`);
      set({ isLoading: false });
      get().fetchAcademicYears();
      return { success: true, data: response };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // ============ CLASSES ============

  fetchClasses: async () => {
    set({ isFetching: true, error: null });
    try {
      const response = await axios.get('/academic/classes');
      set({ classes: response?.data?.classes || [], isFetching: false });
    } catch (error) {
      set({ error: error.message, isFetching: false });
    }
  },

  createClass: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/academic/classes', data);
      set({ isLoading: false });
      get().fetchClasses();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateClass: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/academic/classes/${id}`, data);
      set({ isLoading: false });
      get().fetchClasses();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteClass: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`/academic/classes/${id}`);
      set({ isLoading: false });
      get().fetchClasses();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // ============ SECTIONS ============

  fetchSections: async (classId = null) => {
    set({ isFetching: true, error: null });
    try {
      const url = classId ? `/academic/sections?classId=${classId}` : '/academic/sections';
      const response = await axios.get(url);
      set({ sections: response?.data?.sections || [], isFetching: false });
    } catch (error) {
      set({ error: error.message, isFetching: false });
    }
  },

  createSection: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/academic/sections', data);
      set({ isLoading: false });
      get().fetchSections();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateSection: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/academic/sections/${id}`, data);
      set({ isLoading: false });
      get().fetchSections();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteSection: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`/academic/sections/${id}`);
      set({ isLoading: false });
      get().fetchSections();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  // ============ SUBJECTS ============

  fetchSubjects: async () => {
    set({ isFetching: true, error: null });
    try {
      const response = await axios.get('/academic/subjects');
      set({ subjects: response?.data?.subjects || [], isFetching: false });
    } catch (error) {
      set({ error: error.message, isFetching: false });
    }
  },

  createSubject: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/academic/subjects', data);
      set({ isLoading: false });
      get().fetchSubjects();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  updateSubject: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/academic/subjects/${id}`, data);
      set({ isLoading: false });
      get().fetchSubjects();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  deleteSubject: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`/academic/subjects/${id}`);
      set({ isLoading: false });
      get().fetchSubjects();
      return { success: true, data: response.data };
    } catch (error) {
      const message = error.message;
      set({ error: message, isLoading: false });
      return { success: false, error: message };
    }
  },

  clearError: () => set({ error: null }),
  reset: () => set({ academicYears: [], classes: [], sections: [], subjects: [] })
}));

export default useAcademicStore;
