// File triage helpers for the Toolbox. Everything runs locally on the bytes the user picked:
// hashes, file type from magic bytes, entropy, printable strings and suspicious markers.

const K = new Int32Array(64);
for (let i = 0; i < 64; i++) K[i] = Math.floor(Math.abs(Math.sin(i + 1)) * 4294967296) | 0;
const S = [7, 12, 17, 22, 5, 9, 14, 20, 4, 11, 16, 23, 6, 10, 15, 21];

/** MD5 of a Uint8Array (Web Crypto has no MD5, but threat-intel sites still key on it). */
export function md5(bytes) {
  let a0 = 0x67452301, b0 = 0xefcdab89 | 0, c0 = 0x98badcfe | 0, d0 = 0x10325476;
  const M = new Int32Array(16);
  const block = (buf, off) => {
    for (let i = 0; i < 16; i++) { const j = off + i * 4; M[i] = buf[j] | (buf[j + 1] << 8) | (buf[j + 2] << 16) | (buf[j + 3] << 24); }
    let A = a0, B = b0, C = c0, D = d0;
    for (let i = 0; i < 64; i++) {
      let F, g;
      if (i < 16) { F = (B & C) | (~B & D); g = i; } else if (i < 32) { F = (D & B) | (~D & C); g = (5 * i + 1) & 15; } else if (i < 48) { F = B ^ C ^ D; g = (3 * i + 5) & 15; } else { F = C ^ (B | ~D); g = (7 * i) & 15; }
      F = (F + A + K[i] + M[g]) | 0; A = D; D = C; C = B;
      const s = S[(i >> 4) * 4 + (i & 3)];
      B = (B + ((F << s) | (F >>> (32 - s)))) | 0;
    }
    a0 = (a0 + A) | 0; b0 = (b0 + B) | 0; c0 = (c0 + C) | 0; d0 = (d0 + D) | 0;
  };
  const n = bytes.length; const full = n - (n % 64);
  for (let off = 0; off < full; off += 64) block(bytes, off);
  const rest = n - full; const tail = new Uint8Array(rest < 56 ? 64 : 128);
  tail.set(bytes.subarray(full)); tail[rest] = 0x80;
  const lo = (n * 8) >>> 0, hi = Math.floor((n * 8) / 4294967296) >>> 0, L = tail.length - 8;
  for (let i = 0; i < 4; i++) { tail[L + i] = (lo >>> (8 * i)) & 255; tail[L + 4 + i] = (hi >>> (8 * i)) & 255; }
  for (let off = 0; off < tail.length; off += 64) block(tail, off);
  return [a0, b0, c0, d0].map((x) => [0, 8, 16, 24].map((s) => ((x >>> s) & 255).toString(16).padStart(2, "0")).join("")).join("");
}

