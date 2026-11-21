import * as A from "./calc.mjs";
import S from "./strings.mjs";
import { initLang, fmtNumber, sliderFill, $, radioValue, readNumber, copyText, toast, track, trackOnFirstChange } from "../tool-common.mjs";

const icons = {
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 6v8M12 18.5v.01"/></svg>',
  poor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="m7 7 10 10M17 7 7 17"/></svg>'
};
const form = $("#acoustics-calc");
const el = {
  sizeField: $("#size-field"), dimsField: $("#dims-field"), advExtra: $("#adv-extra"),
  length: $("#length"), width: $("#width"), height: $("#height"),
  glass: $("#glass"), glassOut: $("#glass-out"), panels: $("#panels"), alpha: $("#alpha"),
  status: $("#status"), icon: $("#status-icon"), label: $("#status-label"), title: $("#status-title"), text: $("#status-text"),
  rt: $("#rt"), rtPeople: $("#rt-people"), marker: $("#rt-marker"),
  volume: $("#m-volume"), abs: $("#m-abs"), needed: $("#m-needed"), panelsOut: $("#m-panels"),
  guidance: $("#guidance"), sabine: $("#sabine-note")
};
let lang = "en", units = "metric";
const fillGlass = sliderFill(el.glass);
const firstChange = trackOnFirstChange("acoustics");
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");
const toM = (v) => (units === "metric" ? v : A.feetToM(v));
const fromM = (m) => (units === "metric" ? m : m / A.FOOT_M);

function setDims(preset) {
  const p = A.ROOM_PRESETS[preset];
  el.length.value = fromM(p.lengthM).toFixed(1);
  el.width.value = fromM(p.widthM).toFixed(1);
  el.height.value = fromM(p.heightM).toFixed(1);
}

