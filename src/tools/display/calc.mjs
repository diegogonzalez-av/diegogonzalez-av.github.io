// AV Display Size & Viewing Distance — pure calculation module (browser + Node).
// Methodology: docs/methodology/display-size-calculator.md
//
// Standards-based parts implement the relationships published in AVIXA's own
// free DISCAS calculators (ANSI/AVIXA V202.01, "Display Image Size for 2D Content
// in Audiovisual Systems"):
//   BDM  image height = farthest viewer / (200 × element height as a fraction)
//   ADM  image height = farthest viewer × vertical resolution / 3438
//   Closest viewer    = 1.732 × (top of image − eye height)  [30° upward limit]
// The video/conferencing mode is NOT covered by DISCAS; it uses the general
// human-factors distance-to-diagonal ratio from the FAA Human Factors Design
// Standard (HFDS 2007, §5.2.3.3): between 2:1 and 8:1, optimum 4:1.
// The home mode uses the commonly quoted horizontal viewing angles for home
// viewing: ~30° (widely attributed to SMPTE) and ~40° (THX).

export const INCH_M = 0.0254;
export const FOOT_M = 0.3048;
const DIAG_16x9 = Math.hypot(16, 9);
export const H_PER_DIAG = 9 / DIAG_16x9;   // 0.490261…
export const W_PER_DIAG = 16 / DIAG_16x9;  // 0.871576…

export const BDM_ACUITY = 200;        // AVIXA DISCAS BDM acuity factor
export const ADM_ARCMIN_PER_RAD = 3438; // ≈ 1 arcminute per pixel (AVIXA DISCAS ADM)
export const TAN30_INV = 1.732;        // as used in AVIXA's closest-viewer calculation
export const VIDEO_RATIO = { min: 2, optimum: 4, max: 8 }; // FAA HFDS §5.2.3.3 (distance : diagonal)
export const HOME_ANGLES = [30, 40];     // commonly quoted SMPTE (30°) and THX (≈40°) horizontal viewing angles
export const NEAR_MISS = 0.9;          // design choice: within 10% of the requirement = "warning"

export const COMMON_SIZES_IN = [32, 43, 50, 55, 65, 75, 85, 98, 110, 136, 163, 220];

export const DEFAULTS = {
  mode: "bdm",
  diagonalIn: 75,
  farthestM: 4.5,
  angleDeg: 30,           // home: horizontal viewing angle
  elementHeightPct: 3,    // BDM: smallest element as % of image height (user-adjustable)
  verticalLines: 1080,    // ADM: content resolution
  bottomOfImageM: 1.0,    // assumed height of the image bottom above floor
  eyeHeightM: 1.2         // AVIXA suggests ~1200 mm seated, ~1500 mm standing
};

export const LIMITS = {
  diagonalIn: [24, 220],
  farthestM: [0.5, 30],
  elementHeightPct: [0.5, 10],
  verticalLines: [480, 4320]
};

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
export const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

export function imageSize(diagonalIn) {
  if (!isNum(diagonalIn) || diagonalIn <= 0) throw new RangeError("diagonal must be a positive number");
  const diagonalM = diagonalIn * INCH_M;
  return { diagonalM, heightM: diagonalM * H_PER_DIAG, widthM: diagonalM * W_PER_DIAG };
}

export const heightToDiagonalIn = (heightM) => heightM / H_PER_DIAG / INCH_M;
export const nextCommonSize = (inches) => COMMON_SIZES_IN.find((s) => s >= Math.ceil(inches - 1e-9)) ?? null;

/** Minimum image height (m) the standard requires for a given farthest viewer. */
export function requiredImageHeightM({ mode, farthestM, elementHeightPct, verticalLines, angleDeg = 30 }) {
  if (!isNum(farthestM) || farthestM <= 0) throw new RangeError("farthest viewer distance must be positive");
  if (mode === "bdm") {
    if (!isNum(elementHeightPct) || elementHeightPct <= 0) throw new RangeError("element height must be positive");
    return farthestM / (BDM_ACUITY * (elementHeightPct / 100));
  }
  if (mode === "adm") {
    if (!isNum(verticalLines) || verticalLines <= 0) throw new RangeError("vertical resolution must be positive");
    return (farthestM * verticalLines) / ADM_ARCMIN_PER_RAD;
  }
  if (mode === "video") return (farthestM / VIDEO_RATIO.optimum) * H_PER_DIAG; // diagonal = distance / 4
  if (mode === "home") return requiredWidthForAngle(farthestM, angleDeg) * (9 / 16);
  throw new RangeError(`unknown mode: ${mode}`);
}

