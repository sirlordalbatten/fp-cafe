// Realistic sample messages for awareness simulations. They use a made-up organisation (Northwind Traders),
// made-up people and placeholders for the simulation platform's tracked link, so they teach the patterns
// without copying a real brand. Each planted red flag is marked, so the same text doubles as the lesson.
//
// A segment is either plain text or { t, f } where f names the red flag it plants.

const ORG = "Northwind Traders", DOM = "northwindtraders.com";
const P = (r, a) => a[Math.floor(r() * a.length)];
const PEOPLE = ["Priya Shah", "Daniel Ortiz", "Emma Clarke", "Kenji Watanabe", "Aisha Bello", "Tom Reilly", "Mei Lin", "Lucas Ferreira"];
const LINK = "[tracked simulation link]";

const FLAG = {
  greet: "Generic greeting instead of your name",
  typo: "Spelling and grammar mistakes",
  sender: "Display name and sender address don't match",
  look: "Lookalike sender domain (one character changed)",
  newdom: "Sender domain isn't the company's own",
  hover: "Link text and the real destination differ",
  rush: "Artificial deadline and pressure",
  pw: "Asks you to sign in from an email link",
  process: "Breaks a known process",
  secret: "Asks you to keep it quiet or bypass normal checks",
  external: "External sender pretending to be internal",
  attach: "Unexpected attachment or file to open",
  fee: "Small payment to release something",
  phone: "Phone number to call instead of a link",
  qr: "QR code hides the destination",
  reply: "Reply-To goes somewhere else",
};
const f = (key, t) => ({ t, f: key });

// Easy: an unrelated domain. Normal: one letter swapped (i -> l, o -> 0). Hard: the real name plus a plausible extra word.
function sender(level, team, local, dom = DOM, internal = true) {
  const base = dom.split(".")[0], tld = dom.slice(base.length);
  if (level === "easy") return { name: team, addr: `${local}@${base.slice(0, 9)}-secure-notify.info`, flags: [f("sender", ""), f("newdom", "")] };
  if (level === "normal") { const swap = base.includes("i") ? base.replace("i", "l") : base.includes("o") ? base.replace("o", "0") : base + "s";
    return { name: internal ? `${team} | ${ORG}` : team, addr: `${local}@${swap}${tld}`, flags: [f("look", "")] }; }
  return { name: team, addr: `${local}@${base}-portal${tld}`, flags: [f("newdom", "")] };
}
const greet = (level, first = "{First name}") => (level === "easy" ? [f("greet", "Dear user,")] : [`Hi ${first},`]);
const rush = (level, easy, normal, hard) => (level === "easy" ? f("rush", easy) : level === "normal" ? f("rush", normal) : hard);
const ty = (level, good, bad) => (level === "easy" ? f("typo", bad) : good);
const button = (level, label, real) => (level === "hard" ? { btn: label, href: LINK } : { btn: label, href: LINK, f: "hover", real });

