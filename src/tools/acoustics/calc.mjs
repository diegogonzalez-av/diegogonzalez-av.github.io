// Conference Room Acoustics Checker — pure calculation module (browser + Node).
// Methodology: docs/methodology/room-acoustics-checker.md
//
// Sabine:  T60 = 0.161 · V / A   (V in m³, A in m² sabins)
// Coefficients: mid-frequency (mean of 500 Hz and 1 kHz) values from the
// HyperPhysics table of absorption coefficients (after Hall, Table 15.1).
// Targets: BB93 (UK DfE, 2015) Table 6: meeting room / video conference room
// Tmf ≤ 0.8 s. "Good" at ≤ 0.6 s is a design judgement for video conferencing
// (consistent with the lower end of the 0.6–0.8 s DIN 18041 classroom band).

export const SABINE_K = 0.161;
export const FOOT_M = 0.3048;

const mid = (a500, a1k) => (a500 + a1k) / 2;
// Base materials (HyperPhysics, 500 Hz / 1 kHz)
export const BASE = {
  acousticTileSuspended: mid(0.6, 0.7),   // 0.65
  gypsumBoard: mid(0.05, 0.04),           // 0.045
  plasterOnLath: mid(0.1, 0.05),          // 0.075
  concretePoured: mid(0.02, 0.02),        // 0.02
  heavyGlass: mid(0.04, 0.03),            // 0.035
  carpetOnConcrete: mid(0.15, 0.4),       // 0.275
  vinylOnConcrete: mid(0.03, 0.03),       // 0.03
  softFinish: mid(0.5, 0.7)               // 0.6 — medium velour drapery, used as a proxy for soft/fabric finishes
};

// Surface options exposed in the UI. Composite wall options are documented area-weighted blends.
export const WALLS = {
  soft:   { alpha: 0.5 * BASE.gypsumBoard + 0.5 * BASE.softFinish, label: "Mostly acoustic / soft" },          // ~50% soft coverage
  drywall:{ alpha: BASE.gypsumBoard, label: "Mostly plasterboard / plaster" },
  mixed:  { alpha: 0.85 * BASE.gypsumBoard + 0.15 * BASE.softFinish, label: "Mixed" },                         // ~15% soft finishes
  glass:  { alpha: BASE.heavyGlass, label: "Mostly glass / hard" }
};
export const FLOORS = {
  carpet: { alpha: BASE.carpetOnConcrete, label: "Carpet" },
  vinyl:  { alpha: BASE.vinylOnConcrete, label: "Vinyl / wood" },
  hard:   { alpha: BASE.concretePoured, label: "Tile / concrete" }
};
export const CEILINGS = {
  acoustic: { alpha: BASE.acousticTileSuspended, label: "Acoustic ceiling tile" },
  finished: { alpha: BASE.gypsumBoard, label: "Standard plasterboard ceiling" },
  exposed:  { alpha: BASE.concretePoured, label: "Exposed / hard ceiling" }
};

export const PERSON_SABINS = 0.4; // m² per person — judgement within the 0.2–0.5 m² range commonly published

export const ROOM_PRESETS = {
  small:  { lengthM: 3.6, widthM: 3.0, heightM: 2.7 },  // focus / huddle, 2–4 people
  medium: { lengthM: 6.0, widthM: 4.5, heightM: 2.7 },  // 6–10 people
  large:  { lengthM: 9.0, widthM: 6.0, heightM: 2.8 }   // 12–16 people
};
export const OCCUPANCY = { "2-4": 3, "5-8": 6, "9-12": 10, "13+": 14 };

export const TARGETS = { good: 0.6, limit: 0.8 }; // seconds

const isPos = (v) => typeof v === "number" && Number.isFinite(v) && v > 0;

export function geometry({ lengthM, widthM, heightM }) {
  if (![lengthM, widthM, heightM].every(isPos)) throw new RangeError("room dimensions must be positive numbers");
  const floor = lengthM * widthM;
  const walls = 2 * (lengthM + widthM) * heightM;
  return { volume: floor * heightM, floor, ceiling: floor, walls, total: 2 * floor + walls };
}

/**
 * input: { lengthM, widthM, heightM, walls, floor, ceiling, people?, glassWallPct?, panelAreaM2?, panelAlpha? }
 * glassWallPct (0–100) overrides that share of the wall area with glass (advanced mode).
 * panelAreaM2 adds absorptive panels mounted over wall area (advanced mode).
 */
export function estimate(input) {
  const g = geometry(input);
  const w = WALLS[input.walls], f = FLOORS[input.floor], c = CEILINGS[input.ceiling];
  if (!w || !f || !c) throw new RangeError("unknown surface option");
  const glassShare = Math.min(1, Math.max(0, (input.glassWallPct ?? 0) / 100));
  // Panels cover the selected wall finish first, then glass (e.g. a glass room with panels on its one solid wall).
  const panelArea = Math.min(g.walls, Math.max(0, input.panelAreaM2 ?? 0));
  const panelAlpha = Math.min(1.2, Math.max(0, input.panelAlpha ?? 0.8));
  const finishArea0 = g.walls * (1 - glassShare);
  const finishArea = Math.max(0, finishArea0 - panelArea);
  const glassArea = Math.max(0, g.walls * glassShare - Math.max(0, panelArea - finishArea0));

  const parts = {
    ceiling: g.ceiling * c.alpha,
    floor: g.floor * f.alpha,
    walls: finishArea * w.alpha + glassArea * BASE.heavyGlass,
    panels: panelArea * panelAlpha
  };
  const surfaceA = parts.ceiling + parts.floor + parts.walls + parts.panels;
  const people = Math.max(0, Math.round(input.people ?? 0));
  const peopleA = people * PERSON_SABINS;

  const rt = (A) => (SABINE_K * g.volume) / A;
  const rtEmpty = rt(surfaceA);
  const rtOccupied = rt(surfaceA + peopleA);
  const status = rtEmpty <= TARGETS.good ? "good" : rtEmpty <= TARGETS.limit ? "warn" : "poor";

  // Absorption needed to reach the "good" target (Sabine), unoccupied.
  const neededA = Math.max(0, (SABINE_K * g.volume) / TARGETS.good - surfaceA);

  // Main contributor: the largest surface by reflective (non-absorbed) area, weighted by how hard it is.
  const reflective = {
    walls: g.walls * (1 - (parts.walls + parts.panels) / g.walls),
    ceiling: g.ceiling * (1 - c.alpha),
    floor: g.floor * (1 - f.alpha)
  };
  const hardest = Object.entries(reflective).sort((a, b) => b[1] - a[1])[0][0];
  const meanAlpha = surfaceA / g.total;

  return {
    status, volumeM3: g.volume, surfaceM2: g.total,
    absorptionM2: surfaceA, absorptionWithPeopleM2: surfaceA + peopleA,
    rtUnoccupied: rtEmpty, rtOccupied, people,
    meanAlpha, sabineLikelyOverestimates: meanAlpha > 0.3,
    additionalAbsorptionM2: neededA,
    mainContributor: hardest,
    parts
  };
}

export const feetToM = (ft) => ft * FOOT_M;