/** Farthest viewer (m) that a given image height supports. */
export function maxFarthestM({ mode, heightM, elementHeightPct, verticalLines, angleDeg = 30 }) {
  if (mode === "bdm") return heightM * BDM_ACUITY * (elementHeightPct / 100);
  if (mode === "adm") return (heightM * ADM_ARCMIN_PER_RAD) / verticalLines;
  if (mode === "video") return (heightM / H_PER_DIAG) * VIDEO_RATIO.max;
  if (mode === "home") return (heightM * 16 / 9) / (2 * Math.tan(((angleDeg) * Math.PI) / 360));
  throw new RangeError(`unknown mode: ${mode}`);
}

/** Screen width (m) that fills a given horizontal viewing angle at a distance. */
export function requiredWidthForAngle(distanceM, angleDeg) {
  if (!isNum(angleDeg) || angleDeg <= 0 || angleDeg >= 180) throw new RangeError("viewing angle must be between 0 and 180 degrees");
  return 2 * distanceM * Math.tan((angleDeg * Math.PI) / 360);
}
/** Horizontal angle (degrees) a screen of width W fills at distance d. */
export const viewingAngleDeg = (widthM, distanceM) => (2 * Math.atan(widthM / (2 * distanceM)) * 180) / Math.PI;

/** Closest comfortable viewer (m): DISCAS 30° upward limit, and never closer than half the image width (FAA HFDS §5.2.2.3). */
export function closestViewerM({ heightM, widthM, bottomOfImageM, eyeHeightM }) {
  const rise = Math.max(0, heightM + bottomOfImageM - eyeHeightM);
  return Math.max(TAN30_INV * rise, widthM / 2);
}

export function evaluate(input = {}) {
  const p = { ...DEFAULTS, ...input };
  if (!["bdm", "adm", "video", "home"].includes(p.mode)) throw new RangeError(`unknown mode: ${p.mode}`);
  const size = imageSize(p.diagonalIn);
  const reqH = requiredImageHeightM(p);
  const reqDiagIn = heightToDiagonalIn(reqH);
  const maxFar = maxFarthestM({ ...p, heightM: size.heightM });
  const closest = closestViewerM({ ...size, bottomOfImageM: p.bottomOfImageM, eyeHeightM: p.eyeHeightM });
  const distanceToDiagonal = p.farthestM / size.diagonalM;

  let status, reason;
  if (p.mode === "video") {
    if (distanceToDiagonal > VIDEO_RATIO.max) { status = "poor"; reason = "too-small"; }
    else if (distanceToDiagonal > VIDEO_RATIO.optimum) { status = "warn"; reason = "workable"; }
    else if (distanceToDiagonal < VIDEO_RATIO.min) { status = "warn"; reason = "too-close"; }
    else { status = "good"; reason = "ok"; }
  } else if (p.mode === "home") {
    const ratio = size.heightM / reqH;
    if (ratio >= 1) { status = "good"; reason = "home-ok"; }
    else if (ratio >= NEAR_MISS) { status = "warn"; reason = "home-slightly"; }
    else { status = "poor"; reason = "home-small"; }
    if (p.farthestM < closest) { status = "warn"; reason = "too-close"; }
  } else {
    const ratio = size.heightM / reqH;
    if (ratio >= 1) { status = "good"; reason = "ok"; }
    else if (ratio >= NEAR_MISS) { status = "warn"; reason = "slightly-small"; }
    else { status = "poor"; reason = "too-small"; }
    if (status === "good" && p.farthestM < closest) { status = "warn"; reason = "too-close"; }
  }

  // Minimum diagonal: for video use the 8:1 acceptable limit as the hard minimum, 4:1 as the recommendation.
  const minDiagIn = p.mode === "video" ? p.farthestM / VIDEO_RATIO.max / INCH_M : reqDiagIn;
  const recommendedDiagIn = p.mode === "video" ? p.farthestM / VIDEO_RATIO.optimum / INCH_M : reqDiagIn;

  return {
    status, reason,
    imageHeightM: size.heightM, imageWidthM: size.widthM, diagonalM: size.diagonalM,
    requiredImageHeightM: reqH,
    minDiagonalIn: minDiagIn,
    recommendedDiagonalIn: recommendedDiagIn,
    recommendedCommonSizeIn: nextCommonSize(recommendedDiagIn),
    maxFarthestM: maxFar,
    closestViewerM: closest,
    distanceToDiagonal,
    viewingRatio: p.farthestM / size.heightM, // farthest viewer ÷ image height
    viewingAngleDeg: viewingAngleDeg(size.widthM, p.farthestM)
  };
}

export const mToFt = (m) => m / FOOT_M;
export const ftToM = (ft) => ft * FOOT_M;
