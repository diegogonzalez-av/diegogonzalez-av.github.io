import { escapeHtml as e } from "../../lib/markdown.mjs";
import { icons, picture, abs } from "./layout.mjs";

export const TOOLS = [
  {
    slug: "display-size-calculator", icon: "display", question: "Can they see it?",
    title: "What size screen do I need?", name: "AV Display Size & Viewing Distance Calculator",
    blurb: "Find the right display size for your meeting room and viewing distance.", cta: "Calculate"
  },
  {
    slug: "meeting-cost-calculator", icon: "meeting", question: "Is it worth the time?",
    title: "Should this meeting have been an email?", name: "Meeting Cost Calculator",
    blurb: "See what a recurring meeting actually costs in money and employee time.", cta: "Calculate"
  },
  {
    slug: "room-acoustics-checker", icon: "acoustics", question: "Can they hear it?",
    title: "Will this room sound bad?", name: "Conference Room Acoustics Checker",
    blurb: "Quickly assess whether a meeting room is likely to suffer from excessive reverberation.", cta: "Check the room"
  }
];

/** Email links are assembled by site.js so the address isn't sitting in the HTML for scrapers. */
export function mailAttrs(cfg, subject) {
  const [u, d] = cfg.contact.email.split("@");
  return `href="/contact/" data-mu="${e(u)}" data-md="${e(d)}" data-ms="${e(subject)}"`;
}

export function toolCards(cls = "") {
  return `<div class="tool-grid ${cls}">
${TOOLS.map((t) => `  <a class="tool-card" href="/tools/${t.slug}/">
    <span class="tool-card__icon">${icons[t.icon]}</span>
    <span class="tool-card__q">${e(t.question)}</span>
    <h3>${e(t.title)}</h3>
    <p>${e(t.blurb)}</p>
    <span class="link-arrow">${e(t.cta)}</span>
  </a>`).join("\n")}
</div>`;
}

const privacyLine = () => `<p class="privacy-note">${icons.lock}<span><strong>No signup. No uploads.</strong> Your calculations stay in your browser.</span></p>`;

function insightTag(i) {
  return `<span class="tag"><b>${e(i.source)}</b>${i.topic ? `· ${e(i.topic)}` : ""}</span>`;
}
function insightHref(cfg, i) {
  if (i.url === "linkedin") return { href: cfg.contact.linkedinActivity, ext: true, label: "Read on LinkedIn" };
  if (i.url) return { href: i.url, ext: true, label: i.source === "LinkedIn" ? "Read on LinkedIn" : `Read in ${i.source}` };
  return { href: `/insights/${i.slug}/`, ext: false, label: "Read" };
}
const fmtDate = (d, month = "short") => (d ? new Date(d).toLocaleDateString("en-GB", { day: "numeric", month, year: "numeric" }) : "");

export function insightCard(cfg, i) {
  const h = insightHref(cfg, i);
  return `<a class="insight-card" href="${h.href}"${h.ext ? ' rel="noopener" target="_blank"' : ""} data-track="insight-${e(i.slug)}">
  ${insightTag(i)}
  <h3>${e(i.title)}</h3>
  ${i.quote ? `<blockquote>${e(i.quote)}</blockquote>` : ""}
  <p>${e(i.summary)}</p>
  <span class="meta"><span class="link-arrow">${h.label}</span>${i.date ? `<time datetime="${i.date}">${fmtDate(i.date)}</time>` : ""}</span>
</a>`;
}

/** Newest non-featured insight. To feature a new idea: add a Markdown file with a later date (and optionally image/imageAlt). */
export const latestInsight = (insights) => insights.filter((i) => !i.featured && i.date).sort((a, b) => String(b.date).localeCompare(String(a.date)))[0];

