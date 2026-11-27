// Snack lessons: hands-on micro-labs, a live lesson built from today's KEV data, and cheat sheets.
import { $, h, html, put, store, arr, shuffle, fresh, todayKey, toast } from "../core.js";
import { sfx, sting } from "../audio.js";
import { bump, earn, xp } from "../state.js";
import { load, cveList } from "../data.js";
import { LESSONS } from "../content/lessons.js";
import { EVENTS, SYSMON, LOGONS, ATTACK } from "../content/legacy.js";

const done = () => new Set(arr(store.get("lessonsDone", [])));
let tab = "labs", topic = "All";

export async function mount(sec) {
  html(sec, `<div class="vh"><h1>Snack lessons</h1><p>Three-minute hands-on labs from real SOC work, plus the attack techniques you'll meet: Kerberoasting, pass-the-hash, DCSync, NTLM relay, SQL injection, SSRF, web shells, AiTM phishing and more. Spot the bad line, put the response in order, match the event IDs. Plus one lab built from today's exploited CVE.</p></div>
  <div class="seg tabs" id="ltabs"><button data-p="labs" class="on">Labs</button><button data-p="cheat">Cheat sheets</button><button data-p="cards">ATT&amp;CK flashcards</button></div>
  <div id="lpane"></div>`);
  $("#ltabs").addEventListener("click", (e) => { const b = e.target.closest("button"); if (!b) return; tab = b.dataset.p; [...$("#ltabs").children].forEach((x) => x.classList.toggle("on", x === b)); pane(); });
  await load("cves");
  pane();
}
function pane() { ({ labs, cheat, cards })[tab](); }

// ---------- labs ----------
async function labs() {
  const d = done(); const box = $("#lpane");
  const cves = cveList(await load("cves")).filter((x) => x.kev && x.due);
  const k = cves[0];
  const live = k ? { id: "live-" + todayKey(), t: `Today's live lab: ${k.id}`, topic: "Live from CISA KEV", steps: [
    { type: "read", text: `${k.id} in ${[k.vendor, k.product].filter(Boolean).join(" ")} was added to CISA's Known Exploited Vulnerabilities catalog on ${k.date}. ${k.desc}` },
    { type: "choice", q: "What does being in KEV mean?", o: ["It's being exploited in the wild right now", "It has a CVSS score of 10", "It only affects US government systems"], a: 0, why: "KEV is a list of vulnerabilities with evidence of real exploitation. It applies to everyone, even though the deadlines are for US federal agencies." },
    { type: "choice", q: `CISA's remediation deadline for this one is ${k.due}. What should your first step be?`, o: ["Check whether you run it at all", "Wait until the deadline", "Patch every server in the company"], a: 0, why: "Exposure first: inventory, then patch or mitigate what's affected, then hunt for signs it was already exploited." },
  ] } : null;
  const list = (live ? [live] : []).concat(LESSONS);
  const next = list.find((l) => !d.has(l.id)) || fresh("lessonPick", list, (l) => l.id);
  put(box,
    h("div.panel.lesson-next", h("div.ph", h("h3", d.has(next.id) ? "Revisit" : "Up next"), h("span.muted", `${d.size} of ${LESSONS.length} labs done`)),
      h("p", h("b", next.t)), h("p.muted.small", `${next.topic} · ${next.steps.length} steps`), h("button.btn.primary", { onclick: () => player(next) }, "Start")),
    h("div.seg.wraptabs.ltopics", ["All", ...new Set(list.map((l) => l.topic))].map((tp) => h("button" + (tp === topic ? ".on" : ""), { onclick: () => { topic = tp; labs(); } }, tp))),
    h("div.cards.lessons", list.filter((l) => topic === "All" || l.topic === topic).map((l) => h("button.lcard" + (d.has(l.id) ? ".done" : ""), { onclick: () => player(l) },
      h("span.pill.p-unk", l.topic), h("b", l.t), h("span.muted.small", d.has(l.id) ? "done, play again" : `${l.steps.length} steps`)))));
}

