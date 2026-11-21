import { seg, i18nAttr as i, toolShell } from "./tools.mjs";
import S from "../tools/acoustics/strings.mjs";
import { BASE, WALLS, FLOORS, CEILINGS, PERSON_SABINS, ROOM_PRESETS, TARGETS } from "../tools/acoustics/calc.mjs";

const f2 = (x) => x.toFixed(2).replace(/0$/, "");

export function acousticsTool(cfg, data) {
  const t = S.en;
  const surfaces = (prefix = "") => `
    <fieldset class="field">
      <legend ${i(t, "wallsLegend")}</legend>
      ${seg(prefix + "walls", [{ value: "soft", key: "wSoft" }, { value: "drywall", key: "wDrywall" }, { value: "mixed", key: "wMixed" }, { value: "glass", key: "wGlass" }], t, { checked: "drywall", cols: 2, cls: "seg--2up" })}
    </fieldset>
    <fieldset class="field">
      <legend ${i(t, "floorLegend")}</legend>
      ${seg(prefix + "floor", [{ value: "carpet", key: "fCarpet" }, { value: "vinyl", key: "fVinyl" }, { value: "hard", key: "fHard" }], t, { checked: "carpet" })}
    </fieldset>
    <fieldset class="field">
      <legend ${i(t, "ceilingLegend")}</legend>
      ${seg(prefix + "ceiling", [{ value: "acoustic", key: "cAcoustic" }, { value: "finished", key: "cFinished" }, { value: "exposed", key: "cExposed" }], t, { checked: "acoustic" })}
    </fieldset>`;

  const dims = (k) => `<div class="field"><label class="field__label" for="${k}"><span ${i(t, k)}</span></label><div class="input-affix"><input type="number" id="${k}" step="0.1" min="1" max="60" inputmode="decimal"><span class="len-unit">m</span></div></div>`;

  const calcHtml = `
<form class="calc" id="acoustics-calc" novalidate onsubmit="return false">
  <div class="calc__inputs">
    <fieldset class="field">
      <legend ${i(t, "modeLegend")}</legend>
      ${seg("amode", [{ value: "quick", key: "modeQuick", sub: "modeQuickSub" }, { value: "advanced", key: "modeAdv", sub: "modeAdvSub" }], t, { checked: "quick", cols: 2, cls: "seg--2up" })}
    </fieldset>

    <fieldset class="field" id="size-field">
      <legend ${i(t, "sizeLegend")}</legend>
      ${seg("size", [{ value: "small", key: "sizeSmall", sub: "sizeSmallSub" }, { value: "medium", key: "sizeMedium", sub: "sizeMediumSub" }, { value: "large", key: "sizeLarge", sub: "sizeLargeSub" }], t, { checked: "medium" })}
    </fieldset>

    <div id="dims-field" hidden>
      <div class="field" style="margin-bottom:14px">
        <div class="field__label"><span ${i(t, "units")}</span>
          <span class="unit-toggle" role="group" aria-label="Units">
            <button type="button" data-units="metric" aria-pressed="true" ${i(t, "metric")}</button>
            <button type="button" data-units="imperial" aria-pressed="false" ${i(t, "imperial")}</button>
          </span>
        </div>
      </div>
      <div class="row-2" style="grid-template-columns:repeat(3,1fr)">${dims("length")}${dims("width")}${dims("height")}</div>
    </div>

    ${surfaces()}

    <fieldset class="field">
      <legend ${i(t, "occLegend")}</legend>
      <div class="seg seg--keep" style="--cols:4">
        ${["2-4", "5-8", "9-12", "13+"].map((o) => `<label><input type="radio" name="occ" value="${o}"${o === "5-8" ? " checked" : ""}><span>${o.replace("-", "–")}</span></label>`).join("")}
      </div>
    </fieldset>

    <div id="adv-extra" hidden>
      <div class="field" style="margin-bottom:20px">
        <label class="field__label" for="glass"><span ${i(t, "glassPct")}</span><span class="field__value"><output id="glass-out">0</output><small>%</small></span></label>
        <input type="range" id="glass" min="0" max="100" step="5" value="0">
        <p class="note" ${i(t, "glassHint")}</p>
      </div>
      <div class="row-2">
        <div class="field"><label class="field__label" for="panels"><span ${i(t, "panels")}</span></label><div class="input-affix"><input type="number" id="panels" min="0" max="500" step="0.5" value="0" inputmode="decimal"><span class="area-unit">m²</span></div></div>
        <div class="field"><label class="field__label" for="alpha"><span ${i(t, "panelAlpha")}</span></label><input type="number" id="alpha" min="0.1" max="1.2" step="0.05" value="0.8" inputmode="decimal"></div>
      </div>
      <p class="note" ${i(t, "panelAlphaHint")}</p>
    </div>
  </div>

  <div class="calc__result" aria-live="polite">
    <div class="status" id="status">
      <span class="status__icon" id="status-icon"></span>
      <span class="status__label" id="status-label"></span>
      <p class="status__title" id="status-title"></p>
      <p class="status__text" id="status-text"></p>
    </div>
    <div class="big-result">
      <p class="big-result__kicker" ${i(t, "rtLabel")}</p>
      <p class="big-result__value" id="rt">–</p>
      <p class="big-result__sentence" id="rt-people"></p>
    </div>
    <div class="range-viz">
      <div class="range-viz__head"><span ${i(t, "targetBar")}</span>
        <span class="range-viz__legend"><span><i style="background:var(--good)"></i><span ${i(t, "zoneGood")}</span></span><span><i style="background:var(--warn)"></i><span ${i(t, "zoneWarn")}</span></span><span><i style="background:var(--poor)"></i><span ${i(t, "zonePoor")}</span></span></span>
      </div>
      <div class="range-viz__track" aria-hidden="true" style="background:linear-gradient(90deg, rgba(30,123,79,.2) 0 ${(TARGETS.good / 2) * 100}%, rgba(143,86,0,.2) ${(TARGETS.good / 2) * 100}% ${(TARGETS.limit / 2) * 100}%, rgba(180,35,24,.16) ${(TARGETS.limit / 2) * 100}% 100%)">
        <div class="range-viz__marker" id="rt-marker"></div>
      </div>
      <div class="range-viz__scale" aria-hidden="true"><span>0</span><span>0.4</span><span>0.8</span><span>1.2</span><span>1.6</span><span>2.0+</span></div>
      <p class="note" style="margin-top:10px" ${i(t, "targetNote")}</p>
    </div>
    <dl class="metrics">
      <div><dt ${i(t, "mVolume")}</dt><dd id="m-volume">–</dd></div>
      <div><dt ${i(t, "mAbsorption")}</dt><dd id="m-abs">–</dd></div>
      <div style="grid-column:1/-1"><dt ${i(t, "mNeeded")}</dt><dd><span id="m-needed">–</span><small id="m-panels"></small></dd></div>
    </dl>
    <div>
      <h3 style="font-size:1rem;margin-bottom:8px" ${i(t, "guidanceTitle")}</h3>
      <ul id="guidance" style="margin:0;padding-left:1.1em;font-size:.95rem;color:#2B3644"></ul>
    </div>
    <p class="note" id="sabine-note" hidden ${i(t, "sabineNote")}</p>
    <p class="note"><strong ${i(t, "disclaimer")}</strong></p>
    <div><button type="button" class="btn btn--ghost btn--sm" id="copy-link" ${i(t, "copyLink")}</button></div>
  </div>
</form>`;

  const row = (name, a, note) => `<tr><td>${name}</td><td>${f2(a)}</td><td>${note}</td></tr>`;
  const methodHtml = `
        <details open>
          <summary><span>What this calculates</span></summary>
          <div class="method__body">
            <div>
              <p>Reverberation time (RT60) is how long sound takes to fade by 60 dB after the source stops. Too much of it makes speech blur together, and room microphones pick it up and send it to everyone on the call.</p>
              <p>The tool estimates RT60 with the Sabine equation from the room volume and the absorption of its surfaces, then compares the result with published guidance for meeting and video conference rooms.</p>
            </div>
          </div>
        </details>
        <details>
          <summary><span>Formula &amp; targets</span></summary>
          <div class="method__body">
            <code class="formula">RT60 = 0.161 × V ÷ A      V = volume (m³), A = Σ (surface area × absorption coefficient) (m²)</code>
            <p>Imperial inputs are converted to metric before calculating.</p>
            <ul>
              <li><strong>Good: ${TARGETS.good} s or less.</strong> Aligned with ANSI/ASA S12.60 (rooms under 283 m³) and with Microsoft Teams Rooms / Shure recommendations, which target ≤ 0.5 s as optimal for ceiling microphones.</li>
              <li><strong>Acceptable / marginal: ${TARGETS.good}–${TARGETS.limit} s.</strong> Within the BB93 limit for meeting and video conference rooms, but above the target for good video-conference audio.</li>
              <li><strong>Poor: above ${TARGETS.limit} s.</strong> Based on the upper limit in BB93 (UK Department for Education, 2015), Table 6, for “meeting room, interviewing/counselling room, video conference room”, above which acoustic treatment is required for video conferencing.</li>
            </ul>
            <p>The status uses the <strong>empty-room</strong> estimate, as BB93 measures unoccupied rooms. The figure with people is shown for information only.</p>
            <p>Additional absorption is the extra absorption area needed to bring the Sabine estimate down to ${TARGETS.good} s: <code>0.161 × V ÷ ${TARGETS.good} − A</code>. Divide by a product's rated absorption coefficient to estimate panel area.</p>
          </div>
        </details>
        <details>
          <summary><span>Absorption coefficients &amp; assumptions</span></summary>
          <div class="method__body">
            <p>Mid-frequency values are the mean of the 500 Hz and 1 kHz coefficients in the HyperPhysics table (after Hall). BB93 averages 500 Hz, 1 kHz and 2 kHz, so the two are close but not identical.</p>
            <table>
              <thead><tr><th>Option</th><th>α</th><th>Basis</th></tr></thead>
              <tbody>
                ${row("Acoustic ceiling tile", CEILINGS.acoustic.alpha, "Acoustic tile, suspended (0.6 / 0.7)")}
                ${row("Standard finished ceiling", CEILINGS.finished.alpha, "Gypsum wallboard on studs (0.05 / 0.04)")}
                ${row("Exposed / hard ceiling", CEILINGS.exposed.alpha, "Poured concrete (0.02 / 0.02)")}
                ${row("Carpet", FLOORS.carpet.alpha, "Heavy carpet on concrete (0.15 / 0.4)")}
                ${row("Vinyl / wood", FLOORS.vinyl.alpha, "Vinyl tile on concrete (0.03 / 0.03), conservative for wood")}
                ${row("Tile / concrete", FLOORS.hard.alpha, "Poured concrete (0.02 / 0.02)")}
                ${row("Walls: plasterboard / plaster", WALLS.drywall.alpha, "Gypsum wallboard on studs")}
                ${row("Walls: glass / hard", WALLS.glass.alpha, "Heavy plate glass (0.04 / 0.03)")}
                ${row("Walls: mixed", WALLS.mixed.alpha, "Assumes 85% plasterboard, 15% soft finishes")}
                ${row("Walls: acoustic / soft", WALLS.soft.alpha, "Assumes 50% plasterboard, 50% soft finishes")}
                ${row("Soft finish (proxy)", BASE.softFinish, "Medium velour drapery (0.5 / 0.7). Purpose-made acoustic panels are often more absorptive; check datasheets")}
              </tbody>
            </table>
            <ul>
              <li>Quick-check room sizes: small ${ROOM_PRESETS.small.lengthM} × ${ROOM_PRESETS.small.widthM} × ${ROOM_PRESETS.small.heightM} m, medium ${ROOM_PRESETS.medium.lengthM} × ${ROOM_PRESETS.medium.widthM} × ${ROOM_PRESETS.medium.heightM} m, large ${ROOM_PRESETS.large.lengthM} × ${ROOM_PRESETS.large.widthM} × ${ROOM_PRESETS.large.heightM} m.</li>
              <li>People add about ${PERSON_SABINS} m² of absorption each, a mid-range value within commonly published figures of 0.2 to 0.5 m².</li>
              <li>Furniture is not included, which makes the estimate slightly conservative, meaning it tends to read high.</li>
            </ul>
          </div>
        </details>
        <details>
          <summary><span>Limitations</span></summary>
          <div class="method__body">
            <div><ul>
              <li>Sabine assumes sound is spread evenly through the room. Very absorptive rooms, odd shapes and rooms with all the absorption on one surface behave differently. Sabine tends to overestimate RT60 in well-treated rooms.</li>
              <li>One mid-frequency figure hides low-frequency problems, flutter echo between parallel surfaces, and background noise from HVAC or neighbouring rooms.</li>
              <li>Real material performance depends on the product, its mounting and the air gap behind it.</li>
              <li>For design decisions, commission an acoustic survey or measure RT60 on site.</li>
            </ul></div>
          </div>
        </details>`;

  return toolShell(cfg, {
    slug: "room-acoustics-checker", t, calcHtml, methodHtml,
    sources: data.acoustics.sources, jsFile: "acoustics/ui.js",
    title: "Conference Room Acoustics & RT60 Checker | Diego Gonzalez",
    description: "Will this room sound bad? Free conference room acoustics checker: a 30-second quick check or a Sabine RT60 estimate, compared with published guidance for meeting and video conference rooms.",
    ogImage: "/assets/og/og-acoustics.png"
  });
}
