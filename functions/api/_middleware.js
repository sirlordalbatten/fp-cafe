// Runs before every /api/* request.
import { json, API_HEADERS } from "../../backend/core.mjs";
const ALLOWED = { "/api/run": "POST", "/api/score": "POST", "/api/board": "GET", "/api/live": "GET" };
export async function onRequest({ request, next }) {
  const path = new URL(request.url).pathname.replace(/\/+$/, "");
  const method = ALLOWED[path];
  if (!method) return json({ error: "not found" }, 404);
  if (request.method !== method) return json({ error: "method not allowed" }, 405, { Allow: method });
  const res = await next();
  const out = new Response(res.body, res);
  for (const [k, v] of Object.entries(API_HEADERS)) if (!out.headers.has(k)) out.headers.set(k, v);
  return out;
}
