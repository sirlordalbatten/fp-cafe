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
// The analysts: six SOC colleagues with their own personalities. Friendly, soft shapes, small dot eyes
// with a highlight (never big staring eyes), rosy cheeks, each holding the team mug.
const INK = "#2A2233";
const CHARS = {
  sunny: { skin: "#FBD8BE", blush: "#FF8FA3", hair: "#FF6FB1", hair2: "#FFB3D6", top: "#7C6CFF", top2: "#A79BFF", eyes: "#3A2A4A" },
  dex:   { skin: "#E7B48F", blush: "#F0907E", hair: "#3B2C24", hair2: "#5A463A", top: "#4A5468", top2: "#6B7891", eyes: INK, hat: "#2F8F7D", hat2: "#5CE1C6" },
  rin:   { skin: "#F6D2B5", blush: "#FF9AA8", hair: "#1E2340", hair2: "#2FD3B5", top: "#1FA88E", top2: "#5CE1C6", eyes: INK },
  theo:  { skin: "#9A6440", blush: "#D9806A", hair: "#241913", hair2: "#3E2C22", top: "#E2A33B", top2: "#F5C56B", eyes: "#1C1410" },
  juno:  { skin: "#FFE0C8", blush: "#FF8C7A", hair: "#FF8A2B", hair2: "#FFC15A", top: "#E8505B", top2: "#FF8590", eyes: INK },
  noor:  { skin: "#D9A07A", blush: "#E98B79", hair: "#8E6CE8", hair2: "#B9A2FF", top: "#3D4C7A", top2: "#5E70A8", eyes: "#22182A" },
};
const MIGRATE = { cat: "dex", owl: "noor", fox: "juno", panda: "theo" };
export const charKey = (k) => (CHARS[k] ? k : MIGRATE[k] || "sunny");

function face(k, mood, C) {
  // personality changes the resting face: Dex is deadpan, Theo is serene, Juno grins
  const L = 32, R = 48, y = 44;
  const dot = (x) => `<ellipse cx="${x}" cy="${y}" rx="2.7" ry="3.3" fill="${C.eyes}"/><circle cx="${x + 1}" cy="${y - 1.3}" r="1" fill="#fff"/>`;
  const arcUp = `<path d="M${L - 3.5} ${y + 1}q3.5-4 7 0M${R - 3.5} ${y + 1}q3.5-4 7 0" stroke="${C.eyes}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const arcDown = `<path d="M${L - 3.5} ${y - 0.5}q3.5 3.5 7 0M${R - 3.5} ${y - 0.5}q3.5 3.5 7 0" stroke="${C.eyes}" stroke-width="2.2" fill="none" stroke-linecap="round"/>`;
  const line = `<path d="M${L - 3.5} ${y}h7M${R - 3.5} ${y}h7" stroke="${C.eyes}" stroke-width="2.2" stroke-linecap="round"/>`;
  const brow = (dy, tilt) => `<path d="M${L - 4} ${y - 7 + dy + tilt}q4 ${-2 - tilt} 8 0M${R - 4} ${y - 7 + dy}q4 ${-2 - tilt} 8 ${tilt}" stroke="${C.hair}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  let eyes = "", pupils = "", mouth = "", extra = "";
  const smile = `<path d="M36.5 52q3.5 3.2 7 0" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`;
  const grin = `<path d="M35.5 51h9q-.6 5-4.5 5t-4.5-5z" fill="#7A2E3E"/><path d="M36.6 51.2h6.8" stroke="#fff" stroke-width="1.2"/>`;
  if (mood === "happy") { eyes = arcUp; mouth = grin; }
  else if (mood === "sleepy") { eyes = line; mouth = `<ellipse cx="40" cy="53" rx="1.8" ry="1.4" fill="#7A2E3E"/>`; }
  else if (mood === "sad") { eyes = brow(1, 2); pupils = dot(L) + dot(R); mouth = `<path d="M37 54q3-2.4 6 0" stroke="${INK}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`; }
  else if (k === "dex") { pupils = dot(L) + dot(R); eyes = `<path d="M${L - 4} ${y - 6}h8M${R - 4} ${y - 6}h8" stroke="${C.hair}" stroke-width="1.9" stroke-linecap="round"/>`; mouth = `<path d="M36.5 52.6q2.5 1.4 7-.6" stroke="${INK}" stroke-width="1.7" fill="none" stroke-linecap="round"/>`; }
  else if (k === "theo") { eyes = arcDown; mouth = `<path d="M35.8 52.2q4.2 4.4 8.4 0z" fill="#3A1218"/><path d="M36.8 52.6h6.4" stroke="#fff" stroke-width="1.3" stroke-linecap="round"/>`; }
  else if (k === "juno") { pupils = dot(L) + dot(R); mouth = `<path d="M35.5 51q4.5 5 9 0" stroke="${INK}" stroke-width="1.8" fill="#fff" stroke-linecap="round"/>`; }
  else { pupils = dot(L) + dot(R); mouth = smile; }
  // eyes drawn above the dots for Dex's heavy lids
  return { eyes, lids: "", pupils, mouth, extra };
}

