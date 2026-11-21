"""Generate Open Graph images and favicons. Run: python scripts/make_og.py (needs Pillow).
Outputs to assets/og/ and assets/img/. Re-run after changing headline copy or the portrait."""
from PIL import Image, ImageDraw, ImageFont, ImageFilter
from pathlib import Path
ROOT = Path(__file__).resolve().parent.parent
OG, IMG = ROOT / "assets/og", ROOT / "assets/img"
WF = Path("/mnt/c/Windows/Fonts")
def font(name, size):
    for p in [ROOT / "assets/fonts" / name, WF / name]:
        try: return ImageFont.truetype(str(p), size)
        except Exception: pass
    raise SystemExit(f"font missing: {name}")
SERIF = "SourceSerif4-500-700-normal.woff2"; SANS = "Inter-400-700-normal.woff2"; MONO = "IBMPlexMono-600-normal.woff2"
def serif(s): f = font(SERIF, s); 
def F(name, size, wght=None):
    f = font(name, size)
    if wght:
        try: f.set_variation_by_axes([wght] if "Inter" in name else [wght, 32])
        except Exception:
            try: f.set_variation_by_axes([wght])
            except Exception: pass
    return f
NAVY, NAVY2, GOLD, PAPER, MUTED = (7,27,46), (11,36,64), (227,184,46), (246,244,239), (169,182,200)
W, H = 1200, 630

def base():
    im = Image.new("RGB", (W, H), NAVY)
    g = Image.new("L", (W, H), 0); d = ImageDraw.Draw(g); d.ellipse((-300, -400, 900, 700), fill=70)
    im.paste(Image.new("RGB", (W, H), (22, 56, 96)), (0, 0), g.filter(ImageFilter.GaussianBlur(180)))
    return im

def wrap(d, text, f, width):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if d.textlength(t, font=f) <= width: cur = t
        else: lines.append(cur); cur = w
    lines.append(cur); return lines

def footer(d, right="Enterprise AV Strategy & Systems"):
    d.line((80, 540, W - 80, 540), fill=(40, 62, 92), width=2)
    d.text((80, 562), "DIEGO GONZALEZ", font=F(MONO, 22), fill=(232, 237, 244))
    f = F(MONO, 20); d.text((W - 80 - d.textlength(right.upper(), font=f), 564), right.upper(), font=f, fill=GOLD)

def headline(d, kicker, title, sub=None, x=80, width=1040, size=72):
    d.rectangle((x, 92, x + 56, 96), fill=GOLD)
    d.text((x, 118), kicker.upper(), font=F(MONO, 24), fill=GOLD)
    f = F(SERIF, size, 600); y = 170
    for line in wrap(d, title, f, width):
        d.text((x, y), line, font=f, fill="white"); y += int(size * 1.12)
    if sub:
        y += 14; fs = F(SANS, 30, 450)
        for line in wrap(d, sub, fs, width):
            d.text((x, y), line, font=fs, fill=MUTED); y += 42

# Home: portrait on the right
im = base(); d = ImageDraw.Draw(im)
por = Image.open(ROOT / "_source/Diego_Profile_ORIGINAL.png").convert("RGB")
por = por.crop((214, 40, 214 + 880, 40 + 1100)).resize((400, 500), Image.LANCZOS)
mask = Image.new("L", por.size, 0); ImageDraw.Draw(mask).rounded_rectangle((0, 0, *por.size), 22, fill=255)
im.paste(por, (W - 80 - 400, 65), mask)
headline(d, "Enterprise AV Strategy & Systems", "Enterprise AV, beyond the demo room.", None, width=600, size=60)
d.text((80, 470), "Diego Gonzalez · Author of AV PM for Rookies", font=F(SANS, 26, 500), fill=(232, 237, 244))
im.save(OG / "og-home.png", optimize=True)

def tool(name, kicker, title, sub, right):
    im = base(); d = ImageDraw.Draw(im)
    headline(d, kicker, title, sub, size=76)
    footer(d, right); im.save(OG / name, optimize=True)
tool("og-tools.png", "Free Enterprise AV & workplace tools", "Better rooms. Better meetings.", "Three fast tools for the questions every meeting space eventually has to answer.", "No signup · runs in your browser")
tool("og-display.png", "Can they see it?", "What size screen do I need?", "AV display size & viewing distance calculator, based on AVIXA DISCAS relationships.", "Free tool")
tool("og-meeting.png", "Meeting cost calculator", "Should this meeting have been an email?", "Calculate the real cost of your meeting in money and employee time.", "Free tool")
tool("og-acoustics.png", "Can they hear it?", "Will this room sound bad?", "Conference room acoustics & RT60 checker for speech and video conferencing.", "Free tool")

# Book
im = base(); d = ImageDraw.Draw(im)
cov = Image.open(ROOT / "_source/AVPMforRookies_FCover_ORIGINAL.png").convert("RGB").resize((320, 480), Image.LANCZOS)
sh = Image.new("RGBA", (380, 540), (0, 0, 0, 0)); ImageDraw.Draw(sh).rectangle((30, 30, 350, 510), fill=(0, 0, 0, 170)); sh = sh.filter(ImageFilter.GaussianBlur(16))
im.paste(sh, (W - 80 - 320 - 30, 75 - 15), sh); im.paste(cov, (W - 80 - 320, 75))
headline(d, "The book", "AV PM for Rookies", "A practical guide to product management for Enterprise AV, by Diego Gonzalez.", width=640, size=74)
im.save(OG / "og-book.png", optimize=True)

# Favicons
def fav(size):
    s = size * 4; im = Image.new("RGBA", (s, s), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle((0, 0, s - 1, s - 1), int(s * 0.22), fill=NAVY)
    f = F(MONO, int(s * 0.42)); tw = d.textlength("DG", font=f)
    d.text(((s - tw) / 2, s * 0.24), "DG", font=f, fill=GOLD)
    return im.resize((size, size), Image.LANCZOS)
fav(32).save(IMG / "favicon-32.png"); fav(180).convert("RGB").save(IMG / "apple-touch-icon.png")
(IMG / "favicon.svg").write_text('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64"><rect width="64" height="64" rx="14" fill="#071B2E"/><text x="32" y="41.5" text-anchor="middle" font-family="IBM Plex Mono,Consolas,monospace" font-weight="600" font-size="26" fill="#E3B82E">DG</text></svg>\n')
print("ok")
