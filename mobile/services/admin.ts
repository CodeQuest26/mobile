import { api } from "./api";

/**
 * Service for Admin-only API operations.
 * Centralizing these helps manage endpoints and authorization.
 */
export const adminService = {
  // Dashboard & Overview
  getDashboard: () => api.get("admin/dashboard"),
  getActivities: () => api.get("admin/activities"),

  // User Management
  getUsers: (params?: { page?: number; size?: number; status?: string }) =>
    api.get("admin/users", { params }),
  getAllUsers: (params?: { page?: number; size?: number }) =>
    api.get("admin/users/all", { params }),
  getActiveUsers: (params?: { page?: number; size?: number }) =>
    api.get("admin/users/active", { params }),
  getSuspendedUsers: (params?: { page?: number; size?: number }) =>
    api.get("admin/users/suspended", { params }),
  getUserDetails: (userId: string) => api.get(`admin/users/${userId}`),

  // User Actions (Endpoints: /api/v1/admin/users/{id}/suspend and /api/v1/admin/users/{id}/unsuspend)
  suspendUser: async (userId: string, reason?: string) => {
    const reasonText = reason || "Suspended by administrator";
    const requests = [
      () => api.put(`admin/users/${userId}/suspend`),
      () => api.post(`admin/users/${userId}/suspend`),
      () => api.patch(`admin/users/${userId}/suspend`),
      () => api.put(`admin/users/${userId}/suspend`, {}),
      () => api.post(`admin/users/${userId}/suspend`, {}),
      () => api.patch(`admin/users/${userId}/suspend`, {}),
      () => api.put(`admin/users/${userId}/suspend`, { reason: reasonText }),
      () => api.post(`admin/users/${userId}/suspend`, { reason: reasonText }),
      () => api.patch(`admin/users/${userId}/suspend`, { reason: reasonText }),
      () =>
        api.put(`admin/users/${userId}/suspend`, null, {
          params: { reason: reasonText },
        }),
      () =>
        api.post(`admin/users/${userId}/suspend`, null, {
          params: { reason: reasonText },
        }),
      () =>
        api.patch(`admin/users/${userId}/status`, {
          status: "SUSPENDED",
          enabled: false,
        }),
      () =>
        api.put(`admin/users/${userId}/status`, {
          status: "SUSPENDED",
          enabled: false,
        }),
    ];

    let lastError: any = null;
    for (const req of requests) {
      try {
        return await req();
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        if (status && [400, 404, 405, 415, 422, 500].includes(status)) {
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  },

  unsuspendUser: async (userId: string) => {
    const requests = [
      () => api.put(`admin/users/${userId}/unsuspend`),
      () => api.post(`admin/users/${userId}/unsuspend`),
      () => api.patch(`admin/users/${userId}/unsuspend`),
      () => api.put(`admin/users/${userId}/unsuspend`, {}),
      () => api.post(`admin/users/${userId}/unsuspend`, {}),
      () => api.patch(`admin/users/${userId}/unsuspend`, {}),
      () =>
        api.patch(`admin/users/${userId}/status`, {
          status: "ACTIVE",
          enabled: true,
        }),
      () =>
        api.put(`admin/users/${userId}/status`, {
          status: "ACTIVE",
          enabled: true,
        }),
    ];

    let lastError: any = null;
    for (const req of requests) {
      try {
        return await req();
      } catch (err: any) {
        lastError = err;
        const status = err?.response?.status;
        if (status && [400, 404, 405, 415, 422, 500].includes(status)) {
          continue;
        }
        throw err;
      }
    }
    throw lastError;
  },

  // Factory Verification
  getVerificationQueue: () => api.get("admin/factories/verification-queue"),
  verifyFactory: (factoryId: string, status: string, notes?: string) =>
    api.patch(`admin/factories/${factoryId}/verify`, {
      status,
      approved: status === "VERIFIED",
      notes,
    }),

  // Jobs & Reports
  getJobs: () => api.get("admin/jobs"),
  getReports: () => api.get("admin/reports"),
};
