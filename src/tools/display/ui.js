import * as C from "./calc.mjs";
import S from "./strings.mjs";
import { initLang, fmtNumber, sliderFill, $, radioValue, readNumber, copyText, toast, track, trackOnFirstChange } from "../tool-common.mjs";

const icons = {
  good: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="M12 6v8M12 18.5v.01"/></svg>',
  poor: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><path d="m7 7 10 10M17 7 7 17"/></svg>'
};

const el = {
  diag: $("#diag"), dist: $("#dist"), bottom: $("#bottom"),
  diagOut: $("#diag-out"), diagDims: $("#diag-dims"), distOut: $("#dist-out"), distUnit: $("#dist-unit"), distAlt: $("#dist-alt"),
  distMin: $("#dist-min"), distMax: $("#dist-max"),
  ehField: $("#eh-field"), resField: $("#res-field"), angleField: $("#angle-field"), distLabel: $("#dist-label"), mAngle: $("#m-angle"),
  status: $("#status"), icon: $("#status-icon"), label: $("#status-label"), title: $("#status-title"), text: $("#status-text"),
  recMin: $("#rec-min"), recCommon: $("#rec-common"),
  zone: $("#viz-zone"), marker: $("#viz-marker"), scale: $("#viz-scale"),
  mSize: $("#m-size"), mMaxFar: $("#m-maxfar"), mClosest: $("#m-closest"), mRatio: $("#m-ratio")
};

let units = "metric";
let lang = "en";
const fillDiag = sliderFill(el.diag);
const fillDist = sliderFill(el.dist);
const firstChange = trackOnFirstChange("display");

// Distance is held internally in metres; the slider shows the current unit.
let distM = 4.5;
const DIST = { metric: { min: 1, max: 15, step: 0.1 }, imperial: { min: 3, max: 50, step: 0.5 } };

function len(m, digits = 1) {
  return units === "metric" ? `${fmtNumber(m, lang, digits)} m` : `${fmtNumber(C.mToFt(m), lang, digits)} ft`;
}

