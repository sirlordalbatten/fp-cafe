// Desk ticket templates. {placeholders} are filled at random, so each template
// produces many different tickets. a = correct route: soc, it, net, ir, close.
export const VARS = {
  app: ["Teams", "Outlook", "Excel", "Zoom", "Salesforce", "SAP", "Jira", "the HR portal", "Workday", "Slack", "Adobe Acrobat", "the expenses app"],
  device: ["laptop", "second monitor", "docking station", "phone", "headset", "keyboard", "webcam", "tablet"],
  room: ["meeting room 4B", "the boardroom", "the 3rd floor kitchen", "the training room", "reception", "the quiet room"],
  country: ["Brazil", "Lagos", "Bucharest", "Hanoi", "Amsterdam", "a VPN exit in Frankfurt", "a hosting provider in Ohio"],
  file: ["Q4_Bonus_Plan.xlsm", "Invoice_88231.pdf.exe", "Payroll_Update.html", "scan_0042.zip", "Contract_FINAL_v7.docm", "voicemail_00:42.htm", "Shipping_Label.iso"],
  site: ["the supplier portal", "a crypto news site", "a recipe blog", "the intranet", "a 'free PDF converter'", "a fantasy football site"],
  time: ["2 AM", "Saturday night", "during the all-hands", "right before payroll", "at 4:59 PM on a Friday", "on a public holiday"],
  num: ["3", "12", "40", "200", "1,800", "27"],
  vendor: ["Fortinet", "Ivanti", "Citrix", "Cisco", "Palo Alto", "Microsoft", "VMware", "SonicWall"],
  printer: ["PRINTER-3F-02", "the colour printer", "the label printer", "the big scanner"],
  amount: ["48,000", "96,500", "12,000", "250,000", "31,337"],
  port: ["8443", "3389", "22", "9200", "5432", "8080"],
  cloud: ["an S3 bucket", "a Google Drive folder", "an Azure storage account", "a SharePoint site", "a Dropbox link"],
};
export const T = [
  // ---- IT: not ours ----
  { f: ["kevin", "helen", "marco", "sam"], ch: ["walk", "phone", "chat"], a: "it", m: "My {device} isn't working. Is it a hacker?", w: "Broken hardware is IT's. If it starts typing by itself, call us back." },
  { f: ["helen", "kevin", "marco"], ch: ["phone", "chat"], a: "it", m: "I forgot my password again. Can you reset it? You're security, you have all the passwords.", w: "Resets are the service desk's job. We only care if the lockout looks like an attack (and no, we don't have everyone's passwords)." },
  { f: ["kevin", "helen", "sam", "dan"], ch: ["chat", "email"], a: "it", m: "{app} keeps crashing when I open it. Can security look?", w: "A crashing app is a support ticket. Bounce it with a smile." },
  { f: ["marco", "helen", "kevin"], ch: ["walk", "phone"], a: "it", m: "{printer} is printing blank pages. Is it a virus?", w: "Printers are IT's problem. Mostly emotionally." },
  { f: ["sam", "dan", "kevin"], ch: ["chat", "email"], a: "it", m: "Can I get admin rights to install a {app} plugin? It's urgent, there's a demo {time}.", w: "Software requests go through IT. We'll still have opinions about admin rights." },
  { f: ["helen", "marco", "kevin"], ch: ["email", "phone"], a: "it", m: "My mailbox is full and Outlook says I can't send. Help!", w: "Mailbox quotas are IT. Gently suggest deleting 2014." },
  { f: ["sam", "helen"], ch: ["chat", "walk"], a: "it", m: "The screen in {room} won't connect to my {device}.", w: "AV kit is IT and Facilities territory. Not a breach, just a cable." },
  { f: ["kevin", "dan", "sam"], ch: ["chat"], a: "it", m: "My new starter needs a {device} and accounts by Monday.", w: "Onboarding is IT's process. Security sets the policy, not the paperwork." },
  // ---- Network: not ours ----
  { f: ["dan", "vendor", "sam"], ch: ["email", "chat"], a: "net", m: "Can you open port {port} to the internet for my test box? Just for a week.", w: "Firewall rules belong to Network with change control. We can flag the risk." },
  { f: ["helen", "marco", "kevin"], ch: ["walk", "phone"], a: "net", m: "Wi-Fi in {room} keeps dropping. Are we being attacked?", w: "Wi-Fi coverage is Network's. Unless someone set up an evil twin, which, sure, check later." },
  { f: ["dan"], ch: ["chat"], a: "net", m: "The site-to-site VPN to the warehouse is slow. Can security turn off the inspection?", w: "Performance tuning is Network's, and turning off inspection is a hard no from us." },
  { f: ["vendor", "dan"], ch: ["email"], a: "net", m: "Please whitelist our IP range for the integration. Thanks, Brad.", w: "Allow-list changes go to Network through change control. Verify Brad is real while you're at it." },
  { f: ["marco"], ch: ["walk"], a: "net", m: "Found a spare switch in a cupboard. Can I plug it in for the new hot desks?", w: "Network gear is Network's to deploy. Rogue switches are how weird things end up on your LAN." },
  // ---- SOC: ours ----
  { f: ["kevin", "helen", "sam"], ch: ["email", "walk"], a: "soc", m: "Opened {file} from a supplier we don't use. It asked me to enable content, so I did. Nothing happened?", w: "Enabled content on an unexpected attachment is a likely infection. Investigate and probably isolate." },
  { f: ["kevin", "helen", "marco"], ch: ["phone", "chat"], a: "soc", m: "I'm getting loads of Microsoft approval pop-ups on my phone. I keep pressing Deny. Is that right?", w: "Unrequested MFA prompts mean someone has the password. Reset it and revoke sessions." },
  { f: ["marco", "sam"], ch: ["walk"], a: "soc", m: "Found a USB stick in the car park labelled 'Salaries {num}'. Shall I plug it in to see whose it is?", w: "Classic USB drop. Do not plug it in. Bag it and bring it to the SOC." },
  { f: ["priya", "dan"], ch: ["chat"], a: "soc", m: "Lots of outbound traffic from {printer} to an IP in {country}, every 60 seconds since {time}. Before you ask, the firewall is fine.", w: "Regular beacons to a foreign IP look like C2. That's ours." },
  { f: ["dan"], ch: ["chat"], a: "soc", m: "Oops. I pushed an AWS key to a public GitHub repo about {num} minutes ago. I deleted the commit though?", w: "Deleting the commit doesn't help, bots scrape keys in seconds. Revoke the key and check CloudTrail." },
  { f: ["helen"], ch: ["phone"], a: "soc", m: "Someone called saying they're from the bank and need me to read out the code they just texted me.", w: "That's a live social-engineering attempt. Tell her not to share it, then investigate." },
  { f: ["kevin", "helen", "sam"], ch: ["email"], a: "soc", m: "Forwarding a weird email: '{app} password expires today, click to keep it'. The link goes to a site I don't recognise.", w: "Reported phish. Check who else got it, block the URL, purge the message." },
  { f: ["sam"], ch: ["chat"], a: "soc", m: "I made a shared admin account so the team can log in faster. Password is in the team chat. Efficient, right?", w: "Shared admin creds in chat is a security incident in slow motion. Ours." },
  { f: ["kevin"], ch: ["walk"], a: "soc", m: "A pop-up says my PC is infected and to call a number. I called. They're on my screen now.", w: "Tech-support scam with remote access. Disconnect, isolate, investigate. Right now." },
  { f: ["dan", "priya"], ch: ["chat"], a: "soc", m: "There's a new local admin account called 'support_tmp' on {num} servers. Nobody remembers making it.", w: "Unexplained admin accounts are a persistence red flag. Ours." },
  { f: ["helen"], ch: ["email"], a: "soc", m: "A candidate sent their CV as a password-protected zip with the password in the email. Is that normal?", w: "Password-protected archives dodge email scanning. Classic malware delivery. Investigate before opening." },
  { f: ["kevin"], ch: ["phone"], a: "soc", m: "Our supplier emailed to say their bank details changed. Shall I update them before the payment run {time}?", w: "Payment-detail changes by email are the BEC classic. Verify by phone using a known number." },
  { f: ["dan"], ch: ["chat"], a: "soc", m: "Someone shared {cloud} with 'anyone with the link'. It has customer data in it.", w: "Public exposure of customer data. Lock it down, then work out who accessed it." },
  // ---- IR: escalate ----
  { f: ["marco", "kevin", "helen"], ch: ["walk", "phone"], a: "ir", m: "Every file on the shared drive is called something.lock and there's a text file saying READ_ME_TO_RECOVER.", w: "Active ransomware. Escalate to IR immediately and start isolating." },
  { f: ["ciso"], ch: ["walk"], a: "ir", m: "A journalist just emailed asking about 'the data on the leak site'. What leak site?", w: "Possible data breach with external visibility. Escalate to IR and loop in legal and comms." },
  { f: ["kevin"], ch: ["phone"], a: "ir", m: "The CEO emailed me to wire £{amount} urgently and keep it quiet. I already sent it. Was that OK?", w: "Executed BEC fraud. Escalate to IR and call the bank immediately: recall windows are short." },
  { f: ["priya"], ch: ["chat"], a: "ir", m: "EDR went offline on {num} servers at the same time. Their consoles show someone uninstalled it.", w: "Coordinated EDR tampering is a pre-ransomware sign. Escalate now." },
  { f: ["dan"], ch: ["chat"], a: "ir", m: "A new Domain Admin was created {time}. The name is 'helpdesk2'. We don't have a helpdesk2.", w: "Rogue Domain Admin means likely domain compromise. Escalate to IR." },
  // ---- Close, with a lesson ----
  { f: ["vendor"], ch: ["email"], a: "close", m: "Hi! Do you have 15 minutes to hear about our AI-powered, zero-trust, quantum-ready XDR platform?", w: "Not an incident. Politely close. Maybe block Brad." },
  { f: ["kevin", "helen"], ch: ["email"], a: "close", m: "I clicked the link in the phishing test from the security team. Am I in trouble?", w: "A simulation. Close it kindly, and thank them for reporting. Reporting is the win." },
  { f: ["helen", "kevin", "marco"], ch: ["chat"], a: "close", m: "Is it safe to use the guest Wi-Fi for my personal phone?", w: "A question, not an incident. Answer it nicely and close." },
  { f: ["ciso"], ch: ["email"], a: "close", m: "Can you put 'the cyber' on one slide for the board? Green, ideally.", w: "Not a ticket. It's a slide. You'll do it anyway." },
  { f: ["sam"], ch: ["chat"], a: "close", m: "Windows Defender says it quarantined something from my Downloads. Should I worry?", w: "Blocked and quarantined, single host, known file: close with a note. Escalate only if it recurs." },
  { f: ["kevin", "marco"], ch: ["walk"], a: "close", m: "My {device} says 'update available'. Is that a hacker trying to trick me?", w: "A real update prompt. Close it and suggest actually installing it." },
];

// Topical tickets built from live data (filled in desk.js)
export const LIVE = [
  { f: ["kevin", "helen", "ciso", "marco"], ch: ["walk", "email", "chat"], a: "soc", m: "Saw on the news that {vendor} has a bug being exploited ({id}). Do we use {product}?", w: "Exposure check for a known-exploited CVE: that's exactly our job." },
  { f: ["ciso"], ch: ["walk"], a: "soc", m: "Is this {id} thing in {product} going to be a problem? I have the board in an hour.", w: "Answer with facts: do we run it, is it patched, any signs of exploitation. Ours." },
  { f: ["helen", "kevin"], ch: ["chat"], a: "close", m: "My cousin sent me an article: \"{headline}\". Should I panic?", w: "Reassure, explain in plain words, close. No panic required." },
];
