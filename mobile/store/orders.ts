/**
 * orders.ts — Zustand store for active orders with MMKV offline persistence.
 *
 * Both the Manufacturer Orders tab and the SME Jobs screen write their
 * fetched order data here so it survives app restarts and network loss.
 *
 * Design decisions:
 *  - Raw API shapes are stored (not the UI-transformed shapes) so the
 *    transformation helpers in each screen can still run on cached data.
 *  - `lastSyncedAt` lets screens show a "Last updated X ago" badge when
 *    the device is offline.
 *  - `isStale` becomes true when a network fetch fails, so screens can
 *    show an offline banner without hiding the cached list.
 */

import { mmkvStorage } from "@/store/mmkv";
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

// ─── Manufacturer order (matches ApiOrder in orders.tsx) ─────────────────────

export interface CachedApiOrder {
  id: string;
  jobId: string;
  bidId: string;
  smeId: string;
  factoryId: string;
  factoryName: string;
  smeName: string;
  agreedAmountGhs: number;
  platformFeeGhs: number;
  factoryPayoutGhs: number;
  status:
    | "PAYMENT_PENDING"
    | "IN_ESCROW"
    | "IN_PRODUCTION"
    | "QUALITY_CHECK"
    | "DELIVERED"
    | "COMPLETED"
    | "DISPUTED"
    | "REFUNDED"
    | "CANCELLED";
  qualityCheckDeadline?: string;
  deliveredAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  overallRating?: number | null;
}

// ─── SME order (subset used in jobs.tsx) ─────────────────────────────────────

export interface CachedSmeOrder {
  id: string;
  jobId: string;
  factoryName?: string;
  agreedAmountGhs?: number;
  status: string;
  updatedAt: string;
}

// ─── Store shape ─────────────────────────────────────────────────────────────

interface OrdersState {
  /** Active + completed orders for the Manufacturer role. */
  manufacturerOrders: CachedApiOrder[];
  /** Orders embedded in the SME jobs screen. */
  smeOrders: CachedSmeOrder[];
  /** ISO string of when we last successfully synced from the server. */
  lastSyncedAt: string | null;
  /** True when the most recent network fetch failed (device is offline). */
  isStale: boolean;

  // Actions
  setManufacturerOrders: (orders: CachedApiOrder[]) => void;
  setSmeOrders: (orders: CachedSmeOrder[]) => void;
  markStale: () => void;
  clearOrders: () => void;
}

// ─── Store ───────────────────────────────────────────────────────────────────

export const useOrdersStore = create<OrdersState>()(
  persist(
    (set) => ({
      manufacturerOrders: [],
      smeOrders: [],
      lastSyncedAt: null,
      isStale: false,

      setManufacturerOrders: (orders) =>
        set({
          manufacturerOrders: orders,
          lastSyncedAt: new Date().toISOString(),
          isStale: false,
        }),

      setSmeOrders: (orders) =>
        set({
          smeOrders: orders,
          lastSyncedAt: new Date().toISOString(),
          isStale: false,
        }),

      markStale: () => set({ isStale: true }),

      clearOrders: () =>
        set({
          manufacturerOrders: [],
          smeOrders: [],
          lastSyncedAt: null,
          isStale: false,
        }),
    }),
    {
      name: "orders-cache",
      storage: createJSONStorage(() => mmkvStorage),
      // Persist everything — the cache is the whole point.
      // MMKV handles large payloads efficiently so no need to strip fields.
    },
  ),
);