export async function hashes(bytes) {
  const hex = (b) => [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join("");
  const [s1, s256, s512] = await Promise.all(["SHA-1", "SHA-256", "SHA-512"].map((a) => crypto.subtle.digest(a, bytes)));
  return { md5: md5(bytes), sha1: hex(s1), sha256: hex(s256), sha512: hex(s512) };
}

const starts = (b, sig, at = 0) => sig.every((v, i) => b[at + i] === v);
const ascii = (b, from, len) => String.fromCharCode(...b.subarray(from, from + len));

/** Best guess at the real file type from its first bytes. Returns { name, kind, exts }. */
export function fileType(b) {
  const head = ascii(b, 0, Math.min(b.length, 4096));
  if (starts(b, [0x4d, 0x5a])) {
    const pe = b.length > 0x40 ? (b[0x3c] | (b[0x3d] << 8) | (b[0x3e] << 16)) : 0;
    let dll = false, arch = "";
    if (pe && pe + 24 < b.length && starts(b, [0x50, 0x45, 0, 0], pe)) {
      const mach = b[pe + 4] | (b[pe + 5] << 8); arch = mach === 0x8664 ? "64-bit" : mach === 0x14c ? "32-bit" : mach === 0xaa64 ? "ARM64" : "";
      dll = !!((b[pe + 22] | (b[pe + 23] << 8)) & 0x2000);
    }
    const net = /mscoree\.dll|_CorExeMain|_CorDllMain/.test(ascii(b, 0, Math.min(b.length, 65536)));
    return { name: `Windows ${dll ? "DLL" : "executable"} (PE${arch ? ", " + arch : ""}${net ? ", .NET" : ""})`, kind: "exec", exts: dll ? ["dll", "cpl", "ocx", "sys"] : ["exe", "scr", "com", "sys", "cpl"] };
  }
  if (starts(b, [0x7f, 0x45, 0x4c, 0x46])) return { name: "Linux executable (ELF)", kind: "exec", exts: ["", "so", "elf", "bin", "o"] };
  if (starts(b, [0xcf, 0xfa, 0xed, 0xfe]) || starts(b, [0xce, 0xfa, 0xed, 0xfe])) return { name: "macOS executable (Mach-O)", kind: "exec", exts: ["", "dylib", "bundle"] };
  if (starts(b, [0xca, 0xfe, 0xba, 0xbe])) return { name: "Mach-O universal binary or Java class", kind: "exec", exts: ["", "class"] };
  if (starts(b, [0x25, 0x50, 0x44, 0x46])) return { name: "PDF document", kind: "doc", exts: ["pdf"] };
  if (starts(b, [0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1])) return { name: "Old Office or MSI file (OLE)", kind: "doc", exts: ["doc", "xls", "ppt", "msi", "msg"] };
  if (starts(b, [0x50, 0x4b, 0x03, 0x04]) || starts(b, [0x50, 0x4b, 0x05, 0x06])) {
    if (/word\//.test(head)) return { name: "Word document (Office Open XML)", kind: "doc", exts: ["docx", "docm", "dotm"] };
    if (/xl\//.test(head)) return { name: "Excel workbook (Office Open XML)", kind: "doc", exts: ["xlsx", "xlsm", "xltm"] };
    if (/ppt\//.test(head)) return { name: "PowerPoint (Office Open XML)", kind: "doc", exts: ["pptx", "pptm"] };
    if (/AndroidManifest\.xml|classes\.dex/.test(head)) return { name: "Android app (APK)", kind: "exec", exts: ["apk"] };
    if (/META-INF\//.test(head)) return { name: "Java archive (JAR)", kind: "exec", exts: ["jar"] };
    return { name: "ZIP archive", kind: "archive", exts: ["zip"] };
  }
  if (starts(b, [0x52, 0x61, 0x72, 0x21])) return { name: "RAR archive", kind: "archive", exts: ["rar"] };
  if (starts(b, [0x37, 0x7a, 0xbc, 0xaf, 0x27, 0x1c])) return { name: "7-Zip archive", kind: "archive", exts: ["7z"] };
  if (starts(b, [0x1f, 0x8b])) return { name: "GZIP archive", kind: "archive", exts: ["gz", "tgz"] };
  if (starts(b, [0xfd, 0x37, 0x7a, 0x58, 0x5a])) return { name: "XZ archive", kind: "archive", exts: ["xz"] };
  if (starts(b, [0x42, 0x5a, 0x68])) return { name: "BZIP2 archive", kind: "archive", exts: ["bz2"] };
  if (starts(b, [0x4d, 0x53, 0x43, 0x46])) return { name: "Windows cabinet (CAB)", kind: "archive", exts: ["cab"] };
  if (b.length > 0x8006 && ascii(b, 0x8001, 5) === "CD001") return { name: "Disk image (ISO)", kind: "container", exts: ["iso", "img"] };
  if (head.startsWith("conectix") || head.startsWith("vhdxfile")) return { name: "Virtual hard disk (VHD/VHDX)", kind: "container", exts: ["vhd", "vhdx"] };
  if (starts(b, [0x4c, 0, 0, 0, 0x01, 0x14, 0x02, 0])) return { name: "Windows shortcut (LNK)", kind: "exec", exts: ["lnk"] };
  if (starts(b, [0xe4, 0x52, 0x5c, 0x7b, 0x8c, 0xd8, 0xa7, 0x4d])) return { name: "OneNote document", kind: "doc", exts: ["one"] };
  if (head.startsWith("{\\rtf")) return { name: "Rich Text document (RTF)", kind: "doc", exts: ["rtf", "doc"] };
  if (starts(b, [0x89, 0x50, 0x4e, 0x47])) return { name: "PNG image", kind: "media", exts: ["png"] };
  if (starts(b, [0xff, 0xd8, 0xff])) return { name: "JPEG image", kind: "media", exts: ["jpg", "jpeg"] };
  if (head.startsWith("GIF8")) return { name: "GIF image", kind: "media", exts: ["gif"] };
  if (/^\s*<(!doctype html|html|head|body|script)/i.test(head)) return { name: "HTML page", kind: "script", exts: ["html", "htm", "svg"] };
  if (/^\s*<svg|^\s*<\?xml[^>]*>\s*<svg/i.test(head)) return { name: "SVG image (can carry script)", kind: "script", exts: ["svg"] };
  if (/^\s*<\?xml/i.test(head)) return { name: "XML document", kind: "text", exts: ["xml", "config"] };
  if (head.startsWith("#!")) return { name: "Shell script", kind: "script", exts: ["sh", "py", "pl", ""] };
  const sample = b.subarray(0, 4096); let printable = 0;
  for (const c of sample) if ((c >= 32 && c < 127) || c === 9 || c === 10 || c === 13) printable++;
  if (sample.length && printable / sample.length > 0.95) {
    if (/powershell|invoke-|\$env:|-encodedcommand|new-object/i.test(head)) return { name: "Text with PowerShell", kind: "script", exts: ["ps1", "psm1", "txt", "bat", "cmd"] };
    if (/wscript|createobject|vbscript|dim\s/i.test(head)) return { name: "Text with VBScript", kind: "script", exts: ["vbs", "vbe", "wsf", "hta", "txt"] };
    if (/@echo off|%comspec%|\bcmd \/c\b/i.test(head)) return { name: "Windows batch script", kind: "script", exts: ["bat", "cmd", "txt"] };
    if (/function\s*\(|var\s+\w+\s*=|eval\(|activexobject/i.test(head)) return { name: "Text with JavaScript", kind: "script", exts: ["js", "jse", "txt", "html"] };
    return { name: "Plain text", kind: "text", exts: ["txt", "log", "csv", "json", "md", "ini", "cfg", "conf", "xml", "yaml", "yml", "eml"] };
  }
  return { name: "Unknown binary", kind: "binary", exts: [] };
}

export const RISKY_EXT = new Set(["exe", "dll", "scr", "com", "pif", "cpl", "js", "jse", "vbs", "vbe", "wsf", "wsh", "hta", "lnk", "iso", "img", "vhd", "vhdx", "one", "ps1", "bat", "cmd", "msi", "docm", "xlsm", "pptm", "jar", "apk", "chm", "reg", "xll", "svg", "html", "htm"]);

/** Shannon entropy in bits per byte (0 to 8). */
export function entropy(b) {
  if (!b.length) return 0;
  const f = new Float64Array(256); for (let i = 0; i < b.length; i++) f[b[i]]++;
  let e = 0; for (const c of f) if (c) { const p = c / b.length; e -= p * Math.log2(p); }
  return e;
}

/** Printable ASCII and UTF-16LE strings of at least `min` characters. */
export function strings(b, min = 6, cap = 4000) {
  const out = []; let cur = "";
  const push = () => { if (cur.length >= min && out.length < cap) out.push(cur); cur = ""; };
  for (let i = 0; i < b.length; i++) { const c = b[i]; if (c >= 32 && c < 127) cur += String.fromCharCode(c); else push(); }
  push();
  for (let i = 0; i + 1 < b.length && out.length < cap; i += 2) { const c = b[i]; if (c >= 32 && c < 127 && b[i + 1] === 0) cur += String.fromCharCode(c); else push(); }
  push();
  return out;
}

// Markers that deserve a closer look. [regex, why]
export const MARKERS = [
  [/VirtualAlloc(Ex)?|WriteProcessMemory|CreateRemoteThread|NtUnmapViewOfSection|QueueUserAPC/, "Process injection APIs"],
  [/IsDebuggerPresent|CheckRemoteDebuggerPresent|NtQueryInformationProcess/, "Anti-debugging checks"],
  [/URLDownloadToFile|InternetOpenUrl|WinHttpOpen|DownloadString|DownloadFile|Net\.WebClient|Invoke-WebRequest/i, "Downloads something from the internet"],
  [/powershell(\.exe)?\s+.*-(e|ec|enc|encodedcommand)\b|FromBase64String/i, "Encoded PowerShell"],
  [/\bIEX\b|Invoke-Expression/i, "Runs code built at run time (Invoke-Expression)"],
  [/AutoOpen|Document_Open|Workbook_Open|Auto_Open/, "Office macro that runs on open"],
  [/WScript\.Shell|Shell\.Application|CreateObject\(/i, "Script that launches programs"],
  [/\b(mshta|regsvr32|rundll32|certutil|bitsadmin|wmic|msbuild|installutil)(\.exe)?\b/i, "Living-off-the-land binaries (LOLBins)"],
  [/vssadmin.*delete|wmic.*shadowcopy.*delete|bcdedit.*recoveryenabled|wbadmin.*delete/i, "Deletes backups or shadow copies (ransomware)"],
  [/wevtutil\s+cl|Clear-EventLog/i, "Clears event logs"],
  [/schtasks\s+\/create|New-ScheduledTask|CurrentVersion\\Run/i, "Persistence (scheduled task or Run key)"],
  [/your files (have been|are) encrypted|\.onion\b|bitcoin|decrypt(or|ion) (key|tool)/i, "Ransom note language"],
  [/mimikatz|sekurlsa|lsass|procdump/i, "Credential dumping"],
  [/AmsiUtils|amsiInitFailed|AmsiScanBuffer/i, "Tries to switch off AMSI (antivirus scanning)"],
  [/Add-MpPreference\s+-Exclusion|DisableRealtimeMonitoring/i, "Weakens Microsoft Defender"],
  [/UPX0|UPX1|\.aspack|MPRESS/, "Packed with a common packer"],
];
