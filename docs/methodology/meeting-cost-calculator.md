# Methodology — Meeting Cost Calculator

Code: `src/tools/meeting/calc.mjs` · Assumptions: `data/tools.json → meeting` · Tests: `tests/meeting.test.mjs` · Last verified: 21 Nov 2026

## Formulas
- hourly cost = salary ÷ (hours per week × working weeks per year) [× on-cost multiplier if "estimated employer cost"]; or the hourly cost entered directly.
- people cost per meeting = attendees × hours × hourly cost
- meetings per year: once 1 · daily 5 × weeks · weekly weeks · fortnightly weeks ÷ 2 · monthly 12 × weeks ÷ 52 · custom n
- annual = per meeting × meetings per year; monthly = annual ÷ 12
- employee-hours = attendees × hours (× meetings per year)
- value threshold = total cost per meeting (and per year)
- licence allocation = licence per user per month × 12 ÷ working hours per year × hours × licensed attendees (video: all; hybrid: remote attendees; in person: 0)
- room allocation = installed cost ÷ (lifecycle years × bookable hours per year × utilisation) × hours (video-only: 0)

## Assumptions & sources
| Item | Default | Source / status |
|---|---|---|
| Working weeks | 46 | Judgement: 52 minus ~6 weeks leave and public holidays (UK statutory 5.6 weeks incl. bank holidays). Editable. |
| Hours per week | 37.5 GBP / 40 USD / 38 EUR | Typical contracted hours. ONS YBUY: 36.6 actual weekly hours, UK full-time, Aug 2026 (released 17 Nov 2026). |
| On-cost multiplier US | 1.4 | BLS ECEC release 9 Sep 2026 (June 2026): wages 70.0% of private-industry compensation → 1.43, rounded down. Verified. |
| On-cost multiplier UK | 1.2 | GOV.UK: employer NI 15% (2025/26, 2026/27); auto-enrolment employer minimum 3%. Simplified sum ≈ 1.18 (ignores thresholds/benefits). |
| On-cost multiplier EUR | 1.3 | **Judgement** — varies widely by country. Flagged in UI. |
| Zoom reference price | US$14.16 /user/month (Workplace Pro, annual) | zoom.us/pricing, checked 21 Nov 2026. Prefilled only for USD. |
| Google Workspace reference | £5.90 /user/month (Business Starter, annual, excl. tax, UK) | workspace.google.com/pricing, checked 21 Nov 2026. Prefilled only for GBP. |
| Microsoft Teams | none | Could not verify list prices (site timed out); bundled in M365. User enters own value. |
| Cisco Webex | none | No published paid per-user price. User enters own value. |
| Room technology costs | £10k / £25k / £50k / £120k (small→boardroom) | **Illustrative planning figures (author's judgement), not market data.** Labelled in UI; editable. |
| Room lifecycle / utilisation / bookable hours | 6 years / 30% / 2,070 h | Confirmed by the site owner (21 Nov 2026); planning assumptions (46 weeks × 5 days × 9 h). Editable. |

The headline annual figure is rounded to ~3 significant figures; detailed figures are not.

## Privacy & sharing
All client-side. Share links ("result-only") carry currency, frequency, attendees, duration and the computed totals — never salary or hourly rate. Inputs are added only if the user ticks "Include my inputs". Analytics (if enabled) receive event names only.

## Edge cases
Attendees 1–1,000; duration 5–600 min; salary 0–10m; multiplier 1–3; weeks 1–52; hours 1–80. Out-of-range values throw in the module; the UI clamps. Tampered share links fall back to safe defaults.

## Limitations
Average cost hides seniority differences; excludes preparation, travel, context switching and the value created by the meeting; technology figures are allocations of shared costs, not marginal costs.
