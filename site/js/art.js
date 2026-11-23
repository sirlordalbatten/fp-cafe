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
export function mascot(kind,hat,mood,react){
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