function setUnits(u) {
  units = u;
  document.querySelectorAll("[data-units]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.units === u)));
  const r = DIST[u];
  Object.assign(el.dist, { min: r.min, max: r.max, step: r.step });
  el.dist.value = u === "metric" ? distM.toFixed(1) : (Math.round(C.mToFt(distM) * 2) / 2).toString();
  el.distUnit.textContent = u === "metric" ? "m" : "ft";
  el.distMin.textContent = u === "metric" ? "1 m" : "3 ft";
  el.distMax.textContent = u === "metric" ? "15 m" : "50 ft";
  // Mounting height input
  const b = readNumber(el.bottom, 1);
  const bM = el.bottom.dataset.unit === "imperial" ? C.ftToM(b) : b;
  el.bottom.value = u === "metric" ? bM.toFixed(2) : C.mToFt(bM).toFixed(1);
  el.bottom.step = u === "metric" ? "0.05" : "0.1";
  el.bottom.dataset.unit = u;
  document.querySelectorAll(".len-unit").forEach((s) => (s.textContent = u === "metric" ? "m" : "ft"));
  fillDist();
  render();
}

function readState() {
  const mode = radioValue("mode") || "bdm";
  const raw = Number(el.dist.value);
  distM = units === "metric" ? raw : C.ftToM(raw);
  const b = readNumber(el.bottom, units === "metric" ? 1 : 3.3);
  return {
    mode,
    diagonalIn: Number(el.diag.value),
    farthestM: distM,
    elementHeightPct: Number(radioValue("eh") || 3),
    verticalLines: Number(radioValue("res") || 1080),
    angleDeg: Number(radioValue("angle") || 30),
    bottomOfImageM: C.clamp(units === "metric" ? b : C.ftToM(b), 0, 4),
    eyeHeightM: radioValue("eye") === "standing" ? 1.5 : 1.2
  };
}

function render() {
  const t = S[lang];
  const p = readState();
  el.ehField.hidden = p.mode !== "bdm";
  el.resField.hidden = p.mode !== "adm";
  el.angleField.hidden = p.mode !== "home";
  el.distLabel.textContent = p.mode === "home" ? t.distHome : t.dist;
  const r = C.evaluate(p);

  el.diagOut.textContent = p.diagonalIn;
  el.diagDims.textContent = units === "metric"
    ? `${fmtNumber(r.imageWidthM, lang, 2)} × ${fmtNumber(r.imageHeightM, lang, 2)} m`
    : `${fmtNumber(C.mToFt(r.imageWidthM), lang, 1)} × ${fmtNumber(C.mToFt(r.imageHeightM), lang, 1)} ft`;
  el.distOut.textContent = units === "metric" ? fmtNumber(distM, lang, 1) : fmtNumber(Number(el.dist.value), lang, 1);
  el.distAlt.textContent = units === "metric" ? `${fmtNumber(C.mToFt(distM), lang, 1)} ft` : `${fmtNumber(distM, lang, 1)} m`;

  const key = p.mode === "video"
    ? { ok: "vgood", workable: "vwork", "too-small": "vsmall", "too-close": "vclose" }[r.reason]
    : { ok: "ok", "slightly-small": "slightly", "too-small": "small", "too-close": "close", "home-ok": "hok", "home-slightly": "hslightly", "home-small": "hsmall" }[r.reason];
  el.status.className = `status status--${r.status}`;
  el.icon.innerHTML = icons[r.status];
  el.label.textContent = t[{ good: "statusGood", warn: "statusWarn", poor: "statusPoor" }[r.status]];
  el.title.textContent = t[`t_${key}`];
  el.text.textContent = t[`d_${key}`];

  const inch = (x) => `${Math.ceil(x)}″`;
  el.recMin.textContent = inch(r.recommendedDiagonalIn);
  el.recCommon.textContent = r.recommendedCommonSizeIn ? `${r.recommendedCommonSizeIn}″` : "dvLED / projection";

  el.mSize.textContent = el.diagDims.textContent;
  el.mMaxFar.textContent = len(r.maxFarthestM);
  el.mClosest.textContent = len(r.closestViewerM);
  el.mRatio.textContent = `${fmtNumber(r.viewingRatio, lang, 1)} × H`;
  el.mAngle.textContent = `${fmtNumber(r.viewingAngleDeg, lang, 0)}°`;

  // Visual zone: scale grows with the numbers so the marker never falls off the end.
  const maxM = Math.max(12, Math.ceil(Math.max(distM, Math.min(r.maxFarthestM, 30)) * 1.15 / 2) * 2);
  const pct = (m) => `${Math.min(100, Math.max(0, (m / maxM) * 100))}%`;
  el.zone.style.left = pct(r.closestViewerM);
  el.zone.style.width = `calc(${pct(Math.max(r.closestViewerM, r.maxFarthestM))} - ${pct(r.closestViewerM)})`;
  el.marker.style.left = pct(distM);
  el.marker.style.background = r.status === "good" ? "var(--navy-950)" : r.status === "warn" ? "var(--warn)" : "var(--poor)";
  const steps = 6;
  el.scale.innerHTML = Array.from({ length: steps + 1 }, (_, k) => {
    const m = (maxM / steps) * k;
    return `<span>${units === "metric" ? fmtNumber(m, lang, 0) + " m" : fmtNumber(C.mToFt(m), lang, 0) + " ft"}</span>`;
  }).join("");
}

// URL state (no personal data in this tool, so full state is fine)
function toQuery() {
  const p = readState();
  const q = new URLSearchParams({ m: p.mode, d: String(p.diagonalIn), v: p.farthestM.toFixed(2), u: units });
  if (p.mode === "bdm") q.set("e", String(p.elementHeightPct));
  if (p.mode === "adm") q.set("r", String(p.verticalLines));
  if (p.mode === "home") q.set("a", String(p.angleDeg));
  return q.toString();
}
function fromQuery() {
  const q = new URLSearchParams(location.search);
  const m = q.get("m");
  if (["bdm", "adm", "video", "home"].includes(m)) document.querySelector(`input[name="mode"][value="${m}"]`).checked = true;
  const d = Number(q.get("d")); if (d >= 32 && d <= 165) el.diag.value = String(Math.round(d));
  const v = Number(q.get("v")); if (v >= 0.5 && v <= 30) distM = v;
  const e = q.get("e"); if (["2", "3", "4"].includes(e)) document.querySelector(`input[name="eh"][value="${e}"]`).checked = true;
  const r = q.get("r"); if (["1080", "1440", "2160"].includes(r)) document.querySelector(`input[name="res"][value="${r}"]`).checked = true;
  const a = q.get("a"); if (["30", "40"].includes(a)) document.querySelector(`input[name="angle"][value="${a}"]`).checked = true;
  el.dist.value = distM.toFixed(1);
  return q.get("u") === "imperial" ? "imperial" : "metric";
}

const startUnits = fromQuery();
fillDiag();
document.getElementById("display-calc").addEventListener("input", (ev) => {
  if (ev.target === el.dist) distM = units === "metric" ? Number(el.dist.value) : C.ftToM(Number(el.dist.value));
  render(); firstChange();
});
document.querySelectorAll("[data-units]").forEach((b) => b.addEventListener("click", () => setUnits(b.dataset.units)));
$("#copy-link").addEventListener("click", async () => {
  const url = `${location.origin}${location.pathname}?${toQuery()}`;
  if (await copyText(url)) toast(S[lang].copied);
  track("display-share-link");
});

initLang(S, (l) => { lang = l; render(); });
setUnits(startUnits);
track("display-opened");