function latestCard(cfg, i) {
  const h = insightHref(cfg, i);
  return `<a class="latest" id="latest" href="${h.href}"${h.ext ? ' rel="noopener" target="_blank"' : ""} data-track="latest-insight">
  ${i.image ? `<img class="latest__img" src="${i.image}" alt="${e(i.imageAlt ?? "")}" loading="lazy">` : ""}
  <div class="latest__body">
    <span class="tag"><b>Latest idea</b>· ${e(fmtDate(i.date, "long"))}</span>
    <h3>${e(i.title)}</h3>
    ${!i.image && i.quote ? `<blockquote>${e(i.quote)}</blockquote>` : ""}
    <p>${e(i.summary)}</p>
    <span class="link-arrow">${h.label}</span>
  </div>
</a>`;
}

function publishedCard(cfg, i) {
  const h = insightHref(cfg, i);
  const r = cfg.recognition.find((x) => /AVWeek/.test(x.label) && x.url);
  return `<div class="published">
  <a class="published__link" href="${h.href}" rel="noopener" target="_blank" data-track="av-magazine">
    <span class="tag"><b>Published in ${e(i.source)}</b>· ${e(fmtDate(i.date, "long"))}</span>
    <h3>${e(i.title)}</h3>
    <blockquote>Commissioning proves that a system worked on test day. It does not prove that it was useful, usable or sustainable.</blockquote>
    <span class="link-arrow">${h.label}</span>
  </a>
  ${r ? `<p class="published__note">Picked up by Tim Albright on AVNation's <a href="${r.url}" rel="noopener" target="_blank" data-track="avweek">AVWeek 790</a> as a roundtable talking point (15:39–31:12).</p>` : ""}
</div>`;
}
export function insightFeature(cfg, i) {
  const h = insightHref(cfg, i);
  const date = i.date ? new Date(i.date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";
  return `<a class="insight-feature" href="${h.href}"${h.ext ? ' rel="noopener" target="_blank"' : ""}>
  <div class="insight-feature__body">
    <span class="tag"><b>Published in ${e(i.source)}</b>${date ? `· ${e(date)}` : ""}</span>
    <h3>${e(i.title)}</h3>
    <p>${e(i.summary)}</p>
    <span class="link-arrow">${h.label}</span>
  </div>
  <div class="insight-feature__aside">
    <blockquote>Commissioning proves that a system worked on test day. It does not prove that it was useful, usable or sustainable.</blockquote>
    <span class="tag">The thesis</span>
  </div>
</a>`;
}

function avweek(cfg) {
  const r = cfg.recognition.find((x) => /AVWeek/.test(x.label) && x.url);
  if (!r) return "";
  return `<p class="avweek">Picked up by Tim Albright on AVNation's <a href="${r.url}" rel="noopener" target="_blank">AVWeek 790</a> as a roundtable talking point (15:39–31:12).</p>`;
}

function bookBlock(cfg, { headingLevel = "h2", dark = true } = {}) {
  const b = cfg.book;
  const H = headingLevel;
  return `<div class="book">
  <div class="book__cover">
    ${picture({ base: b.cover, widths: [360, 720], sizes: "(max-width: 920px) 260px, 340px", alt: b.coverAlt, w: 720, h: 1080 })}
  </div>
  <div>
    <span class="eyebrow">The book</span>
    <${H}>${e(b.title)}</${H}>
    <p class="book__subtitle">${e(b.subtitle)}</p>
    <p>A practical field guide to applying product management thinking to Enterprise AV. It is written for people who work around meeting-room technology, UC and collaboration, manufacturers, workplace technology and AV operations, and who want to move from delivering projects to managing products.</p>
    <ul class="book__list">
      <li>Product versus project thinking, and why the difference matters after handover</li>
      <li>Discovery: finding the real user problem behind the request</li>
      <li>Strategy, roadmaps and prioritisation when everyone has a request</li>
      <li>Outcomes, measurement and the product lifecycle</li>
      <li>Stakeholders, and a practical plan for your first 90 days</li>
    </ul>
    <div class="book__buy">
      <a class="btn ${dark ? "btn--gold" : ""}" href="${b.amazonUrl}" rel="noopener" target="_blank" data-track="book-amazon">Buy on Amazon</a>
      <a class="btn ${dark ? "btn--on-dark" : "btn--ghost"}" href="${b.gumroadUrl}" rel="noopener" target="_blank" data-track="book-gumroad">Get the digital edition on Gumroad</a>
    </div>
    <p class="book__meta">Amazon: ${e(b.amazonFormats)} · Gumroad: ${e(b.gumroadFormats)}</p>
  </div>
</div>`;
}

