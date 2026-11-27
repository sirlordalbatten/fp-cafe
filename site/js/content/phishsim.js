// Phishing simulation planner for awareness teams. It produces campaign briefs (pretext, outline,
// the red flags to teach, the follow-up), never a ready-to-send kit: no credential capture pages,
// no real brand templates. The aim is more reports, not more "gotchas".

export const THEMES = [
  { k: "it", t: "IT and accounts", pre: ["Mailbox storage almost full", "Password expiry notice", "New sign-in from an unknown device", "MFA re-enrolment required", "Shared mailbox access request"] },
  { k: "docs", t: "Shared documents", pre: ["A document was shared with you", "Please review and e-sign this agreement", "Scanned document from the office copier", "Updated version of a file you edited"] },
  { k: "hr", t: "HR and policy", pre: ["Updated hybrid working policy to acknowledge", "Annual training reminder", "Staff survey closing today", "New wellbeing benefit to register for"] },
  { k: "finance", t: "Finance and invoices", pre: ["Overdue invoice from a supplier", "Expense claim needs more detail", "Remittance advice attached", "Purchase order approval waiting"] },
  { k: "delivery", t: "Deliveries", pre: ["Parcel held, small fee to release", "Delivery attempt failed, reschedule", "Customs paperwork needed"] },
  { k: "collab", t: "Chat and meetings", pre: ["Missed Teams/Slack message from a colleague", "Meeting recording is ready", "You were mentioned in a channel", "Calendar invite with an agenda link"] },
  { k: "exec", t: "Urgent request from a leader", pre: ["Quick favour, are you at your desk?", "Need this before the board meeting", "Confidential: don't discuss yet"] },
  { k: "ai", t: "AI tools", pre: ["Your AI assistant licence is ready, activate it", "New company AI policy to accept", "AI meeting summary shared with you"] },
  { k: "qr", t: "QR codes", pre: ["Scan to re-verify your account", "Scan for the new parking permit", "Scan to view the updated canteen menu"] },
  { k: "callback", t: "Call-back (TOAD)", pre: ["Subscription renewal charged, call to cancel", "Security alert: call the number to verify"] },
];
export const CHANNELS = [["email", "Email"], ["sms", "Text message"], ["chat", "Teams or Slack message"], ["qr", "Printed QR code poster"], ["voice", "Phone call (vishing drill)"]];
export const LEVELS = [
  ["easy", "Easy", "Several obvious red flags. Good for a first campaign or new starters."],
  ["normal", "Normal", "Two or three red flags. A realistic everyday phish."],
  ["hard", "Hard", "One subtle red flag. For trained teams and high-risk roles only."],
];
const FLAGS = {
  easy: ["Generic greeting ('Dear user')", "Spelling or grammar mistakes", "Sender address doesn't match the display name", "Link text and real destination differ (hover to see)", "Artificial deadline ('within 2 hours')", "Request to enter a password from an email link"],
  normal: ["Lookalike sender domain (one letter changed)", "Unexpected request, even though the tone is normal", "Deadline pressure", "Link goes to a domain that isn't the company's or the service's"],
  hard: ["Sender domain is new or a near miss of a real supplier", "The request breaks a known process (for example, changing bank details by email)"],
};
const CH_FLAGS = {
  sms: "Texts can't show a real sender, and links are shortened. Companies rarely send account links by text.",
  chat: "External chat messages carry an 'external' label. Attackers rely on people ignoring it.",
  qr: "A QR code hides the link until it's scanned, and phones show only a short preview. Check the domain before opening.",
  voice: "Callers can spoof caller ID. Hang up and call back on a number you already know.",
  email: "Hover over every link. Check the sender's full address, not just the name.",
};
const MONTHS = [
  ["January", "New-year benefits and payroll changes; password resets after the holidays"],
  ["February", "Tax documents and year-end statements; e-cards"],
  ["March", "Tax deadlines in many countries; conference invites"],
  ["April", "Tax refunds; quarter-end invoices"],
  ["May", "Performance reviews and pay letters (handle with HR, see the ethics rules)"],
  ["June", "Travel bookings; summer events and festivals"],
  ["July", "Mid-year policy updates; shared documents during holidays"],
  ["August", "Back-to-school; delivery notices"],
  ["September", "Benefits enrolment prep; new project kick-offs"],
  ["October", "Cybersecurity Awareness Month: run a report-the-phish challenge, not a trap"],
  ["November", "Shopping-season deliveries; charity appeals"],
  ["December", "Holiday parcels; year-end bonuses and party invites (avoid fake bonuses)"],
];
export const ETHICS = [
  "Get written approval from leadership, HR and, where you have one, the works council or union.",
  "Never fake bonuses, pay cuts, layoffs, health results or family emergencies. They hurt people and destroy trust in the security team.",
  "Never capture real passwords. Record the click or the form submission, discard what was typed.",
  "No public naming, league tables of clickers, or punishment. Repeat clickers get help, not consequences.",
  "Make reporting the easiest thing to do, and thank every reporter quickly.",
  "Tell people simulations happen (not when). Surprise is fine, deception about the programme isn't.",
  "Don't impersonate real external brands without legal advice. Generic or internal-style lures teach the same skills.",
];
export const METRICS = [
  ["Report rate", "Share of recipients who reported it. The number to grow. Good programmes see this pass the click rate.", "up"],
  ["Time to first report", "Minutes until the first person reported it. This is how fast the SOC hears about a real phish.", "down"],
  ["Click rate", "Useful as a trend, never as a target on its own. It swings with how hard the lure was.", "down"],
  ["Submission rate", "Typed something into the landing form. The real risk signal. Never store what they typed.", "down"],
  ["Repeat clickers", "People who clicked in several campaigns. Offer them short, kind coaching.", "down"],
];

