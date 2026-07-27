import type { Session, TgUser } from "./types";

/** Server-side admin allowlist — never rendered in the UI. */
export const ADMIN_USERNAMES = ["samarskiyyyy", "bocha_bich"];

export function isAdmin(username: string | null | undefined): boolean {
  if (!username) return false;
  return ADMIN_USERNAMES.includes(username.toLowerCase().replace(/^@/, ""));
}

/** Options injected by the runtime (Worker passes KV/env-derived values). */
export interface AuthOpts {
  botToken?: string;
  allowDev?: boolean;
}

function envVar(key: string): string | undefined {
  try {
    return typeof process !== "undefined" ? (process as { env?: Record<string, string> }).env?.[key] : undefined;
  } catch {
    return undefined;
  }
}

/* ------------------------------------------------------------------ */
/*  Web Crypto helpers — Node 19+, Next edge and Cloudflare Workers.   */
/* ------------------------------------------------------------------ */
const enc = new TextEncoder();

async function hmacSha256(keyBytes: ArrayBuffer, data: string): Promise<ArrayBuffer> {
  const key = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  return crypto.subtle.sign("HMAC", key, enc.encode(data));
}

function toHex(buf: ArrayBuffer): string {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Parse & optionally verify Telegram WebApp initData.
 *   secret = HMAC_SHA256(key = BOT_TOKEN, data = "WebAppData")
 *   hash   = HMAC_SHA256(key = secret,    data = data-check-string)
 */
export async function parseInitData(
  raw: string | null,
  botToken?: string,
): Promise<{ user: TgUser | null; verified: boolean }> {
  if (!raw) return { user: null, verified: false };
  const params = new URLSearchParams(raw);
  const hash = params.get("hash");
  params.delete("hash");

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : 1))
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");

  let verified = false;
  const token = botToken ?? envVar("TELEGRAM_BOT_TOKEN");
  if (token && hash) {
    const secret = await hmacSha256(enc.encode(token).buffer, "WebAppData");
    const computed = toHex(await hmacSha256(secret, dataCheckString));
    verified = computed === hash;
  }

  const userRaw = params.get("user");
  if (!userRaw) return { user: null, verified };
  try {
    const u = JSON.parse(userRaw) as {
      id: number;
      username?: string;
      first_name?: string;
      last_name?: string;
      photo_url?: string;
    };
    return {
      verified,
      user: {
        id: u.id,
        username: u.username ?? null,
        firstName: u.first_name ?? null,
        lastName: u.last_name ?? null,
        photoUrl: u.photo_url ?? null,
      },
    };
  } catch {
    return { user: null, verified };
  }
}

function stableDemoId(name: string): number {
  let h = 5381;
  const s = name.toLowerCase();
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return Math.abs(h) || 1;
}

/** Resolve a session from request headers (initData or dev fallback). */
export async function resolveSession(
  req: Request,
  opts?: AuthOpts,
): Promise<Session | null> {
  const token = opts?.botToken ?? envVar("TELEGRAM_BOT_TOKEN");
  const parsed = await parseInitData(req.headers.get("x-telegram-init-data"), token);

  if (parsed.user && (parsed.verified || !token)) {
    return { ...parsed.user, demo: !parsed.verified, isAdmin: isAdmin(parsed.user.username) };
  }

  const allowDev =
    opts?.allowDev ?? (envVar("ALLOW_DEV_AUTH") === "1" || !token);
  if (allowDev) {
    const devName = req.headers.get("x-dev-username");
    if (devName) {
      const username = devName.replace(/^@/, "").trim();
      const user: TgUser = {
        id: stableDemoId(username),
        username,
        firstName: username,
        lastName: null,
        photoUrl: null,
        demo: true,
      };
      return { ...user, isAdmin: isAdmin(username) };
    }
  }
  return null;
}

export async function requireAdmin(
  req: Request,
  opts?: AuthOpts,
): Promise<Session | Response> {
  const session = await resolveSession(req, opts);
  if (!session) return new Response(JSON.stringify({ error: "unauthorized" }), { status: 401 });
  if (!session.isAdmin)
    return new Response(JSON.stringify({ error: "forbidden" }), { status: 403 });
  return session;
}
