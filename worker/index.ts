/**
 * =====================================================================
 *  NEOACC · single-file Cloudflare Worker backend
 * =====================================================================
 *  One Worker serves the whole API. Persistence = KV namespace `ORDERS`
 *  (declared in /wrangler.json). Telegram initData is verified with the
 *  Web Crypto API (edge-safe). CORS is open to the storefront origin so
 *  the static Next front (Cloudflare Pages or any host) can call it.
 *
 *  Local dev:
 *     wrangler dev                      # boots this worker on :8787 with KV
 *     NEXT_PUBLIC_API_URL=http://127.0.0.1:8787 npm run dev   # Next front
 *
 *  Deploy:
 *     wrangler kv namespace create ORDERS   # paste id into wrangler.json
 *     wrangler secret put TELEGRAM_BOT_TOKEN
 *     wrangler deploy
 * =====================================================================
 */
import { z } from "zod";
import { CATEGORIES, SUBCATEGORIES, findItem } from "../src/lib/products";
import { resolveSession, requireAdmin } from "../src/lib/tg";
import type {
  CartLine,
  DeliveredLine,
  Order,
  OrderLine,
  ShopStats,
} from "../src/lib/types";

/* ----------------------------- env / KV ------------------------------ */
interface KV {
  get(key: string): Promise<string | null>;
  put(key: string, value: string): Promise<void>;
  list(opts?: { prefix?: string; limit?: number }): Promise<{ keys: { name: string }[] }>;
}
interface Env {
  ORDERS: KV;
  TELEGRAM_BOT_TOKEN?: string;
  ALLOW_DEV_AUTH?: string;
}
interface ExecCtx {
  waitUntil?(p: Promise<unknown>): void;
  passThroughOnException?(): void;
}

const KEY = (id: string) => `order:${id}`;

async function allOrders(env: Env): Promise<Order[]> {
  const { keys } = await env.ORDERS.list({ prefix: "order:", limit: 1000 });
  const vals = await Promise.all(keys.map((k) => env.ORDERS.get(k.name)));
  const orders = vals.filter(Boolean).map((v) => JSON.parse(v as string) as Order);
  orders.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  return orders;
}
async function getOrder(env: Env, id: string): Promise<Order | undefined> {
  const v = await env.ORDERS.get(KEY(id));
  return v ? (JSON.parse(v) as Order) : undefined;
}
async function putOrder(env: Env, o: Order): Promise<void> {
  await env.ORDERS.put(KEY(o.id), JSON.stringify(o));
}
async function makeOrderId(env: Env): Promise<string> {
  const alpha = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const pick = (n: number) =>
    Array.from({ length: n }, () => alpha[Math.floor(Math.random() * alpha.length)]).join("");
  let id = `${pick(3)}-${pick(4)}`;
  let guard = 0;
  while ((await getOrder(env, id)) && guard++ < 10) id = `${pick(3)}-${pick(4)}`;
  return id;
}

function computeStats(orders: Order[]): ShopStats {
  const s: ShopStats = {
    totalRevenue: 0,
    pendingSum: 0,
    rejectedSum: 0,
    totalOrders: orders.length,
    approvedCount: 0,
    pendingCount: 0,
    rejectedCount: 0,
  };
  for (const o of orders) {
    if (o.status === "approved") {
      s.totalRevenue += o.total;
      s.approvedCount += 1;
    } else if (o.status === "pending") {
      s.pendingSum += o.total;
      s.pendingCount += 1;
    } else {
      s.rejectedSum += o.total;
      s.rejectedCount += 1;
    }
  }
  return s;
}

/* --------------------- delivered-credentials gen --------------------- */
const DOMAIN_POOL = ["neoacc.io", "vault-mail.ru", "acc-node.pro", "securebox.app", "id-hub.ru"];
const rng = (alphabet: string, n: number) =>
  Array.from({ length: n }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");

function makeLogin(itemId: string): string {
  const slug = itemId.replace(/[^a-z0-9]/gi, "").slice(0, 6) || "acc";
  const domain = DOMAIN_POOL[Math.floor(Math.random() * DOMAIN_POOL.length)];
  return `${slug}${rng("0123456789", 4)}@${domain}`;
}
function makePassword(): string {
  return `${rng("ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz", 6)}${rng("0123456789", 3)}${rng("!@#%&*", 1)}`;
}
function buildDelivered(lines: OrderLine[]): DeliveredLine[] {
  return lines.map((line) => ({
    itemId: line.itemId,
    name: line.name,
    accounts: Array.from({ length: line.qty }, () => ({
      login: makeLogin(line.itemId),
      password: makePassword(),
      note: `Восстановление: rec_${rng("0123456789", 5)}@mail.ru`,
    })),
  }));
}

/* ----------------------------- schemas ------------------------------- */
const LineSchema = z.object({
  itemId: z.string().min(1),
  subId: z.string().min(1),
  subName: z.string().min(1),
  name: z.string().min(1),
  emoji: z.string().optional().default(""),
  categoryId: z.enum(["accounts", "sims", "banks"]),
  variantId: z.string().min(1),
  variantLabel: z.string().min(1),
  qty: z.number().int().min(1).max(50),
  unitPrice: z.number().int().min(0).optional(),
});
const CreateSchema = z.object({ lines: z.array(LineSchema).min(1).max(30) });
const ActionSchema = z.object({ action: z.enum(["accept", "reject"]) });

/* ----------------------------- http utils ---------------------------- */
function corsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get("origin") || "*";
  return {
    "Access-Control-Allow-Origin": origin,
    Vary: "Origin",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "content-type,x-telegram-init-data,x-dev-username",
    "Access-Control-Max-Age": "86400",
  };
}
function jsonResp(data: unknown, req: Request, status = 200): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: { "content-type": "application/json", ...corsHeaders(req) },
  });
}
function withCors(res: Response, req: Request): Response {
  const h = new Headers(res.headers);
  for (const [k, v] of Object.entries(corsHeaders(req))) h.set(k, v);
  return new Response(res.body, { status: res.status, headers: h });
}
function authOpts(env: Env) {
  return {
    botToken: env.TELEGRAM_BOT_TOKEN,
    allowDev: env.ALLOW_DEV_AUTH === "1" || !env.TELEGRAM_BOT_TOKEN,
  };
}

