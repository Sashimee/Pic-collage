// Renders the 1200x630 Open Graph card used as the link preview on Facebook,
// X, WhatsApp, Slack & co. Build-time only — it drives the Chromium that ships
// with the dev-dependency @playwright/test and writes public/og-image.png.
//
// Run with: npm run generate:og
import { chromium } from '@playwright/test'
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, resolve } from 'node:path'

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const OUT = resolve(ROOT, 'public', 'og-image.png')
const W = 1200
const H = 630

// The app mark, inlined from public/favicon.svg so the card can never drift
// away from the icon.
const MARK = readFileSync(resolve(ROOT, 'public', 'favicon.svg'), 'utf8')
  .replace(/<\?xml[^>]*\?>/, '')
  .replace('<svg ', '<svg width="118" height="118" ')

// A miniature collage stands in for a screenshot: real photos would need
// bundled assets and would date instantly.
const TILES = [
  { x: 0, y: 0, w: 2, h: 2, from: '#fbbf24', to: '#f97316' },
  { x: 2, y: 0, w: 2, h: 1, from: '#38bdf8', to: '#6366f1' },
  { x: 2, y: 1, w: 1, h: 1, from: '#34d399', to: '#0ea5e9' },
  { x: 3, y: 1, w: 1, h: 1, from: '#f472b6', to: '#a855f7' },
  { x: 0, y: 2, w: 1, h: 1, from: '#a855f7', to: '#6366f1' },
  { x: 1, y: 2, w: 3, h: 1, from: '#fda4af', to: '#fb7185' },
]
const UNIT = 96
const GAP = 10

const tiles = TILES.map(
  (t, i) => `
  <div class="tile" style="
    left:${t.x * UNIT}px; top:${t.y * UNIT}px;
    width:${t.w * UNIT - GAP}px; height:${t.h * UNIT - GAP}px;
    background:linear-gradient(135deg, ${t.from}, ${t.to});
    --i:${i};
  "></div>`,
).join('')

const html = `
<style>
  @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@400;600;800&display=swap');
  * { margin:0; padding:0; box-sizing:border-box; }
  body {
    width:${W}px; height:${H}px; overflow:hidden;
    font-family:Poppins, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif;
    background:#0b1020;
    color:#f8fafc;
    display:flex; align-items:center; gap:44px; padding:0 64px;
    position:relative;
  }
  body::before {
    content:''; position:absolute; inset:0;
    background:
      radial-gradient(760px 520px at 12% -12%, rgba(99,102,241,.55), transparent 62%),
      radial-gradient(720px 560px at 108% 118%, rgba(236,72,153,.5), transparent 60%);
  }
  .left { position:relative; width:566px; flex-shrink:0; }
  .brand { display:flex; align-items:center; gap:20px; margin-bottom:30px; }
  .brand svg { border-radius:26px; box-shadow:0 18px 44px -14px rgba(0,0,0,.75); }
  .wordmark { font-size:40px; font-weight:800; letter-spacing:-.6px; line-height:1.1; }
  .wordmark span {
    display:block; font-size:16px; font-weight:600; letter-spacing:2.6px;
    text-transform:uppercase; color:#c7d2fe; margin-top:6px;
  }
  h1 { font-size:57px; font-weight:800; line-height:1.06; letter-spacing:-1.6px; }
  h1 em {
    font-style:normal;
    background:linear-gradient(100deg,#a5b4fc,#f9a8d4);
    -webkit-background-clip:text; background-clip:text; color:transparent;
  }
  p { margin-top:20px; font-size:23px; line-height:1.5; color:#cbd5e1; max-width:540px; }
  .pills { display:flex; gap:10px; margin-top:32px; flex-wrap:wrap; }
  .pill {
    font-size:17px; font-weight:600; padding:9px 18px; border-radius:999px;
    background:rgba(255,255,255,.09); border:1px solid rgba(255,255,255,.16);
    color:#e2e8f0;
  }
  .board {
    position:relative; width:${4 * UNIT}px; height:${3 * UNIT}px;
    padding:${GAP}px; border-radius:30px; background:#fff;
    box-shadow:0 40px 90px -26px rgba(0,0,0,.75);
    transform:rotate(-3.5deg) scale(1.1); transform-origin:center;
    flex-shrink:0; margin-left:auto;
  }
  .inner { position:relative; width:100%; height:100%; }
  .tile { position:absolute; border-radius:14px; }
</style>
<div class="left">
  <div class="brand">
    ${MARK}
    <div class="wordmark">Pic Collage Maker<span>100% in your browser</span></div>
  </div>
  <h1>Make a collage.<br /><em>Your photos stay on your phone.</em></h1>
  <p>Grids, freehand layouts, filters, text &amp; stickers — no account, no uploads, no app store.</p>
  <div class="pills">
    <div class="pill">Free &amp; offline</div>
    <div class="pill">Installable</div>
    <div class="pill">6 languages</div>
  </div>
</div>
<div class="board"><div class="inner">${tiles}</div></div>
`

const browser = await chromium.launch(
  existsSync('/opt/pw-browsers/chromium') ? { executablePath: '/opt/pw-browsers/chromium' } : {},
)
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 })
await page.setContent(html, { waitUntil: 'networkidle' })
await page.evaluate(() => document.fonts.ready)
await page.screenshot({ path: OUT })
await browser.close()
console.log('wrote', OUT)
