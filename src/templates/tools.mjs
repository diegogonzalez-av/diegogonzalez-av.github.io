import { escapeHtml as e } from "../../lib/markdown.mjs";
import { icons, abs } from "./layout.mjs";
import { TOOLS } from "./pages.mjs";
import displayStrings from "../tools/display/strings.mjs";
import meetingStrings from "../tools/meeting/strings.mjs";
import acousticsStrings from "../tools/acoustics/strings.mjs";

const i = (t, k) => `data-i18n="${k}">${e(t[k])}`; // usage: <span ${i(t,'key')}</span>

function seg(name, options, t, { checked, cols, cls = "" } = {}) {
  return `<div class="seg ${cls}" style="--cols:${cols ?? options.length}">
${options.map((o) => `  <label><input type="radio" name="${name}" value="${o.value}"${o.value === checked ? " checked" : ""}><span><span ${i(t, o.key)}</span>${o.sub ? `<small ${i(t, o.sub)}</small>` : ""}</span></label>`).join("\n")}
</div>`;
}

function sourcesList(sources) {
  return `<ul class="sources">${sources.map((s) => `<li>${s.url ? `<a href="${s.url}" rel="noopener" target="_blank">${e(s.label)}</a>` : e(s.label)}</li>`).join("")}</ul>`;
}

function related(slug) {
  return TOOLS.filter((t) => t.slug !== slug).map((t) => `<a href="/tools/${t.slug}/"><small>${e(t.question)}</small><strong>${e(t.title)}</strong></a>`).join("\n");
}

function crossPromo(cfg, t) {
  return `<div class="crosspromo">
  <img src="${cfg.book.cover}-360.jpg" alt="" width="64" height="96" loading="lazy">
  <div><p ${i(t, "promoText")}</p><a href="/book/" data-track="tool-to-book"><span ${i(t, "promoLink")}</span> →</a></div>
</div>`;
}

function toolShell(cfg, { slug, t, calcHtml, methodHtml, sources, jsFile, extraHead = "", title, description, ogImage }) {
  const tool = TOOLS.find((x) => x.slug === slug);
  return {
    path: `/tools/${slug}/`, nav: "tools",
    title, description, ogImage,
    jsonld: {
      "@context": "https://schema.org",
      "@type": "WebApplication",
      name: tool.name,
      url: abs(cfg, `/tools/${slug}/`),
      applicationCategory: "UtilitiesApplication",
      operatingSystem: "Any (web browser)",
      isAccessibleForFree: true,
      offers: { "@type": "Offer", price: "0", priceCurrency: "GBP" },
      author: { "@type": "Person", name: cfg.person.name, url: abs(cfg, "/about/") }
    },
    body: `
<section class="tool-head">
  <div class="wrap">
    <p class="breadcrumbs"><a href="/tools/">Tools</a></p>
    <div class="tool-head__row">
      <div>
        <p class="tool-head__name" ${i(t, "name")}</p>
        <h1 ${i(t, "h1")}</h1>
        <p class="lede" ${i(t, "lede")}</p>
      </div>
    </div>
  </div>
</section>
<section style="padding-bottom:clamp(48px,7vw,88px)">
  <div class="wrap">
${calcHtml}
    <p class="privacy-note">${icons.lock}<span><strong>No signup. No uploads.</strong> Your calculations stay in your browser.</span></p>
  </div>
</section>
<section class="section section--white">
  <div class="wrap tool-info">
    <div>
      <span class="eyebrow"><span>Methodology</span></span>
      <h2 style="font-size:clamp(1.6rem,2.8vw,2.1rem)"><span>How this is calculated</span></h2>
      <div class="method">
${methodHtml}
        <details>
          <summary><span>Sources</span></summary>
          <div class="method__body">${sourcesList(sources)}</div>
        </details>
      </div>
    </div>
    <aside class="related">
      <span class="eyebrow"><span>Related tools</span></span>
      ${related(slug)}
      ${crossPromo(cfg, t)}
    </aside>
  </div>
</section>`,
    scripts: `${extraHead}<script type="module" src="/assets/js/tools/${jsFile}"></script>`
  };
}