const TOPICS = [
  ["Strategy & standards at scale", "Global consistency without one SKU everywhere: standards, investment priorities and controlled choices."],
  ["Lifecycle, reliability & operations", "What happens after handover: supportability, updates, monitoring and the boring discipline of things that work."],
  ["Experience & product thinking", "Rooms that need no instructions, problems before features, and outcomes over outputs."],
  ["AI & the business of AV", "Where AI genuinely helps AV teams, where it is mostly marketing, and the economics behind the meeting room."]
];

export function home(cfg, insights) {
  const featured = insights.find((i) => i.featured);
  const latest = latestInsight(insights);
  const rest = insights.filter((i) => !i.featured && i !== latest).slice(0, 3);
  const p = cfg.person;
  const rec = cfg.recognition[0];
  return {
    path: "/", nav: "home",
    title: cfg.site.defaultTitle,
    ogType: "profile",
    jsonld: personJsonLd(cfg),
    body: `
<section class="hero">
  <div class="wrap hero__grid">
    <div>
      <p class="hero__name">${e(p.name)}</p>
      <h1>Enterprise AV, beyond the demo room.</h1>
      <p class="hero__lede">Nearly two decades across engineering, integration, consulting, operations and product. I write about what actually determines whether AV works at scale: architecture, lifecycle, reliability, user experience and the decisions in between.</p>
      <div class="hero__ctas">
        <a class="btn" href="#latest" data-track="hero-latest">Read the latest insight</a>
        <a class="btn btn--ghost" href="/tools/" data-track="hero-tools">Explore the tools</a>
        <a class="link-arrow" href="/book/" data-track="hero-book">Discover the book</a>
      </div>
    </div>
    <figure class="portrait">
      ${picture({ base: p.portrait.hero, widths: [480, 800], sizes: "(max-width: 920px) 148px, 440px", alt: p.portrait.alt, eager: true, w: 800, h: 1000 })}
    </figure>
  </div>
</section>

<section class="proof" aria-label="Credentials">
  <div class="wrap">
    <ul>
      <li><strong>~20 years</strong><span>across the full Enterprise AV lifecycle</span></li>
      <li><strong>Both sides</strong><span>integrator, consultant and end-user experience</span></li>
      <li><strong>Global scale</strong><span>Enterprise AV strategy, standards and operations</span></li>
      <li><a href="/book/"><strong>Author</strong><span><em>AV PM for Rookies</em></span></a></li>
      <li><a href="${rec.url}" rel="noopener" target="_blank"><strong>AV Magazine</strong><span>guest article, discussed on AVNation's AVWeek</span></a></li>
    </ul>
  </div>
</section>

<section class="section section--white" id="insights">
  <div class="wrap">
    <div class="section__head">
      <div>
        <span class="eyebrow">Insights</span>
        <h2>Notes from beyond the demo room</h2>
      </div>
      <a class="link-arrow" href="/insights/">All insights</a>
    </div>
    <div class="insights-top">
      ${latest ? latestCard(cfg, latest) : ""}
      ${featured ? publishedCard(cfg, featured) : ""}
    </div>
    <div class="insight-grid">
      ${rest.map((i) => insightCard(cfg, i)).join("\n      ")}
    </div>
  </div>
</section>

<section class="section section--dark" id="book">
  <div class="wrap">${bookBlock(cfg)}</div>
</section>

<section class="section" id="tools">
  <div class="wrap">
    <div class="section__head">
      <div>
        <span class="eyebrow">Free Enterprise AV &amp; workplace tools</span>
        <h2>Better rooms. Better meetings.</h2>
      </div>
      <p class="lede">Three fast tools for the questions every meeting space eventually has to answer.</p>
    </div>
    ${toolCards()}
    ${privacyLine()}
  </div>
</section>

<section class="section section--white" id="topics">
  <div class="wrap">
    <div class="section__head">
      <div>
        <span class="eyebrow">What I think about</span>
        <h2>Technology, people and the decisions in between</h2>
      </div>
      <p class="lede">AV is an ecosystem rather than equipment in rooms: people, spaces, hardware, software, cloud services, operations and lifecycle decisions, all connected.</p>
    </div>
    <div class="topics">
      ${TOPICS.map(([t, d], n) => `<div class="topic"><span class="topic__n">${String(n + 1).padStart(2, "0")}</span><h3>${e(t)}</h3><p>${e(d)}</p></div>`).join("\n      ")}
    </div>
  </div>
</section>

<section class="section section--alt" id="collaboration">
  <div class="wrap">${collaboration(cfg)}</div>
</section>
`
  };
}