function hairBack(k, C) {
  switch (k) {
    case "sunny": return `<circle cx="20" cy="22" r="8" fill="${C.hair}"/><circle cx="60" cy="22" r="8" fill="${C.hair}"/><circle cx="18" cy="20" r="3" fill="${C.hair2}"/><circle cx="58" cy="20" r="3" fill="${C.hair2}"/>`;
    case "rin": return `<path d="M17 52Q13 15 40 14Q67 15 63 52L57 53Q59 38 40 36Q21 38 23 53Z" fill="${C.hair}"/>`;
    case "noor": return `<path d="M13 46Q11 10 40 9Q69 10 67 46L70 74Q40 82 10 74Z" fill="${C.hair}"/>`;
    case "theo": return `<path d="M19 40Q18 18 40 17Q62 18 61 40Z" fill="${C.hair}"/>`;
    default: return "";
  }
}
function hairFront(k, C) {
  switch (k) {
    case "sunny": return `<path d="M18 41Q16 17 40 16Q64 17 62 41Q60 31 54 28Q49 33 43 28Q37 33 31 28Q25 31 22 33Q19 36 18 41Z" fill="${C.hair}"/><path d="M28 21Q36 17 44 19" stroke="${C.hair2}" stroke-width="2.4" fill="none" stroke-linecap="round"/>`;
    case "dex": return `<path d="M19 38Q15 34 18 30M61 38Q65 34 62 30" stroke="${C.hair}" stroke-width="4" stroke-linecap="round"/><path d="M18 33Q17 11 40 10Q63 11 62 33Z" fill="${C.hat}"/><rect x="16.5" y="29" width="47" height="7" rx="3.5" fill="${C.hat2}"/><path d="M24 30v5M30 30v5M36 30v5M42 30v5M48 30v5M54 30v5" stroke="${C.hat}" stroke-width="1.2" opacity=".5"/>`;
    case "rin": return `<path d="M19 34Q20 17 40 17Q60 17 61 34Q56 28 50 30L48 25L44 30Q36 27 28 31Q24 30 19 34Z" fill="${C.hair}"/><path d="M47 18Q55 21 58 30" stroke="${C.hair2}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
    case "theo": return `${[[21, 33], [24, 25], [30, 20], [37, 17], [44, 17], [51, 20], [56, 25], [59, 33]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="6.2" fill="${C.hair}"/>`).join("")}<circle cx="33" cy="19" r="2" fill="${C.hair2}"/><circle cx="48" cy="19" r="2" fill="${C.hair2}"/>`;
    case "juno": return `<path d="M17 41L14 25L23 28L22 14L31 21L38 8L45 19L54 11L56 25L66 22L63 41Q58 30 40 29Q22 30 17 41Z" fill="${C.hair}"/><path d="M31 21L38 14L41 22M45 19L52 15" stroke="${C.hair2}" stroke-width="2" fill="none" stroke-linecap="round"/>`;
    case "noor": return `<path d="M21 42Q21 20 40 20Q59 20 59 42" stroke="${C.hair2}" stroke-width="4.5" fill="none" stroke-linecap="round"/>`;
    default: return "";
  }
}
function extras(k, C) {
  switch (k) {
    case "sunny": return { over: `<path d="M17 42A23 23 0 0 1 63 42" stroke="#2D2A40" stroke-width="3.5" fill="none"/><rect x="13" y="38" width="8" height="13" rx="4" fill="#FFD23F"/><rect x="59" y="38" width="8" height="13" rx="4" fill="#FFD23F"/>`, chest: `<path d="M33 61L40 71L47 61" stroke="#FFD23F" stroke-width="1.6" fill="none"/><rect x="36.5" y="70" width="7" height="8" rx="1.5" fill="#fff"/><rect x="38" y="72" width="4" height="1.5" fill="${C.top}"/>` };
    case "dex": return { over: `<path d="M34 57.5q6 2 12 0" stroke="#B98463" stroke-width="1" fill="none" opacity=".5" stroke-dasharray="1 1.6"/>`, chest: `<path d="M30 62Q40 70 50 62" stroke="${C.top2}" stroke-width="2.5" fill="none"/><path d="M36 66v8M44 66v8" stroke="#D9DEE8" stroke-width="1.4" stroke-linecap="round"/>` };
    case "rin": return { over: `<circle cx="32" cy="44" r="5.6" fill="#ffffff22" stroke="#1E2340" stroke-width="1.8"/><circle cx="48" cy="44" r="5.6" fill="#ffffff22" stroke="#1E2340" stroke-width="1.8"/><path d="M37.6 44h4.8" stroke="#1E2340" stroke-width="1.8"/>`, chest: `<path d="M34 61l6 5 6-5" stroke="#fff" stroke-width="1.6" fill="none" stroke-linejoin="round"/>` };
    case "theo": return { over: `<path d="M22 46Q23 62 40 63Q57 62 58 46Q56 57 48 58Q40 60 32 58Q24 57 22 46Z" fill="${C.hair}"/><path d="M35 50.2q5-2.6 10 0q-5 1.4-10 0z" fill="${C.hair}"/>`, chest: `<path d="M33 61l7 9 7-9" fill="#FFF6E5"/><path d="M33 61L36 80M47 61L44 80" stroke="${C.top2}" stroke-width="2"/><circle cx="40" cy="74" r="1.2" fill="#7A5A2A"/>` };
    case "juno": return { over: `<g fill="#D98A5E" opacity=".75"><circle cx="27" cy="49" r=".9"/><circle cx="29.5" cy="51" r=".9"/><circle cx="26" cy="51.5" r=".8"/><circle cx="51" cy="49" r=".9"/><circle cx="53.5" cy="51" r=".9"/><circle cx="54" cy="48.5" r=".8"/></g><rect x="51" y="36" width="8" height="3.6" rx="1.4" transform="rotate(-20 55 38)" fill="#FFF1D6" stroke="#E8C79A" stroke-width=".6"/>`, chest: `<path d="M30 63L38 69M50 63L42 69" stroke="${C.top2}" stroke-width="3" stroke-linecap="round"/><circle cx="47" cy="73" r="2.6" fill="#FFD23F"/><path d="M47 71.5v3M45.5 73h3" stroke="#E8505B" stroke-width="1"/>` };
    case "noor": return { over: `<path d="M20 49q-2 7 4 10" stroke="#2D2A40" stroke-width="1.6" fill="none"/><circle cx="25" cy="59.5" r="1.8" fill="#2D2A40"/>`, chest: `<path d="M27 63Q40 72 53 63" stroke="${C.hair2}" stroke-width="2.2" fill="none"/>` };
  }
  return { over: "", chest: "" };
}

export function mascot(kindIn, hat, mood, react) {
  const k = charKey(kindIn); const C = CHARS[k]; const md = react ? "happy" : mood;
  const f = face(k, md, C); const x = extras(k, C);
  const headR = k === "noor" ? 18.5 : 21;
  const body = `<path d="M14 82Q15 62 40 60Q65 62 66 82Z" fill="${C.top}"/><path d="M14 82Q15 66 26 62Q22 72 22 82Z" fill="${C.top2}" opacity=".55"/><rect x="36" y="55" width="8" height="7" rx="3" fill="${C.skin}"/>`;
  const mug = `<g class="m-mug"><rect x="49" y="66" width="11" height="10" rx="2.5" fill="#FFFDF8"/><path d="M60 68.5q3.8 0 3.8 2.8t-3.8 2.8" stroke="#FFFDF8" stroke-width="1.7" fill="none"/><rect x="50.4" y="67.4" width="8.2" height="2" rx="1" fill="#8A5A3B"/><path d="M52 71.5l1.5 1.5 3-3" stroke="#2F8F7D" stroke-width="1.3" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
    <ellipse cx="49.5" cy="72" rx="3.2" ry="2.8" fill="${C.skin}"/>
    <path class="m-steam" d="M52.5 63q-1.4-1.8 0-3.6M56 62.5q-1.4-1.8 0-3.6" stroke="#ffffffaa" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`;
  const ears = k === "noor" ? "" : `<ellipse cx="${40 - headR}" cy="45" rx="2.6" ry="3.6" fill="${C.skin}"/><ellipse cx="${40 + headR}" cy="45" rx="2.6" ry="3.6" fill="${C.skin}"/>`;
  const head = `<ellipse cx="40" cy="41" rx="${headR}" ry="${headR}" fill="${C.skin}"/>${ears}`;
  const cheeks = `<ellipse cx="27" cy="50" rx="3.6" ry="2.2" fill="${C.blush}" opacity="${md === "happy" ? ".7" : ".45"}"/><ellipse cx="53" cy="50" rx="3.6" ry="2.2" fill="${C.blush}" opacity="${md === "happy" ? ".7" : ".45"}"/>`;
  const nose = `<path d="M39.2 48.3q.8.9 1.6 0" stroke="${C.blush}" stroke-width="1.3" fill="none" stroke-linecap="round" opacity=".9"/>`;
  const zz = md === "sleepy" ? `<g class="m-z" fill="#C9D4FF" font-size="10" font-weight="700"><text x="63" y="20">z</text><text x="69" y="10">z</text></g>` : "";
  const sweat = md === "sad" ? `<path d="M59 30q-2 3.5 0 5q2-1.5 0-5z" fill="#9FD3FF"/>` : "";
  return `<svg viewBox="0 0 80 80" class="buddy-svg char-${k}" aria-hidden="true">
    <ellipse class="m-shadow" cx="40" cy="79" rx="20" ry="1.6" fill="#0003"/>
    <g class="m-bob">${hairBack(k, C)}${body}${x.chest}${head}<g class="m-ears"></g>${hairFront(k, C)}${cheeks}<g class="m-eyes">${f.eyes}<g class="m-pupils">${f.pupils}</g>${f.lids}</g>${x.over}${nose}${f.mouth}${sweat}${mug}${hat ? `<g class="m-hat">${hatArt(hat)}</g>` : ""}</g>${zz}</svg>`;
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
