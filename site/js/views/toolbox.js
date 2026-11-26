// Toolbox: the analyst's investigation tools in one place. Everything runs in the browser; nothing is sent anywhere.
import { $, h, html, put, ext, copyText } from "../core.js";
import { unwrap, extract, classify, pivots, TYPE_NAME, defang, refang, homograph } from "../ti.js";
import { load, cveList } from "../data.js";
import { detail, status, productName } from "../cvecard.js";
import { bump } from "../state.js";

const TOOLS = [["lookup", "Lookup"], ["unwrap", "Unwrap link"], ["ioc", "IOC extractor"], ["headers", "Email headers"], ["url", "URL parser"], ["look", "Lookalike domain"],
  ["decode", "Decode"], ["defang", "Defang"], ["time", "Time"], ["jwt", "JWT"], ["cidr", "CIDR"], ["hash", "Hash ID"]];

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Toolbox</h1><p>Investigation tools that run in your browser. Nothing you paste leaves this page.</p></div>
  <div class="tbx"><nav class="tbx-nav" id="tbTabs" aria-label="Tools"></nav><div class="panel tbx-pane"><h2 class="tbx-h" id="tbTitle"></h2><div id="toolbox"></div></div></div>`);
  put($("#tbTabs"), TOOLS.map(([k, l], i) => h("button" + (i === 0 ? ".on" : ""), { type: "button", dataset: { t: k } }, l)));
  $("#tbTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; [...$("#tbTabs").children].forEach((x) => x.classList.toggle("on", x === b)); openTool(b.dataset.t); });
  const want = new URLSearchParams(location.hash.split("?")[1] || "").get("t");
  openTool(TOOLS.some(([k]) => k === want) ? want : "lookup");
}
function openTool(t) {
  $("#tbTitle").textContent = TOOLS.find(([k]) => k === t)?.[1] || "";
  [...$("#tbTabs").children].forEach((x) => x.classList.toggle("on", x.dataset.t === t));
  tool(t); bump("tool");
}

function headers(raw) {
  const text = raw.replace(/\r/g, "").replace(/\n[ \t]+/g, " "); const get = (k) => (text.match(new RegExp(`^${k}:\\s*(.*)$`, "gim")) || []).map((l) => l.replace(new RegExp(`^${k}:\\s*`, "i"), ""));
  const dom = (s) => (String(s || "").match(/@([a-z0-9.-]+)/i) || [])[1]?.toLowerCase() || "";
  const from = get("From")[0] || "", rp = get("Return-Path")[0] || "", reply = get("Reply-To")[0] || "", mid = get("Message-ID")[0] || "";
  const auth = get("Authentication-Results").join(" ").toLowerCase(); const res = (k) => (auth.match(new RegExp(`${k}=(\\w+)`)) || [])[1] || "not found";
  const recv = get("Received"); const ips = [...new Set(recv.join(" ").match(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g) || [])];
  const flags = [];
  if (["fail", "softfail"].includes(res("spf"))) flags.push(`SPF ${res("spf")}: the sending server isn't allowed to send for that domain.`);
  if (res("dkim") === "none" || res("dkim") === "fail") flags.push(`DKIM ${res("dkim")}: the message isn't signed by the domain, or the signature broke.`);
  if (res("dmarc") === "fail") flags.push("DMARC fail: the visible From domain didn't pass. Strong sign of spoofing.");
  if (dom(from) && dom(rp) && dom(from) !== dom(rp)) flags.push(`From (${dom(from)}) and Return-Path (${dom(rp)}) differ. Common for newsletters, suspicious for banks and colleagues.`);
  if (dom(reply) && dom(reply) !== dom(from)) flags.push(`Reply-To goes to ${dom(reply)}, not ${dom(from)}. Replies would go to someone else: classic BEC.`);
  if (dom(mid) && dom(from) && !dom(mid).endsWith(dom(from).split(".").slice(-2).join("."))) flags.push(`Message-ID domain (${dom(mid)}) doesn't match the sender.`);
  const disp = (from.match(/^"?([^"<]+)"?\s*</) || [])[1]; if (disp && /@/.test(disp)) flags.push("The display name contains an email address. Phishers use it to show a fake sender.");
  return `From:          ${from}\nReturn-Path:   ${rp || "not found"}\nReply-To:      ${reply || "not set"}\nSubject:       ${get("Subject")[0] || ""}\nSPF / DKIM / DMARC: ${res("spf")} / ${res("dkim")} / ${res("dmarc")}\nHops:          ${recv.length}\nIPs in chain:  ${ips.join(", ") || "none"}\n\n${flags.length ? "Red flags:\n" + flags.map((x) => "• " + x).join("\n") : "No classic red flags. Still check links and attachments."}`;
}
function tool(t) {
  const box = $("#toolbox"); const inp = h("textarea.short", { spellcheck: "false", "aria-label": "Input" }); const out = h("pre.codebox.out");
  const run = (fn) => { const go = () => { try { out.textContent = fn(inp.value); } catch (e) { out.textContent = "Couldn't read that: " + String(e.message || e).slice(0, 120); } }; inp.addEventListener("input", go); go(); };
  if (t === "lookup") {
    const o = h("div.pivot-out"); inp.placeholder = "IP, domain, URL, hash, email, CVE or ATT&CK ID. Defanged is fine."; inp.value = "";
    const go = async () => {
      const ind = classify(inp.value); if (ind.type === "empty") { put(o); return; }
      if (ind.type === "unknown") { put(o, h("p.muted", "Not a type we recognise. Try the IOC extractor for messy text.")); return; }
      const notes = [];
      if (ind.private) notes.push(h("p.note", "Private or reserved address. Public intel won't know it: check your CMDB, DHCP and EDR."));
      if (ind.type === "cve") { const c = cveList(await load("cves")).find((x) => x.id === ind.value); notes.push(c ? h("p.note.ok", "In today's feed: ", h("button.linkbtn", { type: "button", onclick: () => detail(c) }, `${productName(c)} · ${status(c)[0]}`)) : h("p.note", "Not in our current feed of recent exploited and critical CVEs.")); }
      if (["sha256", "sha1", "md5"].includes(ind.type)) notes.push(h("p.note", "Look up hashes. Don't upload company files to public sandboxes."));
      if (ind.type === "url" || ind.type === "domain") notes.push(h("p.note", "Don't open it in your normal browser. Share it as ", h("code", defang(ind.value))));
      put(o, h("p.lk-type", h("b", TYPE_NAME[ind.type]), " ", h("code", ind.value), h("button.btn.ghost.sm", { type: "button", onclick: () => copyText(ind.value, "Copied") }, "Copy")),
        notes, h("ul.pivots", pivots(ind).map(([l, u, why]) => h("li", ext(u, l), h("span.muted", why)))));
    };
    inp.rows = 2; inp.addEventListener("input", go); go();
    put(box, h("p.muted.small", "Nothing is sent until you click a link. Each opens in a new tab with no referrer."), inp, o);
  } else if (t === "unwrap") {
    inp.placeholder = "Paste a SafeLinks, Proofpoint URL Defense, Google or other redirect link";
    inp.value = "https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Furldefense.com%2Fv3%2F__https%3A%2F%2Fexample.com%2Finvoice%3Fid%3D42__%3B!!AbC%24&data=05%7C02&reserved=0";
    run((v) => { const r = unwrap(v); if (!r.steps.length) return `No wrapper found.\n\nFinal URL: ${r.final}\nSafe to share: ${defang(r.final)}`;
      return r.steps.map((s, i) => `${i + 1}. ${s.how}\n   → ${s.to}`).join("\n") + `\n\nFinal URL:     ${r.final}\nSafe to share: ${defang(r.final)}`; });
    put(box, h("p.muted.small", "Strips Microsoft SafeLinks, Proofpoint URL Defense (v1, v2, v3), Barracuda, Google and common ?url= redirects, layer by layer. Nothing is opened or fetched."), inp, out);
  } else if (t === "ioc") {
    inp.placeholder = "Paste an alert, email body, report or log lines"; inp.classList.add("tall");
    inp.value = "User clicked hxxps://login-micros0ft[.]com/auth from 10.20.1.15. Payload a3f5c2e1d4b6978f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f dropped. C2 185.220.101[.]4. Reported by kevin@corp.example. Related: CVE-2026-10005.";
    run((v) => { const x = extract(v); const sec = (n, a, d = false) => a.length ? `${n} (${a.length})\n${a.map((y) => "  " + (d ? defang(y) : y)).join("\n")}` : "";
      return [sec("URLs", x.urls, true), sec("Domains", x.domains, true), sec("IPv4", x.ips), sec("Emails", x.emails), sec("SHA-256", x.sha256), sec("SHA-1", x.sha1), sec("MD5", x.md5), sec("CVEs", x.cves)].filter(Boolean).join("\n\n") || "No indicators found."; });
    put(box, h("p.muted.small", "Pulls URLs, domains, IPs, emails, hashes and CVEs out of messy text. Handles defanged input. URLs and domains come back defanged so you can paste them into a ticket safely."), inp, out,
      h("div.row", h("button.btn.sm", { onclick: () => copyText(out.textContent, "Indicators copied") }, "Copy all")));
  } else if (t === "pivot") {
    const o = h("div.pivot-out"); inp.placeholder = "One indicator: IP, domain, URL, hash, email, CVE or ATT&CK ID"; inp.value = "185.220.101.4";
    const go = () => { const ind = classify(inp.value); const pv = pivots(ind);
      put(o, ind.type === "empty" ? null : h("p.small", h("b", TYPE_NAME[ind.type]), " ", h("code", ind.value)), ind.private ? h("p.note", "Private or reserved address: check your own CMDB and EDR, not public intel.") : null,
        pv.length ? h("ul.pivots", pv.map(([l, u, why]) => h("li", ext(u, l), h("span.muted", why)))) : h("p.muted", "Not a type we can pivot on.")); };
    inp.addEventListener("input", go); go();
    put(box, h("p.muted.small", "Links only. Nothing is looked up until you click, and each opens in a new tab without a referrer."), inp, o);
  } else if (t === "headers") {
    inp.placeholder = "Paste the full email headers (in Outlook: File, Properties, Internet headers)"; inp.classList.add("tall");
    inp.value = "Return-Path: <bounce@mailer-x.top>\nReceived: from mailer-x.top (unknown [203.0.113.50]) by mx.corp.example\nAuthentication-Results: mx.corp.example; spf=fail smtp.mailfrom=mailer-x.top; dkim=none; dmarc=fail header.from=paypal.com\nFrom: \"PayPal Service\" <service@paypal.com>\nReply-To: helpdesk@paypa1-support.top\nSubject: Your account is limited\nMessage-ID: <abc123@mailer-x.top>";
    run(headers);
    put(box, h("p.muted.small", "Reads the authentication results, the sender chain and the classic mismatches. Parsed in your browser."), inp, out);
  } else if (t === "url") {
    inp.placeholder = "Paste a URL (defanged is fine)"; inp.value = "hxxps://login.microsoftonline.com.secure-verify[.]top:8443/common/oauth2/authorize?client_id=abc&redirect_uri=https%3A%2F%2Fevil.example%2Fcb#frag";
    run((v) => { const u = new URL(refang(v).trim()); const parts = u.hostname.split("."); const reg = parts.slice(-2).join(".");
      const q = [...u.searchParams].map(([k, val]) => `  ${k} = ${val}`).join("\n");
      return `Scheme:      ${u.protocol.replace(":", "")}\nHost:        ${u.hostname}\nReal owner:  ${reg}  (read hosts right to left)\nPort:        ${u.port || "default"}\nPath:        ${decodeURIComponent(u.pathname)}\n${q ? "Parameters:\n" + q + "\n" : ""}${u.hash ? "Fragment:    " + u.hash + "\n" : ""}${u.username ? "User info:   " + u.username + "  (text before @ is ignored by browsers: a classic trick)\n" : ""}\nSafe to share: ${defang(u.href)}`; });
    put(box, h("p.muted.small", "Splits a URL into parts and shows who really owns the host."), inp, out);
  } else if (t === "look") {
    inp.placeholder = "A domain, e.g. xn--pple-43d.com or rnicrosoft-login.co"; inp.value = "xn--pple-43d.com";
    run((v) => { const host = (() => { const x = refang(v).trim(); try { return new URL(x.includes("://") ? x : "http://" + x).hostname; } catch { return x; } })(); const r = homograph(host);
      return `Domain:  ${host}\n\n${r.notes.length ? r.notes.map((x) => "• " + x).join("\n") : "Nothing obviously deceptive. Still check the registration date with the TI pivots."}`; });
    put(box, h("p.muted.small", "Checks for punycode, mixed alphabets, brand lookalikes and security-sounding bolt-ons."), inp, out);
  } else if (t === "jwt") {
    inp.placeholder = "Paste a JWT (header.payload.signature)";
    // Built at runtime so no token-shaped string lives in the source (secret scanners rightly flag those).
    const b64u = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    inp.value = `${b64u({ alg: "none", typ: "JWT" })}.${b64u({ sub: "kevin", role: "admin", exp: 1700000000 })}.`;
    run((v) => { const [a, b] = v.trim().split("."); const dec = (x) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(x.length / 4) * 4, "=")), (c) => c.charCodeAt(0))));
      const hd = dec(a), pl = dec(b); const notes = [];
      if (String(hd.alg).toLowerCase() === "none") notes.push("alg is 'none': unsigned. Any server accepting this is broken.");
      for (const k of ["exp", "iat", "nbf"]) if (typeof pl[k] === "number") notes.push(`${k}: ${new Date(pl[k] * 1000).toISOString()}${k === "exp" && pl[k] * 1000 < Date.now() ? " (expired)" : ""}`);
      return `Header:\n${JSON.stringify(hd, null, 2)}\n\nPayload:\n${JSON.stringify(pl, null, 2)}${notes.length ? "\n\n" + notes.map((x) => "• " + x).join("\n") : ""}\n\nThe signature is not checked: decoding is not verifying.`; });
    put(box, h("p.warn", "Tokens are live credentials. Only paste expired or test tokens."), inp, out);
  } else if (t === "cidr") {
    inp.placeholder = "CIDR, optionally followed by an IP to test, e.g. 10.20.0.0/22 10.20.3.7"; inp.value = "10.20.0.0/22 10.20.3.7";
    run((v) => { const [cidr, test] = v.trim().split(/\s+/); const [ip, bits = "32"] = cidr.split("/"); const n = +bits;
      const toI = (x) => { const p = x.split(".").map(Number); if (p.length !== 4 || p.some((o) => !(o >= 0 && o <= 255))) throw new Error("not an IPv4 address"); return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]; };
      const toS = (i) => [24, 16, 8, 0].map((s) => (i >>> s) & 255).join("."); if (!(n >= 0 && n <= 32)) throw new Error("prefix must be 0 to 32");
      const mask = n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0; const net = (toI(ip) & mask) >>> 0; const bc = (net | (~mask >>> 0)) >>> 0; const size = 2 ** (32 - n);
      let o = `Network:    ${toS(net)}/${n}\nNetmask:    ${toS(mask)}\nFirst host: ${toS(n >= 31 ? net : net + 1)}\nLast host:  ${toS(n >= 31 ? bc : bc - 1)}\nBroadcast:  ${toS(bc)}\nAddresses:  ${size.toLocaleString()}`;
      if (test) o += `\n\n${test} is ${((toI(test) & mask) >>> 0) === net ? "INSIDE" : "outside"} this range.`; return o; });
    put(box, h("p.muted.small", "IPv4 subnet maths, and a quick 'is this IP in that range?' check."), inp, out);
  } else if (t === "time") {
    inp.placeholder = "1795449564 or 1795449564569 or 2026-11-23T08:00:00Z"; inp.value = String(Math.floor(Date.now() / 1000));
    run((v) => { v = v.trim(); if (!v) return ""; let d = /^\d{10}$/.test(v) ? new Date(+v * 1000) : /^\d{13}$/.test(v) ? new Date(+v) : /^\d{18}$/.test(v) ? new Date((+v / 1e4) - 11644473600000) : new Date(v);
      if (isNaN(d)) throw new Error("not a date or epoch"); return `UTC:      ${d.toISOString()}\nLocal:    ${d.toString()}\nEpoch s:  ${Math.floor(d / 1000)}\nEpoch ms: ${+d}\nAge:      ${fmtDur(Math.abs(Date.now() - d))} ${d > Date.now() ? "from now" : "ago"}`; });
    put(box, h("p.muted.small", "Paste epoch seconds, milliseconds, Windows FILETIME (18 digits) or an ISO date."), inp, out);
  } else if (t === "defang") {
    inp.placeholder = "Paste URLs, domains or IPs, one per line"; inp.value = "https://evil.example/login\n198.51.100.7";
    run((v) => v.split("\n").map((l) => /\[\.\]|hxxp/i.test(l) ? l.replace(/\[\.\]/g, ".").replace(/hxxp/gi, "http").replace(/\[:\]/g, ":") : l.replace(/\./g, "[.]").replace(/^http/i, "hxxp")).join("\n"));
    put(box, h("p.muted.small", "Defanged IOCs can't be clicked by accident. Already defanged? It refangs them."), inp, out);
  } else if (t === "decode") {
    inp.placeholder = "Base64, URL-encoded or hex"; inp.value = "SGVsbG8gZnJvbSB0aGUgU09D";
    run((v) => { v = v.trim(); const res = []; const printable = (s) => s.replace(/[^\x20-\x7e\n\t]/g, "·");
      if (/^[A-Za-z0-9+/=\s_-]+$/.test(v) && v.replace(/\s/g, "").length % 4 !== 1) { try { const bin = atob(v.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/")); res.push("Base64 → " + printable(bin)); let u = ""; for (let i = 0; i + 1 < bin.length; i += 2) u += String.fromCharCode(bin.charCodeAt(i) | (bin.charCodeAt(i + 1) << 8)); if (/^[\x20-\x7e\s]+$/.test(u)) res.push("Base64 (UTF-16LE, PowerShell -enc) → " + u); } catch { /* not base64 */ } }
      if (/%[0-9a-f]{2}/i.test(v)) { try { res.push("URL → " + decodeURIComponent(v)); } catch { /* bad */ } }
      if (/^(0x)?([0-9a-f]{2}\s?)+$/i.test(v)) res.push("Hex → " + printable(v.replace(/^0x|\s/gi, "").match(/../g).map((x) => String.fromCharCode(parseInt(x, 16))).join("")));
      return res.join("\n\n") || "Doesn't look like base64, URL encoding or hex."; });
    put(box, h("p.muted.small", "Decodes in your browser. Nothing is executed. Never paste real case data into online decoders."), inp, out);
  } else {
    inp.placeholder = "Paste a hash"; inp.value = "44d88612fea8a8f36de82e1278abb02f";
    run((v) => { v = v.trim(); const L = { 32: "MD5 (or NTLM)", 40: "SHA-1", 56: "SHA-224", 64: "SHA-256", 96: "SHA-384", 128: "SHA-512" };
      if (/^\$2[aby]\$/.test(v)) return "bcrypt"; if (/^\$argon2/.test(v)) return "Argon2"; if (/^\$6\$/.test(v)) return "SHA-512 crypt (Linux /etc/shadow)";
      if (!/^[0-9a-f]+$/i.test(v)) return "Not a hex hash."; return `${v.length} hex characters → ${L[v.length] || "unknown length"}`; });
    put(box, h("p.muted.small", "Identify a hash by its length and format."), inp, out);
  }
}
