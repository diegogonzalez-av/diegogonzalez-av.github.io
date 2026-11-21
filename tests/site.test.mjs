// Checks the built site in dist/ (run `npm run build` first).
import test from "node:test";
import assert from "node:assert/strict";
import { readFile, readdir, stat } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
const DIST = fileURLToPath(new URL("../dist/", import.meta.url));
const rel = (f) => f.replace(DIST, "").replace(/\\/g, "/"); // portable relative path
const cfg = JSON.parse(await readFile(new URL("../site.config.json", import.meta.url), "utf8"));

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...await walk(p)); else out.push(p);
  }
  return out;
}
const files = await walk(DIST);
const html = files.filter((f) => f.endsWith(".html"));
const exists = async (p) => { try { await stat(p); return true; } catch { return false; } };

test("expected pages exist", () => {
  for (const p of ["index.html", "about/index.html", "book/index.html", "insights/index.html", "contact/index.html", "privacy/index.html", "terms/index.html", "tools/index.html",
    "tools/display-size-calculator/index.html", "tools/meeting-cost-calculator/index.html", "tools/room-acoustics-checker/index.html", "404.html", "sitemap.xml", "robots.txt"]) {
    assert.ok(files.includes(join(DIST, p)), `missing ${p}`);
  }
});

test("every internal link and asset resolves", async () => {
  const missing = [];
  for (const f of html) {
    const s = await readFile(f, "utf8");
    for (const m of s.matchAll(/(?:href|src|srcset)="([^"]+)"/g)) {
      for (let url of m[1].split(",").map((x) => x.trim().split(" ")[0])) {
        if (!url.startsWith("/") || url.startsWith("//")) continue;
        url = url.split("#")[0].split("?")[0];
        let p = join(DIST, url);
        if (url.endsWith("/")) p = join(p, "index.html");
        if (!(await exists(p))) missing.push(`${f.replace(DIST, "")} → ${url}`);
      }
    }
  }
  assert.deepEqual(missing, []);
});

test("JS module imports resolve", async () => {
  for (const f of files.filter((x) => /assets\/js\/tools\/.*\.(js|mjs)$/.test(x.replace(/\\/g, "/")))) {
    const s = await readFile(f, "utf8");
    for (const m of s.matchAll(/from\s+"(\.[^"]+)"/g)) assert.ok(await exists(join(f, "..", m[1])), `${f}: ${m[1]}`);
  }
});

test("SEO metadata on every page", async () => {
  for (const f of html) {
    const s = await readFile(f, "utf8");
    const name = f.replace(DIST, "");
    assert.match(s, /<title>[^<]{10,}<\/title>/, `${name} title`);
    assert.match(s, /<meta name="description" content="[^"]{50,}">/, `${name} description`);
    assert.match(s, /<link rel="canonical" href="https:\/\//, `${name} canonical`);
    assert.match(s, /<meta property="og:image" content="https:\/\/[^"]+\.png">/, `${name} og:image`);
    assert.match(s, /<meta name="twitter:card"/, `${name} twitter`);
    assert.equal((s.match(/<h1[\s>]/g) || []).length, 1, `${name} must have exactly one h1`);
    for (const img of s.matchAll(/<img\b[^>]*>/g)) assert.match(img[0], /\balt="/, `${name} img without alt`);
  }
});

test("JSON-LD is valid JSON", async () => {
  for (const f of html) {
    const s = await readFile(f, "utf8");
    for (const m of s.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) JSON.parse(m[1]);
  }
});

test("no placeholder, invented or confidential content", async () => {
  for (const f of files.filter((x) => /\.(html|js|mjs|xml|txt)$/.test(x))) {
    const s = (await readFile(f, "utf8")).replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "");
    const name = f.replace(DIST, "");
    for (const bad of [/TODO/, /PLACEHOLDER/i, /lorem ipsum/i, /TU-LINK/i, /calendly/i, /example\.com/, /Bloomberg/i, /affiliate/i, /data-set-lang/, /[áéíóúñ¿¡]/, /\bCTS\b/, /DGAVIT/i, /localStorage/]) assert.doesNotMatch(s, bad, `${name} contains ${bad}`);
  }
});

test("book links come only from config and are the verified URLs", async () => {
  const s = await readFile(join(DIST, "book/index.html"), "utf8");
  assert.ok(s.includes(cfg.book.amazonUrl) && s.includes(cfg.book.gumroadUrl));
  for (const f of html) {
    const t = await readFile(f, "utf8");
    for (const m of t.matchAll(/href="(https:\/\/[^"]*(amazon|gumroad)[^"]*)"/g)) assert.ok([cfg.book.amazonUrl, cfg.book.gumroadUrl].includes(m[1]), `${f}: unexpected ${m[1]}`);
  }
});

test("sitemap lists every indexable page with the configured domain", async () => {
  const s = await readFile(join(DIST, "sitemap.xml"), "utf8");
  for (const p of ["/", "/tools/", "/tools/meeting-cost-calculator/", "/book/", "/about/"]) assert.ok(s.includes(`<loc>${cfg.site.url}${p}</loc>`), p);
  assert.ok(!s.includes("404"));
});

test("no third-party requests except optional analytics", async () => {
  for (const f of html) {
    const s = await readFile(f, "utf8");
    for (const m of s.matchAll(/<(?:script|link)\b[^>]*(?:src|href)="(https?:)?\/\/([^/"]+)/g)) {
      if (/rel="canonical"/.test(m[0])) continue;
      assert.fail(`${f.replace(DIST, "")} loads from ${m[2]}`);
    }
  }
});