/* ------------------------------- router ------------------------------ */
async function handle(request: Request, env: Env): Promise<Response> {
  if (request.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders(request) });
  }

  const url = new URL(request.url);
  const p = url.pathname.replace(/\/+$/, "");
  const actionMatch = p.match(/^\/api\/orders\/([^/]+)\/action$/);

  if (p === "/api/health") return jsonResp({ ok: true, runtime: "worker" }, request);
  if (p === "/api/products")
    return jsonResp({ categories: CATEGORIES, subcategories: SUBCATEGORIES }, request);

  if (p === "/api/me") {
    const s = await resolveSession(request, authOpts(env));
    return s ? jsonResp({ session: s }, request) : jsonResp({ error: "unauthorized" }, request, 401);
  }

  if (p === "/api/orders") {
    const s = await resolveSession(request, authOpts(env));
    if (!s) return jsonResp({ error: "unauthorized" }, request, 401);

    if (request.method === "GET") {
      const scope = url.searchParams.get("scope");
      const orders = await allOrders(env);
      if (scope === "all") {
        if (!s.isAdmin) return jsonResp({ error: "forbidden" }, request, 403);
        return jsonResp({ orders }, request);
      }
      return jsonResp({ orders: orders.filter((o) => o.userId === s.id) }, request);
    }

    if (request.method === "POST") {
      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return jsonResp({ error: "bad_json" }, request, 400);
      }
      const parsed = CreateSchema.safeParse(body);
      if (!parsed.success) return jsonResp({ error: "validation" }, request, 400);

      const lines: OrderLine[] = [];
      let total = 0;
      for (const line of parsed.data.lines as CartLine[]) {
        const found = findItem(line.itemId);
        if (!found || found.sub.id !== line.subId)
          return jsonResp({ error: "unknown_item" }, request, 400);
        const { item, sub } = found;
        const variant = item.variants.find((v) => v.id === line.variantId);
        if (!variant) return jsonResp({ error: "unknown_variant" }, request, 400);
        const unitPrice = item.price + variant.delta;
        const lineTotal = unitPrice * line.qty;
        total += lineTotal;
        lines.push({
          itemId: item.id,
          subName: sub.name,
          name: item.name,
          emoji: sub.emoji,
          variantLabel: variant.label,
          qty: line.qty,
          unitPrice,
          lineTotal,
        });
      }
      const now = new Date().toISOString();
      const order: Order = {
        id: await makeOrderId(env),
        userId: s.id,
        username: s.username,
        firstName: s.firstName,
        photoUrl: s.photoUrl,
        lines,
        total,
        status: "pending",
        createdAt: now,
        updatedAt: now,
      };
      await putOrder(env, order);
      return jsonResp({ order }, request);
    }
  }

  if (actionMatch && request.method === "POST") {
    const guard = await requireAdmin(request, authOpts(env));
    if (guard instanceof Response) return withCors(guard, request);
    const id = decodeURIComponent(actionMatch[1]);
    const order = await getOrder(env, id);
    if (!order) return jsonResp({ error: "not_found" }, request, 404);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return jsonResp({ error: "bad_json" }, request, 400);
    }
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) return jsonResp({ error: "validation" }, request, 400);

    if (parsed.data.action === "accept") {
      const next: Order = {
        ...order,
        status: "approved",
        delivered: buildDelivered(order.lines),
        updatedAt: new Date().toISOString(),
      };
      await putOrder(env, next);
      return jsonResp({ order: next }, request);
    }
    const next: Order = {
      ...order,
      status: "rejected",
      internalNote: `rejected by @${guard.username ?? "admin"}`,
      updatedAt: new Date().toISOString(),
    };
    await putOrder(env, next);
    return jsonResp({ order: next }, request);
  }

  if (p === "/api/admin/stats") {
    const guard = await requireAdmin(request, authOpts(env));
    if (guard instanceof Response) return withCors(guard, request);
    const orders = await allOrders(env);
    return jsonResp({ stats: computeStats(orders), recent: orders.slice(0, 50) }, request);
  }

  return jsonResp({ error: "not_found" }, request, 404);
}

export default {
  async fetch(request: Request, env: Env, _ctx: ExecCtx): Promise<Response> {
    try {
      return await handle(request, env);
    } catch (e) {
      return jsonResp(
        { error: "internal", detail: e instanceof Error ? e.message : String(e) },
        request,
        500,
      );
    }
  },
};
