import * as C from "./calc.mjs";
import S from "./strings.mjs";
import { initLang, fmtNumber, $, radioValue, readNumber, copyText, toast, track, trackOnFirstChange } from "../tool-common.mjs";

const DATA = JSON.parse(document.getElementById("tool-data").textContent);
const form = $("#meeting-calc");
const el = {
  attendees: $("#attendees"), duration: $("#duration"), rate: $("#rate"), currency: $("#currency"), curSymbol: $("#cur-symbol"),
  custom: $("#custom"), customField: $("#custom-field"), multiplier: $("#multiplier"), multiplierField: $("#multiplier-field"), multiplierNote: $("#multiplier-note"),
  hours: $("#hours"), weeks: $("#weeks"),
  tech: $("#tech"), remote: $("#remote"), remoteField: $("#remote-field"), platform: $("#platform"), platformField: $("#platform-field"),
  licence: $("#licence"), licenceNote: $("#licence-note"), room: $("#room"), roomField: $("#room-field"), roomcost: $("#roomcost"), lifecycle: $("#lifecycle"), util: $("#util"),
  kicker: $("#kicker"), headline: $("#headline"), rMeeting: $("#r-meeting"), rMonth: $("#r-month"), rHours: $("#r-hours"), rHoursLabel: $("#r-hours-label"), rDays: $("#r-days"),
  rHourly: $("#r-hourly"), rPeople: $("#r-people"), rTech: $("#r-tech"), rPeopleWrap: $("#r-people-wrap"), rTechWrap: $("#r-tech-wrap"),
  threshold: $("#threshold"), estimateNote: $("#estimate-note"), card: $("#card"), shareInputs: $("#share-inputs"),
  linkedin: $("#btn-linkedin"), x: $("#btn-x")
};

let lang = "en";
const dirty = new Set();         // inputs the user has edited (so currency changes don't overwrite them)
let lastRateMode = "salary";
let lastCurrency = "GBP";
let state = null, result = null;
const firstChange = trackOnFirstChange("meeting");
const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? "");

function money(v, opts) { return C.formatMoney(v, state?.currency ?? "GBP", opts); }

function applyCurrencyDefaults(cur) {
  const d = DATA.defaults[cur];
  const mode = radioValue("rateMode");
  if (!dirty.has("rate")) el.rate.value = mode === "hourly" ? d.hourlyRate : d.annualSalary;
  if (!dirty.has("hours")) el.hours.value = d.hoursPerWeek;
  if (!dirty.has("multiplier")) el.multiplier.value = d.loadedMultiplier;
  const sym = C.CURRENCIES[cur].symbol;
  el.curSymbol.textContent = sym;
  document.querySelectorAll(".cur-symbol").forEach((s) => (s.textContent = sym));
  el.multiplierNote.textContent = DATA.loadedMultiplierNotes[cur];
  applyRoomCost(); applyPlatform();
}

function applyRoomCost() {
  if (dirty.has("roomcost")) return;
  const r = DATA.rooms.types.find((x) => x.key === el.room.value);
  el.roomcost.value = r ? r.cost[el.currency.value] : 0;
}

function applyPlatform() {
  const p = DATA.platforms.find((x) => x.key === el.platform.value);
  const t = S[lang];
  const ignore = p?.key === "covered";
  el.licence.disabled = ignore;
  if (ignore) { el.licence.value = 0; el.licenceNote.textContent = t.licenceHint; return; }
  if (dirty.has("licence")) return;
  if (p?.reference && p.reference.currency === el.currency.value) {
    el.licence.value = p.reference.amount;
    el.licenceNote.textContent = `${p.reference.plan}. Indicative list price, checked ${p.reference.checked}.`;
  } else {
    el.licence.value = 0;
    el.licenceNote.textContent = p?.note ?? (p?.reference
      ? `Reference price published in ${p.reference.currency} (${p.reference.amount}). ${t.licenceHint}`
      : t.licenceHint);
  }
}

