// Log parser for the Toolbox. Turns pasted raw logs into rows with the fields an analyst needs,
// whatever the source. Runs only in the browser and never evaluates anything it reads.

export const COLS = [["time", "Time"], ["host", "Host"], ["user", "User"], ["src_ip", "Source IP"], ["src_port", "Src port"], ["dst_ip", "Dest IP"], ["dst_port", "Dest port"],
  ["event", "Event"], ["action", "Outcome"], ["process", "Process"], ["parent", "Parent"], ["cmd", "Command line"], ["method", "Method"], ["url", "URL / path"], ["status", "Status"],
  ["bytes", "Bytes"], ["ua", "User agent"], ["hash", "Hash"], ["country", "Country"], ["msg", "Message"]];

// Which source keys feed which column. Compared lower-case, dots and underscores ignored.
const ALIAS = {
  time: ["timestamp", "@timestamp", "timegenerated", "time", "eventtime", "timecreated", "createddatetime", "published", "ts", "date", "datetime", "rt", "start", "eventtimestamp", "generatedtime", "receivedtime"],
  host: ["host", "hostname", "computer", "computername", "dvchost", "devname", "devicename", "device", "workstationname", "agenthostname", "hostname1", "shost"],
  user: ["targetusername", "username", "user", "userprincipalname", "useridentityusername", "useridentityarn", "actoralternateid", "actordisplayname", "suser", "duser", "account", "accountname", "subjectusername", "usr", "srcuser", "login"],
  src_ip: ["sourceipaddress", "ipaddress", "srcip", "src", "srcaddr", "sourceip", "sourceaddress", "clientip", "clientipaddress", "clientaddress", "idorigh", "cip", "remoteaddr", "remoteip", "callerip", "sourceipv4", "clientipaddress1", "requestclientip"],
  src_port: ["srcport", "sourceport", "spt", "idorigp", "ipport", "clientport", "sport"],
  dst_ip: ["destinationip", "dstip", "dst", "destinationaddress", "destip", "idresph", "dstaddr", "serverip", "destinationipaddress", "daddr"],
  dst_port: ["destinationport", "dstport", "dpt", "idrespp", "destport", "dport", "serverport"],
  event: ["eventid", "eventname", "eventtype", "event", "eventcode", "signature", "displaymessage", "operationname", "name", "category", "type", "logid", "subtype", "eventcategory"],
  action: ["action", "act", "outcome", "outcomeresult", "result", "resulttype", "status", "statuserrorcode", "errorcode", "disposition", "keywords", "resultdescription", "auditresult"],
  process: ["image", "newprocessname", "processname", "process", "processpath", "exe", "executable", "app", "application", "sproc"],
  parent: ["parentimage", "parentprocessname", "parentprocess", "creatorprocessname"],
  cmd: ["commandline", "processcommandline", "cmd", "cmdline", "command", "scriptblocktext"],
  method: ["method", "httpmethod", "requestmethod", "requestmethod1", "csmethod"],
  url: ["url", "uri", "request", "requesturi", "requesturl", "path", "csuristem", "requestpath", "resource", "destinationurl", "targeturl", "requestparametersbucketname"],
  status: ["httpstatus", "statuscode", "responsecode", "scstatus", "httpstatuscode", "responseelementsstatus"],
  bytes: ["bytes", "bytessent", "bytesout", "sentbytes", "scbytes", "out", "responsebytes", "bodybytessent"],
  ua: ["useragent", "httpuseragent", "csuseragent", "requestuseragent", "clientuseragent", "requestclientuseragent", "uastring"],
  hash: ["sha256", "hashes", "hash", "filehash", "md5", "sha1", "filehashsha256"],
  country: ["country", "countrycode", "locationcountryorregion", "srccountry", "geocountry", "clientgeographicalcontextcountry", "sourcecountry"],
  msg: ["message", "msg", "description", "reason", "details"],
};
const LOOK = {}; for (const [col, keys] of Object.entries(ALIAS)) keys.forEach((k, i) => { if (!(k in LOOK) || LOOK[k][1] > i) LOOK[k] = [col, i]; });
const norm = (k) => String(k).toLowerCase().replace(/[^a-z0-9@]/g, "");