function setUnits(u) {
  const cur = { l: toM(readNumber(el.length, 6)), w: toM(readNumber(el.width, 4.5)), h: toM(readNumber(el.height, 2.7)), p: units === "metric" ? readNumber(el.panels, 0) : readNumber(el.panels, 0) * A.FOOT_M ** 2 };
  units = u;
  document.querySelectorAll("[data-units]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.units === u)));
  el.length.value = fromM(cur.l).toFixed(1); el.width.value = fromM(cur.w).toFixed(1); el.height.value = fromM(cur.h).toFixed(1);
  el.panels.value = (u === "metric" ? cur.p : cur.p / A.FOOT_M ** 2).toFixed(1);
  document.querySelectorAll(".len-unit").forEach((s) => (s.textContent = u === "metric" ? "m" : "ft"));
  document.querySelectorAll(".area-unit").forEach((s) => (s.textContent = u === "metric" ? "m²" : "ft²"));
  render();
}

function readInput() {
  const mode = radioValue("amode") || "quick";
  const base = {
    walls: radioValue("walls"), floor: radioValue("floor"), ceiling: radioValue("ceiling"),
    people: A.OCCUPANCY[radioValue("occ") || "5-8"]
  };
  if (mode === "quick") return { mode, ...base, ...A.ROOM_PRESETS[radioValue("size") || "medium"] };
  const clampDim = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  return {
    mode, ...base,
    lengthM: clampDim(toM(readNumber(el.length, 6)), 1, 60),
    widthM: clampDim(toM(readNumber(el.width, 4.5)), 1, 60),
    heightM: clampDim(toM(readNumber(el.height, 2.7)), 1.8, 20),
    glassWallPct: Number(el.glass.value),
    panelAreaM2: Math.max(0, units === "metric" ? readNumber(el.panels, 0) : readNumber(el.panels, 0) * A.FOOT_M ** 2),
    panelAlpha: Math.min(1.2, Math.max(0.1, readNumber(el.alpha, 0.8)))
  };
}

function area(m2) { return units === "metric" ? `${fmtNumber(m2, lang, 1)} m²` : `${fmtNumber(m2 / A.FOOT_M ** 2, lang, 0)} ft²`; }

function render() {
  const t = S[lang];
  const input = readInput();
  const adv = input.mode === "advanced";
  el.sizeField.hidden = adv; el.dimsField.hidden = !adv; el.advExtra.hidden = !adv;
  el.glassOut.textContent = el.glass.value;
  let r;
  try { r = A.estimate(input); } catch { return; }

  el.status.className = `status status--${r.status}`;
  el.icon.innerHTML = icons[r.status];
  el.label.textContent = { good: t.riskLow, warn: t.riskMed, poor: t.riskHigh }[r.status];
  el.title.textContent = { good: t.tGood, warn: t.tWarn, poor: t.tPoor }[r.status];
  el.text.textContent = { good: t.dGood, warn: t.dWarn, poor: t.dPoor }[r.status] + (r.status !== "good" ? ` ${t.mainContributor}: ${t["c_" + r.mainContributor]}.` : "");

  const s1 = (x) => fmtNumber(x, lang, x < 10 ? 2 : 1);
  el.rt.textContent = `≈ ${s1(r.rtUnoccupied)} s`;
  el.rtPeople.textContent = fill(t.rtPeople, { n: r.people, s: s1(r.rtOccupied) });
  el.marker.style.left = `${Math.min(99, (r.rtUnoccupied / 2) * 100)}%`;
  el.marker.style.background = r.status === "good" ? "var(--good)" : r.status === "warn" ? "var(--warn)" : "var(--poor)";

  el.volume.textContent = units === "metric" ? `${fmtNumber(r.volumeM3, lang, 0)} m³` : `${fmtNumber(r.volumeM3 / A.FOOT_M ** 3, lang, 0)} ft³`;
  el.abs.textContent = area(r.absorptionM2);
  if (r.additionalAbsorptionM2 > 0.05) {
    const alpha = adv ? input.panelAlpha : 0.8;
    el.needed.textContent = area(r.additionalAbsorptionM2);
    el.panelsOut.textContent = fill(t.mPanels, { a: area(r.additionalAbsorptionM2 / alpha), alpha: fmtNumber(alpha, lang, 2) });
  } else { el.needed.textContent = t.mNeededNone; el.panelsOut.textContent = ""; }

  const tips = [];
  if (r.status === "good") tips.push(t.g_good);
  else {
    const order = [r.mainContributor, ...["ceiling", "walls", "floor"].filter((x) => x !== r.mainContributor)];
    for (const k of order) {
      if (k === "ceiling" && input.ceiling !== "acoustic") tips.push(t.g_ceiling);
      if (k === "walls" && input.walls !== "soft") tips.push(t.g_walls);
      if (k === "floor" && input.floor !== "carpet") tips.push(t.g_floor);
    }
    tips.push(t.g_noise);
  }
  el.guidance.innerHTML = tips.map((x) => `<li>${x}</li>`).join("");
  el.sabine.hidden = !r.sabineLikelyOverestimates;
}

// URL state (room descriptions only, nothing personal)
function toQuery() {
  const inp = readInput();
  const q = new URLSearchParams({ m: inp.mode, w: inp.walls, f: inp.floor, c: inp.ceiling, o: radioValue("occ") });
  if (inp.mode === "quick") q.set("s", radioValue("size"));
  else { q.set("l", inp.lengthM.toFixed(2)); q.set("wd", inp.widthM.toFixed(2)); q.set("h", inp.heightM.toFixed(2)); q.set("g", String(inp.glassWallPct)); q.set("p", inp.panelAreaM2.toFixed(1)); q.set("a", String(inp.panelAlpha)); q.set("u", units); }
  return q.toString();
}
function check(name, v) { const r = document.querySelector(`input[name="${name}"][value="${CSS.escape(v ?? "")}"]`); if (r) r.checked = true; }
function fromQuery() {
  const q = new URLSearchParams(location.search);
  if (!q.has("m")) return;
  check("amode", q.get("m")); check("walls", q.get("w")); check("floor", q.get("f")); check("ceiling", q.get("c")); check("occ", q.get("o")); check("size", q.get("s"));
  if (q.get("m") === "advanced") {
    const n = (k) => Number(q.get(k));
    if (n("l") > 0) el.length.value = n("l"); if (n("wd") > 0) el.width.value = n("wd"); if (n("h") > 0) el.height.value = n("h");
    if (q.has("g")) el.glass.value = Math.min(100, Math.max(0, n("g")));
    if (q.has("p")) el.panels.value = Math.max(0, n("p")); if (q.has("a")) el.alpha.value = n("a");
    fillGlass();
    if (q.get("u") === "imperial") setUnits("imperial");
  }
}

setDims("medium");
form.addEventListener("input", (ev) => {
  if (ev.target.name === "size") setDims(ev.target.value);
  if (ev.target.name === "amode" && ev.target.value === "advanced") setDims(radioValue("size") || "medium");
  render(); firstChange();
});
document.querySelectorAll("[data-units]").forEach((b) => b.addEventListener("click", () => setUnits(b.dataset.units)));
$("#copy-link").addEventListener("click", async () => {
  if (await copyText(`${location.origin}${location.pathname}?${toQuery()}`)) toast(S[lang].copied);
  track("acoustics-share-link");
});
fromQuery();
initLang(S, (l) => { lang = l; render(); });
track("acoustics-opened");
