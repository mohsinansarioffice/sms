import { create } from "zustand";
import axios from "../lib/axios";

const unwrap = (res) => res?.data?.data ?? res?.data ?? res;

const useSuperAdminStore = create((set, get) => ({
  overview: null,
  paymentAlerts: null,
  schools: [],
  total: 0,
  currentPage: 1,
  totalPages: 1,
  search: "",
  schoolDetail: null,
  isLoading: false,
  error: null,

  clearError: () => set({ error: null }),

  fetchOverview: async () => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get("/superadmin/overview");
      set({ overview: unwrap(res), isLoading: false });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchPaymentAlerts: async () => {
    try {
      const res = await axios.get("/superadmin/payment-alerts");
      const d = unwrap(res);
      set({
        paymentAlerts: {
          dueOrOverdue: d.dueOrOverdue || [],
          awaitingPayment: d.awaitingPayment || [],
        },
      });
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  /**
   * @param {string} search - server-side name filter
   * @param {{ limit?: number }} [opts] - page size per request; fetches all pages for the table
   */
  fetchSchools: async (search = "", opts = {}) => {
    const limit = opts.limit ?? 2000;
    set({ isLoading: true, error: null, search });
    try {
      let page = 1;
      const all = [];
      let total = 0;
      let totalPages = 1;
      while (page <= totalPages) {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });
        if (search && search.trim()) params.set("search", search.trim());
        const res = await axios.get(`/superadmin/schools?${params.toString()}`);
        const d = unwrap(res);
        const batch = d.schools || [];
        all.push(...batch);
        total = d.total ?? all.length;
        totalPages = d.totalPages || 1;
        page += 1;
        if (batch.length === 0) break;
      }
      set({
        schools: all,
        total,
        currentPage: 1,
        totalPages: 1,
        isLoading: false,
      });
    } catch (error) {
      set({ error: error.message, isLoading: false });
    }
  },

  fetchSchool: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const res = await axios.get(`/superadmin/schools/${id}`);
      set({ schoolDetail: unwrap(res), isLoading: false });
    } catch (error) {
      set({ schoolDetail: null, error: error.message, isLoading: false });
    }
  },

  updateSchoolPlan: async (id, payload) => {
    try {
      const body =
        typeof payload === "string"
          ? { newPlan: payload }
          : {
              newPlan: payload.newPlan,
              paymentDueDate: payload.paymentDueDate,
            };
      await axios.patch(`/superadmin/schools/${id}/plan`, body);
      await get().fetchSchool(id);
      await get().fetchSchools(get().search);
      await get().fetchPaymentAlerts();
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateSchoolFeature: async (id, payload) => {
    try {
      await axios.patch(`/superadmin/schools/${id}/features`, payload);
      await get().fetchSchool(id);
      await get().fetchSchools(get().search);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  updateSchoolActive: async (id, isActive) => {
    try {
      await axios.patch(`/superadmin/schools/${id}/active`, { isActive });
      await get().fetchSchools(get().search);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  resetSchoolAdminPassword: async (schoolId, newPassword) => {
    try {
      const res = await axios.post(
        `/superadmin/schools/${schoolId}/admin/reset-password`,
        newPassword != null && String(newPassword).trim() !== ""
          ? { newPassword: String(newPassword) }
          : {},
      );
      const d = unwrap(res);
      return {
        success: true,
        userId: d.userId,
        email: d.email,
        newPassword: d.newPassword,
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },

  createSuperAdmin: async (payload) => {
    try {
      await axios.post("/superadmin/admins", payload);
      return { success: true };
    } catch (error) {
      return { success: false, error: error.message };
    }
  },
}));

export default useSuperAdminStore;
