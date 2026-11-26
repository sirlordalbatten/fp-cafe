// Indicator helpers shared by the Lounge quick lookup and the analyst toolbox.
// Nothing here sends data anywhere: we only build links the analyst chooses to open.

export const refang = (s) => String(s || "").trim()
  .replace(/\[\.\]|\(\.\)|\{\.\}|\[dot\]|\(dot\)/gi, ".")
  .replace(/\[:\]|\[:\/\/\]/g, (m) => (m === "[:]" ? ":" : "://"))
  .replace(/^hxxp(s?)/i, "http$1").replace(/^fxp/i, "ftp")
  .replace(/\[@\]|\[at\]|\(at\)/gi, "@");

export const defang = (s) => String(s || "")
  .replace(/^http/i, "hxxp").replace(/\./g, "[.]").replace(/@/g, "[@]");

const RX = {
  ipv4: /^(25[0-5]|2[0-4]\d|1?\d?\d)(\.(25[0-5]|2[0-4]\d|1?\d?\d)){3}$/,
  ipv6: /^[0-9a-f:]{2,39}$/i,
  md5: /^[a-f0-9]{32}$/i, sha1: /^[a-f0-9]{40}$/i, sha256: /^[a-f0-9]{64}$/i,
  cve: /^CVE-\d{4}-\d{4,7}$/i,
  email: /^[^\s@]{1,64}@[a-z0-9.-]+\.[a-z]{2,}$/i,
  url: /^(https?|ftp):\/\/[^\s]+$/i,
  domain: /^(?=.{4,253}$)([a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(xn--[a-z0-9-]{2,59}|[a-z]{2,24})$/i,
  attack: /^T\d{4}(\.\d{3})?$/i,
};

/** Returns { type, value } for a pasted indicator (refanged), or { type: "unknown" }. */
export function classify(raw) {
  const v = refang(raw).replace(/^["'<(]+|[">)',;]+$/g, "");
  if (!v) return { type: "empty", value: "" };
  if (RX.cve.test(v)) return { type: "cve", value: v.toUpperCase() };
  if (RX.attack.test(v)) return { type: "attack", value: v.toUpperCase() };
  if (RX.ipv4.test(v)) return { type: "ip", value: v, private: isPrivate4(v) };
  if (RX.sha256.test(v)) return { type: "sha256", value: v.toLowerCase() };
  if (RX.sha1.test(v)) return { type: "sha1", value: v.toLowerCase() };
  if (RX.md5.test(v)) return { type: "md5", value: v.toLowerCase() };
  if (RX.url.test(v)) { try { const u = new URL(v); return { type: "url", value: v, host: u.hostname }; } catch { /* fall through */ } }
  if (RX.email.test(v)) return { type: "email", value: v, host: v.split("@")[1].toLowerCase() };
  if (v.includes(":") && RX.ipv6.test(v) && v.split(":").length > 2) return { type: "ip6", value: v.toLowerCase() };
  if (RX.domain.test(v)) return { type: "domain", value: v.toLowerCase() };
  return { type: "unknown", value: v };
}

export function isPrivate4(ip) {
  const [a, b] = ip.split(".").map(Number);
  return a === 10 || a === 127 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || (a === 169 && b === 254) || (a === 100 && b >= 64 && b <= 127) || a === 0 || a >= 224;
}

export const TYPE_NAME = { cve: "CVE", attack: "ATT&CK technique", ip: "IPv4 address", ip6: "IPv6 address", sha256: "SHA-256 hash", sha1: "SHA-1 hash", md5: "MD5 hash", url: "URL", email: "Email address", domain: "Domain", unknown: "Not sure what this is", empty: "" };

/** Pivot links for an indicator: [label, https url, what it tells you]. */
export function pivots(ind) {
  const e = encodeURIComponent; const v = ind.value; const out = [];
  const add = (l, u, why) => out.push([l, u, why]);
  switch (ind.type) {
    case "ip": case "ip6":
      add("VirusTotal", `https://www.virustotal.com/gui/ip-address/${e(v)}`, "Vendor verdicts, passive DNS, files talking to it");
      add("AbuseIPDB", `https://www.abuseipdb.com/check/${e(v)}`, "Community abuse reports and confidence score");
      add("GreyNoise", `https://viz.greynoise.io/ip/${e(v)}`, "Is it just an internet-wide scanner (background noise)?");
      add("Shodan", `https://www.shodan.io/host/${e(v)}`, "Open ports and what's running there");
      add("OTX", `https://otx.alienvault.com/indicator/ip/${e(v)}`, "Community threat pulses mentioning it");
      add("Talos", `https://talosintelligence.com/reputation_center/lookup?search=${e(v)}`, "Cisco reputation and owner");
      add("ThreatFox", `https://threatfox.abuse.ch/browse.php?search=ioc%3A${e(v)}`, "Known C2 or malware infrastructure");
      break;
    case "domain":
      add("VirusTotal", `https://www.virustotal.com/gui/domain/${e(v)}`, "Verdicts, resolutions, subdomains");
      add("urlscan", `https://urlscan.io/domain/${e(v)}`, "Screenshots of past scans: what the page looked like");
      add("crt.sh", `https://crt.sh/?q=${e(v)}`, "Certificates issued: when was it set up, sibling names");
      add("ICANN lookup", `https://lookup.icann.org/en/lookup?name=${e(v)}`, "Registration date and registrar. A days-old domain is a red flag");
      add("OTX", `https://otx.alienvault.com/indicator/domain/${e(v)}`, "Community threat pulses");
      add("URLhaus", `https://urlhaus.abuse.ch/browse.php?search=${e(v)}`, "Malware download URLs on this host");
      add("Talos", `https://talosintelligence.com/reputation_center/lookup?search=${e(v)}`, "Web and email reputation");
      add("Wayback Machine", `https://web.archive.org/web/*/${e(v)}/*`, "What it served in the past. Old pages and scripts can leak secrets");
      add("Code that mentions it", `https://github.com/search?q=%22${e(v)}%22&type=code`, "Public repos referencing the domain");
      break;
    case "url":
      add("urlscan search", `https://urlscan.io/search/#${e('page.url:"' + v + '"')}`, "Has anyone already scanned this exact URL?");
      add("VirusTotal", `https://www.virustotal.com/gui/search/${e(v)}`, "Vendor verdicts for the URL");
      add("URLhaus", `https://urlhaus.abuse.ch/browse.php?search=${e(v)}`, "Known malware distribution URL?");
      if (ind.host) { add("Host on VirusTotal", `https://www.virustotal.com/gui/domain/${e(ind.host)}`, "Reputation of the host itself"); add("Host on crt.sh", `https://crt.sh/?q=${e(ind.host)}`, "Certificate history of the host"); }
      break;
    case "sha256": case "sha1": case "md5":
      add("VirusTotal", `https://www.virustotal.com/gui/file/${e(v)}`, "Detections, first seen, behaviour");
      add("MalwareBazaar", `https://bazaar.abuse.ch/browse.php?search=${e((ind.type === "sha256" ? "sha256" : ind.type) + ":" + v)}`, "Sample with family tag, if shared");
      add("Hybrid Analysis", `https://www.hybrid-analysis.com/search?query=${e(v)}`, "Sandbox reports");
      add("OTX", `https://otx.alienvault.com/indicator/file/${e(v)}`, "Community threat pulses");
      add("ThreatFox", `https://threatfox.abuse.ch/browse.php?search=ioc%3A${e(v)}`, "Linked malware family");
      break;
    case "email":
      add("Sender domain on VirusTotal", `https://www.virustotal.com/gui/domain/${e(ind.host)}`, "Is the sending domain known bad?");
      add("Sender domain age", `https://lookup.icann.org/en/lookup?name=${e(ind.host)}`, "Brand-new sender domains are a classic phish tell");
      add("MXToolbox blocklists", `https://mxtoolbox.com/SuperTool.aspx?action=blacklist%3a${e(ind.host)}`, "Is the domain on email blocklists?");
      break;
    case "cve":
      add("NVD", `https://nvd.nist.gov/vuln/detail/${e(v)}`, "Description, CVSS, affected versions");
      add("CISA KEV", `https://www.cisa.gov/known-exploited-vulnerabilities-catalog?search_api_fulltext=${e(v)}`, "Is it exploited in the wild?");
      add("EPSS", `https://api.first.org/data/v1/epss?cve=${e(v)}`, "Probability of exploitation in the next 30 days");
      add("GitHub advisories", `https://github.com/advisories?query=${e(v)}`, "Package versions affected and fixed");
      break;
    case "attack":
      add("MITRE ATT&CK", `https://attack.mitre.org/techniques/${v.replace(".", "/")}/`, "Technique, procedures, detections");
      add("Sigma rules", `https://github.com/search?q=repo%3ASigmaHQ%2Fsigma+${e(v.toLowerCase())}&type=code`, "Community detections tagged with it");
      add("Atomic Red Team", `https://github.com/redcanaryco/atomic-red-team/blob/master/atomics/${e(v)}/${e(v)}.md`, "Safe tests to check your detection fires");
      break;
  }
  return out;
}

/** Pull every indicator out of free text (alerts, emails, reports). */
export function extract(text) {
  const t = refang(String(text || "").slice(0, 200000)).replace(/hxxp/gi, "http").replace(/\[\.\]/g, ".");
  const uniq = (a) => [...new Set(a)];
  const urls = uniq(t.match(/\b(?:https?|ftp):\/\/[^\s<>"'`)\]]+/gi) || []).map((u) => u.replace(/[.,;:]+$/, ""));
  const emails = uniq(t.match(/\b[A-Z0-9._%+-]{1,64}@[A-Z0-9.-]+\.[A-Z]{2,24}\b/gi) || []);
  const ips = uniq(t.match(/\b(?:(?:25[0-5]|2[0-4]\d|1?\d?\d)\.){3}(?:25[0-5]|2[0-4]\d|1?\d?\d)\b/g) || []);
  const sha256 = uniq(t.match(/\b[a-f0-9]{64}\b/gi) || []);
  const sha1 = uniq(t.match(/\b[a-f0-9]{40}\b/gi) || []).filter((x) => !sha256.some((s) => s.includes(x)));
  const md5 = uniq(t.match(/\b[a-f0-9]{32}\b/gi) || []).filter((x) => !sha256.some((s) => s.includes(x)) && !sha1.some((s) => s.includes(x)));
  const cves = uniq((t.match(/\bCVE-\d{4}-\d{4,7}\b/gi) || []).map((x) => x.toUpperCase()));
  const hostsInUrls = new Set(urls.map((u) => { try { return new URL(u).hostname; } catch { return ""; } }));
  const FILEEXT = /\.(exe|dll|ps1|bat|js|vbs|zip|rar|7z|iso|img|lnk|doc|docx|xls|xlsx|xlsm|pdf|txt|log|png|jpg|gif|html?|php|aspx?|json|xml|csv|eml|msg|hta|scr|one|msi|cab|sys|tmp|dat)$/i;
  const domains = uniq((t.match(/\b(?:[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?\.)+(?:xn--[a-z0-9-]{2,59}|[a-z]{2,24})\b/gi) || []).map((d) => d.toLowerCase()))
    .filter((d) => !FILEEXT.test(d) && !RX.ipv4.test(d) && !emails.some((m) => m.toLowerCase().endsWith("@" + d)) && !hostsInUrls.has(d) && /[a-z]/.test(d.split(".").pop()));
  return { urls, domains, ips, emails, sha256, sha1, md5, cves };
}

/** Unwrap Microsoft SafeLinks, Proofpoint URL Defense (v1/v2/v3), Mimecast-style, Google and generic ?url= redirects. Returns [steps]. */
export function unwrap(input) {
  const steps = []; let cur = refang(input).trim();
  for (let i = 0; i < 6; i++) {
    let next = null, how = "";
    let u; try { u = new URL(cur); } catch { break; }
    const host = u.hostname.toLowerCase(); const q = u.searchParams;
    if (/safelinks\.protection\.outlook\.com$/.test(host) && q.get("url")) { next = q.get("url"); how = "Microsoft Defender SafeLinks"; }
    else if (host === "urldefense.com" && /^\/v3\/__/.test(u.pathname)) { next = pp3(cur); how = "Proofpoint URL Defense v3"; }
    else if ((host === "urldefense.proofpoint.com" || host === "urldefense.com") && u.pathname.startsWith("/v2/") && q.get("u")) {
      next = q.get("u").replace(/-/g, "%").replace(/_/g, "/"); try { next = decodeURIComponent(next); } catch { /* leave */ } how = "Proofpoint URL Defense v2"; }
    else if ((host === "urldefense.proofpoint.com") && u.pathname.startsWith("/v1/") && q.get("u")) { next = q.get("u"); how = "Proofpoint URL Defense v1"; }
    else if (/(^|\.)google\.[a-z.]+$/.test(host) && u.pathname === "/url" && (q.get("q") || q.get("url"))) { next = q.get("q") || q.get("url"); how = "Google redirect"; }
    else if (/linkprotect\.cudasvc\.com$/.test(host) && q.get("a")) { next = q.get("a"); how = "Barracuda Link Protection"; }
    else if (/(^|\.)l\.facebook\.com$|(^|\.)lm\.facebook\.com$/.test(host) && q.get("u")) { next = q.get("u"); how = "Facebook link shim"; }
    else if (/(^|\.)t\.co$/.test(host)) { break; }
    else { const k = ["url", "u", "target", "redirect", "redirect_uri", "dest", "destination", "r", "link", "goto"].find((k) => /^https?:\/\//i.test(q.get(k) || "")); if (k) { next = q.get(k); how = `Redirect parameter "${k}"`; } }
    if (!next || next === cur) break;
    steps.push({ how, from: cur, to: next }); cur = next;
  }
  return { final: cur, steps };
}
function pp3(s) {
  // https://urldefense.com/v3/__<url>__;<base64 replacement chars>!!<token>
  const m = s.match(/\/v3\/__(.+?)__;(.*?)!/); if (!m) { const n = s.match(/\/v3\/__(.+?)__/); return n ? n[1] : null; }
  let url = m[1]; let rep = ""; try { rep = atob(m[2].replace(/-/g, "+").replace(/_/g, "/")); } catch { rep = ""; }
  const chars = [...new TextDecoder().decode(Uint8Array.from(rep, (c) => c.charCodeAt(0)))]; let i = 0;
  url = url.replace(/\*(\*.)?/g, (mm) => { if (mm.length === 1) return chars[i++] || ""; const n = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_".indexOf(mm[2]) + 2; const out = chars.slice(i, i + n).join(""); i += n; return out; });
  return url;
}

// RFC 3492 punycode decoder, enough to show what an xn-- label really says.
function puny(label) {
  const base = 36, tmin = 1, tmax = 26, skew = 38, damp = 700; let n = 128, i = 0, bias = 72; const out = [];
  let s = label; const d = s.lastIndexOf("-"); if (d > 0) { for (const ch of s.slice(0, d)) out.push(ch.charCodeAt(0)); s = s.slice(d + 1); } else if (d === 0) s = s.slice(1);
  const adapt = (delta, num, first) => { delta = first ? Math.floor(delta / damp) : delta >> 1; delta += Math.floor(delta / num); let k = 0; while (delta > ((base - tmin) * tmax) >> 1) { delta = Math.floor(delta / (base - tmin)); k += base; } return k + Math.floor(((base - tmin + 1) * delta) / (delta + skew)); };
  for (let p = 0; p < s.length;) {
    const oldi = i; let w = 1;
    for (let k = base; ; k += base) {
      const c = s.charCodeAt(p++); const dg = c - 48 < 10 ? c - 22 : c - 65 < 26 ? c - 65 : c - 97 < 26 ? c - 97 : base; if (dg >= base) throw new Error("bad punycode");
      i += dg * w; const t = k <= bias ? tmin : k >= bias + tmax ? tmax : k - bias; if (dg < t) break; w *= base - t;
    }
    bias = adapt(i - oldi, out.length + 1, oldi === 0); n += Math.floor(i / (out.length + 1)); i %= out.length + 1; out.splice(i++, 0, n);
  }
  return String.fromCodePoint(...out);
}
export const toUnicode = (host) => host.split(".").map((l) => { if (!/^xn--/i.test(l)) return l; try { return puny(l.slice(4).toLowerCase()); } catch { return l; } }).join(".");
const CONFUSE = { "а": "a", "е": "e", "о": "o", "р": "p", "с": "c", "у": "y", "х": "x", "і": "i", "ј": "j", "ѕ": "s", "ԁ": "d", "һ": "h", "ԛ": "q", "ԝ": "w", "ɑ": "a", "ο": "o", "ν": "v", "ρ": "p", "τ": "t", "ι": "i", "κ": "k", "α": "a", "ε": "e", "ℓ": "l", "ı": "i" };

const KNOWN = new Set(["microsoft.com", "microsoftonline.com", "office.com", "office365.com", "outlook.com", "live.com", "sharepoint.com", "onedrive.com", "onmicrosoft.com", "azure.com", "windows.net", "apple.com", "icloud.com", "google.com", "gmail.com", "googleusercontent.com", "amazon.com", "amazonaws.com", "paypal.com", "docusign.com", "docusign.net", "dropbox.com", "adobe.com", "linkedin.com", "okta.com", "netflix.com", "dhl.com", "fedex.com", "wellsfargo.com", "chase.com", "github.com", "zoom.us", "slack.com", "facebook.com", "instagram.com"]);
/** Mixed-script / lookalike check for a hostname (punycode-aware). */
export function homograph(input) {
  const notes = []; const host = toUnicode(input.toLowerCase()); const shown = host;
  const labels = input.split(".");
  if (labels.some((l) => /^xn--/i.test(l))) notes.push(`Contains punycode (xn--). It actually reads "${host}". The browser may show it like that, so compare carefully.`);
  const scripts = new Set(); for (const ch of host) { const c = ch.codePointAt(0); if (c < 128) continue; scripts.add(c >= 0x400 && c <= 0x4ff ? "Cyrillic" : c >= 0x370 && c <= 0x3ff ? "Greek" : c >= 0x530 && c <= 0x58f ? "Armenian" : "other non-Latin"); }
  if (scripts.size) notes.push(`Uses ${[...scripts].join(", ")} characters that can look like Latin letters.`);
  const skel = [...host.toLowerCase()].map((ch) => CONFUSE[ch] || ch).join("").replace(/rn/g, "m").replace(/vv/g, "w").replace(/0/g, "o").replace(/1|l/g, "i").replace(/5/g, "s").replace(/\$/g, "s");
  const BRANDS = ["microsoft", "office", "outlook", "office365", "paypal", "apple", "google", "amazon", "docusign", "dropbox", "adobe", "linkedin", "okta", "netflix", "dhl", "fedex", "wellsfargo", "chase", "onedrive", "sharepoint", "github", "zoom", "slack", "facebook", "instagram"];
  const reg = host.toLowerCase().split(".").slice(-2).join(".");
  const hit = KNOWN.has(reg) ? [] : BRANDS.filter((b) => skel.includes(b.replace(/l/g, "i")));
  if (hit.length) notes.push(`Looks like it imitates ${hit.slice(0, 3).join(", ")} but isn't that brand's own domain.`);
  if (/-(login|secure|verify|account|update|support|signin)|(login|secure|verify|account|signin)-/.test(host)) notes.push("Has a security-sounding word bolted on (login-, secure-, verify-). Real brands rarely do this.");
  if (labels.length > 4) notes.push(`Deep subdomain (${labels.length} labels). Read it right to left: the real owner is the last two parts.`);
  return { shown, notes };
}
