// Combinatorial desk tickets. Each scene is built from independent parts (who, what, when, a twist),
// and the twist decides the right route, so the same scene can be "ours", "IT's" or "close it"
// depending on one detail. That is the skill: read the detail.
// Routes: soc, it, net, ir, close.

const FIRST = ["Aisha", "Ben", "Carla", "Deepak", "Elena", "Femi", "Grace", "Hiro", "Ines", "Jamal", "Kasia", "Liam", "Mei", "Nadia", "Omar", "Pooja", "Quinn", "Rosa", "Sven", "Tariq", "Uma", "Victor", "Wen", "Ximena", "Yusuf", "Zoe", "Arjun", "Bea", "Chidi", "Dara", "Eitan", "Fatima", "Goran", "Hana", "Ivo", "Jun", "Kofi", "Leila", "Mateo", "Nora", "Olu", "Pia", "Rahul", "Sofia", "Theo", "Valentina", "Wiktor", "Yara", "Aung", "Thandi", "Moana", "Siddharth", "Ingrid", "Paolo", "Amara", "Kenji", "Lucia", "Ravi", "Selin", "Tomas"];
const DEPT = ["Finance", "HR", "Sales", "Legal", "Marketing", "Procurement", "Payroll", "Customer support", "Engineering", "Facilities", "the exec office", "Research", "Logistics", "Comms", "the warehouse", "Treasury", "Data team", "Recruitment"];
const SKIN = ["#F4D2B5", "#F1C9A5", "#E3B48F", "#D8A27C", "#C68C64", "#B67B55", "#8D5A3B", "#6B4226"];
const HAIR = ["#1B1210", "#2A1A12", "#3B2A20", "#6B4423", "#8D93A8", "#C98F1E", "#D9B26A", "#E8505B", "#4F7BFF", "#2E2A35"];
const BG = ["#2A3350", "#1F3A40", "#3A2350", "#3A3020", "#202A3A", "#2A3A20", "#3A2A40", "#2E2440", "#203A33"];
const SHIRT = ["#7FB7EE", "#5CE1C6", "#A9A1E8", "#F2946B", "#8FD5A6", "#F5B841", "#E8A0BF", "#9FB3C8", "#C9D27A"];
const STYLE = ["short", "long", "bun", "bald", "cap"];
const ACC = ["none", "none", "glasses", "headset", "tie", "hoodie"];

const P = (r, a) => a[Math.floor(r() * a.length)];
export function person(r) {
  return { n: P(r, FIRST), t: P(r, DEPT), a: { bg: P(r, BG), skin: P(r, SKIN), hair: P(r, HAIR), style: P(r, STYLE), acc: P(r, ACC), shirt: P(r, SHIRT) } };
}

const WHEN = ["at 2 AM", "on Saturday night", "during the all-hands", "right before payroll", "at 4:59 on a Friday", "on a public holiday", "ten minutes ago", "while I was at lunch", "first thing this morning", "during the fire drill"];
const APPS = ["Microsoft 365", "DocuSign", "Dropbox", "the HR portal", "Workday", "Salesforce", "Zoom", "Adobe Sign", "SharePoint", "the payroll system", "Slack", "the expenses app"];
const LURES = ["your password expires today", "you have 3 pending voicemails", "an invoice is overdue", "your parcel is held at customs", "a document was shared with you", "your mailbox is full", "unusual sign-in detected, verify now", "your bonus letter is ready", "updated holiday policy, please sign", "your MFA needs re-enrolling"];
const SENDERS = ["an outside address pretending to be IT", "our CEO's name but a Gmail address", "a supplier we actually use", "a domain one letter off ours", "a real colleague's mailbox", "'no-reply' at a brand-new domain"];
const COUNTRIES = ["Brazil", "Nigeria", "Romania", "Vietnam", "the Netherlands", "a VPN exit in Frankfurt", "a hosting provider in Ohio", "Singapore", "Turkey", "Canada"];
const MALWARE = ["Trojan:Win32/Lumma", "Behavior:Win32/SuspRemoteThread", "HackTool:Win64/Mimikatz", "Trojan:JS/FakeCaptcha", "Ransom:Win64/Akira", "Backdoor:MSIL/AsyncRAT", "PUA:Win32/Coinminer", "Trojan:PowerShell/Obfuse", "Exploit:O97M/Macro", "HackTool:Win32/AdFind"];
const HOSTS = ["FIN-LT-0231", "HR-LT-0098", "SRV-FILE01", "DEV-WS-114", "SALES-LT-44", "SRV-SQL02", "KIOSK-RECEPTION", "EXEC-LT-007", "LAB-VM-12", "PRINT-SRV-02"];
const DEVICES = ["laptop", "second monitor", "docking station", "phone", "headset", "keyboard", "webcam", "mouse"];
const ROOMS = ["meeting room 4B", "the boardroom", "the 3rd floor kitchen", "the training room", "reception", "the quiet room"];
const CLOUDS = ["an S3 bucket", "a Google Drive folder", "an Azure storage account", "a SharePoint site", "a Dropbox link", "a public GitHub gist", "a Trello board"];
const DATA = ["customer emails", "payroll records", "a database backup", "contract drafts", "the staff phone list", "API keys", "passport scans"];
const SECRETS = ["an AWS access key", "a database password", "a Slack bot token", "an OpenAI API key", "the Wi-Fi password", "a GitHub personal access token"];
const WHERE_SECRET = ["a public GitHub repo", "a Stack Overflow question", "a Confluence page", "a public Postman workspace", "a screenshot on LinkedIn", "a team chat with 400 people"];
const CALLERS = ["the bank", "IT support", "Microsoft", "the CEO's assistant", "a courier", "the tax office", "our payroll provider"];
const ASKS = ["read out the code they just texted me", "install a remote support app", "confirm my password so they can 'reset' it", "buy gift cards for a client", "approve the login prompt on my phone", "move the payment to a 'safe' account"];
const ACCTS = ["svc_backup2", "helpdesk2", "admin_tmp", "support_tmp", "sql_svc_old", "test123", "jdoe_adm"];
const PORTS = ["8443", "3389", "22", "9200", "5432", "8080", "445"];
const NUM = ["2", "3", "7", "12", "40", "200"];