function collaboration(cfg, H = "h2") {
  const c = cfg.collaboration;
  return `<div class="collab">
      <div>
        <span class="eyebrow">Collaboration</span>
        <${H}>${e(c.title)}</${H}>
      </div>
      <div>
        <p class="lede">${e(c.text)}</p>
        <div class="contact-band__ctas">
          <a class="btn" href="/contact/" data-track="collab-start-conversation">Start a conversation</a>
        </div>
      </div>
    </div>`;
}

export function about(cfg) {
  const p = cfg.person;
  return {
    path: "/about/", nav: "about",
    title: "About Diego Gonzalez | Enterprise AV, Product & Technology Strategy",
    description: "Diego Gonzalez has nearly two decades of experience across AV engineering, project delivery, solutions architecture, consulting and global Enterprise AV. MBA, author of AV PM for Rookies, published in AV Magazine.",
    ogType: "profile",
    jsonld: personJsonLd(cfg),
    body: `
<section class="page-hero">
  <div class="wrap">
    <span class="eyebrow">About</span>
    <h1>I've worked on every side of the AV table.</h1>
  </div>
</section>
<section class="section--tight" style="padding-top:0">
  <div class="wrap about-grid">
    <aside class="about-aside">
      <figure class="portrait">
        ${picture({ base: p.portrait.about, widths: [480, 800], sizes: "(max-width: 920px) 360px, 360px", alt: p.portrait.alt, eager: true, w: 800, h: 1000 })}
      </figure>
      <ul class="fact-list">
        <li><span>Based in</span><span>${e(p.location)}</span></li>
        <li><span>Focus</span><span>${e(p.tagline)}</span></li>
        <li><span>Education</span><span>MBA · MSc · Telecom Eng.</span></li>
        <li><span>Languages</span><span>${e(p.languages.join(", "))}</span></li>
        <li><span>Author</span><span><a href="/book/"><em>AV PM for Rookies</em></a></span></li>
      </ul>
    </aside>
    <div class="prose">
      <p>I've spent nearly two decades in professional and Enterprise AV: designing and engineering systems, delivering complex projects, architecting solutions, consulting, leading engineering and, today, shaping Enterprise AV at global scale.</p>
      <p>That path matters, because each seat teaches you something the others can't. Integrators see what gets promised. Engineers see what actually gets built. Operations teams see what survives Monday morning. Users see none of that. They just want the room to work.</p>
      <p>My work now sits where AV strategy, technology, operations and user experience meet. That means deciding which problems deserve investment, shaping standards that scale across regions and evaluating technology choices. It also means making sure what gets deployed is still useful, supportable and valued years after handover.</p>
      <p>I see AV as an ecosystem of people, spaces, hardware, software, cloud services, integrations, support and lifecycle decisions. Most of the interesting problems live in the gaps between those things.</p>
      <p>I wrote <a href="/book/"><em>AV PM for Rookies</em></a> to help AV professionals make the shift from delivering projects to managing products, and I write every week on LinkedIn about what I'm learning along the way. I'm also increasingly interested in where AI and automation genuinely help AV teams, and where they are mostly marketing.</p>

      <h2>From the rack to the roadmap</h2>
      <ol class="arc">
        <li><strong>Design &amp; engineering</strong><span>System design and project engineering for complex AV projects</span></li>
        <li><strong>Engineering leadership &amp; independent practice</strong><span>Leading an engineering function, then running my own AV consultancy</span></li>
        <li><strong>Project management</strong><span>Delivering AV and technology projects</span></li>
        <li><strong>Solutions architecture &amp; consulting</strong><span>Architecting and advising on enterprise AV solutions</span></li>
        <li><strong>Enterprise AV engineering &amp; product management</strong><span>AV engineering and ${e(p.currentRole)} in a global enterprise</span></li>
      </ol>
      <p><a class="link-arrow" href="${cfg.contact.linkedin}" rel="noopener" target="_blank">Full career history on LinkedIn</a></p>

      <h2>Education &amp; credentials</h2>
      <ul>
        <li>MBA, VIU Universidad Internacional de Valencia</li>
        <li>MSc Building Engineering &amp; Industrial Installations, University of Vigo</li>
        <li>Degree in IT &amp; Telecom Engineering, specialising in acoustics, image &amp; sound, La Salle Barcelona</li>
        <li>Data Science &amp; AI bootcamp, HACK A BOSS</li>
      </ul>
    </div>
  </div>
</section>
<section class="section section--alt">
  <div class="wrap">${collaboration(cfg, "h2")}</div>
</section>`
  };
}

