import { create } from 'zustand';
import axios from '../lib/axios';

const useExamStore = create((set, get) => ({
  examTypes: [],
  exams: [],
  currentExam: null,
  examResults: [],
  studentResults: null,
  examAnalytics: null,
  isLoading: false,
  error: null,

  // ============ EXAM TYPES ============
  
  fetchExamTypes: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get('/exams/types');
      set({
        examTypes: response.data.data?.examTypes || response.data.examTypes || [],
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createExamType: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/exams/types', data);
      set({ isLoading: false });
      get().fetchExamTypes();
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateExamType: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/exams/types/${id}`, data);
      set({ isLoading: false });
      get().fetchExamTypes();
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteExamType: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/exams/types/${id}`);
      set({ isLoading: false });
      get().fetchExamTypes();
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ============ EXAMS ============
  
  fetchExams: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await axios.get(`/exams?${params.toString()}`);
      set({
        exams: response.data.data?.exams || response.data.exams || [],
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchExam: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/exams/${id}`);
      set({
        currentExam: response.data.data?.exam || response.data.exam,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createExam: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/exams', data);
      set({ isLoading: false });
      get().fetchExams();
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateExam: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/exams/${id}`, data);
      set({ isLoading: false });
      get().fetchExams();
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteExam: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/exams/${id}`);
      set({ isLoading: false });
      get().fetchExams();
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  // ============ RESULTS ============
  
  fetchExamResults: async (examId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/exams/${examId}/results`);
      set({
        examResults: response.data.data?.results || response.data.results || [],
        currentExam: response.data.data?.exam || response.data.exam,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  enterMarks: async (examId, results) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post(`/exams/${examId}/results`, { results });
      set({ isLoading: false });
      get().fetchExamResults(examId);
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  fetchStudentResults: async (studentId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/exams/student/${studentId}/results`);
      set({
        studentResults: response.data.data || response.data,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  publishResults: async (examId, isPublished) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/exams/${examId}/publish`, { isPublished });
      set({ isLoading: false });
      return { success: true, data: response.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  fetchExamAnalytics: async (examId) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.get(`/exams/${examId}/analytics`);
      set({
        examAnalytics: response.data.data || response.data,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  clearError: () => set({ error: null }),

  reset: () => set({
    examTypes: [],
    exams: [],
    currentExam: null,
    examResults: [],
    studentResults: null,
    examAnalytics: null
  })
}));

export default useExamStore;
