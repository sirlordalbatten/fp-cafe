// POST /api/ingest   GitHub Actions pushes data that Cloudflare's servers can't fetch themselves (SANS ISC).
// Needs the LIVE_INGEST_SECRET secret; without it the endpoint answers 404. See backend/live.mjs.
import { json, guard } from "../../backend/core.mjs";
import { ingest, d1Store, memoryStore } from "../../backend/live.mjs";

export const onRequestPost = ({ request, env }) => guard(async () => {
  const out = await ingest({ request, env, store: env.DB ? d1Store(env.DB) : memoryStore() });
  return json(out);
}, request, env);