export function book(cfg) {
  const b = cfg.book;
  return {
    path: "/book/", nav: "book",
    title: `${b.title}: ${b.subtitle} | Diego Gonzalez`,
    description: "AV PM for Rookies is a practical field guide to product management for Enterprise AV: product vs project thinking, discovery, strategy, roadmaps, prioritisation, outcomes, lifecycle and your first 90 days.",
    ogImage: "/assets/og/og-book.png",
    ogType: "book",
    jsonld: bookJsonLd(cfg),
    body: `
<section class="section section--dark">
  <div class="wrap">${bookBlock(cfg, { headingLevel: "h1" })}</div>
</section>
<section class="section">
  <div class="wrap--narrow prose">
    <blockquote>Stop just managing hardware installs. Start driving strategic product value.</blockquote>
    <p>Everyone has a request. Sales wants AI, support wants a dashboard and executives want new features. How do you decide what actually deserves to be built?</p>
    <p><em>AV PM for Rookies</em> is a practical field manual for the place where hardware, cloud software, workplace design and global enterprise operations meet. It follows a fictional team through the decisions that turn AV projects into AV products, with frameworks, tables and checklists you can use the next morning.</p>
    <h2>Who it's for</h2>
    <ul>
      <li>AV engineers, project managers and consultants moving into product roles</li>
      <li>Enterprise AV, UC and collaboration teams responsible for meeting-room estates</li>
      <li>Manufacturers and integrators who want to understand how enterprise customers decide</li>
      <li>Workplace technology, digital signage and device-management teams</li>
      <li>AV operations teams moving toward product thinking</li>
    </ul>
    <h2>What's inside</h2>
    <ul>
      <li><strong>The PM mindset shift:</strong> from managing deadlines to driving product value</li>
      <li><strong>Problem-first strategy:</strong> filtering feature noise to solve the real friction</li>
      <li><strong>The four core product risks:</strong> value, usability, feasibility and viability</li>
      <li><strong>Roadmaps, prioritisation and measurement</strong> that survive real stakeholders</li>
      <li><strong>The 90-day blueprint:</strong> a practical plan for your first three months</li>
    </ul>
    <div class="book__buy" style="margin-top:28px">
      <a class="btn" href="${b.amazonUrl}" rel="noopener" target="_blank" data-track="book-amazon">Buy on Amazon</a>
      <a class="btn btn--ghost" href="${b.gumroadUrl}" rel="noopener" target="_blank" data-track="book-gumroad">Get the digital edition on Gumroad</a>
    </div>
  </div>
</section>`
  };
}

