# Methodology — AV Display Size & Viewing Distance Calculator

Code: `src/tools/display/calc.mjs` · Tests: `tests/display.test.mjs` · Last verified: 21 Nov 2026

## Verdict on the original (Gemini) prototype
The prototype labelled its maths "AVIXA DISCAS" but used max viewing distance = 4×/6×/8× image height and min = 1.5–2× image height. That is the legacy **4-6-8 rule of thumb**, not DISCAS. It also carried affiliate-link and "Book consultation" placeholders. Both were removed; the UX ideas (sliders, instant status, visual range bar) were kept; the site is English-only.

## Formulas
| Mode | Formula | Source | Status |
|---|---|---|---|
| Presentations & documents (BDM) | image height = farthest viewer ÷ (200 × element height fraction) | AVIXA DISCAS calculator JS (`bdmCalculator.js`: `acuityFactor:200`, `imageHeight = i/(e*200)*100`) and AVIXA page "Analytical and Basic Decision Making calculations" | Standards-based |
| Fine detail (ADM) | image height = farthest viewer × vertical resolution ÷ 3438 | AVIXA DISCAS calculator JS (`admCalculator.js`, acuity factor 3438 ≈ arcminutes per radian, i.e. 1 px per arcminute) | Standards-based |
| Closest viewer | 1.732 × (image height + bottom of image − eye height) | AVIXA DISCAS calculator JS (`closestViewer = 1.732 × …`), i.e. 30° upward limit | Standards-based |
| Closest viewer (lower bound) | ≥ image width ÷ 2 | FAA HFDS DOT/FAA/TC-07/11 §5.2.2.3 ("not closer … than 1/2 the display width or height") | Human-factors standard |
| Video & conferencing | 2 ≤ distance ÷ diagonal ≤ 8, optimum 4 | FAA HFDS §5.2.3.3 | Rule of thumb for this use (general displays, not VC-specific) |
| Home cinema & TV | screen width = 2 × distance × tan(angle ÷ 2); 30° (widely attributed to SMPTE) or 40° (THX) | Wikipedia "Optimum HDTV viewing distance" (secondary; no primary SMPTE document located) | Commonly quoted guideline |
| 16:9 geometry | H = D × 9/√337 (0.4903), W = D × 16/√337 (0.8716) | Geometry | Exact |

AVIXA's site cites the current edition as ANSI/AVIXA V202.01:2026. Standard text/tables are not reproduced; only the relationships, which AVIXA publishes in its free calculator.

## Assumptions (design choices, not standards)
- Element height default 3% (options 2/3/4%). DISCAS leaves %EH to the designer.
- Warning band: display within 10% of the required image height.
- Mounting defaults: bottom of image 1.0 m; eye height 1.2 m seated / 1.5 m standing (AVIXA suggests 1200 mm / 1500 mm).
- Common sizes list: 32, 43, 50, 55, 65, 75, 85, 98, 110, 136, 163, 220″.

## Units & edge cases
Inputs in inches/metres; imperial converted with 0.3048 m/ft (exact). Slider ranges 32–165″, 1–15 m (3–50 ft); the module accepts 24–220″ and 0.5–30 m. Zero/negative/NaN inputs throw. If the farthest viewer sits inside the closest-viewer limit the status becomes "too close".

## Limitations
Not a DISCAS conformance assessment (no contrast, horizontal angles, content audit). Video mode has no VC-specific standard behind it. Ignores brightness, glare, ambient light, camera position and multiple displays.

## Sources
- https://www.avixa.org/resources/display-image-size-calculators/analytical-and-basic-decision-making-calculations
- https://app.avixa.org/assets/js/bdmCalculator.js?v=5 · https://app.avixa.org/assets/js/admCalculator.js
- https://hf.tc.faa.gov/hfds/download-hfds/hfds_pdfs/dot_faa_tc_07_11.pdf
