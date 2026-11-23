// Unit tests for the leaderboard logic. Run: node --test backend/tests/*.test.mjs
import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../core.mjs";

const SECRET = "x".repeat(40);

test("names: allow-list and blocklist", () => {
  for (const ok of ["night_owl", "SOC-Gremlin", "abc", "Analyst42"]) assert.ok(C.validName(ok), ok);
  for (const bad of ["ab", "a".repeat(17), "<script>", "name with space", "admin", "N4zi_lord", "", null, 42, "ⓐdmin"])
    assert.ok(!C.validName(bad), String(bad));
});

test("team codes are normalised and validated", () => {
  assert.equal(C.normTeam("blue-owls"), "BLUE-OWLS");
  assert.equal(C.normTeam(""), null);
  assert.equal(C.normTeam("a"), false);
  assert.equal(C.normTeam("<x>"), false);
  assert.equal(C.normTeam({}), false);
});

test("tokens: sign, verify, tamper", async () => {
  const t = await C.issueToken(SECRET, "phish", 1000);
  const p = await C.verifyToken(SECRET, t);
  assert.equal(p.g, "phish");
  assert.equal(p.t, 1000);
  assert.equal(await C.verifyToken("y".repeat(40), t), null, "wrong secret");
  const [payload, sig] = t.split(".");
  const forged = C.b64u(new TextEncoder().encode(JSON.stringify({ g: "phish", t: 0, n: "a".repeat(24) })));
  assert.equal(await C.verifyToken(SECRET, `${forged}.${sig}`), null, "swapped payload");
  assert.equal(await C.verifyToken(SECRET, payload), null, "no signature");
  assert.equal(await C.verifyToken(SECRET, "a.b.c"), null);
  assert.equal(await C.verifyToken(SECRET, 5), null);
});

test("proof of work", async () => {
  const token = await C.issueToken(SECRET, "logs");
  let sol = 0;
  while (!(await C.checkPow(token, sol.toString(36), 8))) sol++;
  assert.ok(await C.checkPow(token, sol.toString(36), 8));
  assert.equal(await C.checkPow(token, "not valid!", 8), false);
  assert.equal(C.leadingZeroBits(new Uint8Array([0, 0x1f])), 11);
});

test("plausibility", () => {
  assert.equal(C.plausible("phish", 5000, 60000), null);
  assert.equal(C.plausible("phish", 5000, 2000), "too fast");
  assert.equal(C.plausible("phish", 999999, 60000), "score not plausible");
  assert.equal(C.plausible("phish", 50000, 60000), null);
  assert.equal(C.plausible("phish", -1, 60000), "bad score");
  assert.equal(C.plausible("phish", 1.5, 60000), "bad score");
  assert.equal(C.plausible("phish", 10, 99 * 60e3), "run expired");
  assert.equal(C.plausible("socdle", 7, 60000), "score not plausible");
  assert.equal(C.plausible("nope", 1, 60000), "unknown game");
});

test("week keys follow ISO weeks", () => {
  assert.equal(C.weekKey(Date.UTC(2026, 0, 1)), "2026-W01");
  assert.equal(C.weekKey(Date.UTC(2026, 10, 23)), "2026-W48");
  assert.equal(C.weekKey(Date.UTC(2027, 0, 1)), "2026-W53");
});

test("requests: origin, content type, size", async () => {
  const mk = (h, body = "{}") => new Request("https://fp-cafe.pages.dev/api/run", { method: "POST", headers: h, body });
  assert.ok(C.sameOrigin(mk({ Origin: "https://fp-cafe.pages.dev" })));
  assert.ok(!C.sameOrigin(mk({ Origin: "https://evil.example" })));
  assert.ok(!C.sameOrigin(mk({})));
  await assert.rejects(C.readJson(mk({ "Content-Type": "text/plain" })), { status: 415 });
  await assert.rejects(C.readJson(mk({ "Content-Type": "application/json" }, "x".repeat(5000))), { status: 413 });
  await assert.rejects(C.readJson(mk({ "Content-Type": "application/json" }, "[1]")), { status: 400 });
});

test("not configured -> 503, never a crash", async () => {
  const res = await C.guard(C.startRun, new Request("https://x.dev/api/run", { method: "POST" }), {});
  assert.equal(res.status, 503);
  assert.equal(res.headers.get("X-Content-Type-Options"), "nosniff");
});