function readState() {
  const currency = el.currency.value;
  const rateMode = radioValue("rateMode") || "salary";
  const n = (inp, fb, lo, hi) => Math.min(hi, Math.max(lo, readNumber(inp, fb)));
  const p = {
    attendees: Math.round(n(el.attendees, 6, 1, 1000)),
    durationMin: n(el.duration, 60, 5, 600),
    rateMode, currency,
    annualSalary: rateMode === "salary" ? n(el.rate, 0, 0, 1e7) : C.DEFAULTS.annualSalary,
    hourlyRate: rateMode === "hourly" ? n(el.rate, 0, 0, 1e4) : C.DEFAULTS.hourlyRate,
    costBasis: radioValue("basis") || "salary",
    loadedMultiplier: n(el.multiplier, 1.2, 1, 3),
    hoursPerWeek: n(el.hours, 37.5, 1, 80),
    workingWeeksPerYear: n(el.weeks, 46, 1, 52),
    frequency: radioValue("frequency") || "weekly",
    customPerYear: Math.round(n(el.custom, 24, 0, 2000)),
    tech: null
  };
  if (el.tech.open) {
    const mt = radioValue("mtype") || "hybrid";
    p.tech = {
      meetingType: mt,
      remoteAttendees: Math.round(n(el.remote, 0, 0, 1000)),
      licencePerUserMonth: el.platform.value === "covered" ? 0 : n(el.licence, 0, 0, 1000),
      roomInstalledCost: el.room.value === "none" ? 0 : n(el.roomcost, 0, 0, 1e7),
      roomLifecycleYears: n(el.lifecycle, 6, 1, 20),
      roomUtilisation: n(el.util, 30, 1, 100) / 100,
      roomBookableHoursPerYear: DATA.rooms.bookableHoursPerYear
    };
  }
  return p;
}

function render() {
  const t = S[lang];
  state = readState();
  el.customField.hidden = state.frequency !== "custom";
  el.multiplierField.hidden = state.costBasis !== "loaded";
  const mt = radioValue("mtype");
  el.remoteField.hidden = mt !== "hybrid";
  el.platformField.hidden = mt === "in-person";
  el.roomField.hidden = mt === "video";
  try { result = C.calculate(state); } catch { return; }
  const r = result;

  const freq = t.freqWord[state.frequency];
  el.kicker.textContent = fill(r.recurring ? t.kickerRecurring : t.kickerOnce, { freq, dur: fmtNumber(state.durationMin, lang) });
  el.headline.innerHTML = r.recurring
    ? `${money(C.roundHeadline(r.annualTotal))} <small style="font:500 1rem var(--sans);color:var(--ink-3)">${t.perYearSuffix}</small>`
    : money(r.totalPerMeeting);
  el.rMeeting.textContent = money(r.totalPerMeeting);
  el.rMonth.textContent = r.recurring ? money(r.monthlyTotal) : "–";
  el.rHoursLabel.textContent = r.recurring ? t.hoursYear : t.hoursMeeting;
  el.rHours.textContent = fmtNumber(r.recurring ? r.annualEmployeeHours : r.employeeHoursPerMeeting, lang, r.recurring ? 0 : 1);
  el.rDays.textContent = r.recurring ? fill(t.workingDays, { n: fmtNumber(r.workingDaysPerYear, lang) }) : "";
  el.rHourly.textContent = money(r.hourlyCostPerPerson, { decimals: 2 });
  const hasTech = !!state.tech && r.techPerMeeting > 0;
  el.rPeopleWrap.hidden = el.rTechWrap.hidden = !hasTech;
  if (hasTech) { el.rPeople.textContent = money(r.peoplePerMeeting); el.rTech.textContent = money(r.techPerMeeting); }

  el.threshold.innerHTML = fill(t.threshold, { x: money(r.valueThresholdPerMeeting) }) + (r.recurring ? " " + fill(t.thresholdYear, { y: money(r.valueThresholdAnnual) }) : "");
  el.estimateNote.textContent = state.costBasis === "loaded" ? fill(t.loadedNote, { m: fmtNumber(state.loadedMultiplier, lang, 2) }) : t.estimateNote;

  updateShareLinks();
  drawCard();
}

