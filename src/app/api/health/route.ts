export const runtime = "edge";
export const dynamic = "force-dynamic";

// Edge-safe healthcheck. No Node-only modules, no DB import — importing the
// Postgres client here would break the Cloudflare edge bundle. The platform
// preview only needs a 200 with `{ ok: true }`.
export async function GET() {
  return Response.json({ ok: true, runtime: "edge" });
}
