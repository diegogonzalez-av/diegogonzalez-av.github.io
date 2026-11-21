import test from "node:test";
import assert from "node:assert/strict";
import * as M from "../src/tools/meeting/calc.mjs";
const near = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} ≉ ${b}`);

test("default weekly meeting", () => {
  const r = M.calculate({});
  near(r.hourlyCostPerPerson, 55000 / (37.5 * 46));
  near(r.peoplePerMeeting, 6 * 55000 / 1725);
  assert.equal(r.occurrencesPerYear, 46);
  near(r.annualTotal, r.peoplePerMeeting * 46);
  near(r.monthlyTotal, r.annualTotal / 12);
  assert.equal(r.employeeHoursPerMeeting, 6);
  assert.equal(r.annualEmployeeHours, 276);
  near(r.valueThresholdPerMeeting, r.totalPerMeeting);
});

test("hourly rate and loaded cost", () => {
  const r = M.calculate({ rateMode: "hourly", hourlyRate: 40, attendees: 10, durationMin: 30, frequency: "once" });
  near(r.totalPerMeeting, 200);
  assert.equal(r.recurring, false);
  near(r.annualTotal, 200);
  const l = M.calculate({ rateMode: "hourly", hourlyRate: 40, attendees: 10, durationMin: 30, costBasis: "loaded", loadedMultiplier: 1.4 });
  near(l.peoplePerMeeting, 280);
});

test("frequencies follow the working-weeks assumption", () => {
  const o = { workingWeeksPerYear: 46, customPerYear: 17 };
  assert.equal(M.occurrencesPerYear("once", o), 1);
  assert.equal(M.occurrencesPerYear("daily", o), 230);
  assert.equal(M.occurrencesPerYear("weekly", o), 46);
  assert.equal(M.occurrencesPerYear("fortnightly", o), 23);
  near(M.occurrencesPerYear("monthly", o), 12 * 46 / 52, 1e-9);
  assert.equal(M.occurrencesPerYear("custom", o), 17);
  assert.throws(() => M.occurrencesPerYear("hourly", o));
});

test("technology allocation is separate and documented", () => {
  const base = { attendees: 8, durationMin: 60, frequency: "weekly" };
  const video = M.calculate({ ...base, tech: { meetingType: "video", licencePerUserMonth: 14.16, roomInstalledCost: 25000, roomLifecycleYears: 6, roomUtilisation: 0.3, roomBookableHoursPerYear: 2070 } });
  near(video.licencePerMeeting, 14.16 * 12 / 1725 * 1 * 8, 1e-6);
  assert.equal(video.roomPerMeeting, 0); // video-only meetings don't use a room system
  const room = M.calculate({ ...base, tech: { meetingType: "in-person", licencePerUserMonth: 14.16, roomInstalledCost: 25000, roomLifecycleYears: 6, roomUtilisation: 0.3, roomBookableHoursPerYear: 2070 } });
  assert.equal(room.licencePerMeeting, 0);
  near(room.roomPerMeeting, 25000 / (6 * 2070 * 0.3), 1e-6);
  const hybrid = M.calculate({ ...base, tech: { meetingType: "hybrid", remoteAttendees: 3, licencePerUserMonth: 10, roomInstalledCost: 0, roomLifecycleYears: 6, roomUtilisation: 0.3, roomBookableHoursPerYear: 2070 } });
  near(hybrid.licencePerMeeting, 10 * 12 / 1725 * 3, 1e-6);
  near(hybrid.totalPerMeeting, hybrid.peoplePerMeeting + hybrid.techPerMeeting, 1e-9);
});

test("minimum and maximum inputs", () => {
  const min = M.calculate({ attendees: 1, durationMin: 5, annualSalary: 0, frequency: "once" });
  assert.equal(min.totalPerMeeting, 0);
  const max = M.calculate({ attendees: 1000, durationMin: 600, annualSalary: 10_000_000, frequency: "daily" });
  assert.ok(Number.isFinite(max.annualTotal) && max.annualTotal > 0);
});

test("invalid inputs are rejected", () => {
  assert.throws(() => M.calculate({ attendees: 0 }));
  assert.throws(() => M.calculate({ attendees: NaN }));
  assert.throws(() => M.calculate({ durationMin: 0 }));
  assert.throws(() => M.calculate({ annualSalary: -1 }));
  assert.throws(() => M.calculate({ currency: "JPY" }));
  assert.throws(() => M.calculate({ frequency: "yearly" }));
  assert.throws(() => M.calculate({ costBasis: "loaded", loadedMultiplier: 5 }));
});

test("currency handling", () => {
  assert.equal(M.formatMoney(47834, "GBP"), "£47,834");
  assert.equal(M.formatMoney(47834, "USD"), "$47,834");
  assert.ok(M.formatMoney(47834, "EUR").includes("€"));
  assert.equal(M.formatMoney(12.5, "GBP"), "£12.50");
  // Currency does not change the maths
  near(M.calculate({ currency: "USD" }).annualTotal, M.calculate({ currency: "GBP" }).annualTotal, 1e-9);
});

test("headline rounding", () => {
  assert.equal(M.roundHeadline(47834), 47800);
  assert.equal(M.roundHeadline(1234567), 1230000);
  assert.equal(M.roundHeadline(87.4), 87);
  assert.equal(M.roundHeadline(0), 0);
});

test("share links: result-only by default, inputs opt-in", () => {
  const p = { ...M.DEFAULTS, annualSalary: 72000 };
  const r = M.calculate(p);
  const plain = M.encodeShare(r, p);
  assert.ok(!plain.includes("72000") && !/(^|&)s=/.test(plain), "salary must not leak");
  const d = M.decodeShare("?" + plain);
  assert.equal(d.hasInputs, false);
  assert.equal(d.shared.perYear, Math.round(r.annualTotal));
  const full = M.encodeShare(r, p, { includeInputs: true });
  const d2 = M.decodeShare("?" + full);
  assert.equal(d2.inputs.annualSalary, 72000);
  assert.equal(M.decodeShare("?foo=1"), null);
  // Tampered values fall back safely
  const bad = M.decodeShare("?r=1&c=XXX&f=hourly&n=abc");
  assert.equal(bad.shared.currency, "GBP");
  assert.equal(bad.shared.frequency, "weekly");
  assert.equal(bad.shared.attendees, undefined);
});
