// Under attack: first-response playbooks. Built from public incident-response guidance
// (NIST SP 800-61r3, CISA #StopRansomware guide, NCSC UK incident management, MITRE ATT&CK).
// Each step is a short action an analyst can tick off. Live context (advisories, active groups,
// exploited CVEs) and the contact list come from the data pipeline, so this file only holds the method.

export const PHASES = [["now", "First 15 minutes"], ["hour", "First hour"], ["day", "Next 24 hours"], ["after", "Recover and learn"]];

// Call tree that applies to every incident. Playbooks add their own on top.
export const CALL_TREE = [
  "Incident lead or on-call manager",
  "IT / infrastructure on-call (they hold the keys to isolate)",
  "Security leadership (CISO or head of security)",
  "Legal and the data protection officer (breach notice clocks start early)",
  "Cyber insurer's hotline, before you hire outside responders",
  "Comms lead, so nobody talks to press or customers first",
];

export const PLAYBOOKS = [
  {
    id: "ransomware", n: "Ransomware", tone: "crit", attack: ["T1486", "T1490"], live: "ransomware",
    sign: "Files renamed with odd extensions, ransom notes on desktops or shares, backups or shadow copies deleted, many hosts slowing at once.",
    steps: {
      now: [
        "Disconnect affected machines from the network: pull the cable or disable Wi-Fi. Do not power them off; memory holds keys and evidence.",
        "If it is spreading, isolate whole segments or VLANs and block SMB (445) between them.",
        "Disable the accounts seen on affected hosts, starting with admin and service accounts.",
        "Protect backups: take them offline or lock access before the attacker reaches them.",
        "Open an incident channel outside the company domain, such as a phone bridge, in case email and chat are compromised.",
      ],
      hour: [
        "Find patient zero: first host with the ransom note, earliest EDR alert, first odd logon.",
        "Photograph or save the ransom note and one encrypted file. Do not reply to the attackers.",
        "Identify the strain (ID Ransomware) and check No More Ransom for a free decryptor.",
        "Reset passwords for privileged accounts from a clean machine, and reset the KRBTGT password twice if domain controllers are touched.",
        "Call your cyber insurer and legal before hiring a response firm or talking about payment.",
      ],
      day: [
        "Scope the intrusion: how they got in (VPN, RDP, phishing, an unpatched edge device) and where they went.",
        "Hunt for the tools they left: remote access software, scheduled tasks, new admin accounts, Cobalt Strike and similar beacons.",
        "Check for data theft before encryption (large uploads, rclone, MEGA, file-sharing sites). Most gangs steal first.",
        "Report to the national CERT and police. In many countries, regulators must hear within 72 hours if personal data was affected.",
        "Rebuild from known-good backups onto clean, patched systems. Do not restore into a network the attacker still controls.",
      ],
      after: [
        "Close the entry point for good: patch, enforce MFA everywhere, remove internet-facing RDP.",
        "Test a full restore from backup, not just that the backup job succeeded.",
        "Write the timeline and hold a blameless review within two weeks.",
      ],
    },
    dont: ["Power off infected machines", "Pay or contact the attackers without legal, insurer and law enforcement advice", "Restore backups before you know how they got in", "Use company email to coordinate if the domain may be compromised"],
    evidence: ["Ransom note and one encrypted sample", "EDR alerts and process trees from the first hosts", "Domain controller and VPN logs", "Firewall and proxy logs showing outbound data volume", "Memory images of a few infected hosts"],
    extra: ["Backup administrator", "Outside incident response firm (through your insurer)"],
  },
  {
    id: "bec", n: "Payment fraud or email takeover (BEC)", tone: "crit", attack: ["T1534", "T1114", "T1657"], live: "phishing",
    sign: "A supplier's bank details 'changed', the CEO asks for an urgent transfer, finance got an invoice from a look-alike domain, or a mailbox sends mail the owner did not write.",
    steps: {
      now: [
        "If money already moved, call your bank's fraud line now and ask for a recall. Hours matter.",
        "Report the transfer to the police cybercrime unit (in the US, FBI IC3). Fast reports can freeze funds.",
        "Confirm the request by phone using a number you already had, never one from the email.",
        "If an internal mailbox is involved, reset its password and revoke all its sessions and tokens.",
      ],
      hour: [
        "Check the mailbox for new inbox rules that forward, delete or hide mail, and remove them.",
        "Review sign-ins for the account: new countries, new devices, legacy protocols, MFA changes.",
        "Search all mailboxes for the same sender, subject or look-alike domain and pull the messages.",
        "Tell finance to hold any payment with changed bank details until verified by phone.",
      ],
      day: [
        "Find how the account was taken: phishing page, password reuse or token theft (AiTM).",
        "Check what the attacker read or sent, and warn customers or suppliers who got mail from them.",
        "Block the look-alike domain and report it for takedown.",
      ],
      after: [
        "Require phone call-back for any change of bank details.",
        "Move finance and executives to phishing-resistant MFA (passkeys or security keys).",
        "Alert on new inbox rules and external forwarding.",
      ],
    },
    dont: ["Reply to the fraudster's email", "Verify using contact details from the suspicious message", "Delete the emails, as they are evidence"],
    evidence: ["Full email headers of the fraudulent messages", "Bank transfer details and timestamps", "Mailbox audit log and inbox rules", "Sign-in logs for the account"],
    extra: ["Finance controller", "Your bank's fraud team"],
  },
  {
    id: "phish", n: "Someone clicked a phishing link", tone: "high", attack: ["T1566", "T1204"], live: "phishing",
    sign: "A user reports clicking a link or opening an attachment, entered a password on a strange page, or approved an MFA prompt they did not start.",
    steps: {
      now: [
        "Thank the user for reporting. Fast honest reports are the best control you have.",
        "If they entered a password: reset it and revoke all sessions and refresh tokens now.",
        "If they opened an attachment or ran something: isolate the device in EDR.",
        "Block the URL and domain at the proxy, DNS filter and email gateway.",
      ],
      hour: [
        "Pull the original email and find everyone else who received it. Remove it from all inboxes.",
        "Check who else clicked, using proxy and DNS logs for the domain.",
        "Review the account's sign-ins since the click for new locations or devices.",
        "Check the URL and any file hash in the Toolbox, then pivot on the infrastructure.",
      ],
      day: [
        "If credentials were used by the attacker, treat it as an account takeover.",
        "Report the phishing page to Netcraft and Google Safe Browsing so browsers start warning.",
        "Share the indicators with your team and any ISAC you belong to.",
      ],
      after: ["Turn the real email into a training example, without naming the user.", "Consider phishing-resistant MFA for the targeted group."],
    },
    dont: ["Blame or shame the user", "Visit the link from a normal work machine", "Forward the phishing email around as an attachment"],
    evidence: ["Original email as .eml with headers", "Proxy or DNS logs for the domain", "Sign-in logs since the click", "EDR timeline if anything ran"],
    extra: [],
  },
  {
    id: "ato", n: "Account takeover or suspicious login", tone: "high", attack: ["T1078", "T1621", "T1110"], live: "security",
    sign: "Impossible travel, a login from a new country, MFA prompts the user did not start, a password spray hitting many accounts, or an account changing its own MFA.",
    steps: {
      now: [
        "Disable the account or reset the password, and revoke every session and token.",
        "Remove any MFA method or app registration the attacker added.",
        "If it was an admin account, check for new admins, new apps and changed policies right away.",
      ],
      hour: [
        "List everything the account did since the first bad login: mail rules, file downloads, shares, new devices.",
        "Block the source IPs and check whether they touched other accounts (spray pattern).",
        "Look for OAuth app consents the user granted recently and remove unknown ones.",
      ],
      day: [
        "Find the root cause: reused password, infostealer on a home device, phishing, MFA fatigue.",
        "Check whether the user's password appears in breach data (Have I Been Pwned).",
        "If data was accessed, bring in legal to decide on notification.",
      ],
      after: ["Turn on number matching or move to passkeys.", "Block legacy authentication.", "Alert on MFA method changes."],
    },
    dont: ["Only reset the password: tokens keep working until revoked", "Re-enable the account before you know how it fell"],
    evidence: ["Sign-in and audit logs for the account", "List of MFA methods and app consents before you remove them", "Mailbox and file activity logs"],
    extra: ["Identity team (Entra ID, Okta or similar admins)"],
  },
  {
    id: "malware", n: "Malware on a device or infostealer", tone: "high", attack: ["T1204", "T1555", "T1071"], live: "malware",
    sign: "EDR or antivirus alert, odd processes or PowerShell, beaconing to a strange domain, or a user's passwords turning up for sale.",
    steps: {
      now: [
        "Isolate the device through EDR (it keeps the EDR connection) or unplug it from the network.",
        "Do not wipe it yet. Grab the alert details, process tree and file hash.",
        "If it is an infostealer: assume every password, cookie and session on that machine is stolen.",
      ],
      hour: [
        "Reset passwords and revoke sessions for every account used on that device, including personal ones the user mentions.",
        "Check the hash and domains in the Toolbox, then search for them across all hosts.",
        "Find how it arrived: download, email attachment, USB, cracked software, malicious ad.",
      ],
      day: [
        "Hunt for persistence: scheduled tasks, Run keys, services, startup folders.",
        "Block its command-and-control domains and IPs at the edge.",
        "Reimage the device. Cleaning by hand is rarely trustworthy.",
      ],
      after: ["Add a detection for the behaviour you saw, not only the hash.", "Restrict who can install software."],
    },
    dont: ["Run the sample on a normal machine", "Upload company documents to public sandboxes", "Reconnect the device before it is reimaged"],
    evidence: ["File hash and a copy of the sample (zipped with a password)", "EDR process tree and timeline", "DNS and proxy logs for the device"],
    extra: ["Desktop or endpoint team"],
  },
  {
    id: "ddos", n: "DDoS: site or service flooded", tone: "high", attack: ["T1498", "T1499"], live: "ddos",
    sign: "Website or API slow or down, bandwidth maxed out, a flood of requests from many IPs, or an extortion note threatening a bigger attack.",
    steps: {
      now: [
        "Confirm it is an attack and not a bad deploy or a real traffic spike.",
        "Call your hosting provider, ISP or DDoS protection service and ask them to turn on mitigation.",
        "Turn on 'under attack' or challenge modes in your CDN or WAF if you have one.",
      ],
      hour: [
        "Find the pattern: which URLs, which protocols, which countries, which user agents.",
        "Rate-limit or block the pattern, and cache what you can at the edge.",
        "Put up a status page so customers know you are on it.",
      ],
      day: [
        "Check whether the DDoS is cover for something else, such as a login attack or data theft.",
        "If there was a ransom demand, report it to the police and do not pay.",
        "Report to your national CERT.",
      ],
      after: ["Sign up for always-on DDoS protection for anything critical.", "Hide origin server IPs behind the CDN.", "Write a runbook with your provider's emergency number in it."],
    },
    dont: ["Pay a DDoS extortion demand", "Expose your origin IP while troubleshooting"],
    evidence: ["Traffic graphs and sample logs of the flood", "Provider ticket numbers", "Any extortion messages"],
    extra: ["Hosting, ISP or CDN emergency line"],
  },
  {
    id: "breach", n: "Data breach or leak", tone: "crit", attack: ["T1567", "T1530", "T1213"], live: "breach",
    sign: "Your data appears on a leak site or forum, a researcher reports an exposed bucket or database, or logs show large uploads to unknown places.",
    steps: {
      now: [
        "Close the exposure: make the bucket private, take the database off the internet, revoke the leaked keys.",
        "Bring in legal and the data protection officer now. Many laws give you 72 hours from when you become aware.",
        "Preserve logs before they roll over; raise retention if needed.",
      ],
      hour: [
        "Work out what data, how many people, and since when it was exposed.",
        "Check access logs to see whether anyone actually downloaded it.",
        "Do not download a leak from a criminal site yourself. Let legal and law enforcement guide that.",
      ],
      day: [
        "Decide on notification to regulators and affected people with legal.",
        "Reset anything the data lets an attacker use: passwords, API keys, tokens.",
        "Prepare a plain-language notice and an FAQ for customers.",
      ],
      after: ["Scan continuously for public buckets and exposed databases.", "Classify what data you hold and delete what you do not need."],
    },
    dont: ["Promise 'no data was taken' before you know", "Contact the people selling the data", "Delete logs or exposed files before they are preserved"],
    evidence: ["Access logs for the exposed system", "Copy of the exposed configuration", "Screenshots of the leak post with timestamps"],
    extra: ["Data protection officer", "Privacy regulator (through legal)"],
  },
  {
    id: "web", n: "Website or server hacked", tone: "high", attack: ["T1190", "T1505.003", "T1491"], live: "kev",
    sign: "Defaced pages, unknown files in the web root (web shells), odd outbound connections from a server, or a known-exploited CVE in something you run.",
    steps: {
      now: [
        "Take the server off the internet or put it behind a maintenance page. Keep it running for evidence.",
        "Snapshot the VM or disk before changing anything.",
        "Check the CVE menu: is the product on CISA's known-exploited list?",
      ],
      hour: [
        "Look for web shells: new .php, .jsp or .aspx files and recently modified files in the web root.",
        "Read the web server logs for the exploit request and the first odd POST requests.",
        "Rotate credentials stored on the server: database passwords, API keys, cloud keys.",
      ],
      day: [
        "Check whether they moved from the server to the internal network.",
        "Rebuild from clean source and patch before going back online.",
        "Report to your national CERT, especially for edge devices like VPNs and firewalls.",
      ],
      after: ["Patch internet-facing systems on the KEV list within days, not weeks.", "Put a WAF in front and alert on new files in the web root."],
    },
    dont: ["Just delete the web shell and carry on", "Restore the same unpatched version"],
    evidence: ["Disk snapshot", "Web server and WAF logs", "List of recently changed files with hashes"],
    extra: ["Application owner", "Hosting provider"],
  },
  {
    id: "secrets", n: "Leaked keys or passwords in code", tone: "high", attack: ["T1552", "T1078.004"], live: "security",
    sign: "An API key or cloud key pushed to a public repo, a secret-scanning alert, a token in a public Docker image, or a cloud bill spike.",
    steps: {
      now: [
        "Revoke or rotate the key first. Deleting the commit does not help: it is already copied.",
        "If it is a cloud key, check for new users, new keys and new compute in every region.",
      ],
      hour: [
        "Review the provider's audit logs (for example CloudTrail) for what the key did since it leaked.",
        "Shut down anything the attacker created, such as crypto miners, and note it for the bill dispute.",
        "Search the rest of the repo and its history for other secrets.",
      ],
      day: ["Purge the secret from git history and image layers.", "Contact the provider's support about charges caused by abuse."],
      after: ["Turn on secret scanning and push protection.", "Use short-lived credentials instead of long-lived keys."],
    },
    dont: ["Rely on deleting the commit", "Leave old keys active 'just in case'"],
    evidence: ["Commit hash and time of the leak", "Cloud audit logs", "Billing data"],
    extra: ["Cloud platform team", "Repository owner"],
  },
  {
    id: "supply", n: "A supplier or software we use was hacked", tone: "high", attack: ["T1195", "T1199"], live: "security",
    sign: "A vendor announces a breach, a library or update you use is reported malicious, or a managed service provider's account acts strangely.",
    steps: {
      now: [
        "Find where you use it: which hosts, which versions, which accounts or integrations it has.",
        "Follow the vendor's or CERT's guidance. Disable the integration or block the update if advised.",
        "Rotate any credentials or API tokens shared with that supplier.",
      ],
      hour: [
        "Hunt using the indicators the vendor or CERT published.",
        "Check what the supplier's accounts did in your environment recently.",
      ],
      day: ["Ask the supplier in writing what was affected and what data of yours they hold.", "Decide with legal whether you have notification duties."],
      after: ["Keep an inventory of suppliers with access to your systems.", "Pin dependency versions and review updates."],
    },
    dont: ["Wait for the vendor to call you", "Assume you are unaffected because they have not said so"],
    evidence: ["Inventory of affected installs and versions", "Logs of supplier account activity", "Vendor notices with dates"],
    extra: ["Vendor or procurement manager"],
  },
  {
    id: "insider", n: "Insider misuse", tone: "med", attack: ["T1078", "T1530"], live: "",
    sign: "An employee downloads unusual volumes, accesses data outside their role, emails files to a personal address, or a leaver keeps access.",
    steps: {
      now: [
        "Bring in HR and legal before taking visible action. Insider cases follow employment law.",
        "Preserve evidence quietly: logs, mailbox, device.",
      ],
      hour: [
        "Limit access to the sensitive data if the risk is ongoing, as agreed with HR and legal.",
        "Build a factual timeline from logs. Record facts, not opinions.",
      ],
      day: ["Decide with HR and legal on next steps and whether to involve police.", "Check whether data left and where it went."],
      after: ["Remove access on the day people leave.", "Alert on bulk downloads and personal email forwarding."],
    },
    dont: ["Confront the person on your own", "Investigate beyond what policy and law allow"],
    evidence: ["Access and download logs", "Email and DLP alerts", "Device image (via a proper process)"],
    extra: ["HR", "Employment lawyer"],
  },
  {
    id: "lost", n: "Lost or stolen laptop or phone", tone: "med", attack: [], live: "",
    sign: "A user reports a device missing, or a device has not checked in and its owner cannot find it.",
    steps: {
      now: [
        "Lock the device remotely and, if it cannot be recovered, wipe it through device management.",
        "Revoke the device's sessions and certificates, and reset the user's password.",
      ],
      hour: [
        "Check whether the disk was encrypted. If yes, the risk drops a lot.",
        "List what data was on it and which accounts were signed in.",
      ],
      day: ["Report the theft to police for a reference number.", "If unencrypted personal data was on it, bring in legal about notification."],
      after: ["Enforce disk encryption and screen locks on every device."],
    },
    dont: ["Wait days hoping it turns up"],
    evidence: ["Device ID and last check-in time", "Encryption status", "Police reference"],
    extra: [],
  },
  {
    id: "extortion", n: "Extortion or threat email", tone: "med", attack: ["T1657"], live: "ransomware",
    sign: "Someone claims to have your data or access and demands payment, threatens a DDoS, or claims to have hacked a staff member's webcam.",
    steps: {
      now: [
        "Do not reply or pay. Save the full message with headers.",
        "Check whether the claim is real: does any sample data match your systems?",
        "Many are bluffs that reuse old breach data. Check for the leaked password in old breaches.",
      ],
      hour: [
        "If the sample looks real, switch to the data breach playbook.",
        "If it threatens a DDoS, alert your provider and switch to the DDoS playbook.",
      ],
      day: ["Report it to the police and your national CERT.", "Warn staff if the scam is targeting many of them."],
      after: ["Keep a log of extortion attempts. Repeat senders show patterns."],
    },
    dont: ["Pay or negotiate without legal and law enforcement advice"],
    evidence: ["Original message with headers", "Any samples they sent", "Payment address (crypto wallet) they gave"],
    extra: [],
  },
];