function flatten(o, pre = "", out = {}, depth = 0) {
  if (depth > 6) return out;
  for (const [k, v] of Object.entries(o || {})) {
    const key = pre ? pre + "." + k : k;
    if (v && typeof v === "object" && !Array.isArray(v)) flatten(v, key, out, depth + 1);
    else if (Array.isArray(v)) out[key] = v.map((x) => (typeof x === "object" ? JSON.stringify(x) : String(x))).join(", ").slice(0, 2000);
    else if (v !== null && v !== undefined && v !== "") out[key] = String(v).slice(0, 2000);
  }
  return out;
}
// Pick normalised columns from a flat field map. Exact alias first, then the last path segment.
export function toRow(fields, extra = {}) {
  const row = { ...extra }; const rank = {};
  for (const [k, v] of Object.entries(fields)) {
    if (v === "" || v === "-") continue;
    for (const cand of [norm(k), norm(k.split(".").pop())]) {
      const hit = LOOK[cand]; if (!hit) continue;
      const [col, pri] = hit; const p = cand === norm(k) ? pri : pri + 50;
      if (!(col in row) || (col in rank && p < rank[col])) { row[col] = v; rank[col] = p; }
      break;
    }
  }
  const dk = Object.keys(fields).find((k) => norm(k) === "date"), tk = Object.keys(fields).find((k) => norm(k) === "time");
  if (dk && tk && /^\d{4}-\d\d-\d\d$/.test(fields[dk]) && /^\d\d:\d\d/.test(fields[tk])) row.time = `${fields[dk]} ${fields[tk]}`;
  if (row.hash && /SHA256=([A-F0-9]{64})/i.test(row.hash)) row.hash = row.hash.match(/SHA256=([A-F0-9]{64})/i)[1].toLowerCase();
  if (row.src_ip && /:\d+$/.test(row.src_ip) && /^\d+\.\d+\.\d+\.\d+:\d+$/.test(row.src_ip)) { const [ip, p] = row.src_ip.split(":"); row.src_ip = ip; row.src_port = row.src_port || p; }
  row._f = fields;
  return row;
}

// ---------- format parsers ----------
function parseJson(text) {
  let data;
  try { data = JSON.parse(text); } catch {
    const lines = text.split(/\r?\n/).filter((l) => l.trim());
    data = []; for (const l of lines) { try { data.push(JSON.parse(l)); } catch { return null; } }
  }
  if (!Array.isArray(data)) data = data?.Records || data?.records || data?.value || data?.data || data?.events || data?.hits?.hits?.map((x) => x._source) || [data];
  const objs = data.filter((x) => x && typeof x === "object");
  if (!objs.length) return null;
  const first = objs[0]; let fmt = "JSON";
  if ("eventName" in first && "eventSource" in first) fmt = "AWS CloudTrail";
  else if ("userPrincipalName" in first && ("ipAddress" in first || "createdDateTime" in first)) fmt = "Microsoft Entra sign-in";
  else if ("actor" in first && "eventType" in first && "outcome" in first) fmt = "Okta System Log";
  else if ("protoPayload" in first) fmt = "Google Cloud audit";
  else if ("ts" in first && "id.orig_h" in first) fmt = "Zeek (JSON)";
  else if ("@timestamp" in first) fmt = "Elastic / ECS";
  return { fmt, rows: objs.slice(0, 5000).map((o) => toRow(flatten(o))) };
}
function parseXml(text) {
  if (!/<Event[\s>]/.test(text)) return null;
  const doc = new DOMParser().parseFromString(`<Events>${text.replace(/<\?xml[^>]*\?>/g, "")}</Events>`, "application/xml");
  if (doc.querySelector("parsererror")) return null;
  const rows = [];
  for (const ev of doc.getElementsByTagName("Event")) {
    const g = (tag) => ev.getElementsByTagName(tag)[0];
    const f = { EventID: g("EventID")?.textContent || "", TimeCreated: g("TimeCreated")?.getAttribute("SystemTime") || "", Computer: g("Computer")?.textContent || "",
      Channel: g("Channel")?.textContent || "", Provider: g("Provider")?.getAttribute("Name") || "", Keywords: g("Keywords")?.textContent || "" };
    for (const d of ev.getElementsByTagName("Data")) { const n = d.getAttribute("Name"); if (n) f[n] = d.textContent; }
    const row = toRow(f);
    row.event = f.EventID + (EVENT_NAMES[`${/sysmon/i.test(f.Channel + f.Provider) ? "S" : ""}${f.EventID}`] ? " · " + EVENT_NAMES[`${/sysmon/i.test(f.Channel + f.Provider) ? "S" : ""}${f.EventID}`] : "");
    if (f.IpAddress && f.IpAddress !== "-") row.src_ip = f.IpAddress;
    if (f.TargetUserName) row.user = (f.TargetDomainName ? f.TargetDomainName + "\\" : "") + f.TargetUserName;
    if (f.LogonType) row.action = (row.action ? row.action + " · " : "") + "logon type " + f.LogonType;
    if (f.Status && f.Status !== "0x0") row.action = "failure " + f.Status + (f.SubStatus ? "/" + f.SubStatus : "");
    if (f.EventID === "4625") row.action = "failure" + (f.SubStatus ? " " + f.SubStatus : "");
    rows.push(row);
  }
  return rows.length ? { fmt: rows.some((r) => /sysmon/i.test(r._f.Channel + r._f.Provider)) ? "Windows event XML (Sysmon)" : "Windows event XML", rows } : null;
}
const EVENT_NAMES = { 4624: "logon", 4625: "failed logon", 4634: "logoff", 4648: "explicit credentials", 4672: "admin logon", 4688: "process created", 4697: "service installed",
  4698: "task created", 4720: "account created", 4724: "password reset", 4728: "added to global group", 4732: "added to local group", 4740: "locked out", 4768: "Kerberos TGT",
  4769: "Kerberos service ticket", 4771: "Kerberos pre-auth failed", 4776: "NTLM validation", 1102: "audit log cleared", 7045: "service installed", 4104: "script block",
  S1: "process created", S3: "network connection", S7: "image loaded", S8: "remote thread", S10: "process access", S11: "file created", S13: "registry set", S22: "DNS query" };

