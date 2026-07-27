import type { CartLine, Order, Session, ShopStats } from "./types";

/**
 * Base URL of the Cloudflare Worker backend (see /worker/index.ts).
 * Set NEXT_PUBLIC_API_URL at front build time, e.g. https://neoacc-worker.<you>.workers.dev
 * Leave empty only if the API is same-origin (it isn't, in this architecture).
 */
const BASE =
  typeof process !== "undefined" && process.env ? process.env.NEXT_PUBLIC_API_URL ?? "" : "";

let auth = { initData: "", devUsername: "" };

export function setAuth(next: Partial<typeof auth>) {
  auth = { ...auth, ...next };
}

export function currentAuth() {
  return auth;
}

function buildHeaders(withJson: boolean): Record<string, string> {
  const h: Record<string, string> = {};
  if (auth.initData) h["x-telegram-init-data"] = auth.initData;
  else if (auth.devUsername) h["x-dev-username"] = auth.devUsername;
  if (withJson) h["content-type"] = "application/json";
  return h;
}

async function req<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { ...buildHeaders(!!init.body), ...(init.headers || {}) },
    cache: "no-store",
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data && (data.error || data.message)) || `HTTP ${res.status}`;
    throw new Error(String(msg));
  }
  return data as T;
}

export const api = {
  me: () => req<{ session: Session }>("/api/me"),
  myOrders: () => req<{ orders: Order[] }>("/api/orders?scope=mine"),
  stats: () => req<{ stats: ShopStats; recent: Order[] }>("/api/admin/stats"),
  createOrder: (lines: CartLine[]) =>
    req<{ order: Order }>("/api/orders", {
      method: "POST",
      body: JSON.stringify({ lines }),
    }),
  act: (id: string, action: "accept" | "reject") =>
    req<{ order: Order }>(`/api/orders/${encodeURIComponent(id)}/action`, {
      method: "POST",
      body: JSON.stringify({ action }),
    }),
};
