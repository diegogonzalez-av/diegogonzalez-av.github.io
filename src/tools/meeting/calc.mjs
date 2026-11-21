// Meeting Cost Calculator — pure calculation module (browser + Node).
// Methodology: docs/methodology/meeting-cost-calculator.md
//
// People cost is time × hourly cost. Technology is shown separately as an
// ALLOCATED estimate (licences spread over working hours; room equipment spread
// over its lifecycle and actual use). Neither is money spent "per click".

export const CURRENCIES = {
  GBP: { symbol: "£", locale: "en-GB" },
  USD: { symbol: "$", locale: "en-US" },
  EUR: { symbol: "€", locale: "de-DE" }
};

export const DEFAULTS = {
  attendees: 6,
  durationMin: 60,
  rateMode: "salary",        // "salary" | "hourly"
  annualSalary: 55000,
  hourlyRate: 30,
  currency: "GBP",
  costBasis: "salary",       // "salary" | "loaded"
  loadedMultiplier: 1.3,
  hoursPerWeek: 37.5,
  workingWeeksPerYear: 46,   // 52 weeks minus ~6 weeks of leave and public holidays
  frequency: "weekly",
  customPerYear: 24,
  tech: null                 // optional, see techAllocation()
};

export const LIMITS = {
  attendees: [1, 1000],
  durationMin: [5, 600],
  annualSalary: [0, 10_000_000],
  hourlyRate: [0, 10_000],
  loadedMultiplier: [1, 3],
  hoursPerWeek: [1, 80],
  workingWeeksPerYear: [1, 52],
  customPerYear: [0, 2000]
};

export const FREQUENCIES = ["once", "daily", "weekly", "fortnightly", "monthly", "custom"];

const isNum = (v) => typeof v === "number" && Number.isFinite(v);
function num(v, name, [lo, hi]) {
  if (!isNum(v)) throw new RangeError(`${name} must be a number`);
  if (v < lo || v > hi) throw new RangeError(`${name} must be between ${lo} and ${hi}`);
  return v;
}

export function workingHoursPerYear({ hoursPerWeek, workingWeeksPerYear }) {
  return hoursPerWeek * workingWeeksPerYear;
}

/** Number of occurrences per year for a frequency, consistent with the working-weeks assumption. */
export function occurrencesPerYear(frequency, { workingWeeksPerYear, customPerYear } = DEFAULTS) {
  switch (frequency) {
    case "once": return 1;
    case "daily": return 5 * workingWeeksPerYear;
    case "weekly": return workingWeeksPerYear;
    case "fortnightly": return workingWeeksPerYear / 2;
    case "monthly": return 12 * (workingWeeksPerYear / 52);
    case "custom": return customPerYear;
    default: throw new RangeError(`unknown frequency: ${frequency}`);
  }
}

export function hourlyCost(p) {
  const base = p.rateMode === "hourly" ? p.hourlyRate : p.annualSalary / workingHoursPerYear(p);
  return p.costBasis === "loaded" ? base * p.loadedMultiplier : base;
}

/**
 * Technology allocation for one meeting.
 * tech = {
 *   meetingType: "in-person" | "video" | "hybrid",
 *   licencePerUserMonth: number (0 = already covered / ignore),
 *   licensedAttendees?: number (defaults to all attendees for video, remote attendees for hybrid),
 *   remoteAttendees?: number (hybrid only),
 *   roomInstalledCost: number (0 = no room system),
 *   roomLifecycleYears: number, roomUtilisation: 0..1, roomBookableHoursPerYear: number
 * }
 */
export function techAllocation(tech, p) {
  if (!tech) return { licence: 0, room: 0, total: 0 };
  const hours = p.durationMin / 60;
  const yearHours = workingHoursPerYear(p);
  let licence = 0;
  if (tech.meetingType !== "in-person" && tech.licencePerUserMonth > 0) {
    let users = p.attendees;
    if (tech.meetingType === "hybrid") users = Math.min(p.attendees, Math.max(0, tech.remoteAttendees ?? p.attendees));
    if (isNum(tech.licensedAttendees)) users = Math.min(p.attendees, Math.max(0, tech.licensedAttendees));
    licence = (tech.licencePerUserMonth * 12 / yearHours) * hours * users;
  }
  let room = 0;
  if (tech.meetingType !== "video" && tech.roomInstalledCost > 0) {
    const usedHours = tech.roomLifecycleYears * tech.roomBookableHoursPerYear * tech.roomUtilisation;
    if (usedHours > 0) room = (tech.roomInstalledCost / usedHours) * hours;
  }
  return { licence, room, total: licence + room };
}

