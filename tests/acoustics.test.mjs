import test from "node:test";
import assert from "node:assert/strict";
import * as A from "../src/tools/acoustics/calc.mjs";
const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);
const medium = { lengthM: 6, widthM: 4.5, heightM: 2.7 };

test("geometry", () => {
  const g = A.geometry(medium);
  near(g.volume, 72.9); near(g.floor, 27); near(g.walls, 56.7); near(g.total, 110.7);
});

test("coefficients are the mean of the 500 Hz and 1 kHz table values", () => {
  near(A.BASE.acousticTileSuspended, 0.65); near(A.BASE.gypsumBoard, 0.045); near(A.BASE.carpetOnConcrete, 0.275);
  near(A.BASE.heavyGlass, 0.035); near(A.BASE.concretePoured, 0.02); near(A.BASE.vinylOnConcrete, 0.03);
});

test("Sabine: treated medium room is good", () => {
  const r = A.estimate({ ...medium, walls: "drywall", floor: "carpet", ceiling: "acoustic" });
  const Aexp = 27 * 0.65 + 27 * 0.275 + 56.7 * 0.045;
  near(r.absorptionM2, Aexp);
  near(r.rtUnoccupied, 0.161 * 72.9 / Aexp);
  assert.equal(r.status, "good");
  assert.equal(r.additionalAbsorptionM2, 0);
});

test("glass box is poor, walls are the main contributor, absorption needed is correct", () => {
  const r = A.estimate({ ...medium, walls: "glass", floor: "vinyl", ceiling: "exposed" });
  const Aexp = 27 * 0.02 + 27 * 0.03 + 56.7 * 0.035;
  near(r.rtUnoccupied, 0.161 * 72.9 / Aexp);
  assert.equal(r.status, "poor");
  assert.equal(r.mainContributor, "walls");
  near(r.additionalAbsorptionM2, 0.161 * 72.9 / 0.6 - Aexp);
  // adding exactly that absorption hits the target
  const fixed = A.estimate({ ...medium, walls: "glass", floor: "vinyl", ceiling: "exposed", panelAreaM2: r.additionalAbsorptionM2 / (1 - 0), panelAlpha: 1 + 0.035 });
  near(fixed.rtUnoccupied, 0.6, 0.01);
});

test("status thresholds", () => {
  for (const walls of Object.keys(A.WALLS)) for (const floor of Object.keys(A.FLOORS)) for (const ceiling of Object.keys(A.CEILINGS)) for (const size of Object.keys(A.ROOM_PRESETS)) {
    const r = A.estimate({ ...A.ROOM_PRESETS[size], walls, floor, ceiling });
    const expected = r.rtUnoccupied <= 0.6 ? "good" : r.rtUnoccupied <= 0.8 ? "warn" : "poor";
    assert.equal(r.status, expected);
    assert.ok(r.rtUnoccupied > 0 && Number.isFinite(r.rtUnoccupied));
  }
});

test("people and panels reduce RT60; glass share increases it", () => {
  const base = { ...medium, walls: "drywall", floor: "carpet", ceiling: "finished" };
  const r0 = A.estimate(base);
  assert.ok(A.estimate({ ...base, people: 8 }).rtOccupied < r0.rtUnoccupied);
  assert.ok(A.estimate({ ...base, panelAreaM2: 10, panelAlpha: 0.8 }).rtUnoccupied < r0.rtUnoccupied);
  const soft = { ...medium, walls: "soft", floor: "carpet", ceiling: "acoustic" };
  assert.ok(A.estimate({ ...soft, glassWallPct: 100 }).rtUnoccupied > A.estimate(soft).rtUnoccupied);
  // panels can't exceed total wall area, and they also work on glass walls
  const huge = A.estimate({ ...base, panelAreaM2: 1e6, panelAlpha: 0.8 });
  near(huge.parts.panels, 56.7 * 0.8);
  const glassRoom = { ...base, glassWallPct: 100 };
  assert.ok(A.estimate({ ...glassRoom, panelAreaM2: 20, panelAlpha: 0.8 }).rtUnoccupied < A.estimate(glassRoom).rtUnoccupied);
  near(A.estimate({ ...glassRoom, panelAreaM2: 20, panelAlpha: 0.8 }).parts.walls, (56.7 - 20) * 0.035);
});

test("invalid inputs are rejected", () => {
  assert.throws(() => A.estimate({ lengthM: 0, widthM: 3, heightM: 2.7, walls: "drywall", floor: "carpet", ceiling: "acoustic" }));
  assert.throws(() => A.estimate({ ...medium, walls: "cardboard", floor: "carpet", ceiling: "acoustic" }));
  assert.throws(() => A.geometry({ lengthM: NaN, widthM: 3, heightM: 3 }));
});

test("imperial conversion", () => {
  near(A.feetToM(10), 3.048, 1e-9);
  const m = A.estimate({ lengthM: A.feetToM(20), widthM: A.feetToM(15), heightM: A.feetToM(9), walls: "drywall", floor: "carpet", ceiling: "acoustic" });
  near(m.volumeM3, 20 * 15 * 9 * 0.3048 ** 3, 1e-6);
});