const P = (r, a) => a[Math.floor(r() * a.length)];
const NAMES = ["Operation Paper Cut", "Spring Clean", "Inbox Zero", "The Long Weekend", "Parcel Panic", "Quiet Quarter", "Fresh Coffee", "Second Look", "Hover First", "Report It", "Slow Down", "Stop Think Check"];

/** Build a campaign brief. */
export function brief(r, { theme, channel, level }) {
  const th = THEMES.find((x) => x.k === theme) || P(r, THEMES); const pre = P(r, th.pre);
  const ch = CHANNELS.find((x) => x[0] === channel) || CHANNELS[0]; const lv = LEVELS.find((x) => x[0] === level) || LEVELS[1];
  const n = { easy: 4, normal: 3, hard: 2 }[lv[0]];
  const flags = [...FLAGS[lv[0]]].sort(() => r() - 0.5).slice(0, n);
  const outline = [
    `Opening: "${pre}", written like a routine internal message about ${th.t.replace(/^(\w)/, (c) => c.toLowerCase()).replace(/^iT/, "IT").replace(/^aI/, "AI").replace(/^hR/, "HR").replace(/^qR/, "QR")}.`,
    `Hook: ${lv[0] === "hard" ? "a plausible, routine reason to act" : "a reason to act quickly"}.`,
    ch[0] === "voice" ? "Ask: the caller asks the person to confirm details or approve a prompt." : ch[0] === "qr" ? "Call to action: a QR code to scan." : "Call to action: one link to a simulation landing page.",
    "Sign-off: a believable team name, not a real person's name.",
  ];
  return {
    name: P(r, NAMES), theme: th.t, themeKey: th.k, channelKey: ch[0], levelKey: lv[0], pretext: pre, channel: ch[1], level: lv[1], levelWhy: lv[2], outline, flags, channelTip: CH_FLAGS[ch[0]],
    landing: `Oops, this was a practice ${ch[1].toLowerCase()} from the security team. Nothing bad happened, and nothing you typed was kept. Here's what gave it away: ${flags.slice(0, 2).map((f) => f.toLowerCase()).join("; ")}. Next time, use the Report button. It takes two seconds and it's exactly what we want.`,
    followup: `Two days later, share a short note with everyone: what the simulation looked like, the ${n} red flags, the report rate, and a thank-you to the reporters (by count, not by name).`,
  };
}
export { MONTHS };