function player(lesson) {
  const box = $("#lpane"); let i = 0, right = 0, total = 0;
  const steps = lesson.steps;
  const next = () => { i++; i < steps.length ? draw() : finish(); };
  const draw = () => {
    const s = steps[i];
    const head = h("div.lhead", h("button.btn.ghost.sm", { onclick: labs }, "← All labs"), h("span.muted", `${lesson.t} · step ${i + 1} of ${steps.length}`), h("div.bar.lprog", h("i", { "data-w": (i / steps.length) * 100 })));
    const body = h("div.lbody"); const fb = h("p.lfb", { "aria-live": "polite" }); const go = h("button.btn.primary", { onclick: next, hidden: true }, i === steps.length - 1 ? "Finish" : "Next");
    const reveal = (ok, why) => { total++; if (ok) right++; fb.className = "lfb " + (ok ? "ok" : "no"); fb.textContent = (ok ? "Right. " : "Not quite. ") + (why || ""); go.hidden = false; go.focus(); sting(ok ? "combo" : "fail"); };
    if (s.type === "read") { body.append(h("p.lread", s.text)); go.hidden = false; }
    else if (s.type === "choice") {
      body.append(h("p.lq", s.q));
      const order = shuffle(s.o.map((_, k) => k));
      const btns = order.map((k) => { const b = h("button.lopt", s.o[k]); b._k = k; return b; });
      btns.forEach((b) => b.addEventListener("click", () => { btns.forEach((x) => (x.disabled = true)); btns.find((x) => x._k === s.a).classList.add("right"); if (b._k !== s.a) b.classList.add("wrong"); reveal(b._k === s.a, s.why); }));
      body.append(h("div.lopts", btns));
    } else if (s.type === "spot") {
      body.append(h("p.lq", s.prompt), h("p.muted.small", "Click every line you'd investigate, then check."));
      const picked = new Set();
      const lines = s.lines.map((l, k) => { const b = h("button.lline.mono", { "aria-pressed": "false", onclick: () => { picked.has(k) ? picked.delete(k) : picked.add(k); b.classList.toggle("on"); b.setAttribute("aria-pressed", String(picked.has(k))); sfx("tick"); } }, l); return b; });
      const check = h("button.btn", { onclick: () => {
        check.disabled = true; lines.forEach((b, k) => { b.disabled = true; if (s.bad.includes(k)) b.classList.add("right"); else if (picked.has(k)) b.classList.add("wrong"); });
        const ok = s.bad.length === picked.size && s.bad.every((k) => picked.has(k)); reveal(ok, s.why);
      } }, "Check");
      body.append(h("div.llines", lines), check);
    } else if (s.type === "order") {
      body.append(h("p.lq", s.prompt), h("p.muted.small", "Tap items in the right order."));
      const pool = shuffle(s.items); const chosen = [];
      const out = h("ol.lorder"); const opts = h("div.lopts");
      const drawO = () => {
        put(out, chosen.map((x) => h("li", x)));
        put(opts, pool.filter((x) => !chosen.includes(x)).map((x) => h("button.lopt", { onclick: () => { chosen.push(x); sfx("tick"); drawO(); if (chosen.length === s.items.length) {
          const ok = chosen.every((y, k) => y === s.items[k]); [...out.children].forEach((li, k) => li.classList.add(chosen[k] === s.items[k] ? "right" : "wrong"));
          reveal(ok, (ok ? "" : "Correct order: " + s.items.join(" → ") + ". ") + (s.why || ""));
        } } }, x)));
      };
      drawO(); body.append(out, opts);
    } else if (s.type === "match") {
      body.append(h("p.lq", s.prompt), h("p.muted.small", "Pick a left item, then its match on the right."));
      const L = shuffle(s.pairs.map((p) => p[0])), R = shuffle(s.pairs.map((p) => p[1])); const ans = Object.fromEntries(s.pairs);
      let sel = null, matched = 0, misses = 0;
      const lb = L.map((x) => h("button.lopt.mono", { onclick: () => { sel = x; lb.forEach((b) => b.classList.toggle("on", b.textContent === x)); sfx("tick"); } }, x));
      const rb = R.map((y) => h("button.lopt", { onclick: () => {
        if (!sel) return; const b = rb.find((q) => q.textContent === y);
        if (ans[sel] === y) { b.disabled = true; b.classList.add("right"); const l = lb.find((q) => q.textContent === sel); l.disabled = true; l.classList.add("right"); l.classList.remove("on"); sel = null; matched++; sfx("coin");
          if (matched === s.pairs.length) reveal(misses <= 1, misses ? `${misses} wrong pick${misses === 1 ? "" : "s"} along the way.` : "Clean sweep."); }
        else { misses++; b.classList.add("shake"); setTimeout(() => b.classList.remove("shake"), 400); sting("fail"); }
      } }, y));
      body.append(h("div.lmatch", h("div", lb), h("div", rb)));
    }
    put(box, h("div.panel.lplayer", head, body, fb, h("div.row", go)));
  };
  const finish = () => {
    const d = done(); const first = !d.has(lesson.id); d.add(lesson.id); store.set("lessonsDone", [...d].slice(-200));
    bump("lessons"); xp(first ? 20 : 6, "lesson"); if (first) earn(6, "lesson"); sting("level");
    put(box, h("div.panel.lplayer", h("h2", "Lab complete"), h("p", total ? `${right} of ${total} right.` : "Done."), first ? h("p.muted", "+6 beans, +20 XP") : null,
      h("div.row", h("button.btn.primary", { onclick: labs }, "More labs"))));
  };
  draw();
}