export function insightsIndex(cfg, insights) {
  const featured = insights.find((i) => i.featured);
  const rest = insights.filter((i) => i !== featured);
  return {
    path: "/insights/", nav: "insights",
    title: "Insights on Enterprise AV, Product & Lifecycle | Diego Gonzalez",
    description: "Articles and weekly writing by Diego Gonzalez on Enterprise AV strategy, product thinking, standards, reliability, lifecycle and AI in AV operations.",
    body: `
<section class="page-hero">
  <div class="wrap">
    <span class="eyebrow">Insights</span>
    <h1>Notes from beyond the demo room</h1>
    <p class="lede">Published articles and weekly writing about what happens when AV technology meets real users, real operations and the full product lifecycle.</p>
  </div>
</section>
<section class="section--tight" style="padding-top:0">
  <div class="wrap">
    ${featured ? insightFeature(cfg, featured) + avweek(cfg) : ""}
    <div class="insight-grid">
      ${rest.map((i) => insightCard(cfg, i)).join("\n      ")}
    </div>
    <div class="contact-band">
      <p><strong>A new post every week on LinkedIn.</strong> Lifecycle, standards, reliability, AI and the occasional confession from twenty years in AV.</p>
      <div class="contact-band__ctas"><a class="btn btn--gold" href="${cfg.contact.linkedinActivity}" rel="noopener" target="_blank">${icons.linkedin} Read on LinkedIn</a></div>
    </div>
  </div>
</section>`
  };
}

export function insightPage(cfg, i, html) {
  return {
    path: `/insights/${i.slug}/`, nav: "insights",
    title: `${i.title} | Diego Gonzalez`,
    description: i.summary,
    ogType: "article",
    jsonld: { "@context": "https://schema.org", "@type": "Article", headline: i.title, datePublished: i.date, author: { "@type": "Person", name: cfg.person.name, url: abs(cfg, "/about/") } },
    body: `
<article class="section--tight">
  <div class="wrap--narrow">
    <p class="breadcrumbs"><a href="/insights/">Insights</a></p>
    <span class="eyebrow">${e(i.topic ?? "Essay")}</span>
    <h1>${e(i.title)}</h1>
    <div class="prose">${html}</div>
  </div>
</article>`
  };
}

export function contact(cfg) {
  return {
    path: "/contact/", nav: "contact",
    title: "Contact Diego Gonzalez | Speaking, Editorial & Selected Advisory",
    description: "Get in touch with Diego Gonzalez about speaking, podcasts, editorial pieces and selected advisory on Enterprise AV strategy, standards and AI in AV.",
    body: `
<section class="page-hero">
  <div class="wrap">
    <span class="eyebrow">Contact</span>
    <h1>Let's talk</h1>
    <p class="lede">${e(cfg.collaboration.text)} LinkedIn is the quickest way to reach me, and email works too.</p>
    <div class="hero__ctas" style="margin-top:24px">
      <a class="btn" href="${cfg.contact.linkedin}" rel="noopener" target="_blank" data-track="contact-linkedin">${icons.linkedin} Message me on LinkedIn</a>
      <a class="btn btn--ghost" ${mailAttrs(cfg, "Hello Diego")} data-track="contact-email">${icons.mail} <span data-mail-label>Send an email</span></a>
    </div>
  </div>
</section>`
  };
}

const LEGAL_UPDATED = "21 November 2026";

