// GET /api/live?f=map,events   Fresh threat data, cached for minutes. See backend/live.mjs.
import { json } from "../../backend/core.mjs";
import { serveLive, parseFeeds, d1Store, memoryStore } from "../../backend/live.mjs";

export async function onRequestGet({ request, env }) {
  const feeds = parseFeeds(new URL(request.url).searchParams.get("f"));
  if (!feeds.length) return json({ error: "ask for one or more feeds: map, events, cves, news, soc, ai, detect" }, 400);
  const store = env.DB ? d1Store(env.DB) : memoryStore();
  const out = await serveLive({ feeds, env, store });
  return json(out, 200, { "Cache-Control": "public, max-age=30" });
}