// ---------- cheat sheets ----------
function cheat() {
  const q = h("input.search", { type: "search", placeholder: "Filter: 4624, kerberos, service", "aria-label": "Filter cheat sheets" });
  const t1 = h("table.cheat"), t2 = h("table.cheat"), t3 = h("table.cheat");
  const fill = () => {
    const f = q.value.trim().toLowerCase(); const m = (r) => !f || r.join(" ").toLowerCase().includes(f);
    put(t1, h("tr", h("th", "Event ID"), h("th", "Meaning"), h("th", "Why it matters")), EVENTS.filter(m).map((r) => h("tr", r.map((c, i) => h(i ? "td" : "td.mono", c)))));
    put(t2, h("tr", h("th", "Sysmon ID"), h("th", "Meaning")), SYSMON.filter(m).map((r) => h("tr", r.map((c, i) => h(i ? "td" : "td.mono", c)))));
    put(t3, h("tr", h("th", "Logon type"), h("th", "Meaning")), LOGONS.filter(m).map((r) => h("tr", r.map((c, i) => h(i ? "td" : "td.mono", c)))));
  };
  q.addEventListener("input", fill); fill();
  put($("#lpane"), h("div.panel", q, h("h3.sub3", "Windows security events"), t1, h("h3.sub3", "Sysmon"), t2, h("h3.sub3", "Logon types"), t3));
}

// ---------- flashcards (spaced: missed cards come back sooner) ----------
function cards() {
  const box = $("#lpane"); const due = arr(store.get("cardMiss", []));
  const pickCard = () => due.length && Math.random() < 0.5 ? ATTACK.find((a) => a[0] === due[0]) || fresh("card", ATTACK, (a) => a[0]) : fresh("card", ATTACK, (a) => a[0]);
  let c = pickCard();
  const front = h("div.f"), back = h("div.b"); const card = h("button.flipcard", { "aria-label": "Flip card" }, h("div.in", front, back));
  const draw = () => { front.textContent = c[0]; back.textContent = c[1]; card.classList.remove("flip"); };
  card.addEventListener("click", () => { card.classList.toggle("flip"); sfx("pop"); });
  const ans = (knew) => { const m = arr(store.get("cardMiss", [])).filter((x) => x !== c[0]); if (!knew) m.push(c[0]); store.set("cardMiss", m.slice(-30)); if (knew) { bump("card"); xp(2, "card"); } c = pickCard(); draw(); };
  draw();
  put(box, h("div.panel", h("p.muted", "Tap the card to flip it. Cards you miss come back sooner."), h("div.flipwrap", card),
    h("div.row.center", h("button.btn", { onclick: () => ans(false) }, "Didn't know it"), h("button.btn.primary", { onclick: () => ans(true) }, "Knew it"))));
}