// ---------------- Sharing ----------------
function shareUrl() {
  return `${location.origin}${location.pathname}?${C.encodeShare(result, state, { includeInputs: el.shareInputs.checked })}`;
}
function shareText() {
  const t = S[lang];
  return result.recurring
    ? fill(t.shareText, { freq: t.freqWord[state.frequency], y: money(C.roundHeadline(result.annualTotal), { compact: false }) })
    : fill(t.shareTextOnce, { x: money(result.totalPerMeeting) });
}
function updateShareLinks() {
  const url = encodeURIComponent(shareUrl());
  el.linkedin.href = `https://www.linkedin.com/sharing/share-offsite/?url=${url}`;
  el.x.href = `https://x.com/intent/tweet?text=${encodeURIComponent(shareText())}&url=${url}`;
}

async function drawCard() {
  const t = S[lang];
  const c = el.card, g = c.getContext("2d");
  try { await document.fonts.ready; } catch {}
  const W = 1200, H = 630;
  const grad = g.createLinearGradient(0, 0, W, H);
  grad.addColorStop(0, "#0B2440"); grad.addColorStop(1, "#071B2E");
  g.fillStyle = grad; g.fillRect(0, 0, W, H);
  g.fillStyle = "#E3B82E"; g.fillRect(80, 96, 56, 4);
  g.font = "600 26px 'IBM Plex Mono', monospace"; g.fillStyle = "#E3B82E";
  g.fillText(t.cardKicker, 80, 156);
  const value = result.recurring ? money(C.roundHeadline(result.annualTotal)) : money(result.totalPerMeeting);
  g.fillStyle = "#FFFFFF";
  let size = 132;
  g.font = `600 ${size}px 'Source Serif 4', Georgia, serif`;
  const suffix = result.recurring ? ` ${t.cardYear}` : "";
  while (g.measureText(value).width + (suffix ? 200 : 0) > W - 160 && size > 60) { size -= 6; g.font = `600 ${size}px 'Source Serif 4', Georgia, serif`; }
  g.fillText(value, 80, 300);
  if (suffix) {
    const vw = g.measureText(value).width;
    g.font = `600 ${Math.round(size * 0.36)}px 'IBM Plex Mono', monospace`; g.fillStyle = "#A9B6C8";
    g.fillText(suffix.trim(), 80 + vw + 22, 300);
  }
  g.font = "500 34px Inter, system-ui, sans-serif"; g.fillStyle = "#E8EDF4";
  const hours = result.recurring ? result.annualEmployeeHours : result.employeeHoursPerMeeting;
  g.fillText(fill(t.cardHours, { h: fmtNumber(hours, lang, result.recurring ? 0 : 1) }), 80, 372);
  g.font = "italic 500 40px 'Source Serif 4', Georgia, serif"; g.fillStyle = "#FFFFFF";
  g.fillText(t.cardQ, 80, 452);
  g.fillStyle = "rgba(255,255,255,.12)"; g.fillRect(80, 520, W - 160, 1);
  g.font = "600 22px 'IBM Plex Mono', monospace"; g.fillStyle = "#A9B6C8";
  g.fillText("DIEGO GONZALEZ · ENTERPRISE AV & PRODUCT MANAGEMENT", 80, 568);
  g.textAlign = "right"; g.fillStyle = "#E3B82E";
  g.fillText(location.host || "", W - 80, 568);
  g.textAlign = "left";
}