export function calculate(input = {}) {
  const p = { ...DEFAULTS, ...input };
  if (!CURRENCIES[p.currency]) throw new RangeError(`unsupported currency: ${p.currency}`);
  if (!FREQUENCIES.includes(p.frequency)) throw new RangeError(`unknown frequency: ${p.frequency}`);
  num(p.attendees, "attendees", LIMITS.attendees);
  num(p.durationMin, "duration", LIMITS.durationMin);
  num(p.hoursPerWeek, "hours per week", LIMITS.hoursPerWeek);
  num(p.workingWeeksPerYear, "working weeks", LIMITS.workingWeeksPerYear);
  if (p.rateMode === "hourly") num(p.hourlyRate, "hourly rate", LIMITS.hourlyRate);
  else num(p.annualSalary, "salary", LIMITS.annualSalary);
  if (p.costBasis === "loaded") num(p.loadedMultiplier, "loaded multiplier", LIMITS.loadedMultiplier);
  if (p.frequency === "custom") num(p.customPerYear, "meetings per year", LIMITS.customPerYear);

  const rate = hourlyCost(p);
  const hours = p.durationMin / 60;
  const perYear = occurrencesPerYear(p.frequency, p);
  const peoplePerMeeting = rate * hours * p.attendees;
  const tech = techAllocation(p.tech, p);
  const totalPerMeeting = peoplePerMeeting + tech.total;
  const employeeHoursPerMeeting = hours * p.attendees;
  const recurring = p.frequency !== "once";

  return {
    currency: p.currency,
    hourlyCostPerPerson: rate,
    occurrencesPerYear: perYear,
    recurring,
    peoplePerMeeting,
    techPerMeeting: tech.total,
    licencePerMeeting: tech.licence,
    roomPerMeeting: tech.room,
    totalPerMeeting,
    annualPeople: peoplePerMeeting * perYear,
    annualTech: tech.total * perYear,
    annualTotal: totalPerMeeting * perYear,
    monthlyTotal: (totalPerMeeting * perYear) / 12,
    employeeHoursPerMeeting,
    annualEmployeeHours: employeeHoursPerMeeting * perYear,
    workingDaysPerYear: (employeeHoursPerMeeting * perYear) / (p.hoursPerWeek / 5),
    // Value the meeting needs to create to cover its estimated cost
    valueThresholdPerMeeting: totalPerMeeting,
    valueThresholdAnnual: totalPerMeeting * perYear
  };
}

export function formatMoney(value, currency, { compact = false, decimals } = {}) {
  const c = CURRENCIES[currency] ?? CURRENCIES.GBP;
  const d = decimals ?? (Math.abs(value) >= 100 ? 0 : 2);
  return new Intl.NumberFormat(c.locale === "de-DE" ? "en-IE" : c.locale, {
    style: "currency", currency, maximumFractionDigits: d, minimumFractionDigits: d,
    notation: compact ? "compact" : "standard"
  }).format(value);
}

/** Rounds a headline figure to a believable precision (~3 significant figures). */
export function roundHeadline(value) {
  if (!isNum(value) || value <= 0) return 0;
  const mag = Math.pow(10, Math.max(0, Math.floor(Math.log10(value)) - 2));
  return Math.round(value / mag) * mag;
}

// ---- Share-state encoding (no server, nothing stored) ----
// "Result-only" links never contain salary/rate. Full links are opt-in.
export function encodeShare(r, p, { includeInputs = false } = {}) {
  const q = new URLSearchParams();
  q.set("r", "1");
  q.set("c", p.currency);
  q.set("f", p.frequency);
  q.set("n", String(p.attendees));
  q.set("d", String(p.durationMin));
  q.set("pm", String(Math.round(r.totalPerMeeting)));
  q.set("py", String(Math.round(r.annualTotal)));
  q.set("h", String(Math.round(r.annualEmployeeHours)));
  if (p.frequency === "custom") q.set("cy", String(p.customPerYear));
  if (includeInputs) {
    q.set("rm", p.rateMode);
    if (p.rateMode === "hourly") q.set("hr", String(p.hourlyRate)); else q.set("s", String(p.annualSalary));
    q.set("cb", p.costBasis);
    if (p.costBasis === "loaded") q.set("lm", String(p.loadedMultiplier));
    q.set("hw", String(p.hoursPerWeek));
    q.set("ww", String(p.workingWeeksPerYear));
  }
  return q.toString();
}

export function decodeShare(search) {
  const q = new URLSearchParams(search);
  if (q.get("r") !== "1") return null;
  const n = (k) => { const v = Number(q.get(k)); return Number.isFinite(v) ? v : undefined; };
  const currency = CURRENCIES[q.get("c")] ? q.get("c") : "GBP";
  const frequency = FREQUENCIES.includes(q.get("f")) ? q.get("f") : "weekly";
  const shared = { currency, frequency, attendees: n("n"), durationMin: n("d"), perMeeting: n("pm"), perYear: n("py"), hours: n("h"), customPerYear: n("cy") };
  const inputs = {};
  if (q.has("rm")) {
    inputs.rateMode = q.get("rm") === "hourly" ? "hourly" : "salary";
    if (q.has("hr")) inputs.hourlyRate = n("hr");
    if (q.has("s")) inputs.annualSalary = n("s");
    inputs.costBasis = q.get("cb") === "loaded" ? "loaded" : "salary";
    if (q.has("lm")) inputs.loadedMultiplier = n("lm");
    if (q.has("hw")) inputs.hoursPerWeek = n("hw");
    if (q.has("ww")) inputs.workingWeeksPerYear = n("ww");
  }
  return { shared, inputs, hasInputs: q.has("rm") };
}