// Each scene: (r) => { m, a, w, ch }. Small helpers keep them short.
const S = [
  // Reported email: the action taken decides the route
  (r) => {
    const lure = P(r, LURES), from = P(r, SENDERS), app = P(r, APPS);
    const v = P(r, [
      ["close", "I didn't click anything, just reporting it.", "Reported and not clicked: thank them, purge it from other mailboxes in bulk, close. Reporting is the win."],
      ["soc", "I clicked and it showed a login page. I typed my password but then it went blank.", "Credentials entered on a phish page. Reset the password, revoke sessions, check sign-ins and inbox rules."],
      ["soc", "I opened the attachment and it asked me to 'enable editing'. I did.", "Enabled content on a phish attachment: probably code execution. Investigate the host, maybe isolate."],
      ["close", "The header says it came from our phishing-simulation vendor. Did I pass?", "It's the simulation. Close it kindly and tell them they did exactly the right thing."],
      ["soc", "Twelve people in my team got the same one and two of them clicked.", "A campaign with clicks. Find everyone who got it, who clicked, who typed anything. Ours."],
    ]);
    return { m: `Got an email from ${from}: "${lure}" with a ${app} button. ${v[1]}`, a: v[0], w: v[2], ch: P(r, ["email", "chat"]) };
  },
  // Sign-in alert: is it them?
  (r) => {
    const c = P(r, COUNTRIES), t = P(r, WHEN);
    const v = P(r, [
      ["close", `Oh, that was me. I'm on holiday in ${c} and logged in from the hotel. My manager knows.`, "Explained, matches their travel, MFA passed on their own device. Note it and close. If you can, confirm it with the manager."],
      ["soc", "I haven't left the office all day. Who is logging in as me?", "An unexplained foreign sign-in that passed MFA suggests a stolen session token. Revoke sessions, reset, investigate."],
      ["soc", "My phone keeps buzzing with approval requests. I pressed Approve once to make it stop.", "MFA fatigue and they approved it. Treat the account as compromised: revoke, reset, hunt for what the attacker did."],
      ["it", "I can't log in at all, it says my account is locked. I typed my password wrong a few times.", "Self-inflicted lockout with no foreign sign-ins: a service-desk unlock. Bounce to IT."],
    ]);
    return { m: `I got a 'new sign-in from ${c}' email ${t}. ${v[1]}`, a: v[0], w: v[2], ch: P(r, ["chat", "phone", "email"]) };
  },
  // EDR alert: the outcome decides it
  (r) => {
    const mw = P(r, MALWARE), host = P(r, HOSTS), n = P(r, NUM);
    const v = P(r, [
      ["close", `It says "remediated, file quarantined". Just the one machine.`, "Blocked and quarantined on a single host with no follow-on activity: document it and close. Check it doesn't come back."],
      ["soc", `It says "detected, not blocked" and the process is still running.`, "Detected but running is live activity. Investigate the process tree now and isolate if it's real."],
      ["ir", `Same alert on ${n} servers in the last ten minutes, and some show "service stopped".`, "Same detection spreading across servers plus stopped services: possible ransomware staging. Escalate to IR."],
      ["soc", "It ran from the Downloads folder after the user searched for a 'free PDF converter'.", "Malvertising-delivered payload that executed. Ours: scope it and contain the host."],
    ]);
    return { m: `Defender flagged ${mw} on ${host}. ${v[1]}`, a: v[0], w: v[2], ch: "chat", f: "priya" };
  },
  // Hardware vs. hands-on-keyboard
  (r) => {
    const d = P(r, DEVICES);
    const v = P(r, [
      ["it", `My ${d} stopped working after the update. Is it hackers?`, "Broken hardware after an update is IT's. Bounce it with a smile."],
      ["soc", `My mouse is moving by itself and windows are opening. I'm not touching my ${d}.`, "Someone else controlling the screen means remote access. Disconnect from the network and investigate. Ours."],
      ["it", `My ${d} is really slow today and the fan is loud.`, "Slow and noisy is usually IT. If CPU is pegged by something odd like a miner, it comes back to us."],
      ["soc", `There's a program called 'AnyDesk' on my ${d} that I never installed, and it's connected.`, "Unexpected remote-access tool with a live session. Ours, and quickly."],
    ]);
    return { m: v[1], a: v[0], w: v[2], ch: P(r, ["walk", "phone", "chat"]) };
  },
  // Network requests
  (r) => {
    const port = P(r, PORTS), room = P(r, ROOMS);
    const v = P(r, [
      ["net", `Can you open port ${port} to the internet for my test server? Just for a week.`, "Firewall rules go to Network through change control. We can attach a risk note."],
      ["net", `The Wi-Fi in ${room} keeps dropping. Are we under attack?`, "Wi-Fi coverage is Network's. Only ours if there's a rogue access point copying our network name."],
      ["soc", `Someone plugged a little box into the network port in ${room}. It has a blinking light and no label.`, "An unknown device on the wire could be a planted implant. Don't unplug it yet: photo, isolate the switch port, investigate."],
      ["net", "Our partner says they can't reach our SFTP server since this morning.", "Connectivity for a partner integration is Network's first. Pull us in if logs show blocking for a security reason."],
    ]);
    return { m: v[1], a: v[0], w: v[2], ch: P(r, ["email", "chat"]) };
  },
  // Accounts
  (r) => {
    const acct = P(r, ACCTS), n = P(r, NUM), t = P(r, WHEN);
    const v = P(r, [
      ["close", `There's a change ticket for it, approved by the identity team yesterday.`, "Approved and documented: close with a note linking the change. Good hygiene to check, though."],
      ["soc", "Nobody on the team remembers creating it.", "Unexplained privileged accounts are a persistence sign. Disable it, then find out who and how."],
      ["ir", "It was added to Domain Admins and has logged in to the domain controllers.", "Rogue Domain Admin activity means likely domain compromise. Escalate to IR now."],
    ]);
    return { m: `A new account '${acct}' appeared on ${n} servers ${t}. ${v[1]}`, a: v[0], w: v[2], ch: "chat", f: P(r, ["priya", "dan"]) };
  },
  // Data exposure
  (r) => {
    const cl = P(r, CLOUDS), d = P(r, DATA);
    const v = P(r, [
      ["soc", "The access log shows downloads from IPs we don't recognise.", "Exposed sensitive data with outside access. Lock it down, preserve logs, work out what left. Likely legal involvement."],
      ["soc", "It's been like that for a month. No idea if anyone opened it.", "Long-standing exposure of sensitive data. Ours: lock it, check access logs, assess notification duties."],
      ["close", "Turns out it's the public marketing brochure, which is meant to be public.", "Public by design. Close it, and thank them for checking."],
    ]);
    return { m: `Someone shared ${cl} with ${d} in it as 'anyone with the link'. ${v[1]}`, a: v[0], w: v[2], ch: P(r, ["chat", "email"]) };
  },
  // Leaked secret
  (r) => {
    const s = P(r, SECRETS), w = P(r, WHERE_SECRET), t = P(r, WHEN);
    return { m: `I accidentally posted ${s} in ${w} ${t}. I deleted it already, so we're fine?`, a: "soc",
      w: "Deleting doesn't help: bots scrape secrets in seconds. Revoke and rotate the secret first, then check what used it.", ch: "chat", f: "dan" };
  },
  // Phone pretexting
  (r) => {
    const c = P(r, CALLERS), ask = P(r, ASKS);
    const v = P(r, [
      ["soc", "I said I'd call back. They sounded really legit though.", "Live vishing attempt, not successful. Ours: warn others, note the number, check if anyone else got the call."],
      ["ir", "I did it. Then they hung up.", "Successful social engineering with access or money at stake. Act fast: contain, and escalate if money or admin access is involved."],
      ["soc", "They're still on hold. What do I say?", "Tell them to hang up and call the real organisation on a known number. Then log the attempt."],
    ]);
    return { m: `Someone called saying they're from ${c} and asked me to ${ask}. ${v[1]}`, a: v[0], w: v[2], ch: "phone" };
  },
  // Payment change (BEC)
  (r) => {
    const amt = P(r, ["12,000", "48,000", "96,500", "250,000", "31,337"]);
    const v = P(r, [
      ["soc", "I haven't changed anything yet. Should I?", "Bank-detail change by email is the BEC classic. Verify by phone on a number you already have, and check the mailbox for compromise."],
      ["ir", `I updated them and the £${amt} payment went out this morning.`, "Money already sent to a fraudster's account. Escalate now and call the bank: recall windows are hours, not days."],
      ["close", "I called them on the number in our system and they confirmed it's genuine.", "Verified out-of-band. That's the process working. Close it with a note."],
    ]);
    return { m: `A supplier emailed to say their bank details changed before the payment run. ${v[1]}`, a: v[0], w: v[2], ch: P(r, ["email", "phone"]) };
  },
  // Physical
  (r) => {
    const room = P(r, ROOMS);
    const v = P(r, [
      ["soc", "Found a USB stick in the car park labelled 'Salaries 2026'. Shall I plug it in to see whose it is?", "Classic USB drop. Don't plug it in. Bag it and bring it to the SOC."],
      ["soc", `Someone without a badge followed me through the door into ${room} and is now plugging in a laptop.`, "Tailgating plus a laptop on the wire. Get Facilities or security staff to them now, and check the switch port."],
      ["close", `There's a new person in ${room} with a visitor badge and an escort. Is that OK?`, "Badge plus escort is the process working. Close, and thank them for noticing."],
      ["it", "The badge reader on the 2nd floor is beeping red at everyone.", "Broken badge reader is Facilities and IT. Ours only if it's been tampered with."],
    ]);
    return { m: v[1], a: v[0], w: v[2], ch: "walk", f: "marco" };
  },
  // Ransomware signs: scale decides
  (r) => {
    const v = P(r, [
      ["ir", "Every file on the shared drive is now called something.akira and there's a README in every folder.", "Active ransomware on shared storage. Escalate to IR and start isolating."],
      ["soc", "One file on my desktop has a weird extension. Everything else opens fine.", "Probably not ransomware, but worth a look: check the process that wrote it. Ours to check, not IR yet."],
      ["ir", "The backup server's jobs all failed and the backup catalogue is empty.", "Deleted backups are a pre-encryption step. Escalate to IR before the next stage."],
    ]);
    return { m: v[1], a: v[0], w: v[2], ch: P(r, ["walk", "phone", "chat"]) };
  },
  // Agents taking a closer look: what follows the scan decides it
  (r) => {
    const v = P(r, [
      ["close", "The WAF shows a port scan from a cloud IP. Nothing else from it since.", "One scan and silence is background noise. Note it and close."],
      ["soc", "A port scan from a cloud IP, then it read our API docs, found the old v0 endpoint and paged through 400 records.", "That's an investigation, not noise: someone found a forgotten endpoint and pulled data. Ours, now. Then retire v0."],
      ["soc", "Someone opened a pull request on our public tools repo. It's a 'small fix' that downloads a binary during the build.", "A malicious contribution to code you publish. Don't merge, check whether any build already ran it, and review who has merge rights."],
      ["soc", "A researcher emailed: our old website's JavaScript in the Wayback Machine has an API key in it. Is it still live?", "Assume yes until proven otherwise. Rotate the key, check what used it, then hunt your history for others."],
      ["ir", "The forgotten staging server answered a login with dev/dev, and now there's outbound traffic from it to a hosting IP.", "Default credentials on a forgotten host with live outbound traffic: an active intrusion. Escalate and isolate."],
    ]);
    return { m: v[1], a: v[0], w: v[2], ch: P(r, ["chat", "email"]), f: P(r, ["priya", "dan"]) };
  },
  // AI tools at work
  (r) => {
    const v = P(r, [
      ["soc", "I pasted the customer list into a free AI chatbot to sort it. Is that OK?", "Customer data in an unapproved AI tool is a data-handling incident. Ours: find out what was shared and the tool's retention."],
      ["soc", "Our AI assistant summarised an email and told me to urgently share the finance folder with an outside address.", "Prompt injection in an email steering the assistant. Don't follow it. Check what else the assistant did."],
      ["it", "Can I get access to the company AI assistant? My manager approved it.", "Licence and access requests are IT's. Security set the policy already."],
      ["close", "Is it OK to use the approved company AI assistant for meeting notes?", "Approved tool, approved use: answer and close."],
    ]);
    return { m: v[1], a: v[0], w: v[2], ch: P(r, ["chat", "email"]) };
  },
];

/** A fresh ticket from parts. Returns { m, a, w, ch, p } where p is the person (unless the scene picks a regular). */
export function genTicket(r, i) {
  const s = S[i ?? Math.floor(r() * S.length)](r);
  return { ...s, p: s.f ? null : person(r) };
}
export const SCENE_COUNT = S.length;