$("#btn-copy-result").addEventListener("click", async () => {
  if (await copyText(`${shareText()}\n${shareUrl()}`)) toast(S[lang].copiedResult);
  track("meeting-share-copy");
});
$("#btn-copy-link").addEventListener("click", async () => {
  if (await copyText(shareUrl())) toast(S[lang].copiedLink);
  track("meeting-share-link");
});
el.linkedin.addEventListener("click", () => track("meeting-share-linkedin"));
el.x.addEventListener("click", () => track("meeting-share-x"));
$("#btn-download").addEventListener("click", () => {
  const a = document.createElement("a");
  a.download = "meeting-cost.png"; a.href = el.card.toDataURL("image/png"); a.click();
  track("meeting-share-download");
});
const native = $("#btn-native");
if (navigator.share) {
  native.hidden = false;
  native.addEventListener("click", async () => {
    track("meeting-share-native");
    try {
      const blob = await new Promise((res) => el.card.toBlob(res, "image/png"));
      const file = new File([blob], "meeting-cost.png", { type: "image/png" });
      const payload = { title: S[lang].h1, text: shareText(), url: shareUrl() };
      if (navigator.canShare?.({ files: [file] })) payload.files = [file];
      await navigator.share(payload);
    } catch {}
  });
}
el.shareInputs.addEventListener("change", updateShareLinks);

// ---------------- Events ----------------
form.addEventListener("input", (ev) => {
  const id = ev.target.id;
  if (["rate", "hours", "multiplier", "licence", "roomcost"].includes(id)) dirty.add(id);
  if (ev.target.name === "rateMode" && ev.target.value !== lastRateMode) {
    lastRateMode = ev.target.value;
    dirty.delete("rate");
    const d = DATA.defaults[el.currency.value];
    el.rate.value = lastRateMode === "hourly" ? d.hourlyRate : d.annualSalary;
    el.rate.step = lastRateMode === "hourly" ? "1" : "500";
  }
  if (id === "currency" && el.currency.value !== lastCurrency) { lastCurrency = el.currency.value; applyCurrencyDefaults(lastCurrency); }
  if (id === "room") { dirty.delete("roomcost"); applyRoomCost(); }
  if (id === "platform") { dirty.delete("licence"); applyPlatform(); }
  render(); firstChange();
});
form.addEventListener("change", (ev) => { if (ev.target.tagName === "SELECT") form.dispatchEvent(new Event("input")); });
el.tech.addEventListener("toggle", () => { render(); if (el.tech.open) track("meeting-tech-opened"); });

// ---------------- Shared links ----------------
function loadShared() {
  const s = C.decodeShare(location.search);
  if (!s) return;
  const { shared, inputs } = s;
  if (shared.attendees) el.attendees.value = shared.attendees;
  if (shared.durationMin) el.duration.value = shared.durationMin;
  el.currency.value = shared.currency; lastCurrency = shared.currency;
  const f = document.querySelector(`input[name="frequency"][value="${shared.frequency}"]`); if (f) f.checked = true;
  if (shared.customPerYear != null) el.custom.value = shared.customPerYear;
  applyCurrencyDefaults(shared.currency);
  if (s.hasInputs) {
    document.querySelector(`input[name="rateMode"][value="${inputs.rateMode}"]`).checked = true; lastRateMode = inputs.rateMode;
    el.rate.value = inputs.rateMode === "hourly" ? inputs.hourlyRate ?? "" : inputs.annualSalary ?? ""; dirty.add("rate");
    document.querySelector(`input[name="basis"][value="${inputs.costBasis}"]`).checked = true;
    if (inputs.loadedMultiplier) { el.multiplier.value = inputs.loadedMultiplier; dirty.add("multiplier"); }
    if (inputs.hoursPerWeek) { el.hours.value = inputs.hoursPerWeek; dirty.add("hours"); }
    if (inputs.workingWeeksPerYear) el.weeks.value = inputs.workingWeeksPerYear;
  }
  const banner = $("#shared-banner");
  const t = S[lang];
  if (shared.perYear || shared.perMeeting) {
    $("#shared-figure").textContent = shared.frequency !== "once" && shared.perYear
      ? `${C.formatMoney(C.roundHeadline(shared.perYear), shared.currency)} ${t.perYearSuffix} · ${fmtNumber(shared.hours ?? 0, lang)} employee-hours`
      : C.formatMoney(shared.perMeeting ?? 0, shared.currency);
    banner.hidden = false;
  }
  track("meeting-shared-opened");
}

initLang(S, (l) => { lang = l; applyPlatform(); if (state) render(); });
applyCurrencyDefaults("GBP");
loadShared();
render();
track("meeting-opened");
