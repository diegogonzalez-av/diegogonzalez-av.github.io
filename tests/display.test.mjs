import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/tools/display/calc.mjs";
const near = (a, b, tol = 1e-3) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test("16:9 geometry", () => {
  const s = C.imageSize(75);
  near(s.heightM, 75 * 0.0254 * 9 / Math.hypot(16, 9));
  near(s.heightM, 0.93394, 1e-4);
  near(s.widthM, 1.66033, 1e-4);
});

test("BDM matches AVIXA relationship: image height = FV / (200 × %EH)", () => {
  near(C.requiredImageHeightM({ mode: "bdm", farthestM: 4.5, elementHeightPct: 3 }), 0.75);
  near(C.maxFarthestM({ mode: "bdm", heightM: 1, elementHeightPct: 3 }), 6);
  const r = C.evaluate({ mode: "bdm", diagonalIn: 75, farthestM: 4.5, elementHeightPct: 3 });
  assert.equal(r.status, "good");
  near(r.recommendedDiagonalIn, 0.75 / C.H_PER_DIAG / 0.0254, 1e-6);
  assert.equal(r.recommendedCommonSizeIn, 65);
});

test("ADM matches AVIXA relationship: FV = IH × 3438 / vertical resolution", () => {
  near(C.requiredImageHeightM({ mode: "adm", farthestM: 3.438, verticalLines: 1080 }), 1.08);
  near(C.maxFarthestM({ mode: "adm", heightM: 1.08, verticalLines: 1080 }), 3.438);
  // 4K content needs twice the image height of 1080p at the same distance
  const a = C.requiredImageHeightM({ mode: "adm", farthestM: 5, verticalLines: 1080 });
  const b = C.requiredImageHeightM({ mode: "adm", farthestM: 5, verticalLines: 2160 });
  near(b / a, 2);
});

test("status bands for BDM/ADM", () => {
  // exactly at requirement → good; 95% → warn; 80% → poor
  const reqDiag = (fv) => C.heightToDiagonalIn(C.requiredImageHeightM({ mode: "bdm", farthestM: fv, elementHeightPct: 3 }));
  const fv = 6;
  assert.equal(C.evaluate({ mode: "bdm", farthestM: fv, diagonalIn: Math.ceil(reqDiag(fv)) }).status, "good");
  assert.equal(C.evaluate({ mode: "bdm", farthestM: fv, diagonalIn: reqDiag(fv) * 0.95 }).status, "warn");
  assert.equal(C.evaluate({ mode: "bdm", farthestM: fv, diagonalIn: reqDiag(fv) * 0.8 }).status, "poor");
});

test("video mode uses FAA HFDS 2:1–8:1 distance-to-diagonal ratio", () => {
  assert.equal(C.evaluate({ mode: "video", diagonalIn: 75, farthestM: 4.5 }).status, "good");   // 2.36
  const w = C.evaluate({ mode: "video", diagonalIn: 43, farthestM: 4.5 });                       // 4.12
  assert.equal(w.status, "warn"); assert.equal(w.reason, "workable");
  assert.equal(C.evaluate({ mode: "video", diagonalIn: 32, farthestM: 8 }).status, "poor");     // 9.8
  const c = C.evaluate({ mode: "video", diagonalIn: 100, farthestM: 2 });                        // 0.79
  assert.equal(c.reason, "too-close");
  near(C.evaluate({ mode: "video", diagonalIn: 75, farthestM: 4 }).recommendedDiagonalIn, 1 / 0.0254, 1e-6);
});

test("closest viewer: 30° upward limit and half image width", () => {
  const s = C.imageSize(75);
  near(C.closestViewerM({ ...s, bottomOfImageM: 1.0, eyeHeightM: 1.2 }), 1.732 * (s.heightM - 0.2));
  // image entirely below eye level → half-width rule governs
  near(C.closestViewerM({ ...s, bottomOfImageM: 0, eyeHeightM: 1.5 }), s.widthM / 2);
  const r = C.evaluate({ mode: "bdm", diagonalIn: 98, farthestM: 1.5 });
  assert.equal(r.reason, "too-close");
});

test("min/max slider extremes produce finite results", () => {
  for (const mode of ["bdm", "adm", "video"]) for (const d of [32, 165]) for (const f of [1, 15]) {
    const r = C.evaluate({ mode, diagonalIn: d, farthestM: f });
    for (const v of [r.recommendedDiagonalIn, r.maxFarthestM, r.closestViewerM, r.viewingRatio]) assert.ok(Number.isFinite(v));
  }
});

test("invalid inputs are rejected", () => {
  assert.throws(() => C.imageSize(0));
  assert.throws(() => C.imageSize(NaN));
  assert.throws(() => C.evaluate({ farthestM: -1 }));
  assert.throws(() => C.evaluate({ mode: "nope" }));
  assert.throws(() => C.evaluate({ mode: "bdm", elementHeightPct: 0 }));
  assert.throws(() => C.evaluate({ mode: "adm", verticalLines: 0 }));
});

test("metric/imperial conversion", () => {
  near(C.ftToM(10), 3.048, 1e-9);
  near(C.mToFt(C.ftToM(17.5)), 17.5, 1e-9);
  near(C.INCH_M * 12, C.FOOT_M, 1e-12);
});

test("common sizes", () => {
  assert.equal(C.nextCommonSize(60.2), 65);
  assert.equal(C.nextCommonSize(65), 65);
  assert.equal(C.nextCommonSize(300), null);
});

test("home mode uses viewing angle (30° SMPTE / 40° THX)", () => {
  // 65" (1.443 m wide) at 2.69 m subtends 30°
  const w = C.imageSize(65).widthM;
  near(C.viewingAngleDeg(w, w / (2 * Math.tan(Math.PI / 12))), 30, 1e-9);
  near(C.requiredWidthForAngle(3, 40), 2 * 3 * Math.tan((20 * Math.PI) / 180), 1e-12);
  const d30 = C.evaluate({ mode: "home", angleDeg: 30, farthestM: 3, diagonalIn: 75 });
  const d40 = C.evaluate({ mode: "home", angleDeg: 40, farthestM: 3, diagonalIn: 75 });
  assert.ok(d40.recommendedDiagonalIn > d30.recommendedDiagonalIn);
  near(d30.recommendedDiagonalIn, C.requiredWidthForAngle(3, 30) / C.W_PER_DIAG / 0.0254, 1e-6);
  assert.equal(C.evaluate({ mode: "home", angleDeg: 30, farthestM: 3, diagonalIn: 65 }).status, "poor");   // 1.44 m wide < 1.61 m needed (89%)
  assert.equal(C.evaluate({ mode: "home", angleDeg: 30, farthestM: 3, diagonalIn: 75 }).status, "good");
  near(C.maxFarthestM({ mode: "home", heightM: C.imageSize(75).heightM, angleDeg: 30 }), C.imageSize(75).widthM / (2 * Math.tan(Math.PI / 12)), 1e-9);
  assert.throws(() => C.requiredWidthForAngle(3, 0));
});
