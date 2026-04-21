import { create } from 'zustand';
import axios from '../lib/axios';

const useCommunicationStore = create((set, get) => ({
  announcements: [],
  currentAnnouncement: null,
  announcementReaders: [],
  messages: [],
  currentMessage: null,
  users: [],
  unreadAnnouncementsCount: 0,
  unreadMessagesCount: 0,
  total: 0,
  currentPage: 1,
  totalPages: 1,
  messagesListType: 'inbox',
  isLoading: false,
  error: null,

  fetchAnnouncements: async (page = 1, limit = 20, search = '') => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (search && search.trim()) params.set('search', search.trim());
      const res = await axios.get(`/communication/announcements?${params.toString()}`);
      const d = res.data || {};
      set({
        announcements: d.announcements || [],
        total: d.total ?? 0,
        currentPage: d.currentPage || page,
        totalPages: d.totalPages || 1,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchAnnouncement: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/communication/announcements/${id}`);
      set({
        currentAnnouncement: res.data?.announcement || null,
        isLoading: false
      });
    } catch (error) {
      set({ currentAnnouncement: null, error: error.message, isLoading: false });
    }
  },

  fetchAnnouncementReaders: async (id) => {
    try {
      const res = await axios.get(`/communication/announcements/${id}/readers`);
      set({ announcementReaders: res.data?.readers || [] });
    } catch (error) {
      console.error('Fetch readers error:', error);
      set({ announcementReaders: [] });
    }
  },

  createAnnouncement: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/communication/announcements', data);
      set({ isLoading: false });
      get().fetchAnnouncements(1, 20, '');
      return { success: true, data: res.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  updateAnnouncement: async (id, data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.put(`/communication/announcements/${id}`, data);
      set({ isLoading: false });
      get().fetchAnnouncements(get().currentPage, 20, '');
      return { success: true, data: res.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteAnnouncement: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/communication/announcements/${id}`);
      set({ isLoading: false });
      get().fetchAnnouncements(get().currentPage, 20, '');
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  markAnnouncementRead: async (id) => {
    try {
      await axios.post(`/communication/announcements/${id}/read`);
      const announcements = get().announcements.map((a) =>
        String(a._id) === String(id)
          ? { ...a, isRead: true, readAt: new Date().toISOString() }
          : a
      );
      set({ announcements });
      const cur = get().currentAnnouncement;
      if (cur && String(cur._id) === String(id)) {
        set({
          currentAnnouncement: { ...cur, isRead: true, readAt: new Date().toISOString() }
        });
      }
      get().fetchUnreadAnnouncementsCount();
    } catch (error) {
      console.error('Mark read error:', error);
    }
  },

  fetchUnreadAnnouncementsCount: async () => {
    try {
      const res = await axios.get('/communication/announcements/unread/count');
      set({ unreadAnnouncementsCount: res.data?.unreadCount ?? 0 });
    } catch (error) {
      console.error('Fetch unread count error:', error);
    }
  },

  fetchMessages: async (type = 'inbox', page = 1, limit = 20) => {
    set({ isLoading: true, error: null, messagesListType: type });
    try {
      const res = await axios.get(
        `/communication/messages?type=${encodeURIComponent(type)}&page=${String(page)}&limit=${String(limit)}`
      );
      const d = res.data || {};
      set({
        messages: d.messages || [],
        total: d.total ?? 0,
        currentPage: d.currentPage || page,
        totalPages: d.totalPages || 1,
        isLoading: false
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchMessage: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/communication/messages/${id}`);
      set({
        currentMessage: res.data?.message || null,
        isLoading: false
      });
      get().fetchUnreadMessagesCount();
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  sendMessage: async (data) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.post('/communication/messages', data);
      set({ isLoading: false });
      get().fetchUnreadMessagesCount();
      return { success: true, data: res.data };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  deleteMessage: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await axios.delete(`/communication/messages/${id}`);
      set({ isLoading: false });
      const t = get().messagesListType || 'inbox';
      get().fetchMessages(t, get().currentPage);
      return { success: true };
    } catch (error) {
      set({ error: error.message, isLoading: false });
      return { success: false, error: error.message };
    }
  },

  fetchUnreadMessagesCount: async () => {
    try {
      const res = await axios.get('/communication/messages/unread/count');
      set({ unreadMessagesCount: res.data?.unreadCount ?? 0 });
    } catch (error) {
      console.error('Fetch unread messages count error:', error);
    }
  },

  fetchUsers: async () => {
    try {
      const res = await axios.get('/communication/users');
      set({ users: res.data?.users || [] });
    } catch (error) {
      console.error('Fetch users error:', error);
    }
  },

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      announcements: [],
      currentAnnouncement: null,
      announcementReaders: [],
      messages: [],
      currentMessage: null,
      users: [],
      unreadAnnouncementsCount: 0,
      unreadMessagesCount: 0,
      messagesListType: 'inbox'
    })
}));

export default useCommunicationStore;
