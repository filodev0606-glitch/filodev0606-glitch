/**
 * Reconciles Next's segment-prefetch payloads with a plain file host.
 *
 *   node scripts/fix-export.mjs      (run automatically after `next build`)
 *
 * Next 16 prefetches a route's payload from a dot-joined path:
 *
 *   /id/jasa/pembuatan-aplikasi/__next.$d$locale.jasa.$d$service.__PAGE__.txt
 *
 * but `output: export` writes the same payload as nested directories:
 *
 *   out/id/jasa/pembuatan-aplikasi/__next.$d$locale/jasa/$d$service/__PAGE__.txt
 *
 * A Next server maps between the two. Firebase Hosting serves files, so the
 * prefetch 404s and every in-site link silently falls back to a full page
 * load. Rather than turning prefetching off, this writes the flattened name
 * alongside the nested one so both resolve.
 *
 * The files are small — a few KB each — so duplicating them costs nothing
 * next to the images.
 */

import { copyFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
  "out",
);

const PAYLOAD = "__PAGE__.txt";
const SEGMENT_ROOT = "__next.";

function walk(dir, found = []) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) walk(full, found);
    else if (entry === PAYLOAD) found.push(full);
  }
  return found;
}

let copied = 0;

for (const file of walk(OUT)) {
  const parts = path.relative(OUT, file).split(path.sep);

  /* Find the segment root — the first path component Next prefixed with
     "__next.". Everything from there down is what gets dot-joined. */
  const rootIndex = parts.findIndex((p) => p.startsWith(SEGMENT_ROOT));
  if (rootIndex === -1) continue;

  const base = parts.slice(0, rootIndex);
  const segments = parts.slice(rootIndex);

  // Already flat: the payload sits directly under the segment root.
  if (segments.length === 1) continue;

  const flat = segments.join(".");
  const target = path.join(OUT, ...base, flat);

  copyFileSync(file, target);
  copied++;
}

console.log(`fix-export: ${copied} prefetch payloads flattened`);