// Theme writers. Each returns { team, local, subject, body: [[segments]], btn, sig, footer, extraFlags }
const EMAIL = {
  it: (r, lv, pre) => {
    const variants = {
      "Mailbox storage almost full": { subj: `Action required: your mailbox is 98% full`, body: [
        ["Your mailbox has reached ", ty(lv, "49.1 GB of its 50 GB limit", "49.1 GB of it's 50 GB limmit"), ". When it is full, new messages will be held and may be returned to the sender."],
        ["To keep receiving email, review your storage and archive older items. Our new self-service tool will move anything older than 12 months to your online archive automatically."],
        [rush(lv, "Please do this within 2 hours or your account will be suspended.", "Please complete this by the end of today so incoming mail is not held overnight.", "You can do this at any time this week.")]],
        btn: "Review my storage" },
      "Password expiry notice": { subj: "Your password expires today", body: [
        ["Our records show your network password ", ty(lv, "will expire at 17:00 today", "will expired at 17:00 today"), ". After that you will be unable to access email, Teams and VPN."],
        ["To keep your current password, confirm it through the secure portal below. If you would prefer a new one, you can change it there too."],
        [rush(lv, "Failure to act imediately will result in loss of access.", "Please do this before you log off today.", "Changing it now avoids any interruption tomorrow morning.")]],
        btn: "Keep my password", pw: true },
      "New sign-in from an unknown device": { subj: "New sign-in to your account from Windows (Lagos, NG)", body: [
        ["We noticed a new sign-in to your Northwind account."],
        ["Device: Windows 11 · Chrome", { br: 1 }, "Location: Lagos, Nigeria (approximate)", { br: 1 }, `Time: ${new Date().toUTCString().slice(0, 22)} UTC`],
        ["If this was you, you don't need to do anything. If you don't recognise it, ", ty(lv, "secure your account now", "secure you're acount now"), " so we can sign out the other device."],
        [rush(lv, "Unverified accounts will be locked in 1 hour.", "For your protection, unverified sign-ins are blocked after 24 hours.", "")]],
        btn: "This wasn't me", pw: true },
      "MFA re-enrolment required": { subj: "Multi-factor authentication re-enrolment", body: [
        ["As part of the move to our new identity platform, every member of staff needs to re-register their authenticator app."],
        ["It takes about two minutes: sign in, scan the code on screen with your phone, and approve the test notification."],
        [rush(lv, "Accounts not re-enrolled by 3pm today will be disabled.", "Please complete this by Friday. Accounts not re-enrolled will need a Service Desk call to unlock.", "The old method will stop working at the end of the month.")]],
        btn: "Start re-enrolment", pw: true },
      "Shared mailbox access request": { subj: "Access granted: finance-ap@northwindtraders.com", body: [
        ["You have been given access to the shared mailbox ", "finance-ap", " at the request of your manager."],
        ["To add it to Outlook, open the link below and sign in once. The mailbox will appear in your folder list within a few minutes."],
        ["If you were not expecting this, you can ignore the message."]],
        btn: "Open shared mailbox", pw: true },
    };
    const v = variants[pre] || variants["Mailbox storage almost full"];
    return { team: "IT Service Desk", local: "servicedesk", subject: v.subj, body: v.body, btn: v.btn, pw: v.pw,
      sig: ["IT Service Desk", `${ORG} · ext. 4400`, `Ticket INC00${48000 + Math.floor(r() * 900)}`], footer: "This is an automated message from the IT Service Desk. Please do not reply to this email." };
  },
  docs: (r, lv, pre) => {
    const who = P(r, PEOPLE); const file = P(r, ["Q4 supplier rates - revised.xlsx", "Contract renewal 2027 - FINAL.pdf", "Team restructure proposal.docx", "Budget variance Nov.xlsx"]);
    const sign = /e-sign/.test(pre);
    return { team: sign ? "Document Signing" : `${who} (via Northwind Files)`, local: sign ? "esign" : "files-noreply", subject: sign ? `Please review and sign: ${file}` : `${who} shared "${file}" with you`,
      body: sign ? [[`${who} has sent you a document to review and sign.`], [{ card: file, sub: "1 document · 3 pages · signature required on page 3" }],
        ["Please review the document and add your signature. The sender will be notified as soon as it is complete."], [rush(lv, "This document expires in 2 hours.", "This request expires at midnight tonight.", "")]]
        : [[`${who} shared a file with you.`], [{ card: file, sub: `"Can you check the figures on tab 2 before tomorrow's call? Thanks!"` }],
          ["You can open it in your browser. You may be asked to sign in to confirm your identity."]],
      btn: sign ? "Review document" : "Open", pw: true, attach: false,
      sig: [], footer: `You're receiving this because ${who} shared a file with you. Northwind Files, ${ORG}.` };
  },
  hr: (r, lv, pre) => ({ team: "People Team", local: "people", subject: pre === "Staff survey closing today" ? "Last chance: staff survey closes at 5pm" : `${pre}`,
    body: [[`We have updated ${pre.toLowerCase().includes("policy") ? "the hybrid working policy following feedback from the autumn survey" : "our guidance for the coming year"}. The main changes are:`],
      [{ list: ["Core collaboration days are now Tuesday and Thursday", "Home working equipment allowance has increased", "New process for requesting compressed hours"] }],
      ["All staff are asked to read the policy and confirm they have done so in the HR portal."],
      [rush(lv, "Staff who do not acknowledge today may have there pay delayed.", "Please acknowledge by the end of this week.", "Please acknowledge when convenient.")]],
    btn: "Read and acknowledge", pw: true, sig: ["Kind regards,", "The People Team", ORG], footer: "People Team · HR Portal · This email was sent to all staff." }),
  finance: (r, lv, pre) => {
    const sup = "Contoso Office Supplies"; const inv = `INV-${20460 + Math.floor(r() * 400)}`;
    if (lv === "hard" && !/Purchase order|Expense/.test(pre)) return { team: "Accounts Receivable | Contoso", local: "accounts", dom: "contososupplies.com", noButton: true, subject: `Re: ${inv} - updated remittance details`, replyTo: "accounts.contoso@outlook-mail.co",
      body: [["Hello,"], [`Following our call last week, please note that our bank details have changed as we move to a new provider. All payments from ${new Date().toLocaleDateString(undefined, { day: "numeric", month: "long" })} should go to the account in the attached letter.`],
        [f("process", `Could you please update your records and confirm once the outstanding balance on ${inv} (£18,420.00) has been scheduled to the new account?`)], ["Many thanks for your help, and apologies for any inconvenience."]],
      attach: "Contoso - change of bank details.pdf", sig: ["Rachel Green", "Accounts Receivable", sup, "Tel: +44 20 7946 0123"], footer: "" };
    const amount = `£${(2400 + Math.floor(r() * 9000)).toLocaleString()}.00`;
    if (pre.includes("Purchase order")) return { team: "Procurement", local: "procurement", subject: `PO-${88100 + Math.floor(r() * 800)} is waiting for your approval`,
      body: [[...greet(lv)], [`A purchase order for ${amount} from ${sup} has been routed to you for approval because the usual approver is on leave.`],
        [{ list: [`Supplier: ${sup}`, `Amount: ${amount} (incl. VAT)`, "Cost centre: CC-4410 Operations", "Requested by: Facilities"] }],
        ["Please review the order and approve or reject it in the procurement portal. You will need to sign in with your network account."],
        [rush(lv, "If its not aproved in 2 hours the supplier will cancel the order.", "Please action this today so the order can go out tomorrow.", "")]],
      btn: "Review purchase order", pw: true, sig: ["Procurement Team", ORG], footer: "This is a system notification from the procurement portal." };
    if (pre.includes("Expense")) return { team: "Expenses", local: "expenses", subject: "Your expense claim was returned: more detail needed",
      body: [[...greet(lv)], [`Your expense claim EXP-${3300 + Math.floor(r() * 600)} (${amount.replace(/\d,?\d{3}/, "1" + Math.floor(r() * 9))}) was returned by Finance.`],
        [{ quote: "Receipt for the hotel on 14th is missing. Please re-upload it and confirm the business purpose." }],
        ["Open the claim to add the missing details. Claims not resubmitted are not paid in this month's payroll."],
        [rush(lv, "Resubmit within 24 hours or the claim will be canceled.", "Please resubmit before Thursday's payroll cut-off.", "")]],
      btn: "Open my claim", pw: true, sig: ["Finance Shared Services", ORG], footer: "Automated message from the expenses system." };
    return { team: `Accounts | ${sup}`, local: "accounts", dom: "contososupplies.com", subject: pre.includes("Overdue") ? `OVERDUE: ${inv} - second reminder` : `Remittance advice - payment ${inv}`,
      body: [[ty(lv, "Hello,", "Dear Sir/Madam,")], [`Our records show invoice ${inv} for ${amount} ${pre.includes("Remittance") ? "has been paid. Please see the remittance advice attached." : "remains unpaid and is now 14 days past due."}`],
        [pre.includes("Remittance") ? "Open the attachment to view the payment breakdown and the invoices it covers." : "A copy of the invoice and your current statement of account are attached. If payment has already been made, please send us the remittance advice so we can update our records."],
        [pre.includes("Remittance") ? "If any of the amounts look wrong, reply to this email and our accounts team will look into it." : ty(lv, "Please arrange payment or let us know if there is a problem with the invoice.", "Please arrange payment imediately or contact us if their is a problem.")],
        [rush(lv, "Failure to pay within 24 hours will result in legal action.", "To avoid a late payment fee, please settle by Friday.", "")]],
      attach: pre.includes("Remittance") ? `Remittance_${inv}.html` : `${inv}.pdf`, noButton: true, sig: ["Accounts Team", sup], footer: "Please do not reply to this mailbox. It is not monitored." };
  },
  delivery: (r, lv, pre) => ({ team: "ParcelPoint Delivery", local: "noreply", dom: "parcelpoint.com", subject: pre.includes("fee") ? "Your parcel is waiting: action needed" : pre.includes("Customs") ? "Customs documents required for your shipment" : "We missed you: reschedule your delivery",
    body: [[...greet(lv), ""], [`We tried to deliver your parcel (tracking PP${Math.floor(1e9 + r() * 9e9)}) today but ${pre.includes("fee") ? "an unpaid shipping fee of " : "nobody was available to receive it."}`, pre.includes("fee") ? f("fee", "£1.99 must be paid before we can release it") : ""],
      [`You can choose a new delivery date or a collection point using the link below.`], [rush(lv, "Parcels not rescheduled within 24 hours will be returned to sender.", "Parcels are held for 5 working days before being returned.", "")]],
    btn: pre.includes("fee") ? "Pay and reschedule" : "Reschedule delivery", sig: ["ParcelPoint Customer Service"], footer: "ParcelPoint Ltd. Please do not reply to this message." }),
  collab: (r, lv, pre) => { const who = P(r, PEOPLE);
    return { team: "Microsoft Teams (Northwind)", local: "teams-noreply", subject: pre.includes("recording") ? "Recording available: Weekly ops sync" : pre.includes("mentioned") ? `${who} mentioned you in #finance-ops` : `You have 3 unread messages from ${who}`,
      body: [[pre.includes("recording") ? "The recording and transcript for Weekly ops sync are ready to view." : `${who} sent you messages while you were away:`],
        [{ quote: pre.includes("recording") ? "Duration 47:12 · Transcript and AI summary included" : `"Hey, did you see the updated numbers? Need your sign-off before 3, link below"` }],
        ["Open the conversation to reply."]],
      btn: pre.includes("recording") ? "Watch recording" : "Reply in Teams", pw: true, sig: [], footer: "You're receiving this email because you have unread activity. Manage notification settings." }; },
  exec: (r, lv) => ({ team: "Sarah Mitchell", local: "s.mitchell.ceo", subject: "Quick favour", body: [[ty(lv, "Hi {First name},", "Hi,")],
    ["Are you at your desk? I'm in back-to-back meetings with the board and need something sorted quickly."],
    [f("secret", "Please keep this between us for now, it's for a staff thank-you that's meant to be a surprise.")], ["Reply here and I'll send the details. I can't take calls at the moment."]],
    sig: ["Sarah", "", "Sent from my iPhone"], footer: "", noButton: true }),
  ai: (r, lv) => ({ team: "AI Workplace Team", local: "ai-workplace", subject: "Your Copilot licence is ready: activate it today", body: [[...greet(lv)],
    ["Good news: you've been selected for the next wave of our AI assistant rollout. Your licence has been assigned and is ready to activate."],
    [{ list: ["Summarise long email threads and meetings", "Draft documents from your notes", "Ask questions about your team's files"] }],
    ["Activation takes under a minute. You will be asked to sign in and grant the assistant access to your mailbox and files."],
    [rush(lv, "Unactivated licences will be reasigned to someone else in 2 hours.", "Licences not activated by Friday will be reassigned.", "")]],
    btn: "Activate my licence", pw: true, consent: true, sig: ["AI Workplace Team", ORG], footer: "This message was sent to selected staff as part of the AI assistant pilot." }),
  qr: (r, lv, pre) => ({ team: pre.includes("parking") ? "Facilities" : pre.includes("canteen") ? "Facilities" : "IT Security", local: pre.includes("parking") || pre.includes("canteen") ? "facilities" : "it-security",
    subject: pre.includes("parking") ? "New parking permits: scan to register" : pre.includes("canteen") ? "New canteen menu and pre-order" : "Action required: re-verify your account",
    body: [[...greet(lv)], [pre.includes("parking") ? "From next month, parking permits are digital. Scan the code below with your phone to register your vehicle." : pre.includes("canteen") ? "The canteen has a new winter menu, and you can now pre-order lunch. Scan the code to see this week's dishes." : "Our security systems require you to re-verify your account on a mobile device."],
      [{ qr: true }, ""], [rush(lv, "This must be done today.", "Please register before Friday.", "")]],
    sig: [pre.includes("Scan to re") ? "IT Security" : "Facilities Team", ORG], footer: "", noButton: true, qrFlag: true }),
  callback: (r, lv) => ({ team: "SecureShield Billing", local: "billing", dom: "secureshield.com", subject: `Order confirmation #SS-${Math.floor(1e6 + r() * 9e6)}`, body: [["Thank you for your order."],
    [{ list: ["SecureShield Total Protection, 3 devices, 1 year", "Amount charged: £299.99", "Renewal: automatic"] }],
    ["If you did not authorise this purchase, or want to cancel and receive a refund, ", f("phone", "call our billing team on +44 20 7946 0958"), " within 24 hours."],
    ["No action is needed if you wish to keep your subscription."]],
    sig: ["SecureShield Billing Department"], footer: "This is an automated receipt.", noButton: true }),
};

