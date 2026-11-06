/**
 * Builds the Open Graph share card.
 *
 *   node scripts/generate-og.mjs
 *
 * Every link sent on WhatsApp, Instagram or LinkedIn was rendering as a bare
 * grey box, which for a studio that sells visual work is the worst possible
 * first impression.
 *
 * Composited here with sharp rather than at request time with next/og: that
 * route can only emit PNG, and a photograph as PNG came out at 2 MB. The same
 * card as JPEG is roughly a tenth of that, and share-card scrapers are not
 * patient.
 *
 * The result is committed like the other derived assets, so a build never
 * depends on which fonts happen to exist on the machine doing the building.
 *
 * That also means the card goes stale silently. It sat for weeks reading
 * "We Build Digital Experience" — the singular the site itself had already
 * been corrected away from — over a "Jelajahi Karya Kami" button that no
 * longer existed anywhere. Re-run this whenever the hero copy changes.
 */

import { existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const SOURCE = path.join(ROOT, "design", "source");
const ASSETS = path.join(ROOT, "public", "assets");

const W = 1200;
const H = 630;

/* Whatever the build machine has. The card is generated once and committed,
   so this list only has to satisfy the machine running this script. */
const SANS = "Instrument Sans, Segoe UI, Helvetica, Arial, sans-serif";

const overlay = () =>
  Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="shade" x1="0" y1="0" x2="1" y2="0.25">
      <stop offset="0" stop-color="#020c09" stop-opacity="0.94"/>
      <stop offset="0.44" stop-color="#020c09" stop-opacity="0.74"/>
      <stop offset="0.82" stop-color="#020c09" stop-opacity="0.12"/>
      <stop offset="1" stop-color="#020c09" stop-opacity="0.05"/>
    </linearGradient>
  </defs>

  <rect width="${W}" height="${H}" fill="url(#shade)"/>

  <circle cx="88" cy="150" r="7" fill="#9fdcd0"/>
  <text x="112" y="160" font-family="${SANS}" font-size="27" letter-spacing="8" fill="#edf5ee">FILODEV</text>

  <text x="80" y="288" font-family="${SANS}" font-size="64" font-weight="600" fill="#edf5ee">We Build Digital</text>
  <text x="80" y="360" font-family="${SANS}" font-size="64" font-weight="600" fill="#edf5ee">Experiences</text>

  <text x="80" y="430" font-family="${SANS}" font-size="25" fill="#b8d0c2">Jasa pembuatan aplikasi Android, website,</text>
  <text x="80" y="468" font-family="${SANS}" font-size="25" fill="#b8d0c2">dan integrasi AI. Dua aplikasi tayang di Google Play.</text>

  <rect x="80" y="516" width="318" height="54" rx="6" fill="#9fdcd0"/>
  <text x="239" y="551" text-anchor="middle" font-family="${SANS}" font-size="22" font-weight="600" fill="#06231f">Konsultasi Gratis</text>
</svg>`);

const sources = existsSync(SOURCE)
  ? readdirSync(SOURCE).filter((f) => /\.(png|jpe?g|webp)$/i.test(f))
  : [];

/* Prefer the untouched source render; fall back to the shipped WebP so this
   still works for anyone who only has the repository. */
const source =
  sources
    .filter((f) => f.toLowerCase().includes("hero-source-c"))
    .map((f) => path.join(SOURCE, f))
    .find(Boolean) ?? path.join(ASSETS, "filodev-hero.webp");

if (!existsSync(source)) {
  console.error("Missing visual asset: /public/assets/filodev-hero.webp");
  process.exit(1);
}

const to = path.join(ASSETS, "og.jpg");

const base = await sharp(source)
  // "attention" keeps the falls in frame rather than centre-cropping them out.
  .resize(W, H, { fit: "cover", position: "attention" })
  .toBuffer();

await sharp(base)
  .composite([{ input: overlay(), top: 0, left: 0 }])
  .jpeg({ quality: 84, mozjpeg: true })
  .toFile(to);

console.log(`og.jpg  ${W}x${H}  ${(statSync(to).size / 1024).toFixed(0)}KB`);
