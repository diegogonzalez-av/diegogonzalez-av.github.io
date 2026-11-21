# Methodology — Conference Room Acoustics Checker

Code: `src/tools/acoustics/calc.mjs` · Tests: `tests/acoustics.test.mjs` · Last verified: 21 Nov 2026

## Formula
Sabine: RT60 = 0.161 × V ÷ A (V m³; A = Σ area × α, m² sabins). Imperial inputs converted to metric (0.3048 m/ft). Status uses the empty-room estimate; the occupied figure adds 0.4 m² per person.
Additional absorption to reach 0.6 s: ΔA = 0.161 V ÷ 0.6 − A. Panel area example = ΔA ÷ panel α (user-entered, default 0.8 flagged as an assumption).

## Targets (confirmed by the site owner, 21 Nov 2026)
| Band | Value | Basis |
|---|---|---|
| Good | ≤ 0.6 s | Aligned with ANSI/ASA S12.60 (rooms < 283 m³) and Microsoft Teams Rooms / Shure recommendations (optimal ≤ 0.5 s for ceiling microphones). Citation supplied by the site owner; the primary documents were not accessible during build. |
| Acceptable / marginal | 0.6–0.8 s | Within the BB93 limit, above the VC target. |
| Poor | > 0.8 s | BB93 (DfE 2015) Table 6, meeting / interviewing / video conference room Tmf ≤ 0.8 s. Verified from the PDF (p.34). Above this, acoustic treatment is required for video conferencing. |
| Background noise (guidance text) | ≤ 40 dB LAeq,30min new build | BB93 Table 1. Verified. |

UI tooltip text (shown under the reverberation bar): "Thresholds: ≤ 0.6 s (Good) is aligned with ANSI/ASA S12.60 (rooms under 283 m³) and with Microsoft Teams Rooms / Shure recommendations, which target ≤ 0.5 s as optimal for ceiling microphones. > 0.8 s (Poor) is based on the upper limit in BB93 (Table 6), above which acoustic treatment is required for video conferencing."

## Absorption coefficients (mean of 500 Hz and 1 kHz) — HyperPhysics table after Hall, Table 15.1
| UI option | α | Basis |
|---|---|---|
| Acoustic ceiling tile | 0.65 | Acoustic tile, suspended 0.6/0.7 |
| Standard finished ceiling | 0.045 | Gypsum wallboard on studs 0.05/0.04 |
| Exposed / hard ceiling | 0.02 | Poured concrete |
| Carpet | 0.275 | Heavy carpet on concrete 0.15/0.4 |
| Vinyl / wood | 0.03 | Vinyl tile on concrete (conservative for wood) |
| Tile / concrete | 0.02 | Poured concrete |
| Walls plasterboard | 0.045 | Gypsum wallboard |
| Walls glass | 0.035 | Heavy plate glass 0.04/0.03 |
| Walls mixed | 0.128 | Blend: 85% plasterboard + 15% soft finish (assumption) |
| Walls acoustic/soft | 0.3225 | Blend: 50% plasterboard + 50% soft finish (assumption) |
| Soft finish proxy | 0.6 | Medium velour drapery 0.5/0.7 (proxy; real panels often higher) |
People: 0.4 m² each (judgement within 0.2–0.5 m², Engineering Toolbox — last-resort source). Furniture excluded (conservative).

## Quick-check presets
Small 3.6 × 3.0 × 2.7 m · Medium 6.0 × 4.5 × 2.7 m · Large 9.0 × 6.0 × 2.8 m. Occupancy 2–4 → 3, 5–8 → 6, 9–12 → 10, 13+ → 14.

## Edge cases
Panels cover the selected wall finish first, then glass, capped at total wall area.
Non-positive/NaN dimensions throw; unknown surfaces throw; panel area capped at available non-glass wall area; glass share 0–100%. Note shown when mean α > 0.3 (Sabine overestimates).

## Limitations
Sabine assumes a diffuse field; ignores low-frequency issues, flutter echo, non-uniform absorption, HVAC noise, product-specific performance and mounting. Not a substitute for an acoustic survey or measured RT60.

## Sources
- https://assets.publishing.service.gov.uk/media/5a8170d3e5274a2e8ab54012/BB93_February_2015.pdf
- https://hyperphysics.gsu.edu/hbase/Acoustic/revmod.html
- https://en.wikipedia.org/wiki/Reverberation · https://en.wikipedia.org/wiki/Sabin_(unit)