/* ------------------------------------------------------------------------ */
export function displayTool(cfg, data) {
  const t = displayStrings.en;
  const calcHtml = `
<form class="calc" id="display-calc" novalidate onsubmit="return false">
  <div class="calc__inputs">
    <fieldset class="field">
      <legend ${i(t, "modeLegend")}</legend>
      ${seg("mode", [
        { value: "bdm", key: "modeBdm", sub: "modeBdmSub" },
        { value: "adm", key: "modeAdm", sub: "modeAdmSub" },
        { value: "video", key: "modeVideo", sub: "modeVideoSub" },
        { value: "home", key: "modeHome", sub: "modeHomeSub" }
      ], t, { checked: "bdm", cols: 2, cls: "seg--2up" })}
    </fieldset>

    <div class="field">
      <div class="field__label"><span ${i(t, "units")}</span>
        <span class="unit-toggle" role="group" data-i18n-aria="units" aria-label="${e(t.units)}">
          <button type="button" data-units="metric" aria-pressed="true" ${i(t, "metric")}</button>
          <button type="button" data-units="imperial" aria-pressed="false" ${i(t, "imperial")}</button>
        </span>
      </div>
    </div>

    <div class="field">
      <label class="field__label" for="diag"><span ${i(t, "diag")}</span><span class="field__value"><output id="diag-out">75</output><small>in</small></span></label>
      <input type="range" id="diag" min="32" max="165" step="1" value="75">
      <div class="field__scale"><span>32″</span><output id="diag-dims">1.66 × 0.93 m</output><span>165″</span></div>
    </div>

    <div class="field">
      <label class="field__label" for="dist"><span id="dist-label" ${i(t, "dist")}</span><span class="field__value"><output id="dist-out">4.5</output><small id="dist-unit">m</small></span></label>
      <input type="range" id="dist" min="1" max="15" step="0.1" value="4.5">
      <div class="field__scale"><span id="dist-min">1 m</span><output id="dist-alt">14.8 ft</output><span id="dist-max">15 m</span></div>
    </div>

    <fieldset class="field" id="eh-field">
      <legend ${i(t, "ehLegend")}</legend>
      <p class="field__hint" ${i(t, "ehHint")}</p>
      ${seg("eh", [
        { value: "2", key: "eh2", sub: "eh2Sub" },
        { value: "3", key: "eh3", sub: "eh3Sub" },
        { value: "4", key: "eh4", sub: "eh4Sub" }
      ], t, { checked: "3", cls: "seg--keep" })}
    </fieldset>

    <fieldset class="field" id="angle-field" hidden>
      <legend ${i(t, "angleLegend")}</legend>
      ${seg("angle", [{ value: "30", key: "angle30", sub: "angle30Sub" }, { value: "40", key: "angle40", sub: "angle40Sub" }], t, { checked: "30", cols: 2, cls: "seg--keep" })}
    </fieldset>

    <fieldset class="field" id="res-field" hidden>
      <legend ${i(t, "resLegend")}</legend>
      <p class="field__hint" ${i(t, "resHint")}</p>
      <div class="seg seg--keep" style="--cols:3">
        <label><input type="radio" name="res" value="1080" checked><span>1080p<small>1920 × 1080</small></span></label>
        <label><input type="radio" name="res" value="1440"><span>1440p<small>2560 × 1440</small></span></label>
        <label><input type="radio" name="res" value="2160"><span>4K UHD<small>3840 × 2160</small></span></label>
      </div>
    </fieldset>

    <details class="advanced">
      <summary ${i(t, "advanced")}</summary>
      <div class="advanced__body">
        <div class="row-2">
          <div class="field"><label class="field__label" for="bottom"><span ${i(t, "bottom")}</span></label>
            <div class="input-affix"><input type="number" id="bottom" value="1.0" step="0.05" min="0" max="3" inputmode="decimal"><span class="len-unit">m</span></div></div>
          <fieldset class="field"><legend ${i(t, "eye")}</legend>
            ${seg("eye", [{ value: "seated", key: "eyeSeated" }, { value: "standing", key: "eyeStanding" }], t, { checked: "seated", cols: 2, cls: "seg--2up" })}
          </fieldset>
        </div>
      </div>
    </details>
  </div>

  <div class="calc__result" aria-live="polite">
    <div class="status" id="status">
      <span class="status__icon" id="status-icon"></span>
      <span class="status__label" id="status-label"></span>
      <p class="status__title" id="status-title"></p>
      <p class="status__text" id="status-text"></p>
    </div>
    <dl class="metrics">
      <div><dt ${i(t, "recMin")}</dt><dd id="rec-min">–</dd></div>
      <div><dt ${i(t, "common")}</dt><dd id="rec-common">–</dd></div>
    </dl>
    <div class="range-viz">
      <div class="range-viz__head"><span ${i(t, "vizTitle")}</span>
        <span class="range-viz__legend"><span><i style="background:rgba(30,123,79,.25);border:1.5px solid var(--good)"></i><span ${i(t, "vizZone")}</span></span><span><i style="background:var(--navy-950);border-radius:50%"></i><span ${i(t, "vizViewer")}</span></span></span>
      </div>
      <div class="range-viz__track" aria-hidden="true"><div class="range-viz__zone" id="viz-zone"></div><div class="range-viz__marker" id="viz-marker"></div></div>
      <div class="range-viz__scale" id="viz-scale" aria-hidden="true"></div>
    </div>
    <dl class="metrics">
      <div><dt ${i(t, "mSize")}</dt><dd id="m-size">–</dd></div>
      <div><dt ${i(t, "mMaxFar")}</dt><dd id="m-maxfar">–</dd></div>
      <div><dt ${i(t, "mClosest")}</dt><dd id="m-closest">–</dd></div>
      <div><dt ${i(t, "mRatio")}</dt><dd><span id="m-ratio">–</span><small ${i(t, "mRatioSub")}</small></dd></div>
      <div><dt ${i(t, "mAngle")}</dt><dd id="m-angle">–</dd></div>
    </dl>
    <p class="note" ${i(t, "aspectNote")}</p>
    <div><button type="button" class="btn btn--ghost btn--sm" id="copy-link" ${i(t, "copyLink")}</button></div>
  </div>
</form>`;

  const methodHtml = `
        <details open>
          <summary><span>What this calculates</span></summary>
          <div class="method__body">
            <div>
              <p>For presentations and fine detail, the tool works out the smallest image height that lets the person farthest from the screen read the content, then compares it with your display. It implements the relationships behind AVIXA's DISCAS standard (ANSI/AVIXA V202.01, <em>Display Image Size for 2D Content in Audiovisual Systems</em>), as published in AVIXA's own free DISCAS calculators.</p>
              <p>DISCAS does not cover video and conferencing content. For that mode the tool uses a general human-factors ratio between viewing distance and screen diagonal instead. That is a rule of thumb, not a DISCAS result.</p>
              <p>For home cinema and TV, it uses the horizontal viewing angles commonly quoted for home viewing: about 30° for mixed use (widely attributed to SMPTE) and about 40° for a cinematic experience (THX).</p>
              <p>It also estimates the closest comfortable seat, so that the front row doesn't end up craning their necks.</p>
            </div>
          </div>
        </details>
        <details>
          <summary><span>Formulas</span></summary>
          <div class="method__body">
            <p><strong>Presentations &amp; documents</strong> (DISCAS Basic Decision Making):</p>
            <code class="formula">image height = farthest viewer ÷ (200 × element height %)</code>
            <p><strong>Fine detail</strong> (DISCAS Analytical Decision Making: about one pixel per arcminute of vision):</p>
            <code class="formula">image height = farthest viewer × vertical resolution ÷ 3438</code>
            <p><strong>Video &amp; conferencing</strong> (FAA Human Factors Design Standard §5.2.3.3, general displays):</p>
            <code class="formula">2 ≤ viewing distance ÷ diagonal ≤ 8   (optimum 4)</code>
            <p><strong>Home cinema &amp; TV</strong> (horizontal viewing angle; ~30° is widely attributed to SMPTE, ~40° is THX's recommendation):</p>
            <code class="formula">screen width = 2 × viewing distance × tan(angle ÷ 2)</code>
            <p><strong>Closest comfortable seat</strong> (30° upward limit, as in AVIXA's calculator; never closer than half the image width, per FAA HFDS §5.2.2.3):</p>
            <code class="formula">closest = max( 1.732 × (top of image − eye height), image width ÷ 2 )</code>
            <p>16:9 geometry: image height = diagonal × 0.4903; width = diagonal × 0.8716.</p>
          </div>
        </details>
        <details>
          <summary><span>Assumptions</span></summary>
          <div class="method__body">
            <div><ul>
              <li><strong>Element height</strong> is the height of the smallest content you need to read, as a share of image height. DISCAS leaves this to the designer. The default of 3% is a choice, not part of the standard. Measure your own content if you can.</li>
              <li><strong>Status bands</strong>: Good means the display meets the requirement. Warning means it is within 10% of it. Poor means it falls further short. The 10% band is a design choice for readability, not part of DISCAS.</li>
              <li>Default mounting: bottom of the image 1.0 m above the floor. Eye height is 1.2 m seated or 1.5 m standing, in line with AVIXA's suggested values.</li>
              <li>A 16:9 image fills the screen. Projection, ultrawide displays and letterboxed content will differ.</li>
              <li>Recommended sizes round up to the next common commercial size. Availability varies by manufacturer and market.</li>
            </ul></div>
          </div>
        </details>
        <details>
          <summary><span>Limitations</span></summary>
          <div class="method__body">
            <div><ul>
              <li>This is a quick planning check, not a DISCAS conformance assessment. Full conformance also involves contrast ratio, viewing angles and the actual content. Use AVIXA's own calculator and the standard for formal design work.</li>
              <li>The video mode is a general rule of thumb. No published standard defines display size for video conferencing faces.</li>
              <li>The home angles are widely quoted guidelines. SMPTE's 30° figure is commonly cited but no primary SMPTE document confirming it could be located.</li>
              <li>The tool does not consider brightness, glare, ambient light, horizontal viewing angles, camera position or multiple displays.</li>
            </ul></div>
          </div>
        </details>`;

  return toolShell(cfg, {
    slug: "display-size-calculator", t, calcHtml, methodHtml,
    sources: data.display.sources, jsFile: "display/ui.js",
    title: "AV Display Size & Viewing Distance Calculator | Diego Gonzalez",
    description: "Free meeting-room display size calculator based on AVIXA DISCAS relationships. Enter viewing distance and content type to see the recommended minimum screen size, in metric or imperial.",
    ogImage: "/assets/og/og-display.png"
  });
}

/* ------------------------------------------------------------------------ */
export { meetingTool } from "./tool-meeting.mjs";
export { acousticsTool } from "./tool-acoustics.mjs";
export { seg, i as i18nAttr, toolShell };
