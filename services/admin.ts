import { api } from "./api";

/**
 * Service for Admin-only API operations.
 * Centralizing these helps manage endpoints and authorization.
 */
export const adminService = {
  // Dashboard & Overview
  getDashboard: () => api.get("/admin/dashboard"),
  getActivities: () => api.get("/admin/activities"),

  // User Management
  getUsers: () => api.get("/admin/users"),
  getUserDetails: (userId: string) => api.get(`/admin/users/${userId}`),

  // Factory Verification
  getVerificationQueue: () => api.get("/admin/factories/verification-queue"),
  verifyFactory: (factoryId: string, status: string, notes?: string) =>
    api.patch(`/admin/factories/${factoryId}/verify`, {
      status,
      approved: status === "VERIFIED",
      notes,
    }),

  // Jobs & Reports
  getJobs: () => api.get("/admin/jobs"),
  getReports: () => api.get("/admin/reports"),
};
