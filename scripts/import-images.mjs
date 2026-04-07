import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

/**
 * Usage:
 *   node scripts/import-images.mjs --slug cosmo --out src/assets/builds/cosmo --urls < urls.txt
 *   node scripts/import-images.mjs --slug blue-yellow --out src/assets/builds/blue-yellow --from-md src/content/builds/blue-yellow.md
 *
 * Expects one URL per line on stdin.
 */

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--slug') args.slug = argv[++i];
    else if (a === '--out') args.out = argv[++i];
    else if (a === '--from-md') args.fromMd = argv[++i];
  }
  return args;
}

async function readStdin() {
  const chunks = [];
  for await (const c of process.stdin) chunks.push(c);
  return Buffer.concat(chunks).toString('utf8');
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'george-guitars-image-import/1.0' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

function filenameFromUrl(url, idx) {
  const u = new URL(url);
  const base = path.basename(u.pathname) || `image-${idx + 1}`;
  const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
  return safe;
}

async function main() {
  const { slug, out, fromMd } = parseArgs(process.argv);
  if (!slug || !out) {
    console.error('Missing --slug or --out');
    process.exit(1);
  }

  const input = fromMd ? await readFile(fromMd, 'utf8') : await readStdin();
  const urls = input
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l && !l.startsWith('#'))
    .map((l) => l.replace(/^[-*]\s+/, ''))
    .filter((l) => /^https?:\/\//i.test(l));

  await mkdir(out, { recursive: true });

  const manifest = [];
  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const filename = filenameFromUrl(url, i);
    const buf = await fetchBuffer(url);
    const dest = path.join(out, filename);
    await writeFile(dest, buf);
    manifest.push({ slug, src: `/assets/builds/${slug}/${filename}`, filename, url });
    console.log(`Downloaded ${filename}`);
  }

  const manifestPath = path.join(out, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2), 'utf8');
  console.log(`Wrote ${manifestPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

