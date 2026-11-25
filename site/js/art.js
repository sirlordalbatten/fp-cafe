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
// Chibi buddies: big glossy eyes, rosy cheeks, soft shading, holding a coffee mug.
const PAL = {
  cat:   { fur: "#B7C2E8", shade: "#8E9AC6", belly: "#EEF1FB", inner: "#F6B8C8", ink: "#2B2340" },
  fox:   { fur: "#F39A52", shade: "#D9733A", belly: "#FFF4E6", inner: "#FFE1C7", ink: "#2B2340" },
  owl:   { fur: "#C29A73", shade: "#9A7552", belly: "#F6E8D4", inner: "#F6E8D4", ink: "#2B2340" },
  panda: { fur: "#FBFAF7", shade: "#DCD8CF", belly: "#FFFFFF", inner: "#2E2A35", ink: "#2B2340" },
};
function eyes(kind, mood, P) {
  const L = 31, R = 49, y = 42;
  const arc = (dy) => `<path d="M${L - 5} ${y + dy}q5 ${dy < 0 ? 6 : -6} 10 0M${R - 5} ${y + dy}q5 ${dy < 0 ? 6 : -6} 10 0" stroke="${P.ink}" stroke-width="2.6" fill="none" stroke-linecap="round"/>`;
  if (mood === "happy") return { w: arc(2), p: "" };
  if (mood === "sleepy") return { w: `<path d="M${L - 5} ${y + 1}h10M${R - 5} ${y + 1}h10" stroke="${P.ink}" stroke-width="2.6" stroke-linecap="round"/>`, p: "" };
  const big = kind === "owl" ? 6.6 : 5.6;
  const ball = (x) => `<ellipse cx="${x}" cy="${y}" rx="${big}" ry="${big + 1}" fill="${P.ink}"/><circle cx="${x + 2}" cy="${y - 2.6}" r="${big * 0.38}" fill="#fff"/><circle cx="${x - 1.8}" cy="${y + 2.4}" r="${big * 0.17}" fill="#fff" opacity=".85"/>`;
  let w = "";
  if (kind === "owl") w = `<circle cx="${L}" cy="${y}" r="9.5" fill="${P.belly}"/><circle cx="${R}" cy="${y}" r="9.5" fill="${P.belly}"/>`;
  if (mood === "sad") w += `<path d="M${L - 6} ${y - 9}q5-3 9 0M${R + 6} ${y - 9}q-5-3-9 0" stroke="${P.ink}" stroke-width="1.8" fill="none" stroke-linecap="round"/>`;
  return { w, p: ball(L) + ball(R) };
}
export function mascot(kind, hat, mood, react) {
  const P = PAL[kind] || PAL.cat; const id = "g" + kind;
  let ears = "", face = "";
  if (kind === "cat") ears = `<path d="M17 30Q16 10 28 16Q24 24 17 30Z" fill="${P.fur}"/><path d="M63 30Q64 10 52 16Q56 24 63 30Z" fill="${P.fur}"/><path d="M20 25Q20 15 26 18Z" fill="${P.inner}"/><path d="M60 25Q60 15 54 18Z" fill="${P.inner}"/>`;
  if (kind === "fox") { ears = `<path d="M15 32Q12 6 31 15Q24 22 15 32Z" fill="${P.fur}"/><path d="M65 32Q68 6 49 15Q56 22 65 32Z" fill="${P.fur}"/><path d="M19 26Q18 13 27 17Z" fill="${P.inner}"/><path d="M61 26Q62 13 53 17Z" fill="${P.inner}"/>`;
    face = `<path d="M18 44Q24 60 40 60Q56 60 62 44Q54 52 40 52Q26 52 18 44Z" fill="${P.belly}"/>`; }
  if (kind === "owl") { ears = `<path d="M19 22Q18 12 28 17Z" fill="${P.shade}"/><path d="M61 22Q62 12 52 17Z" fill="${P.shade}"/>`; }
  if (kind === "panda") { ears = `<circle cx="21" cy="21" r="8" fill="#2E2A35"/><circle cx="59" cy="21" r="8" fill="#2E2A35"/>`;
    face = `<ellipse cx="31" cy="42" rx="8.5" ry="9.5" transform="rotate(-18 31 42)" fill="#2E2A35"/><ellipse cx="49" cy="42" rx="8.5" ry="9.5" transform="rotate(18 49 42)" fill="#2E2A35"/>`; }
  const md = react ? "happy" : mood;
  const Pe = { ...P, ink: kind === "panda" ? (md === "happy" || md === "sleepy" ? "#F5F2EC" : "#141218") : P.ink };
  const e = eyes(kind, md, Pe);
  if (kind === "panda" && e.p) e.p = e.p.replace(/<ellipse cx="(\d+)" cy="42" rx="[\d.]+" ry="[\d.]+" fill="#141218"\/>/g, (m, x) => `<circle cx="${x}" cy="42" r="7.2" fill="#F5F2EC"/>` + m);
  const nose = kind === "owl" ? `<path d="M37.5 48l2.5 4 2.5-4z" fill="#F5B841"/>` : `<ellipse cx="40" cy="49" rx="2.2" ry="1.6" fill="${kind === "panda" ? "#2E2A35" : "#5A3A4A"}"/>`;
  const mouth = react ? `<path d="M36 52.5q4 5 8 0z" fill="#7A2E3E"/>`
    : mood === "sad" ? `<path d="M37 54q3-2.5 6 0" stroke="${P.ink}" stroke-width="1.6" fill="none" stroke-linecap="round"/>`
    : `<path d="M36.5 51.5q1.75 2 3.5 0q1.75 2 3.5 0" stroke="${kind === "panda" ? "#2E2A35" : "#5A3A4A"}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`;
  const cheeks = `<ellipse cx="23.5" cy="50" rx="4.2" ry="2.6" fill="#FF8FA8" opacity="${mood === "happy" || react ? ".75" : ".5"}"/><ellipse cx="56.5" cy="50" rx="4.2" ry="2.6" fill="#FF8FA8" opacity="${mood === "happy" || react ? ".75" : ".5"}"/>`;
  const tear = mood === "sad" && !react ? `<path d="M25 47q-1.5 3 0 4q1.5-1 0-4z" fill="#9FD3FF"/>` : "";
  const body = `<ellipse cx="40" cy="67" rx="17" ry="11" fill="url(#${id}b)"/><ellipse cx="40" cy="69" rx="10" ry="7" fill="${P.belly}"/>`;
  const mug = `<g class="m-mug"><rect x="33" y="63" width="12" height="10" rx="2.5" fill="#FFFDF8"/><path d="M45 65.5q4 0 4 3t-4 3" stroke="#FFFDF8" stroke-width="1.8" fill="none"/><rect x="34.5" y="64.5" width="9" height="2.2" rx="1" fill="#8A5A3B"/>
    <circle cx="31.5" cy="68" r="3" fill="${P.fur}"/><circle cx="47.5" cy="70" r="3" fill="${P.fur}"/>
    <path class="m-steam" d="M37 60q-1.5-2 0-4M41 59q-1.5-2 0-4" stroke="#ffffff88" stroke-width="1.2" fill="none" stroke-linecap="round"/></g>`;
  const zz = mood === "sleepy" && !react ? `<g class="m-z" fill="#C9D4FF" font-size="10" font-weight="700"><text x="62" y="20">z</text><text x="68" y="10">z</text></g>` : "";
  return `<svg viewBox="0 0 80 80" class="buddy-svg" aria-hidden="true"><defs>
    <radialGradient id="${id}h" cx=".38" cy=".32" r=".75"><stop offset=".45" stop-color="${P.fur}"/><stop offset="1" stop-color="${P.shade}"/></radialGradient>
    <radialGradient id="${id}b" cx=".4" cy=".3" r=".8"><stop offset="0" stop-color="${P.fur}"/><stop offset="1" stop-color="${P.shade}"/></radialGradient></defs>
    <ellipse class="m-shadow" cx="40" cy="78" rx="18" ry="2.6" fill="#0006"/>
    <g class="m-bob">${body}<g class="m-ears">${ears}</g><circle cx="40" cy="40" r="25" fill="url(#${id}h)"/><ellipse cx="31" cy="26" rx="9" ry="5" transform="rotate(-25 31 26)" fill="#fff" opacity=".28"/>${face}${cheeks}<g class="m-eyes">${e.w}<g class="m-pupils">${e.p}</g></g>${tear}${nose}${mouth}${mug}${hat ? `<g class="m-hat">${hatArt(hat)}</g>` : ""}</g>${zz}</svg>`;
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
