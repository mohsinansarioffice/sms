import { create } from 'zustand';
import axios from '../lib/axios';

const useEventStore = create((set, get) => ({
  events: [],
  isLoading: false,
  error: null,

  fetchEvents: async (filters = {}) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      Object.keys(filters).forEach((key) => {
        if (filters[key]) params.append(key, filters[key]);
      });
      const response = await axios.get(`/events?${params.toString()}`);
      set({
        events: response?.data?.events || [],
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  createEvent: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.post('/events', payload);
      set({ isLoading: false });
      await get().fetchEvents();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateEvent: async (id, payload) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.put(`/events/${id}`, payload);
      set({ isLoading: false });
      await get().fetchEvents();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteEvent: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const response = await axios.delete(`/events/${id}`);
      set({ isLoading: false });
      await get().fetchEvents();
      return { success: true, data: response };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },
}));

export default useEventStore;
