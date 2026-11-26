// Buddy and people art. Static SVG written in this repo (no data goes in here).
export function hatArt(id){ switch(id){
  case "cap": return `<path d="M21 27Q40 4 59 27Z" fill="#5CE1C6"/><path d="M52 25l17 3-17 2z" fill="#2F8F7D"/><circle cx="40" cy="12" r="2" fill="#2F8F7D"/>`;
  case "shades": return `<rect x="21" y="38" width="16" height="10" rx="3" fill="#14161C"/><rect x="43" y="38" width="16" height="10" rx="3" fill="#14161C"/><path d="M37 42h6" stroke="#14161C" stroke-width="2.5"/><path d="M24 40l5 0" stroke="#ffffff55" stroke-width="1.5"/>`;
  case "tophat": return `<rect x="29" y="0" width="22" height="22" rx="2" fill="#1C1F27"/><rect x="29" y="15" width="22" height="4" fill="#E8505B"/><rect x="22" y="20" width="36" height="5" rx="2" fill="#1C1F27"/>`;
  case "phones": return `<path d="M17 44A23 23 0 0 1 63 44" stroke="#2A2E3A" stroke-width="5" fill="none"/><rect x="11" y="38" width="10" height="16" rx="4" fill="#E8505B"/><rect x="59" y="38" width="10" height="16" rx="4" fill="#E8505B"/>`;
  case "helmet": return `<path d="M16 31Q40-2 64 31Z" fill="#F5B841"/><rect x="14" y="29" width="52" height="5" rx="2" fill="#C98F1E"/><circle cx="40" cy="17" r="5" fill="#FFF3C4" stroke="#C98F1E" stroke-width="2"/>`;
  case "grad": return `<path d="M24 22h32v6H24z" fill="#1C1F27"/><path d="M40 6l26 9-26 9-26-9z" fill="#262A35"/><path d="M60 15v12" stroke="#F5B841" stroke-width="2"/><circle cx="60" cy="28" r="2.5" fill="#F5B841"/>`;
  case "crown": return `<path d="M24 26V10l8 8 8-12 8 12 8-8v16z" fill="#F5B841" stroke="#C98F1E" stroke-width="1.5" stroke-linejoin="round"/><circle cx="40" cy="19" r="2.5" fill="#E8505B"/>`;
  default: return ""; } }
// The analysts: six SOC colleagues drawn as half-body portraits at their desks, in a soft 3D style.
// Natural proportions, shaded faces, headsets. They blink, breathe, type, and talk when they speak.
const CHARS = {
  sunny: { skin: "#F2C6A4", skin2: "#D99B78", hair: "#3B1E3F", hair2: "#FF5FA8", top: "#6D5DF5", top2: "#4B3FC4", eyes: "#2A1A22", brow: "#3B1E3F", lip: "#B5625F" },
  dex:   { skin: "#E2AD86", skin2: "#B97E5A", hair: "#3B2C24", hair2: "#5A463A", top: "#5B6478", top2: "#3E465A", eyes: "#22180F", brow: "#3B2C24", lip: "#9C5B4C", hat: "#22806F", hat2: "#2FA58E" },
  rin:   { skin: "#F3D0B3", skin2: "#D5A584", hair: "#14172A", hair2: "#2FD3B5", top: "#1C6E61", top2: "#124B43", eyes: "#18131C", brow: "#14172A", lip: "#B66A65" },
  theo:  { skin: "#8A5636", skin2: "#633A22", hair: "#1A120D", hair2: "#2E2119", top: "#D99A35", top2: "#A8721F", eyes: "#140D09", brow: "#1A120D", lip: "#5E2E24", shirt: "#F3EEE4" },
  juno:  { skin: "#F7D7BF", skin2: "#DDAA88", hair: "#E8762A", hair2: "#FFB15A", top: "#2B2B33", top2: "#17171C", eyes: "#1D1713", brow: "#B65A1E", lip: "#C0675F" },
  noor:  { skin: "#CF9670", skin2: "#A66F4C", hair: "#6E54C9", hair2: "#9C86F2", top: "#24304F", top2: "#172038", eyes: "#1B1214", brow: "#2B1C18", lip: "#9A5650" },
};
const MIGRATE = { cat: "dex", owl: "noor", fox: "juno", panda: "theo" };
export const charKey = (k) => (CHARS[k] ? k : MIGRATE[k] || "sunny");

