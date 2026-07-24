import { api } from "./api";

export const adminService = {
  getDashboardStats: () => api.get("admin/analytics/dashboard"),

  getUsers: (params?: {
    page?: number;
    size?: number;
    role?: "SME_OWNER" | "FACTORY_OWNER" | "ENTERPRISE" | "ADMIN";
    isActive?: boolean;
    search?: string;
  }) => api.get("admin/users", { params }),

  getAllUsers: () => api.get("admin/users/all"),

  getActiveUsers: (params?: {
    page?: number;
    size?: number;
    minutes?: number;
  }) => api.get("admin/users/active", { params }),

  getSuspendedUsers: (params?: { page?: number; size?: number }) =>
    api.get("admin/users", { params: { ...params, isActive: false } }),

  getUserDetails: async (userId: string) => {
    const { data } = await api.get("admin/users/all");
    const list = Array.isArray(data) ? data : (data?.content ?? []);
    const found = list.find((u: any) => u.id === userId);
    if (!found) {
      throw new Error("User not found");
    }
    return { data: found };
  },

  suspendUser: (userId: string, reason?: string) =>
    api.post(`admin/users/${userId}/suspend`, null, {
      params: { reason: reason || "Suspended by administrator" },
    }),

  unsuspendUser: (userId: string) => api.put(`admin/users/${userId}/unsuspend`),

  getVerificationQueue: (params?: {
    status?: "PENDING" | "VERIFIED" | "SUSPENDED" | "REJECTED";
    page?: number;
    size?: number;
  }) => api.get("admin/factories/verification-queue", { params }),

  verifyFactory: (factoryId: string, status: string, notes?: string) =>
    api.patch(`admin/factories/${factoryId}/verify`, { status, notes }),

  listDisputes: (params?: { page?: number; size?: number }) =>
    api.get("admin/disputes", { params }),

  resolveDispute: (
    disputeId: string,
    payload: {
      resolution:
        | "OPEN"
        | "UNDER_REVIEW"
        | "RESOLVED_BUYER"
        | "RESOLVED_SELLER"
        | "RESOLVED_SPLIT"
        | "CLOSED";
      adminNotes?: string;
      refundAmountGhs?: number;
    },
  ) => api.patch(`admin/disputes/${disputeId}/resolve`, payload),

  getAllTickets: (params?: {
    status?:
      | "OPEN"
      | "IN_PROGRESS"
      | "WAITING_FOR_USER"
      | "RESOLVED"
      | "CLOSED";
    category?: "PAYMENT" | "ORDER" | "ACCOUNT" | "TECHNICAL" | "OTHER";
    page?: number;
    size?: number;
  }) => api.get("admin/support/tickets", { params }),

  getTicketStats: () => api.get("admin/support/tickets/stats"),

  updateTicketStatus: (
    ticketId: string,
    payload: {
      status:
        | "OPEN"
        | "IN_PROGRESS"
        | "WAITING_FOR_USER"
        | "RESOLVED"
        | "CLOSED";
      adminNotes?: string;
      assignedAdminId?: string;
    },
  ) => api.put(`admin/support/tickets/${ticketId}/status`, payload),
};