const SYSLOG = /^(?:<\d+>)?(?:\d+ )?((?:[A-Z][a-z]{2}\s+\d{1,2}\s\d\d:\d\d:\d\d)|(?:\d{4}-\d\d-\d\dT[\d:.]+(?:Z|[+-]\d\d:?\d\d)?))\s+(\S+)\s+([\w./-]+)(?:\[(\d+)\])?:\s?(.*)$/;
function parseSyslog(lines) {
  const rows = []; let hits = 0;
  for (const l of lines) {
    const m = l.match(SYSLOG); if (!m) { rows.push(toRow({ message: l })); continue; }
    hits++;
    const [, time, host, prog, pid, msg] = m; const r = { time, host, process: prog + (pid ? `[${pid}]` : ""), msg };
    let x;
    if ((x = msg.match(/^(Failed|Accepted) (password|publickey|keyboard-interactive\/pam) for (invalid user )?(\S+) from ([\d.:a-f]+) port (\d+)/i))) Object.assign(r, { action: x[1].toLowerCase() === "failed" ? "failure" : "success", event: `ssh ${x[2]}${x[3] ? " (invalid user)" : ""}`, user: x[4], src_ip: x[5], src_port: x[6] });
    else if ((x = msg.match(/^Invalid user (\S+) from ([\d.:a-f]+)(?: port (\d+))?/i))) Object.assign(r, { action: "failure", event: "ssh invalid user", user: x[1], src_ip: x[2], src_port: x[3] || "" });
    else if ((x = msg.match(/^\s*(\S+) : .*?(?:USER=(\S+) ; )?COMMAND=(.*)$/))) Object.assign(r, { event: "sudo", user: x[1], cmd: x[3], action: /incorrect password|NOT in sudoers/i.test(msg) ? "failure" : "success" });
    else if ((x = msg.match(/session (opened|closed) for user (\S+)/))) Object.assign(r, { event: "session " + x[1], user: x[2].replace(/\(.*$/, "") });
    else if ((x = msg.match(/SRC=([\d.]+) DST=([\d.]+).*?PROTO=(\w+)(?:.*?SPT=(\d+) DPT=(\d+))?/))) Object.assign(r, { event: "firewall " + x[3], src_ip: x[1], dst_ip: x[2], src_port: x[4] || "", dst_port: x[5] || "", action: /DROP|REJECT|BLOCK/i.test(msg) ? "blocked" : "" });
    rows.push(toRow({}, r));
  }
  return hits >= Math.max(1, lines.length * 0.5) ? { fmt: "Syslog / Linux auth", rows } : null;
}
const ACCESS = /^(\S+) \S+ (\S+) \[([^\]]+)\] "(\S+) (\S+)(?: (\S+))?" (\d{3}) (\d+|-)(?: "([^"]*)" "([^"]*)")?/;
function parseAccess(lines) {
  const rows = []; let hits = 0;
  for (const l of lines) {
    const m = l.match(ACCESS); if (!m) continue; hits++;
    const [, ip, user, time, method, url, , status, bytes, ref, ua] = m;
    rows.push(toRow({}, { src_ip: ip, user: user === "-" ? "" : user, time, method, url, status, bytes: bytes === "-" ? "" : bytes, ua: ua || "", msg: ref && ref !== "-" ? "referrer " + ref : "" }));
  }
  return hits >= Math.max(1, lines.length * 0.6) ? { fmt: "Web access log (Apache / Nginx)", rows } : null;
}
function kv(s) {
  const out = {}; const rx = /([A-Za-z_][\w.-]*)=("(?:[^"\\]|\\.)*"|(?:(?! [A-Za-z_][\w.-]*=)\S| (?![A-Za-z_][\w.-]*=))*)/g;
  for (const m of s.matchAll(rx)) out[m[1]] = m[2].replace(/^"|"$/g, "").replace(/\\(["\\=])/g, "$1").trim();
  return out;
}
function parseCef(lines) {
  const rows = [];
  for (const l of lines) {
    const i = l.indexOf("CEF:"); const j = l.indexOf("LEEF:");
    if (i >= 0) {
      const parts = l.slice(i + 4).split(/(?<!\\)\|/);
      if (parts.length < 8) continue;
      const ext = kv(parts.slice(7).join("|"));
      rows.push(toRow({ ...ext, vendor: parts[1], product: parts[2], signature: parts[4], name: parts[5], severity: parts[6] }, { event: `${parts[4]} · ${parts[5]}` }));
    } else if (j >= 0) {
      const parts = l.slice(j).split("|"); if (parts.length < 6) continue;
      const body = parts.slice(5).join("|"); const f = {};
      for (const kvp of body.split(/\t|\^/)) { const k = kvp.indexOf("="); if (k > 0) f[kvp.slice(0, k)] = kvp.slice(k + 1); }
      rows.push(toRow({ ...f, vendor: parts[1], product: parts[2] }, { event: parts[4] }));
    }
  }
  return rows.length >= Math.max(1, lines.length * 0.5) ? { fmt: rows[0]._f.signature !== undefined ? "CEF" : "LEEF", rows } : null;
}
function parseKv(lines) {
  const rows = [];
  for (const l of lines) { const f = kv(l); if (Object.keys(f).length >= 3) rows.push(toRow(f)); }
  if (rows.length < Math.max(1, lines.length * 0.6)) return null;
  const f = rows[0]._f;
  return { fmt: "devid" in f || "logid" in f ? "Fortinet (key=value)" : "key=value", rows };
}
function csvSplit(line, d) {
  const out = []; let cur = "", q = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (q) { if (c === '"' && line[i + 1] === '"') { cur += '"'; i++; } else if (c === '"') q = false; else cur += c; }
    else if (c === '"') q = true; else if (c === d) { out.push(cur); cur = ""; } else cur += c;
  }
  out.push(cur); return out;
}
function parseDelimited(lines) {
  if (lines[0].startsWith("#separator") || lines.some((l) => l.startsWith("#fields"))) {
    const fl = lines.find((l) => l.startsWith("#fields")); const names = fl.split(/\t/).slice(1);
    const rows = lines.filter((l) => !l.startsWith("#")).map((l) => { const v = l.split("\t"); const f = {}; names.forEach((n, i) => { if (v[i] && v[i] !== "-") f[n] = v[i]; }); return toRow(f); });
    return rows.length ? { fmt: "Zeek (TSV)", rows } : null;
  }
  for (const d of [",", "\t", ";"]) {
    const head = csvSplit(lines[0], d); if (head.length < 3) continue;
    if (!head.every((x) => /^[\w @().\-/]{1,60}$/.test(x.trim()))) continue;
    const known = head.filter((x) => LOOK[norm(x)]).length; if (known < 2) continue;
    const rows = lines.slice(1).filter((l) => l.trim()).map((l) => { const v = csvSplit(l, d); const f = {}; head.forEach((n, i) => { if (v[i]) f[n.trim()] = v[i]; }); return toRow(f); });
    return rows.length ? { fmt: d === "\t" ? "TSV with header" : "CSV with header", rows } : null;
  }
  return null;
}

/** Detect the format and return { fmt, rows }. */
export function parseLogs(raw) {
  const text = String(raw).trim(); if (!text) return { fmt: "", rows: [] };
  const lines = text.split(/\r?\n/).map((l) => l.trimEnd()).filter(Boolean).slice(0, 5000);
  return (text[0] === "{" || text[0] === "[" ? parseJson(text) : null)
    || (text.includes("<Event") ? parseXml(text) : null)
    || (/CEF:\d|LEEF:/.test(lines[0]) ? parseCef(lines) : null)
    || parseAccess(lines) || parseSyslog(lines) || parseDelimited(lines) || parseKv(lines)
    || { fmt: "Plain text (no structure found)", rows: lines.map((l) => toRow({ message: l })) };
}

// ---------- what stands out ----------
const isFail = (r) => /fail|denied|invalid|0xc000006[ad]|0xc0000064|blocked|wrongpassword|50126|authfail/i.test(`${r.action || ""} ${r.event || ""} ${r.status && +r.status === 401 ? "fail" : ""}`);
export function findings(rows) {
  const out = []; const by = (key, filter = () => true) => { const m = {}; for (const r of rows) if (r[key] && filter(r)) (m[r[key]] = m[r[key]] || []).push(r); return m; };
  for (const [ip, rs] of Object.entries(by("src_ip", isFail))) {
    const users = new Set(rs.map((r) => r.user).filter(Boolean));
    if (users.size >= 5) out.push(`Password spraying: ${ip} failed against ${users.size} different accounts (${rs.length} failures).`);
    else if (rs.length >= 5) out.push(`Brute force: ${rs.length} failed logins from ${ip}${users.size === 1 ? ` against ${[...users][0]}` : ""}.`);
  }
  const fails = by("src_ip", isFail); const ok = by("src_ip", (r) => /success|accepted|^4624/i.test(`${r.action || ""} ${r.event || ""}`));
  for (const ip of Object.keys(ok)) if ((fails[ip] || []).length >= 3) out.push(`${ip} got in after ${(fails[ip] || []).length} failures. Check that account now.`);
  const cmds = rows.filter((r) => r.cmd);
  if (cmds.some((r) => /-e(nc|ncodedcommand)?\s+[A-Za-z0-9+/=]{20,}|frombase64string/i.test(r.cmd))) out.push("Encoded PowerShell in a command line. Decode it in the PowerShell decoder.");
  const lol = cmds.filter((r) => /\b(certutil|mshta|regsvr32|rundll32|bitsadmin|wmic|msbuild|installutil)(\.exe)?\b.*(http|urlcache|scrobj|javascript|\/i:|process call create)/i.test(r.cmd));
  if (lol.length) out.push(`${lol.length} command line${lol.length > 1 ? "s use" : " uses"} a living-off-the-land binary to download or run code.`);
  const office = rows.filter((r) => /(winword|excel|powerpnt|outlook|onenote|msaccess)\.exe/i.test(r.parent || "") && /(powershell|pwsh|cmd|wscript|cscript|mshta|rundll32|regsvr32)\.exe/i.test(r.process || ""));
  if (office.length) out.push(`An Office app started a script interpreter (${office.length}x). Classic malicious-document behaviour.`);
  const bad = rows.filter((r) => ["4444", "50050", "31337", "1337", "6667", "9001"].includes(String(r.dst_port || "")) && !/deny|drop|block|reject/i.test(r.action || ""));
  if (bad.length) out.push(`Allowed traffic to port${new Set(bad.map((r) => r.dst_port)).size > 1 ? "s" : ""} ${[...new Set(bad.map((r) => r.dst_port))].join(", ")}: default ports for Metasploit, Cobalt Strike, IRC bots or Tor.`);
  if (cmds.some((r) => /vssadmin.*delete|wbadmin.*delete|bcdedit.*recoveryenabled/i.test(r.cmd))) out.push("Backups or shadow copies deleted: a classic step right before ransomware encrypts.");
  if (rows.some((r) => /^(1102|104)\b/.test(r.event || ""))) out.push("An event log was cleared. Almost never legitimate.");
  if (rows.some((r) => /^47(20|28|32|56)\b/.test(r.event || ""))) out.push("Accounts created or added to groups. Confirm these were planned changes.");
  if (rows.some((r) => /lsass/i.test(r._f?.TargetImage || "") && /^10\b/.test(r.event || ""))) out.push("Something opened lsass.exe (Sysmon 10). Treat as credential dumping until proven otherwise.");
  const web = rows.filter((r) => r.url);
  const attacks = web.filter((r) => /(union\s+select|'\s*or\s*'?1'?\s*=\s*'?1|<script|%3cscript|\.\.\/|%2e%2e%2f|\/etc\/passwd|\$\{jndi:|cmd=|wp-login\.php|\.env\b|\/\.git\/)/i.test(decodeSafe(r.url)));
  if (attacks.length) out.push(`${attacks.length} web request${attacks.length > 1 ? "s carry" : " carries"} attack patterns (SQL injection, XSS, traversal, Log4Shell or secret-file probes).`);
  const scanners = rows.filter((r) => /sqlmap|nikto|nmap|masscan|zgrab|nuclei|gobuster|ffuf|wpscan|python-requests|go-http-client|curl\//i.test(r.ua || ""));
  if (scanners.length) out.push(`${scanners.length} request${scanners.length > 1 ? "s come" : " comes"} from scanners or scripts (by user agent).`);
  const ct = rows.filter((r) => /^(StopLogging|DeleteTrail|UpdateTrail|PutBucketPolicy|PutBucketAcl|CreateAccessKey|CreateUser|AttachUserPolicy|AuthorizeSecurityGroupIngress|DisableKey|ScheduleKeyDeletion|DeleteDetector|PutEventSelectors)$/.test(r.event || ""));
  if (ct.length) out.push(`${ct.length} sensitive AWS API call${ct.length > 1 ? "s" : ""}: ${[...new Set(ct.map((r) => r.event))].slice(0, 5).join(", ")}.`);
  const st = web.filter((r) => /^4\d\d$/.test(r.status || "")).length;
  if (web.length >= 10 && st / web.length > 0.5) out.push(`${Math.round((st / web.length) * 100)}% of web requests failed (4xx). Typical of scanning or directory brute forcing.`);
  return out;
}
function decodeSafe(s) { try { return decodeURIComponent(s); } catch { return s; } }
export function topValues(rows, key, n = 5) {
  const m = {}; for (const r of rows) if (r[key]) m[r[key]] = (m[r[key]] || 0) + 1;
  return Object.entries(m).sort((a, b) => b[1] - a[1]).slice(0, n);
}
export function toCsv(rows, cols) {
  const esc = (v) => { let s = String(v ?? ""); if (/^[=+\-@\t\r]/.test(s)) s = "'" + s; return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };   // ' stops spreadsheet formula injection
  return [cols.map(([, l]) => l).join(","), ...rows.map((r) => cols.map(([k]) => esc(r[k])).join(","))].join("\n");
}

// ---------- hunt queries ----------
const q = (v) => `"${String(v).replace(/["\\]/g, "")}"`;
const list = (a) => a.map(q).join(", ");
export function huntQueries(x, days = 7) {
  const out = []; const { ips = [], domains = [], urls = [], sha256 = [], sha1 = [], md5 = [], emails = [] } = x;
  const ip = ips.slice(0, 200), dom = domains.slice(0, 200), url = urls.slice(0, 100), em = emails.slice(0, 100);
  const kql = [], spl = [], es = [], udm = [];
  if (ip.length) {
    kql.push(`// IPs: endpoint network traffic and sign-ins\nlet iocs = dynamic([${list(ip)}]);\nunion\n  (DeviceNetworkEvents | where Timestamp > ago(${days}d) | where RemoteIP in (iocs) | project Timestamp, DeviceName, InitiatingProcessFileName, RemoteIP, RemotePort, RemoteUrl),\n  (SigninLogs | where TimeGenerated > ago(${days}d) | where IPAddress in (iocs) | project Timestamp = TimeGenerated, UserPrincipalName, IPAddress, ResultType, AppDisplayName)`);
    spl.push(`earliest=-${days}d (src_ip IN (${list(ip)}) OR dest_ip IN (${list(ip)}) OR src IN (${list(ip)}) OR dest IN (${list(ip)}))\n| stats count min(_time) as first max(_time) as last values(sourcetype) as sourcetypes by src dest\n| convert ctime(first) ctime(last)`);
    es.push(`source.ip : (${ip.map(q).join(" or ")}) or destination.ip : (${ip.map(q).join(" or ")})`);
    udm.push(ip.map((v) => `principal.ip = ${q(v)} OR target.ip = ${q(v)}`).join(" OR "));
  }
  if (dom.length) {
    kql.push(`// Domains: connections and DNS\nlet iocs = dynamic([${list(dom)}]);\nDeviceNetworkEvents | where Timestamp > ago(${days}d)\n| where RemoteUrl has_any (iocs)\n| project Timestamp, DeviceName, InitiatingProcessFileName, RemoteUrl, RemoteIP`);
    spl.push(`earliest=-${days}d (query IN (${list(dom)}) OR url_domain IN (${list(dom)}) OR dest_host IN (${list(dom)}))\n| stats count by src, query, url_domain, sourcetype`);
    es.push(`dns.question.name : (${dom.map(q).join(" or ")}) or url.domain : (${dom.map(q).join(" or ")}) or destination.domain : (${dom.map(q).join(" or ")})`);
    udm.push(dom.map((v) => `network.dns.questions.name = ${q(v)} OR target.hostname = ${q(v)}`).join(" OR "));
  }
  if (url.length) {
    kql.push(`// URLs: clicks in email and Teams\nlet iocs = dynamic([${list(url)}]);\nUrlClickEvents | where Timestamp > ago(${days}d)\n| where Url in (iocs)\n| project Timestamp, AccountUpn, Url, ActionType, IsClickedThrough`);
    spl.push(`earliest=-${days}d url IN (${list(url)})\n| stats count by src, user, url, action`);
    es.push(`url.full : (${url.map(q).join(" or ")})`);
    udm.push(url.map((v) => `target.url = ${q(v)}`).join(" OR "));
  }
  const hashes = [["SHA256", sha256, "sha256"], ["SHA1", sha1, "sha1"], ["MD5", md5, "md5"]].filter(([, a]) => a.length);
  for (const [col, a, low] of hashes) {
    kql.push(`// ${col} hashes: files and processes\nlet iocs = dynamic([${list(a.slice(0, 200))}]);\nunion\n  (DeviceFileEvents | where Timestamp > ago(${days}d) | where ${col} in (iocs)),\n  (DeviceProcessEvents | where Timestamp > ago(${days}d) | where ${col} in (iocs))\n| project Timestamp, DeviceName, ActionType, FileName, FolderPath, ${col}, InitiatingProcessFileName`);
    spl.push(`earliest=-${days}d (file_hash IN (${list(a)}) OR ${low} IN (${list(a)}) OR Hashes="*${a[0]}*")\n| stats count by host, file_name, file_path`);
    es.push(`file.hash.${low} : (${a.map(q).join(" or ")}) or process.hash.${low} : (${a.map(q).join(" or ")})`);
    udm.push(a.map((v) => `target.file.${low} = ${q(v)} OR target.process.file.${low} = ${q(v)}`).join(" OR "));
  }
  if (em.length) {
    kql.push(`// Email senders\nlet iocs = dynamic([${list(em)}]);\nEmailEvents | where Timestamp > ago(${days}d)\n| where SenderFromAddress in (iocs) or SenderMailFromAddress in (iocs)\n| project Timestamp, RecipientEmailAddress, SenderFromAddress, Subject, DeliveryAction, NetworkMessageId`);
    spl.push(`earliest=-${days}d (src_user IN (${list(em)}) OR sender IN (${list(em)}))\n| stats count by recipient, src_user, subject`);
    es.push(`email.from.address : (${em.map(q).join(" or ")})`);
    udm.push(em.map((v) => `network.email.from = ${q(v)}`).join(" OR "));
  }
  if (kql.length) out.push(["Microsoft Defender / Sentinel (KQL)", kql.join("\n\n")]);
  if (spl.length) out.push(["Splunk (SPL)", spl.join("\n\n")]);
  if (es.length) out.push(["Elastic (KQL)", es.join("\nor\n")]);
  if (udm.length) out.push(["Google SecOps (UDM search)", udm.join("\nOR\n")]);
  return out;
}
