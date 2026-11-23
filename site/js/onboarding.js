// First-visit setup. Everything stays in this browser.
import { h, modal, toast } from "./core.js";
import { profile, saveProfile, earn } from "./state.js";
import { mascot } from "./art.js";
import { ROLES, SIEMS, VENDORS, BUDDIES } from "./content/legacy.js";
import { sfx } from "./audio.js";

export function openOnboarding() {
  const p = profile();
  const choice = (opts, cur, multi = false) => {
    const sel = new Set(multi ? cur : [cur]);
    const wrap = h("div.opt", { role: multi ? "group" : "radiogroup" });
    for (const o of opts) {
      const b = h("button" + (sel.has(o) ? ".on" : ""), { type: "button", "aria-pressed": String(sel.has(o)) }, o);
      b.addEventListener("click", () => {
        if (multi) { sel.has(o) ? sel.delete(o) : sel.add(o); } else { sel.clear(); sel.add(o); }
        [...wrap.children].forEach((x) => { const on = sel.has(x.textContent); x.classList.toggle("on", on); x.setAttribute("aria-pressed", String(on)); });
      });
      wrap.append(b);
    }
    wrap.value = () => (multi ? [...sel] : [...sel][0]);
    return wrap;
  };
  const name = h("input", { type: "text", maxlength: "24", placeholder: "A nickname, not your real username", value: p.name, id: "oName", autocomplete: "off" });
  const role = choice(ROLES, p.role), siem = choice(SIEMS, p.siem), stack = choice(VENDORS, p.stack, true), humor = choice(["dry", "chaotic", "gentle"], p.humor);
  let buddy = p.buddy;
  const buddies = h("div.opt.buddies");
  for (const [k, b] of Object.entries(BUDDIES)) {
    const btn = h("button" + (k === buddy ? ".on" : ""), { type: "button", title: b.d, "aria-pressed": String(k === buddy) });
    const art = h("span.bart"); art.innerHTML = mascot(k, "", "ok", false);
    btn.append(art, h("span", `${b.n}, ${b.d}`));
    btn.addEventListener("click", () => { buddy = k; [...buddies.children].forEach((x) => { x.classList.toggle("on", x === btn); x.setAttribute("aria-pressed", String(x === btn)); }); sfx("pop"); });
    buddies.append(btn);
  }
  const close = modal([
    h("h2", "Welcome to FP Café"),
    h("p.muted", "A few questions so your buddy, digest and detections fit you. Stored only in this browser. You can skip."),
    h("div.field", h("label.l", { for: "oName" }, "What should we call you?"), name),
    h("div.field", h("span.l", "Your role"), role), h("div.field", h("span.l", "Your SIEM"), siem),
    h("div.field", h("span.l", "What's in your stack? Pick any. The CVE menu can filter to just these."), stack),
    h("div.field", h("span.l", "Humour"), humor), h("div.field", h("span.l", "Pick your buddy"), buddies),
    h("div.row", h("button.btn.primary", { onclick: () => {
      const first = !p.onboarded;
      saveProfile({ name: name.value.replace(/[<>]/g, "").trim().slice(0, 24), role: role.value(), siem: siem.value(), stack: stack.value(), humor: humor.value(), buddy, onboarded: true });
      if (first) { earn(20, "welcome"); toast("Welcome in. Here are 20 beans for the coffee machine."); }
      close();
    } }, "Take a seat"), h("button.btn.ghost", { onclick: () => { saveProfile({ onboarded: true }); close(); } }, "Skip for now")),
  ], { label: "Welcome", wide: true });
}
