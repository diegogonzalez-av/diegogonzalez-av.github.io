import { escapeHtml as e } from "../../lib/markdown.mjs";

export const icons = {
  display: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="2.5" y="4" width="19" height="12" rx="1.5"/><path d="M8 20h8M12 16v4"/><path d="M6 8.5h5M6 11.5h8" opacity=".6"/></svg>',
  meeting: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/><path d="M17.5 3.5l2 2M6.5 3.5l-2 2" opacity=".6"/></svg>',
  acoustics: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 12h2M7 8v8M11 5v14M15 9v6M19 11v2"/></svg>',
  lock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="10.5" width="16" height="10" rx="2"/><path d="M8 10.5V7a4 4 0 0 1 8 0v3.5"/></svg>',
  linkedin: '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.85-3.04-1.85 0-2.14 1.45-2.14 2.94v5.67H9.35V9h3.41v1.56h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.13 2.06 2.06 0 0 1 0 4.13zM7.12 20.45H3.56V9h3.56v11.45zM22.22 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.45c.98 0 1.78-.77 1.78-1.73V1.73C24 .77 23.2 0 22.22 0z"/></svg>',
  mail: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3.5 6.5 8.5 6.5 8.5-6.5"/></svg>',
  check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m5 12.5 4.5 4.5L19 7.5"/></svg>',
  alert: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="M12 6v8M12 18.5v.01"/></svg>',
  cross: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" aria-hidden="true"><path d="m7 7 10 10M17 7 7 17"/></svg>'
};

export const NAV = [
  { href: "/tools/", label: "Tools", key: "tools" },
  { href: "/insights/", label: "Insights", key: "insights" },
  { href: "/book/", label: "Book", key: "book" },
  { href: "/about/", label: "About", key: "about" }
];

export function abs(cfg, path) { return cfg.site.url.replace(/\/$/, "") + path; }

export function layout(cfg, page, assets) {
  const title = page.title ?? cfg.site.defaultTitle;
  const desc = page.description ?? cfg.site.defaultDescription;
  const canonical = abs(cfg, page.path);
  const og = abs(cfg, page.ogImage ?? cfg.site.ogImage);
  const jsonld = page.jsonld ? `<script type="application/ld+json">${JSON.stringify(page.jsonld).replace(/</g, "\\u003c")}</script>` : "";
  const a = cfg.analytics;
  const analytics = a && a.provider === "goatcounter" && a.code
    ? `<script data-goatcounter="https://${e(a.code)}.goatcounter.com/count" async src="https://gc.zgo.at/count.js"></script>`
    : "";
  return `<!DOCTYPE html>
<html lang="${page.lang ?? "en"}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${e(title)}</title>
<meta name="description" content="${e(desc)}">
<link rel="canonical" href="${canonical}">
${page.noindex ? '<meta name="robots" content="noindex">' : ""}
<meta name="theme-color" content="${cfg.site.themeColor}">
${cfg.site.googleSiteVerification ? `<meta name="google-site-verification" content="${e(cfg.site.googleSiteVerification)}">` : ""}
<meta name="author" content="${e(cfg.person.name)}">
<meta property="og:site_name" content="${e(cfg.site.name)}">
<meta property="og:type" content="${page.ogType ?? "website"}">
<meta property="og:locale" content="${cfg.site.locale}">
<meta property="og:title" content="${e(page.ogTitle ?? title)}">
<meta property="og:description" content="${e(desc)}">
<meta property="og:url" content="${canonical}">
<meta property="og:image" content="${og}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${e(page.ogAlt ?? title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${e(page.ogTitle ?? title)}">
<meta name="twitter:description" content="${e(desc)}">
<meta name="twitter:image" content="${og}">
<link rel="icon" href="/assets/img/favicon.svg" type="image/svg+xml">
<link rel="icon" href="/assets/img/favicon-32.png" sizes="32x32" type="image/png">
<link rel="apple-touch-icon" href="/assets/img/apple-touch-icon.png">
<link rel="preload" href="/assets/fonts/Inter-400-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="/assets/fonts/SourceSerif4-500-700-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="/assets/css/site.css?v=${assets.cssHash}">
${jsonld}
${analytics}
</head>
<body${page.bodyClass ? ` class="${page.bodyClass}"` : ""}>
<a class="skip" href="#main">Skip to content</a>
${header(cfg, page.nav)}
<main id="main">
${page.body}
</main>
${footer(cfg)}
<script src="/assets/js/site.js?v=${assets.jsHash}" defer></script>
${page.scripts ?? ""}
</body>
</html>
`;
}

