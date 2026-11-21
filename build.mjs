// Static site build: zero dependencies. `node build.mjs` → dist/
import { readFile, writeFile, mkdir, rm, cp, readdir } from "node:fs/promises";
import { createHash } from "node:crypto";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { parseFrontMatter, markdownToHtml } from "./lib/markdown.mjs";
import { layout, abs } from "./src/templates/layout.mjs";
import * as P from "./src/templates/pages.mjs";
import { displayTool, meetingTool, acousticsTool } from "./src/templates/tools.mjs";

const ROOT = fileURLToPath(new URL(".", import.meta.url)); // works on Windows, macOS and Linux
const DIST = join(ROOT, "dist");
const cfg = JSON.parse(await readFile(join(ROOT, "site.config.json"), "utf8"));
const data = JSON.parse(await readFile(join(ROOT, "data/tools.json"), "utf8"));

const hash = (s) => createHash("sha256").update(s).digest("hex").slice(0, 10);
async function write(rel, content) {
  const f = join(DIST, rel);
  await mkdir(dirname(f), { recursive: true });
  await writeFile(f, content);
}

// ---- content ----
async function loadInsights() {
  const dir = join(ROOT, "content/insights");
  const files = (await readdir(dir)).filter((f) => f.endsWith(".md")).sort();
  const items = [];
  for (const f of files) {
    const { data: d, body } = parseFrontMatter(await readFile(join(dir, f), "utf8"));
    if (d.draft) continue;
    const slug = d.slug || f.replace(/^\d+-/, "").replace(/\.md$/, "");
    items.push({ ...d, slug, body: body.trim() });
  }
  return items.sort((a, b) => (a.order ?? 99) - (b.order ?? 99) || String(b.date ?? "").localeCompare(String(a.date ?? "")));
}

await rm(DIST, { recursive: true, force: true });
await mkdir(DIST, { recursive: true });

// ---- assets ----
await cp(join(ROOT, "assets"), join(DIST, "assets"), { recursive: true });
const css = (await readFile(join(ROOT, "src/styles/fonts.css"), "utf8")) + "\n" + (await readFile(join(ROOT, "src/styles/site.css"), "utf8"));
await write("assets/css/site.css", css);
const siteJs = await readFile(join(ROOT, "src/js/site.js"), "utf8");
await write("assets/js/site.js", siteJs);
await write("assets/js/tools/tool-common.mjs", await readFile(join(ROOT, "src/js/tool-common.mjs"), "utf8"));
for (const tool of ["display", "meeting", "acoustics"]) {
  for (const f of ["calc.mjs", "strings.mjs", "ui.js"]) {
    await write(`assets/js/tools/${tool}/${f}`, await readFile(join(ROOT, `src/tools/${tool}/${f}`), "utf8"));
  }
}
const assets = { cssHash: hash(css), jsHash: hash(siteJs) };

// ---- pages ----
const insights = await loadInsights();
const pages = [
  P.home(cfg, insights), P.about(cfg), P.book(cfg), P.insightsIndex(cfg, insights), P.contact(cfg), P.privacy(cfg), P.terms(cfg),
  P.toolsIndex(cfg), displayTool(cfg, data), meetingTool(cfg, data), acousticsTool(cfg, data), P.notFound(cfg)
];
for (const i of insights.filter((x) => !x.url && x.body)) pages.push(P.insightPage(cfg, i, markdownToHtml(i.body)));

const problems = [];
for (const page of pages) {
  const html = layout(cfg, page, assets);
  for (const bad of [/\bTODO\b/, /PLACEHOLDER/i, /lorem ipsum/i, /\$\{/, /undefined/, /\bnull\b(?![^<]*<\/script>)/]) {
    const m = html.replace(/<script type="application\/(ld\+)?json"[\s\S]*?<\/script>/g, "").match(bad);
    if (m) problems.push(`${page.path}: suspicious text ${bad} → "${html.substr(Math.max(0, m.index - 40), 100).replace(/\s+/g, " ")}"`);
  }
  const out = page.path.endsWith(".html") ? page.path.slice(1) : join(page.path.slice(1), "index.html");
  await write(out, html);
}

// ---- SEO files ----
const today = new Date().toISOString().slice(0, 10);
const urls = pages.filter((p) => !p.noindex).map((p) => `  <url><loc>${abs(cfg, p.path)}</loc><lastmod>${today}</lastmod></url>`);
await write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.join("\n")}\n</urlset>\n`);
await write("robots.txt", `User-agent: *\nAllow: /\n\nSitemap: ${abs(cfg, "/sitemap.xml")}\n`);
await write(".nojekyll", "");
if (cfg.site.cname) await write("CNAME", cfg.site.cname + "\n");

if (problems.length) {
  console.error("Build produced suspicious output:\n" + problems.join("\n"));
  process.exit(1);
}
console.log(`Built ${pages.length} pages → dist/  (css ${assets.cssHash}, js ${assets.jsHash})`);