const FACE = "M41 44C41 29 49 21 60 21C71 21 79 29 79 44C79 57 72 66 60 67C48 66 41 57 41 44Z";
function hairBack(k, C) {
  switch (k) {
    case "sunny": return `<path d="M74 24C86 18 95 26 90 40C88 48 84 54 80 56C84 46 84 36 76 30Z" fill="${C.hair}"/><path d="M80 28C86 26 89 31 87 37" stroke="${C.hair2}" stroke-width="1.6" fill="none" opacity=".7"/>`;
    case "rin": return `<path d="M37 64C33 42 39 19 60 18C81 19 87 42 83 64L75 64C78 48 75 35 60 34C45 35 42 48 45 64Z" fill="${C.hair}"/>`;
    case "noor": return `<path d="M33 62C29 32 41 14 60 14C79 14 91 32 87 62C94 74 98 90 98 120H22C22 90 26 74 33 62Z" fill="url(#hj-${k})"/>`;
    default: return "";
  }
}
function hairFront(k, C) {
  switch (k) {
    case "sunny": return `<path d="M40 45C37 27 49 17 62 18C75 19 82 28 80 43C76 33 70 29 62 30C53 31 46 37 40 45Z" fill="${C.hair}"/><path d="M50 22C57 19 66 20 72 24" stroke="${C.hair2}" stroke-width="2" fill="none" stroke-linecap="round" opacity=".85"/>`;
    case "dex": return `<path d="M40 46C38 41 39 37 41 35M80 46C82 41 81 37 79 35" stroke="${C.hair}" stroke-width="3" stroke-linecap="round"/><path d="M39 38C39 21 49 13 60 13C71 13 81 21 81 38Z" fill="url(#hat-${k})"/><rect x="37.5" y="33" width="45" height="7.5" rx="3.7" fill="${C.hat2}"/><path d="M44 34v6M50 34v6M56 34v6M62 34v6M68 34v6M74 34v6" stroke="#00000030" stroke-width="1"/><path d="M47 18C53 15 61 15 66 17" stroke="#ffffff30" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case "rin": return `<path d="M41 41C41 27 49 20 60 20C71 20 79 27 79 41C73 36 66 34 60 35C54 34 47 36 41 41Z" fill="${C.hair}"/><path d="M66 21C73 24 77 30 78 38" stroke="${C.hair2}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
    case "theo": return `<path d="M41 38C41 25 50 19 60 19C70 19 79 25 79 38C77 33 72 30 60 30C48 30 43 33 41 38Z" fill="${C.hair}"/>${[[44, 30], [48, 25], [54, 22], [60, 21], [66, 22], [72, 25], [76, 30]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="3.6" fill="${C.hair}"/>`).join("")}`;
    case "juno": return `<path d="M40 42C38 23 48 14 62 15C75 16 83 26 80 40L76 33L72 37L69 29L64 34L60 27L55 33L50 28L46 36Z" fill="${C.hair}"/><path d="M52 19C58 16 66 17 72 21" stroke="${C.hair2}" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M40 42C40 46 41 49 42 51" stroke="#00000020" stroke-width="2"/>`;
    case "noor": return `<path d="M41 47C40 28 49 19 60 19C71 19 80 28 79 47" stroke="${C.hair2}" stroke-width="4" fill="none" stroke-linecap="round" opacity=".9"/>`;
  }
  return "";
}
function outfit(k, C) {
  const base = `<path d="M22 120C23 93 37 80 52 77L60 83L68 77C83 80 97 93 98 120Z" fill="url(#top-${k})"/>`;
  switch (k) {
    case "sunny": return base + `<path d="M52 77Q60 90 68 77" stroke="${C.top2}" stroke-width="3" fill="none"/><path d="M54 84v14M66 84v14" stroke="#ffffffaa" stroke-width="1.4" stroke-linecap="round"/>`;
    case "dex": return base + `<path d="M50 77Q60 92 70 77" fill="${C.top2}"/><path d="M55 86v12M65 86v12" stroke="#D9DEE8" stroke-width="1.4" stroke-linecap="round"/>`;
    case "rin": return base + `<path d="M52 77L60 92L68 77" fill="#E9EEF5"/><path d="M60 92V120" stroke="${C.top2}" stroke-width="1.5"/><path d="M52 77L46 88L56 84Z M68 77L74 88L64 84Z" fill="${C.top2}"/>`;
    case "theo": return base + `<path d="M52 77L60 94L68 77Z" fill="${C.shirt}"/><path d="M52 77L49 120M68 77L71 120" stroke="${C.top2}" stroke-width="2.2"/><circle cx="57" cy="103" r="1.3" fill="${C.top2}"/><circle cx="57" cy="112" r="1.3" fill="${C.top2}"/>`;
    case "juno": return base + `<path d="M52 77L60 90L68 77Z" fill="#E8505B"/><path d="M52 77L42 96L55 88Z M68 77L78 96L65 88Z" fill="#3A3A44"/><path d="M36 96L44 108" stroke="#ffffff22" stroke-width="1.5"/>`;
    case "noor": return `<path d="M28 120C29 96 40 84 54 81L60 92L66 81C80 84 91 96 92 120Z" fill="url(#top-${k})"/><path d="M54 81L60 92L66 81" fill="#E9EEF5"/>`;
  }
  return base;
}
function headset(k) {
  const y = k === "dex" ? 2 : 0;
  return `<g class="m-headset"><path d="M39 ${44 + y}C38 ${19 + y} 82 ${19 + y} 81 ${44 + y}" stroke="#262B38" stroke-width="3.2" fill="none" stroke-linecap="round"/>
    <rect x="35" y="${41 + y}" width="8" height="13" rx="3.5" fill="#262B38"/><rect x="77" y="${41 + y}" width="8" height="13" rx="3.5" fill="#262B38"/>
    <circle class="m-led" cx="39" cy="${47.5 + y}" r="1.4" fill="#5CE1C6"/>
    <path d="M39 ${54 + y}C40 61 45 63 52 62" stroke="#262B38" stroke-width="1.8" fill="none" stroke-linecap="round"/><rect x="51" y="60" width="5" height="3.4" rx="1.7" fill="#3A4152"/></g>`;
}
function extras(k, C) {
  switch (k) {
    case "dex": return `<path d="M46 56C48 64 54 67 60 67C66 67 72 64 74 56C70 61 66 62.5 60 62.5C54 62.5 50 61 46 56Z" fill="#00000018"/>`;
    case "rin": return `<g fill="#ffffff14" stroke="#1E2340" stroke-width="1.5"><circle cx="52" cy="46" r="5.8"/><circle cx="68" cy="46" r="5.8"/></g><path d="M57.8 45.5h4.4M46.2 45l-4.6-1.5M73.8 45l4.6-1.5" stroke="#1E2340" stroke-width="1.5"/>`;
    case "theo": return `<path d="M43 50C44 63 51 68 60 68C69 68 76 63 77 50C75 58 71 62 66 62.5C63 60 57 60 54 62.5C49 62 45 58 43 50Z" fill="${C.hair}"/><path d="M54 57.6C57 55.8 63 55.8 66 57.6C63 58.6 57 58.6 54 57.6Z" fill="${C.hair}"/>`;
    case "juno": return `<g fill="#C7814F" opacity=".55"><circle cx="48" cy="53" r=".8"/><circle cx="50.5" cy="54.5" r=".8"/><circle cx="47" cy="55.5" r=".7"/><circle cx="72" cy="53" r=".8"/><circle cx="69.5" cy="54.5" r=".8"/><circle cx="73" cy="55.5" r=".7"/></g>`;
  }
  return "";
}
function faceFeatures(k, mood, C) {
  const L = 52, R = 68, y = 46;
  const brows = { sunny: [-1, 0.5], dex: [1, -0.6], rin: [0, 0], theo: [-0.5, 0.4], juno: [-1.5, 1], noor: [0, 0.3] }[k];
  const sad = mood === "sad", sleepy = mood === "sleepy", happy = mood === "happy";
  const bt = sad ? 2.4 : brows[1];
  const brow = `<path d="M${L - 5} ${y - 6 + brows[0] + (sad ? 1 : 0)}Q${L} ${y - 9 + brows[0] - bt} ${L + 4.5} ${y - 7 + brows[0] + (sad ? -1 : 0)}M${R - 4.5} ${y - 7 + brows[0] + (sad ? -1 : 0)}Q${R} ${y - 9 + brows[0] - bt} ${R + 5} ${y - 6 + brows[0] + (sad ? 1 : 0)}" stroke="${C.brow}" stroke-width="1.9" fill="none" stroke-linecap="round"/>`;
  const eye = (x) => `<ellipse cx="${x}" cy="${y}" rx="3.9" ry="2.9" fill="#FBF7F2"/><circle cx="${x}" cy="${y + 0.2}" r="2.5" fill="${C.eyes}"/><circle cx="${x + 0.9}" cy="${y - 0.8}" r=".85" fill="#fff"/>`;
  const lash = (x) => `<path d="M${x - 4.2} ${y - 0.4}Q${x} ${y - 4.2} ${x + 4.2} ${y - 0.4}" stroke="#1A1216" stroke-width="1.2" fill="none" stroke-linecap="round"/>`;
  const halfLid = (x, amt) => `<path d="M${x - 4.4} ${y - 0.6}Q${x} ${y - 4.6} ${x + 4.4} ${y - 0.6}L${x + 4.4} ${y - 3 + amt}Q${x} ${y - 4 + amt} ${x - 4.4} ${y - 3 + amt}Z" fill="${C.skin}"/><path d="M${x - 4.2} ${y - 3 + amt + 0.6}Q${x} ${y - 3.6 + amt} ${x + 4.2} ${y - 3 + amt + 0.6}" stroke="#1A1216" stroke-width="1.1" fill="none"/>`;
  let eyes = eye(L) + eye(R) + lash(L) + lash(R);
  if (sleepy) eyes += halfLid(L, 3.6) + halfLid(R, 3.6);
  else if (k === "dex" && !happy) eyes += halfLid(L, 1.7) + halfLid(R, 1.7);
  if (happy) eyes += `<path d="M${L - 3.8} ${y + 2.8}Q${L} ${y + 1} ${L + 3.8} ${y + 2.8}M${R - 3.8} ${y + 2.8}Q${R} ${y + 1} ${R + 3.8} ${y + 2.8}" stroke="${C.skin2}" stroke-width="1.4" fill="none" stroke-linecap="round"/>`;
  const lids = `<g class="m-lids"><ellipse cx="${L}" cy="${y}" rx="4.4" ry="3.4" fill="${C.skin}"/><ellipse cx="${R}" cy="${y}" rx="4.4" ry="3.4" fill="${C.skin}"/><path d="M${L - 4} ${y + 1}Q${L} ${y + 2.4} ${L + 4} ${y + 1}M${R - 4} ${y + 1}Q${R} ${y + 2.4} ${R + 4} ${y + 1}" stroke="#1A1216" stroke-width="1.1" fill="none"/></g>`;
  const nose = `<path d="M60 47.5C59.4 50.5 58.2 52 57.8 53.2C58.8 54.2 61.2 54.2 62.2 53.2" stroke="${C.skin2}" stroke-width="1.3" fill="none" stroke-linecap="round"/>`;
  let mouth;
  if (sad) mouth = `<path d="M55.5 60.2Q60 57.8 64.5 60.2" stroke="${C.lip}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  else if (happy) mouth = `<path d="M54.5 57.6Q60 63.8 65.5 57.6Q60 59 54.5 57.6Z" fill="#5B2328"/><path d="M55.6 58.1Q60 59.2 64.4 58.1" stroke="#fff" stroke-width="1.1" fill="none"/>`;
  else if (k === "dex") mouth = `<path d="M55.5 59.2Q59 59.9 64.6 58.2" stroke="${C.lip}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  else if (k === "juno") mouth = `<path d="M55 58Q60 61.5 65.5 57" stroke="${C.lip}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  else mouth = `<path d="M55 58Q60 61.4 65 58" stroke="${C.lip}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  const talk = `<ellipse class="m-talk" cx="60" cy="59.4" rx="3.2" ry="2.1" fill="#5B2328"/>`;
  return { brow, eyes, lids, nose, mouth: `<g class="m-mouth">${mouth}</g>${talk}` };
}

export function mascot(kindIn, hat, mood, react) {
  const k = charKey(kindIn); const C = CHARS[k]; const md = react ? "happy" : mood;
  const f = faceFeatures(k, md, C);
  const defs = `<defs>
    <radialGradient id="sk-${k}" cx=".42" cy=".36" r=".72"><stop offset="0" stop-color="${C.skin}"/><stop offset=".7" stop-color="${C.skin}"/><stop offset="1" stop-color="${C.skin2}"/></radialGradient>
    <linearGradient id="top-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.top}"/><stop offset="1" stop-color="${C.top2}"/></linearGradient>
    <linearGradient id="hat-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${C.hat2 || C.hair2}"/><stop offset="1" stop-color="${C.hat || C.hair}"/></linearGradient>
    <linearGradient id="hj-${k}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${C.hair2}"/><stop offset="1" stop-color="${C.hair}"/></linearGradient>
    <linearGradient id="desk-${k}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2E3A63"/><stop offset="1" stop-color="#151C34"/></linearGradient>
    <linearGradient id="rim-${k}" x1="0" y1="0" x2="1" y2="0"><stop offset=".82" stop-color="#5CE1C6" stop-opacity="0"/><stop offset="1" stop-color="#5CE1C6" stop-opacity=".16"/></linearGradient></defs>`;
  const ears = k === "noor" ? "" : `<ellipse cx="41" cy="48" rx="3.2" ry="5" fill="${C.skin2}"/><ellipse cx="79" cy="48" rx="3.2" ry="5" fill="${C.skin2}"/>`;
  const neck = `<path d="M53 60V73Q60 78 67 73V60Z" fill="${C.skin2}"/>`;
  const head = `${ears}<path d="${FACE}" fill="url(#sk-${k})"/><path d="${FACE}" fill="url(#rim-${k})"/>`;
  const arms = `<path d="M24 120C26 108 32 101 44 99L50 104C42 107 38 112 37 120Z" fill="url(#top-${k})"/><path d="M96 120C94 108 88 101 76 99L70 104C78 107 82 112 83 120Z" fill="url(#top-${k})"/>`;
  const desk = `<rect x="0" y="105" width="120" height="15" fill="url(#desk-${k})"/><path d="M0 105.5H120" stroke="#46578C" stroke-width="1"/>
    <rect x="34" y="99" width="52" height="8" rx="2" fill="#10172C" stroke="#33406A" stroke-width=".8"/><path d="M38 102h44M38 104.5h44" stroke="#2B375E" stroke-width=".8" stroke-dasharray="2.6 1.4"/>`;
  const hands = `<g class="m-hands"><ellipse class="m-hl" cx="47" cy="101.5" rx="6" ry="3.6" fill="${C.skin}"/><ellipse class="m-hr" cx="73" cy="101.5" rx="6" ry="3.6" fill="${C.skin}"/></g>`;
  const zz = md === "sleepy" ? `<g class="m-z" fill="#C9D4FF" font-size="11" font-weight="700"><text x="88" y="26">z</text><text x="95" y="15">z</text></g>` : "";
  const hatG = hat ? `<g class="m-hat" transform="translate(24 4.5) scale(.9)">${hatArt(hat)}</g>` : "";
  return `<svg viewBox="12 4 96 103" class="buddy-svg char-${k}" aria-hidden="true">${defs}
    <g class="m-bob"><g class="m-breathe">${hairBack(k, C)}${outfit(k, C)}${neck}${head}${extras(k, C) && k === "theo" ? "" : ""}${hairFront(k, C)}
      <g class="m-eyes">${f.eyes}<g class="m-pupils"></g>${f.lids}</g>${f.brow}${f.nose}${k === "theo" ? extras(k, C) : ""}${f.mouth}${k !== "theo" ? extras(k, C) : ""}${headset(k)}${hatG}</g>
      ${arms}${desk}${hands}</g>${zz}</svg>`;
}
export function avatar(a,size){ const s=size||48;
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