export function privacy(cfg) {
  const ga = cfg.analytics.provider === "goatcounter" && cfg.analytics.code;
  return {
    path: "/privacy/", nav: "",
    title: "Privacy Policy | Diego Gonzalez",
    description: "Privacy policy for diegogonzalez-av.github.io: no cookies, no accounts, and calculator inputs never leave your browser.",
    body: `
<section class="page-hero"><div class="wrap--narrow"><span class="eyebrow">Legal</span><h1>Privacy policy</h1><p class="muted">Last updated: ${LEGAL_UPDATED}</p></div></section>
<section class="section--tight" style="padding-top:0"><div class="wrap--narrow prose">
  <blockquote>In short: no cookies, no accounts, no forms. The calculators run in your browser and nothing you type is sent to or stored by this site.</blockquote>
  <h2>Who is responsible</h2>
  <p>This is the personal website of ${e(cfg.person.name)}, based in the United Kingdom. For any privacy question, <a ${mailAttrs(cfg, "Privacy question")}>contact me by email</a>.</p>
  <h2>Information this site collects</h2>
  <p>None directly. The site has no user accounts, sign-up, contact forms, comments or newsletter, and it does not use cookies or store anything on your device.</p>
  <h2>The calculators</h2>
  <p>All calculations run locally in your browser. Salaries, rates, room dimensions and every other value you enter are never transmitted to a server, logged or stored. Closing the page discards them.</p>
  <h2>Share links</h2>
  <p>If you choose to share a result, the link itself contains the shared figures. For the meeting cost calculator, salary or hourly rate is included only if you tick “Include my inputs”. Nothing is saved on a server. If you share to LinkedIn or X, those platforms process the post under their own privacy policies.</p>
  <h2>Hosting</h2>
  <p>The site is hosted on GitHub Pages, operated by GitHub, Inc. To deliver and secure the service, GitHub may process technical information such as your IP address in server logs. See the <a href="https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement" rel="noopener" target="_blank">GitHub General Privacy Statement</a>.</p>
  <h2>Analytics</h2>
  <p>${ga
    ? "This site uses GoatCounter, a privacy-friendly analytics service that sets no cookies and does not collect personal data, to count page views, referring websites and anonymous events such as “tool opened”, “calculation completed” and “share clicked”. Calculator values are never included."
    : "This site does not currently use analytics. If privacy-friendly, cookie-free analytics are added in future, they will count page views and anonymous events only (never calculator values), and this policy will be updated before they are switched on."}</p>
  <h2>Cookies</h2>
  <p>This site sets no cookies and stores nothing on your device, so no cookie banner is required.</p>
  <h2>If you email me</h2>
  <p>I use your name, email address and message only to reply to you. I don't add you to any list or share your details, and I delete correspondence when it is no longer needed.</p>
  <h2>External links</h2>
  <p>Links to LinkedIn, Amazon, Gumroad, publishers and standards bodies take you to sites with their own privacy policies.</p>
  <h2>Your rights</h2>
  <p>Under UK data protection law you can ask to access, correct or delete personal data I hold about you (in practice, only emails you have sent me). You can also complain to the <a href="https://ico.org.uk/" rel="noopener" target="_blank">Information Commissioner's Office</a>.</p>
  <h2>Changes</h2>
  <p>If this policy changes, the date at the top will be updated.</p>
</div></section>`
  };
}

export function terms(cfg) {
  return {
    path: "/terms/", nav: "",
    title: "Terms of Use | Diego Gonzalez",
    description: "Terms of use for diegogonzalez-av.github.io and its free tools: planning estimates provided as is, not professional advice.",
    body: `
<section class="page-hero"><div class="wrap--narrow"><span class="eyebrow">Legal</span><h1>Terms of use</h1><p class="muted">Last updated: ${LEGAL_UPDATED}</p></div></section>
<section class="section--tight" style="padding-top:0"><div class="wrap--narrow prose">
  <h2>The tools</h2>
  <p>The display size, meeting cost and room acoustics tools are free planning aids provided “as is” for general information. Their results are estimates based on the methods and assumptions documented on each tool page. They are not engineering, acoustic, financial or other professional advice. Verify important decisions with suitably qualified professionals and your own data.</p>
  <p>To the extent permitted by law, no liability is accepted for any loss arising from use of the tools or the content of this site.</p>
  <h2>Reference figures and standards</h2>
  <p>Reference prices are indicative list prices, dated when checked, and may change. References to standards and guidance (including AVIXA DISCAS, BB93 and others) describe how the tools apply published relationships. They do not reproduce those documents and do not imply endorsement by their publishers.</p>
  <h2>Trademarks</h2>
  <p>Product, platform and organisation names (including AVIXA, Microsoft Teams, Zoom, Google Meet, Cisco Webex, LinkedIn, Amazon and Gumroad) belong to their respective owners. No affiliation or endorsement is implied.</p>
  <h2>Content</h2>
  <p>Text, tools and images on this site are © ${e(cfg.person.name)} unless stated otherwise. You are welcome to share links and short quotes with attribution. Views expressed are my own and do not represent any employer.</p>
  <h2>Law</h2>
  <p>These terms are governed by the laws of England and Wales.</p>
</div></section>`
  };
}