function header(cfg, active) {
  return `<header class="site-header">
  <div class="wrap site-header__inner">
    <a class="brand" href="/" aria-label="${e(cfg.person.name)}: home">
      ${avatar(cfg)}
      <span class="brand__text"><span class="brand__name">${e(cfg.person.name)}</span><span class="brand__tag">${e(cfg.person.tagline)}</span></span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav"><span></span><span></span><span></span><span class="sr-only">Menu</span></button>
    <nav class="nav" id="site-nav" aria-label="Main">
      ${NAV.map((n) => `<a href="${n.href}"${n.key === active ? ' aria-current="page"' : ""}>${n.label}</a>`).join("\n      ")}
      <a class="btn btn--sm" href="/contact/"${active === "contact" ? ' aria-current="page"' : ""}>Contact</a>
    </nav>
  </div>
</header>`;
}

function footer(cfg) {
  const year = new Date().getFullYear();
  return `<footer class="site-footer">
  <div class="wrap">
    <div class="site-footer__grid">
      <div>
        <a class="brand" href="/">${avatar(cfg)}<span class="brand__text"><span class="brand__name">${e(cfg.person.name)}</span><span class="brand__tag">${e(cfg.person.tagline)}</span></span></a>
        <p class="site-footer__motto">Better AV decisions.<br>Better experiences.<br>Better outcomes.</p>
      </div>
      <div>
        <h2>Free tools</h2>
        <ul>
          <li><a href="/tools/display-size-calculator/">Display size calculator</a></li>
          <li><a href="/tools/meeting-cost-calculator/">Meeting cost calculator</a></li>
          <li><a href="/tools/room-acoustics-checker/">Room acoustics checker</a></li>
        </ul>
      </div>
      <div>
        <h2>Read</h2>
        <ul>
          <li><a href="/insights/">Insights</a></li>
          <li><a href="/book/">AV PM for Rookies</a></li>
          <li><a href="${cfg.contact.linkedinActivity}" rel="noopener" target="_blank">Weekly posts on LinkedIn</a></li>
        </ul>
      </div>
      <div>
        <h2>Connect</h2>
        <ul>
          <li><a href="/about/">About</a></li>
          <li><a href="/contact/">Contact</a></li>
          <li><a href="${cfg.contact.linkedin}" rel="noopener" target="_blank">LinkedIn</a></li>
        </ul>
      </div>
    </div>
    <div class="site-footer__base">
      <p>© ${year} ${e(cfg.person.name)}. Views are my own and do not represent any employer.</p>
      <p>No cookies. Calculator inputs never leave your browser. <a href="/privacy/">Privacy</a> · <a href="/terms/">Terms</a></p>
    </div>
  </div>
</footer>`;
}

function avatar(cfg) {
  const a = cfg.person.portrait.avatar;
  return `<picture class="brand__avatar"><source type="image/webp" srcset="${a}-96.webp 1x, ${a}-192.webp 2x"><img src="${a}-96.jpg" srcset="${a}-192.jpg 2x" alt="" width="44" height="44"></picture>`;
}

export function picture({ base, widths, sizes, alt, eager = false, w, h, cls = "" }) {
  const set = (ext) => widths.map((x) => `${base}-${x}.${ext} ${x}w`).join(", ");
  return `<picture${cls ? ` class="${cls}"` : ""}>
  <source type="image/avif" srcset="${set("avif")}" sizes="${sizes}">
  <source type="image/webp" srcset="${set("webp")}" sizes="${sizes}">
  <img src="${base}-${widths[widths.length - 1]}.jpg" srcset="${set("jpg")}" sizes="${sizes}" alt="${e(alt)}" width="${w}" height="${h}" ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async">
</picture>`;
}

export function mailto(cfg, subject) {
  return `mailto:${cfg.contact.email}?subject=${encodeURIComponent(subject)}`;
}
