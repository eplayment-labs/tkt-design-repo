"use client";

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { fanOrders, fanTickets, initialFollowing, promoCodes as seedPromos } from "@/mocks/people";
import { hosts } from "@/mocks/hosts";
import type { Host, Order, PaymentMethod, PromoCode, Ticket, TktEvent } from "@/mocks/types";

export type Role = "fan" | "host";

export type Hold = {
  id: string;
  eventId: string;
  items: { tierId: string; qty: number }[];
  promo?: string;
  expiresAt: number;
};

export type QueuedCheckIn = { eventId: string; attendeeId: string; at: string };

type State = {
  signedIn: boolean;
  role: Role;
  following: string[];
  tickets: Ticket[];
  orders: Order[];
  holds: Hold[];
  /** Codes entered on ticket select, uppercased. */
  unlocked: string[];
  waitlist: string[];

  hostId: string;
  hostProfile: Partial<Host>;
  onboarded: boolean;
  drafts: TktEvent[];
  checkIns: Record<string, Record<string, string>>;
  syncQueue: QueuedCheckIn[];
  promos: PromoCode[];

  // dev
  payment: "success" | "fail";
  offline: boolean;
  lastPayment: PaymentMethod;
};

type Actions = {
  signIn: (role: Role) => void;
  signOut: () => void;
  setRole: (role: Role) => void;
  toggleFollow: (hostId: string) => void;
  createHold: (hold: Omit<Hold, "id" | "expiresAt">, ms: number) => string;
  dropHold: (id: string) => void;
  completeOrder: (order: Order, tickets: Ticket[], holdId: string) => void;
  unlock: (code: string) => void;
  joinWaitlist: (tierId: string) => void;
  updateTicket: (id: string, patch: Partial<Ticket>) => void;
  setHostProfile: (patch: Partial<Host>) => void;
  finishOnboarding: () => void;
  saveDraft: (e: TktEvent) => void;
  checkIn: (eventId: string, attendeeId: string) => void;
  undoCheckIn: (eventId: string, attendeeId: string) => void;
  flushQueue: () => void;
  addPromo: (p: PromoCode) => void;
  removePromo: (id: string) => void;
  setDev: (patch: Partial<Pick<State, "payment" | "offline">>) => void;
};

const initial: State = {
  signedIn: false,
  role: "fan",
  following: initialFollowing,
  tickets: fanTickets,
  orders: fanOrders,
  holds: [],
  unlocked: [],
  waitlist: [],
  hostId: hosts[0].id,
  hostProfile: {},
  onboarded: true,
  drafts: [],
  checkIns: {},
  syncQueue: [],
  promos: seedPromos,
  payment: "success",
  offline: false,
  lastPayment: "gcash",
};

const uid = () => Math.random().toString(36).slice(2, 10);

export const useStore = create<State & Actions>()(
  persist(
    (set, get) => ({
      ...initial,
      signIn: (role) => set({ signedIn: true, role }),
      signOut: () => set({ ...initial }),
      setRole: (role) => set({ role }),
      toggleFollow: (hostId) =>
        set((s) => ({
          following: s.following.includes(hostId) ? s.following.filter((h) => h !== hostId) : [...s.following, hostId],
        })),
      createHold: (hold, ms) => {
        const id = uid();
        set((s) => ({ holds: [...s.holds.filter((h) => h.expiresAt > Date.now()), { ...hold, id, expiresAt: Date.now() + ms }] }));
        return id;
      },
      dropHold: (id) => set((s) => ({ holds: s.holds.filter((h) => h.id !== id) })),
      completeOrder: (order, tickets, holdId) =>
        set((s) => ({
          orders: [order, ...s.orders],
          tickets: [...tickets, ...s.tickets],
          holds: s.holds.filter((h) => h.id !== holdId),
          lastPayment: order.payment,
        })),
      unlock: (code) => set((s) => ({ unlocked: Array.from(new Set([...s.unlocked, code.toUpperCase()])) })),
      joinWaitlist: (tierId) => set((s) => ({ waitlist: Array.from(new Set([...s.waitlist, tierId])) })),
      updateTicket: (id, patch) => set((s) => ({ tickets: s.tickets.map((t) => (t.id === id ? { ...t, ...patch } : t)) })),
      setHostProfile: (patch) => set((s) => ({ hostProfile: { ...s.hostProfile, ...patch } })),
      finishOnboarding: () => set({ onboarded: true }),
      saveDraft: (e) => set((s) => ({ drafts: [e, ...s.drafts.filter((d) => d.id !== e.id)] })),
      checkIn: (eventId, attendeeId) => {
        const at = new Date().toISOString();
        set((s) => ({
          checkIns: { ...s.checkIns, [eventId]: { ...s.checkIns[eventId], [attendeeId]: at } },
          syncQueue: s.offline ? [...s.syncQueue, { eventId, attendeeId, at }] : s.syncQueue,
        }));
      },
      undoCheckIn: (eventId, attendeeId) =>
        set((s) => {
          const next = { ...s.checkIns[eventId] };
          delete next[attendeeId];
          return {
            checkIns: { ...s.checkIns, [eventId]: next },
            syncQueue: s.syncQueue.filter((q) => !(q.eventId === eventId && q.attendeeId === attendeeId)),
          };
        }),
      flushQueue: () => set({ syncQueue: [] }),
      addPromo: (p) => set((s) => ({ promos: [p, ...s.promos] })),
      removePromo: (id) => set((s) => ({ promos: s.promos.filter((p) => p.id !== id) })),
      setDev: (patch) => {
        set(patch);
        if (patch.offline === false && get().syncQueue.length) set({ syncQueue: [] });
      },
    }),
    {
      name: "tkt-demo",
      version: 1,
      storage: createJSONStorage(() => localStorage),
      skipHydration: true,
    },
  ),
);

/** True once persisted state has loaded on the client. */
export const useHydrated = () => useStore.persist?.hasHydrated?.() ?? false;