export function notFound(cfg) {
  return {
    path: "/404.html", nav: "", noindex: true,
    title: "Page not found | Diego Gonzalez",
    description: "This page doesn't exist. Explore free Enterprise AV tools, insights and the book AV PM for Rookies instead.",
    body: `
<section class="section">
  <div class="wrap--narrow">
    <span class="eyebrow">404 · No signal</span>
    <h1>This input has nothing connected to it.</h1>
    <p class="lede">The page you were looking for doesn't exist or has moved.</p>
    <div class="hero__ctas" style="margin-top:24px"><a class="btn" href="/">Back to the home page</a><a class="btn btn--ghost" href="/tools/">Explore the tools</a></div>
  </div>
</section>`
  };
}

export function toolsIndex(cfg) {
  return {
    path: "/tools/", nav: "tools",
    title: "Free Enterprise AV & Workplace Tools | Diego Gonzalez",
    description: "Free tools for better meeting spaces: an AV display size calculator, a meeting cost calculator and a conference room acoustics (RT60) checker. No signup, all in your browser.",
    ogImage: "/assets/og/og-tools.png",
    jsonld: {
      "@context": "https://schema.org", "@type": "ItemList",
      itemListElement: TOOLS.map((t, n) => ({ "@type": "ListItem", position: n + 1, url: abs(cfg, `/tools/${t.slug}/`), name: t.name }))
    },
    body: `
<section class="page-hero">
  <div class="wrap">
    <span class="eyebrow">Free Enterprise AV &amp; workplace tools</span>
    <h1>Better rooms. Better meetings.</h1>
    <p class="lede">Practical tools for better meeting spaces and better meetings. No signup. No unnecessary complexity.</p>
  </div>
</section>
<section class="section--tight" style="padding-top:0">
  <div class="wrap">
    ${toolCards()}
    ${privacyLine()}
  </div>
</section>
<section class="section section--white">
  <div class="wrap--narrow prose">
    <span class="eyebrow">How these tools are built</span>
    <h2 style="margin-top:0">Simple on the surface, honest underneath</h2>
    <p>Each tool answers one real question in a few seconds. Every calculation runs in your browser, documents its method and sources, and states its limits. Where published guidance exists, the tools follow it. Where it doesn't, they say so instead of inventing precision.</p>
    <p>They are planning aids, not a substitute for a proper design, an acoustic survey or your own finance team. But they will tell you quickly whether you are asking the right question.</p>
  </div>
</section>`
  };
}

export function personJsonLd(cfg) {
  const p = cfg.person;
  return {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": abs(cfg, "/#person"),
    name: p.name,
    alternateName: p.alternateNames,
    url: abs(cfg, "/"),
    image: abs(cfg, p.portrait.square),
    jobTitle: p.jobTitle,
    description: "Enterprise AV specialist with nearly two decades across AV engineering, delivery, consulting and global Enterprise AV. Author of AV PM for Rookies.",
    homeLocation: { "@type": "Place", name: p.location },
    knowsAbout: ["Enterprise AV", "AV system design", "AV strategy", "AV product management", "Workplace technology", "Unified communications", "AV standards", "Product strategy", "Room acoustics", "Display sizing"],
    knowsLanguage: p.languages,
    sameAs: [cfg.contact.linkedin],
    subjectOf: cfg.recognition.filter((r) => r.url).map((r) => ({ "@type": "Article", headline: r.detail, url: r.url }))
  };
}

export function bookJsonLd(cfg) {
  const b = cfg.book;
  return {
    "@context": "https://schema.org",
    "@type": "Book",
    name: `${b.title}: ${b.subtitle}`,
    author: { "@type": "Person", name: b.author, url: abs(cfg, "/about/") },
    inLanguage: "en",
    image: abs(cfg, `${b.cover}-720.jpg`),
    url: abs(cfg, "/book/"),
    sameAs: [b.amazonUrl, b.gumroadUrl]
  };
}
