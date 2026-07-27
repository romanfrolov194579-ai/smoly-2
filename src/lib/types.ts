// Shared domain types for the shop mini-app.

export type CategoryId = "accounts" | "sims" | "banks";

export interface Category {
  id: CategoryId;
  label: string;
  accent: "blue" | "amber" | "violet";
}

export interface Variant {
  id: string;
  label: string;
  /** price delta in rubles added on top of the item base price */
  delta: number;
}

/** A concrete purchasable product living inside a subcategory. */
export interface ProductItem {
  id: string;
  name: string;
  /** base price in rubles (shown only on the product page / cart) */
  price: number;
  /**
   * Direct URL to the product photo hosted anywhere (CDN / image host).
   * Leave as `null` until you paste a real link — the UI renders a designed
   * placeholder slot in that case.
   */
  photo: string | null;
  /** one-liner shown on the grid card */
  short: string;
  /** full description shown on the dedicated product page */
  description: string;
  perks: string[];
  variants: Variant[];
}

/**
 * A "mini-category" inside a top-level category — e.g. Яндекс.Сплит, Авито…
 * Most subcategories hold a single item; Яндекс.Сплит holds several.
 */
export interface Subcategory {
  id: string;
  categoryId: CategoryId;
  name: string;
  emoji: string;
  badge?: string;
  items: ProductItem[];
}

export interface CartLine {
  itemId: string;
  subId: string;
  subName: string;
  name: string;
  emoji: string;
  categoryId: CategoryId;
  variantId: string;
  variantLabel: string;
  qty: number;
  unitPrice: number;
}

export type OrderStatus = "pending" | "approved" | "rejected";

export interface OrderLine {
  itemId: string;
  subName: string;
  name: string;
  emoji: string;
  variantLabel: string;
  qty: number;
  unitPrice: number;
  lineTotal: number;
}

/** Delivered account credentials, generated when an order is approved. */
export interface DeliveredLine {
  itemId: string;
  name: string;
  accounts: { login: string; password: string; note?: string }[];
}

export interface Order {
  id: string;
  userId: number;
  username: string | null;
  firstName: string | null;
  photoUrl: string | null;
  lines: OrderLine[];
  total: number;
  status: OrderStatus;
  createdAt: string;
  updatedAt: string;
  delivered?: DeliveredLine[];
  /** internal note, never exposed to the buyer */
  internalNote?: string;
}

export interface TgUser {
  id: number;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
  photoUrl: string | null;
  /** true when initData could not be cryptographically verified (browser preview) */
  demo?: boolean;
}

export interface Session extends TgUser {
  isAdmin: boolean;
}

export interface ShopStats {
  totalRevenue: number;
  pendingSum: number;
  rejectedSum: number;
  totalOrders: number;
  approvedCount: number;
  pendingCount: number;
  rejectedCount: number;
}
