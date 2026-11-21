import { escapeHtml as e } from "../../lib/markdown.mjs";
import { seg, i18nAttr as i, toolShell } from "./tools.mjs";
import S from "../tools/meeting/strings.mjs";

export function meetingTool(cfg, data) {
  const t = S.en;
  const m = data.meeting;
  const d = m.defaults.GBP;
  const calcHtml = `
<div class="shared-banner" id="shared-banner" hidden>
  <div><span class="eyebrow eyebrow--gold" ${i(t, "sharedTitle")}</span><strong id="shared-figure"></strong></div>
  <a class="btn btn--gold btn--sm" href="#meeting-calc" ${i(t, "sharedCta")}</a>
</div>
<form class="calc" id="meeting-calc" novalidate onsubmit="return false">
  <div class="calc__inputs">
    <div class="row-2">
      <div class="field">
        <label class="field__label" for="attendees"><span ${i(t, "attendees")}</span></label>
        <input type="number" id="attendees" min="1" max="1000" step="1" value="6" inputmode="numeric">
      </div>
      <div class="field">
        <label class="field__label" for="duration"><span ${i(t, "duration")}</span></label>
        <div class="input-affix"><input type="number" id="duration" min="5" max="600" step="5" value="60" inputmode="numeric"><span ${i(t, "min")}</span></div>
      </div>
    </div>

    <fieldset class="field">
      <legend ${i(t, "rateLegend")}</legend>
      ${seg("rateMode", [{ value: "salary", key: "rateSalary" }, { value: "hourly", key: "rateHourly" }], t, { checked: "salary", cols: 2, cls: "seg--2up" })}
      <div class="row-2">
        <div class="input-affix"><span id="cur-symbol">£</span><input type="number" id="rate" min="0" step="500" value="${d.annualSalary}" inputmode="decimal" aria-label="Amount"></div>
        <label class="sr-only" for="currency">Currency</label>
        <select id="currency" aria-label="Currency">
          <option value="GBP" selected>GBP £</option>
          <option value="USD">USD $</option>
          <option value="EUR">EUR €</option>
        </select>
      </div>
    </fieldset>

    <fieldset class="field">
      <legend ${i(t, "freqLegend")}</legend>
      ${seg("frequency", [
        { value: "once", key: "fOnce" }, { value: "daily", key: "fDaily" }, { value: "weekly", key: "fWeekly" },
        { value: "fortnightly", key: "fFortnightly" }, { value: "monthly", key: "fMonthly" }, { value: "custom", key: "fCustom" }
      ], t, { checked: "weekly", cls: "seg--wrap seg--2up" }).replace('class="seg seg--wrap', 'style="--min:104px" class="seg seg--wrap')}
      <div class="field" id="custom-field" hidden>
        <label class="field__label" for="custom"><span ${i(t, "perYear")}</span></label>
        <input type="number" id="custom" min="0" max="2000" step="1" value="24" inputmode="numeric">
      </div>
    </fieldset>

    <fieldset class="field">
      <legend ${i(t, "basisLegend")}</legend>
      ${seg("basis", [{ value: "salary", key: "basisSalary", sub: "basisSalarySub" }, { value: "loaded", key: "basisLoaded", sub: "basisLoadedSub" }], t, { checked: "salary", cols: 2, cls: "seg--2up" })}
      <div class="field" id="multiplier-field" hidden>
        <label class="field__label" for="multiplier"><span ${i(t, "multiplier")}</span></label>
        <div class="input-affix"><input type="number" id="multiplier" min="1" max="3" step="0.05" value="${d.loadedMultiplier}" inputmode="decimal"><span>×</span></div>
        <p class="note" id="multiplier-note"></p>
      </div>
    </fieldset>

    <details class="advanced">
      <summary ${i(t, "timeAssumptions")}</summary>
      <div class="advanced__body">
        <div class="row-2">
          <div class="field"><label class="field__label" for="hours"><span ${i(t, "hoursWeek")}</span></label><input type="number" id="hours" min="1" max="80" step="0.5" value="${d.hoursPerWeek}" inputmode="decimal"></div>
          <div class="field"><label class="field__label" for="weeks"><span ${i(t, "weeksYear")}</span></label><input type="number" id="weeks" min="1" max="52" step="1" value="${m.workingWeeksPerYear}" inputmode="numeric"></div>
        </div>
        <p class="note" ${i(t, "weeksHint")}</p>
      </div>
    </details>

    <details class="advanced" id="tech">
      <summary ${i(t, "techSummary")}</summary>
      <div class="advanced__body">
        <p class="note" ${i(t, "techIntro")}</p>
        <fieldset class="field">
          <legend ${i(t, "typeLegend")}</legend>
          ${seg("mtype", [{ value: "in-person", key: "tInPerson" }, { value: "video", key: "tVideo" }, { value: "hybrid", key: "tHybrid" }], t, { checked: "hybrid", cls: "seg--keep" })}
        </fieldset>
        <div class="field" id="remote-field">
          <label class="field__label" for="remote"><span ${i(t, "remote")}</span></label>
          <input type="number" id="remote" min="0" max="1000" step="1" value="3" inputmode="numeric">
        </div>
        <div class="field" id="platform-field">
          <label class="field__label" for="platform"><span ${i(t, "platform")}</span></label>
          <select id="platform">
            ${m.platforms.map((p) => `<option value="${p.key}"${p.key === "covered" ? " selected" : ""}>${e(p.label)}</option>`).join("")}
          </select>
          <label class="field__label" for="licence" style="margin-top:6px"><span ${i(t, "licence")}</span></label>
          <div class="input-affix"><span class="cur-symbol">£</span><input type="number" id="licence" min="0" step="0.01" value="0" inputmode="decimal"></div>
          <p class="note" id="licence-note" ${i(t, "licenceHint")}</p>
        </div>
        <div class="field" id="room-field">
          <label class="field__label" for="room"><span ${i(t, "roomType")}</span></label>
          <select id="room">
            ${m.rooms.types.map((r) => `<option value="${r.key}"${r.key === "medium" ? " selected" : ""}>${e(r.label)}</option>`).join("")}
          </select>
          <label class="field__label" for="roomcost" style="margin-top:6px"><span ${i(t, "roomCost")}</span></label>
          <div class="input-affix"><span class="cur-symbol">£</span><input type="number" id="roomcost" min="0" step="500" value="25000" inputmode="decimal"></div>
          <p class="note" ${i(t, "roomHint")}</p>
          <div class="row-2">
            <div class="field"><label class="field__label" for="lifecycle"><span ${i(t, "lifecycle")}</span></label><input type="number" id="lifecycle" min="1" max="20" step="1" value="${m.rooms.lifecycleYears}" inputmode="numeric"></div>
            <div class="field"><label class="field__label" for="util"><span ${i(t, "utilisation")}</span></label><div class="input-affix"><input type="number" id="util" min="1" max="100" step="1" value="${Math.round(m.rooms.utilisation * 100)}" inputmode="numeric"><span>%</span></div></div>
          </div>
        </div>
      </div>
    </details>
  </div>

  <div class="calc__result" aria-live="polite">
    <div class="big-result">
      <p class="big-result__kicker" id="kicker"></p>
      <p class="big-result__value" id="headline">–</p>
    </div>
    <dl class="metrics">
      <div><dt ${i(t, "perMeeting")}</dt><dd id="r-meeting">–</dd></div>
      <div><dt ${i(t, "perMonth")}</dt><dd id="r-month">–</dd></div>
      <div><dt id="r-hours-label" ${i(t, "hoursYear")}</dt><dd><span id="r-hours">–</span><small id="r-days"></small></dd></div>
      <div><dt ${i(t, "hourly")}</dt><dd id="r-hourly">–</dd></div>
      <div id="r-people-wrap" hidden><dt ${i(t, "peopleCost")}</dt><dd id="r-people">–</dd></div>
      <div id="r-tech-wrap" hidden><dt ${i(t, "techCost")}</dt><dd id="r-tech">–</dd></div>
    </dl>
    <p class="threshold" id="threshold"></p>
    <p class="note" id="estimate-note"></p>
    <div class="share">
      <p class="share__title" ${i(t, "shareTitle")}</p>
      <canvas id="card" width="1200" height="630" class="share-preview" role="img" aria-label="Share card preview"></canvas>
      <div class="share__btns">
        <button type="button" class="btn btn--sm" id="btn-copy-result" ${i(t, "copyResult")}</button>
        <a class="btn btn--sm btn--ghost" id="btn-linkedin" href="https://www.linkedin.com/" target="_blank" rel="noopener">LinkedIn</a>
        <a class="btn btn--sm btn--ghost" id="btn-x" href="https://x.com/" target="_blank" rel="noopener">X</a>
        <button type="button" class="btn btn--sm btn--ghost" id="btn-copy-link" ${i(t, "copyLink")}</button>
        <button type="button" class="btn btn--sm btn--ghost" id="btn-download" ${i(t, "download")}</button>
        <button type="button" class="btn btn--sm btn--ghost" id="btn-native" hidden ${i(t, "shareNative")}</button>
      </div>
      <label class="share__check"><input type="checkbox" id="share-inputs"> <span ${i(t, "shareInclude")}</span></label>
    </div>
  </div>
</form>`;

  const methodHtml = `
        <details open>
          <summary><span>What this calculates</span></summary>
          <div class="method__body">
            <div>
              <p>The people cost of a meeting is simply the time everyone spends in it, multiplied by what that time costs. The point is not that meetings are bad. It is to make their opportunity cost visible, so the decision to hold one is a conscious one.</p>
              <p>If you add meeting technology, it appears as a separate <strong>estimated allocation</strong> of costs that exist anyway: licences spread across working hours, and room equipment spread across its lifecycle and actual use. It is not money spent each time someone presses Join.</p>
            </div>
          </div>
        </details>
        <details>
          <summary><span>Formulas</span></summary>
          <div class="method__body">
            <code class="formula">hourly cost = annual salary ÷ (hours per week × working weeks)   [× on-cost multiplier]</code>
            <code class="formula">people cost per meeting = attendees × duration (h) × hourly cost</code>
            <code class="formula">annual cost = cost per meeting × meetings per year</code>
            <code class="formula">licence allocation = licence per user per month × 12 ÷ working hours × duration × licensed attendees</code>
            <code class="formula">room allocation = installed cost ÷ (lifecycle years × bookable hours × utilisation) × duration</code>
            <p>Meetings per year: daily = 5 × working weeks; weekly = working weeks; fortnightly = working weeks ÷ 2; monthly = 12 × working weeks ÷ 52.</p>
          </div>
        </details>
        <details>
          <summary><span>Assumptions</span></summary>
          <div class="method__body">
            <table>
              <thead><tr><th>Assumption</th><th>Default</th><th>Basis</th></tr></thead>
              <tbody>
                <tr><td>Working weeks per year</td><td>${m.workingWeeksPerYear}</td><td>52 weeks minus roughly 6 weeks of leave and public holidays. Editable.</td></tr>
                <tr><td>Hours per week</td><td>37.5 (GBP), 40 (USD), 38 (EUR)</td><td>Typical contracted hours. ONS reports 36.6 actual weekly hours for UK full-time workers (Aug 2026). Editable.</td></tr>
                <tr><td>On-cost multiplier (UK)</td><td>${m.defaults.GBP.loadedMultiplier}×</td><td>${e(m.loadedMultiplierNotes.GBP)}</td></tr>
                <tr><td>On-cost multiplier (US)</td><td>${m.defaults.USD.loadedMultiplier}×</td><td>${e(m.loadedMultiplierNotes.USD)}</td></tr>
                <tr><td>On-cost multiplier (EUR)</td><td>${m.defaults.EUR.loadedMultiplier}×</td><td>${e(m.loadedMultiplierNotes.EUR)}</td></tr>
                <tr><td>Room technology cost</td><td>£${m.rooms.types[1].cost.GBP.toLocaleString("en-GB")}–£${m.rooms.types[4].cost.GBP.toLocaleString("en-GB")}</td><td>${e(m.rooms._note)}</td></tr>
                <tr><td>Room lifecycle / utilisation</td><td>${m.rooms.lifecycleYears} years / ${Math.round(m.rooms.utilisation * 100)}%</td><td>Planning assumptions over ${m.rooms.bookableHoursPerYear.toLocaleString("en-GB")} bookable hours a year (46 weeks × 5 days × 9 hours). Editable.</td></tr>
                ${m.platforms.filter((p) => p.reference).map((p) => `<tr><td>${e(p.label)} reference price</td><td>${p.reference.currency} ${p.reference.amount.toFixed(2)}</td><td>${e(p.reference.plan)}. Indicative list price, <a href="${p.reference.url}" rel="noopener" target="_blank">checked ${e(p.reference.checked)}</a>. Prefilled only when your currency matches.</td></tr>`).join("")}
              </tbody>
            </table>
            
          </div>
        </details>
        <details>
          <summary><span>Limitations &amp; privacy</span></summary>
          <div class="method__body">
            <div><ul>
              <li>An average cost per attendee hides real differences in seniority. Treat the result as an order of magnitude, not an invoice.</li>
              <li>It doesn't count preparation, travel, context switching or the cost of <em>not</em> meeting. Some meetings are cheap at any price.</li>
              <li>Licence and room allocations are estimates of shared costs, not marginal costs.</li>
              <li>Everything runs in your browser. Share links include only the headline figures unless you tick “Include my inputs”.</li>
            </ul></div>
          </div>
        </details>`;

  return toolShell(cfg, {
    slug: "meeting-cost-calculator", t, calcHtml, methodHtml,
    sources: m.sources, jsFile: "meeting/ui.js",
    extraHead: `<script type="application/json" id="tool-data">${JSON.stringify(m).replace(/</g, "\\u003c")}</script>\n`,
    title: "Meeting Cost Calculator: Calculate the Real Cost of Meetings | Diego Gonzalez",
    description: "Should this meeting have been an email? Free meeting cost calculator: see the cost per meeting, per year and in employee-hours, with transparent assumptions and an optional technology allocation.",
    ogImage: "/assets/og/og-meeting.png"
  });
}