/** Build a full sample message for the brief. */
export function sampleMessage(r, { themeKey, pretext, channel, level }) {
  const lv = level === "hard" ? "hard" : level === "easy" ? "easy" : "normal";
  const m = (EMAIL[themeKey] || EMAIL.it)(r, lv, pretext);
  const s = sender(lv, m.team, m.local, m.dom || DOM, !m.dom);
  const planted = new Set(s.flags.map((x) => x.f));
  const walk = (seg) => { if (seg && typeof seg === "object" && seg.f) planted.add(seg.f); };
  m.body.forEach((p) => p.forEach(walk));
  if (m.btn && !m.noButton && lv !== "hard") planted.add("hover");
  if (m.pw) planted.add("pw");
  if (m.attach && lv !== "hard") planted.add("attach");
  if (m.replyTo) planted.add("reply");
  if (m.qrFlag) planted.add("qr");
  if (lv !== "easy" && (m.local === "servicedesk" || m.team.includes("People") || m.team.includes("Facilities"))) planted.add("external");
  const msg = { channel, from: s.name, addr: s.addr, replyTo: m.replyTo || "", to: "{First name} {Last name}", subject: m.subject, body: m.body, sig: m.sig, footer: m.footer,
    btn: m.noButton || !m.btn ? null : button(lv, m.btn, s.addr.split("@")[1]), attach: m.attach || "", external: lv !== "easy",
    flags: [...planted].map((k) => [k, FLAG[k]]) };
  if (channel === "sms") return { ...msg, sms: smsText(lv, m) };
  if (channel === "chat") return { ...msg, chat: chatText(lv, m) };
  if (channel === "voice") return { ...msg, voice: voiceScript(lv, m) };
  return msg;
}
const plain = (segs) => segs.map((x) => (typeof x === "string" ? x : x?.t || "")).join("");
function smsText(lv, m) {
  const first = plain(m.body.find((p) => p.some((x) => typeof x === "string" && x.length > 30)) || m.body[0]).slice(0, 120);
  return `${m.team.split(" |")[0]}: ${first} ${lv === "easy" ? "Act now:" : "Details:"} nwt-${lv === "hard" ? "staff" : "secure"}.link/${Math.random().toString(36).slice(2, 7)}`;
}
function chatText(lv, m) {
  return [`${m.team.split(" |")[0]} (External)`, `Hi! ${plain(m.body[0]).slice(0, 140)}`, `${lv === "easy" ? "Pls do it now, its urgent" : "Can you take a look when you get a sec?"} ${LINK}`];
}
function voiceScript(lv, m) {
  return [`Caller introduces themselves as "${m.team.split(" |")[0]}" and mentions ${m.subject.toLowerCase()}.`, "Builds trust with a real-sounding detail: a ticket number, a colleague's name, or the person's team.",
    lv === "hard" ? "Asks the person to read back a code sent to their phone, framed as 'confirming it's really you'." : "Asks the person to approve a sign-in prompt or visit a website while on the call.",
    "Pass condition: the person hangs up and calls the Service Desk back on the number from the intranet."];
}
export { FLAG };
