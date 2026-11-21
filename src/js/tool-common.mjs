// Shared helpers for tool pages: i18n, number formatting, sliders, toasts, anonymous analytics.
// English-only site. Strings live in each tool's strings.mjs (one place to edit copy).
export function initLang(dict, onChange) {
  const t = dict.en;
  onChange?.("en", t);
  return () => "en";
}

export function fmtNumber(v, lang, digits = 0) {
  return new Intl.NumberFormat("en-GB", { maximumFractionDigits: digits, minimumFractionDigits: digits }).format(v);
}

export function sliderFill(input) {
  const set = () => {
    const min = Number(input.min), max = Number(input.max), v = Number(input.value);
    input.style.setProperty("--p", `${((v - min) / (max - min)) * 100}%`);
  };
  input.addEventListener("input", set);
  set();
  return set;
}

let toastTimer;
export function toast(msg) {
  let el = document.querySelector(".toast");
  if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); }
  el.textContent = msg;
  el.classList.add("is-on");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("is-on"), 2400);
}

// Anonymous events only. Never pass input values.
export function track(name) { try { window.dgTrack?.(name); } catch {} }

/** Fire "calculation completed" once per page view, after the user has actually changed something. */
export function trackOnFirstChange(tool) {
  let done = false;
  return () => { if (!done) { done = true; track(`${tool}-calculated`); } };
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];
export const radioValue = (name) => document.querySelector(`input[name="${name}"]:checked`)?.value;
export function readNumber(el, fallback) {
  const v = parseFloat(String(el.value).replace(",", "."));
  return Number.isFinite(v) ? v : fallback;
}

export async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch {
    const ta = document.createElement("textarea"); ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    let ok = false; try { ok = document.execCommand("copy"); } catch {}
    ta.remove(); return ok;
  }
}
