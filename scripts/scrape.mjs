import { load } from 'cheerio';
import { mkdir, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';

const ORIGIN = 'https://www.george-guitars.com';

function isInternalUrl(url) {
  try {
    const u = new URL(url, ORIGIN);
    return u.origin === ORIGIN;
  } catch {
    return false;
  }
}

function normalizePathname(url) {
  const u = new URL(url, ORIGIN);
  // strip trailing slash (except root)
  let p = u.pathname.replace(/\/+$/, '');
  if (p === '') p = '/';
  return p;
}

function slugFromPathname(p) {
  if (p === '/') return 'index';
  return p.replace(/^\//, '').replace(/\//g, '-');
}

function cleanText(s) {
  return (s ?? '').replace(/\u00a0/g, ' ').replace(/[ \t]+\n/g, '\n').trim();
}

function stripCookiePolicy(text) {
  const idx = text.toLowerCase().indexOf('cookie policy');
  return idx >= 0 ? text.slice(0, idx).trim() : text.trim();
}

function extractPage(html, pathname) {
  const $ = load(html);

  // Remove obvious cookie modal text from extraction by dropping elements containing it
  $('*')
    .filter((_, el) => cleanText($(el).text()).toLowerCase().includes('cookie policy'))
    .each((_, el) => {
      // don't nuke entire body; just mark, we'll strip by text as well
      $(el).attr('data-cookie-policy', '1');
    });

  const h3s = $('h3')
    .toArray()
    .map((el) => cleanText($(el).text()))
    .filter(Boolean);

  const title =
    h3s.find((t) => !t.toLowerCase().includes('cookie policy')) ??
    cleanText($('title').first().text()) ??
    slugFromPathname(pathname);

  const bodyText = stripCookiePolicy(cleanText($('body').text()));

  // Heuristic extraction based on current site structure.
  // We favor headings that appear as plain text: "SPECIFICATIONS" and "ABOUT THIS PROJECT".
  const lines = bodyText.split('\n').map((l) => l.trim()).filter(Boolean);

  const specIdx = lines.findIndex((l) => l.toUpperCase() === 'SPECIFICATIONS');
  const aboutIdx = lines.findIndex((l) => l.toUpperCase() === 'ABOUT THIS PROJECT');

  const introLines = [];
  const specs = [];
  const aboutLines = [];
  const callouts = [];

  const afterTitleStart = (() => {
    const titleIdx = lines.findIndex((l) => l === title);
    return titleIdx >= 0 ? titleIdx + 1 : 0;
  })();

  const introEnd = Math.max(
    0,
    [specIdx, aboutIdx].filter((n) => n >= 0).sort((a, b) => a - b)[0] ?? lines.length
  );

  for (let i = afterTitleStart; i < introEnd; i++) introLines.push(lines[i]);

  if (specIdx >= 0) {
    for (let i = specIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (l.toUpperCase() === 'ABOUT THIS PROJECT') break;
      // specs on the site appear as bullet-ish lines in text extraction; keep short-ish ones
      if (l.length <= 160 && !/^(accept|reject|strictly necessary|performance)$/i.test(l)) {
        specs.push(l.replace(/^[•\-\*]\s*/, '').trim());
      }
    }
  }

  if (aboutIdx >= 0) {
    // collect until we hit the callouts (all-caps headings) or end
    for (let i = aboutIdx + 1; i < lines.length; i++) {
      const l = lines[i];
      if (/^[A-Z0-9][A-Z0-9 '&/-]{6,}$/.test(l) && l.length <= 60) break;
      aboutLines.push(l);
    }

    // callouts: ALLCAPS heading followed by one or more lines until next ALLCAPS heading
    for (let i = aboutIdx + 1; i < lines.length; i++) {
      const heading = lines[i];
      if (!(/^[A-Z0-9][A-Z0-9 '&/-]{6,}$/.test(heading) && heading.length <= 60)) continue;
      const chunks = [];
      for (let j = i + 1; j < lines.length; j++) {
        const l = lines[j];
        if (/^[A-Z0-9][A-Z0-9 '&/-]{6,}$/.test(l) && l.length <= 60) break;
        // stop if we run into cookie items
        if (/^(cookie policy|accept all|reject all|accept only selected|strictly necessary|performance)$/i.test(l))
          break;
        chunks.push(l);
      }
      const text = cleanText(chunks.join('\n'));
      if (text) callouts.push({ heading, text });
    }
  }

  return {
    pathname,
    slug: slugFromPathname(pathname),
    title,
    intro: cleanText(introLines.join('\n')),
    specs: specs.filter(Boolean),
    about: cleanText(aboutLines.join('\n')),
    callouts,
    rawTitleCandidates: h3s,
  };
}

function toFrontmatterYaml(page) {
  const escape = (s) => String(s ?? '').replace(/"/g, '\\"');
  const yamlList = (items) => items.map((x) => `  - "${escape(x)}"`).join('\n');
  const yamlCallouts = (items) =>
    items
      .map(
        (c) =>
          `  - heading: "${escape(c.heading)}"\n    text: "${escape(c.text).replace(/\n/g, '\\n')}"`
      )
      .join('\n');

  return `---\nslug: "${escape(page.slug)}"\ntitle: "${escape(page.title)}"\nintro: "${escape(page.intro)}"\nspecs:\n${yamlList(page.specs)}\ncallouts:\n${yamlCallouts(page.callouts)}\nsourcePath: "${escape(page.pathname)}"\n---\n`;
}

async function fetchText(url) {
  const res = await fetch(url, {
    headers: {
      'user-agent': 'george-guitars-rebuild-bot/1.0',
      accept: 'text/html,*/*',
    },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText} for ${url}`);
  return await res.text();
}

async function fetchBuffer(url) {
  const res = await fetch(url, {
    headers: { 'user-agent': 'george-guitars-rebuild-bot/1.0' },
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText} for ${url}`);
  const ab = await res.arrayBuffer();
  return Buffer.from(ab);
}

async function downloadImages(html, outDir, pageSlug) {
  const $ = load(html);
  const imgs = $('img')
    .toArray()
    .map((el) => $(el).attr('src'))
    .filter(Boolean)
    .map((src) => new URL(src, ORIGIN).toString());

  const unique = [...new Set(imgs)].filter((u) => isInternalUrl(u));
  if (unique.length === 0) return [];

  const pageDir = path.join(outDir, pageSlug);
  await mkdir(pageDir, { recursive: true });

  const downloaded = [];
  for (const url of unique) {
    try {
      const u = new URL(url);
      const base = path.basename(u.pathname) || 'image';
      const safe = base.replace(/[^a-zA-Z0-9._-]/g, '_');
      const buf = await fetchBuffer(url);
      const filePath = path.join(pageDir, safe);
      await writeFile(filePath, buf);
      downloaded.push({ url, filePath });
    } catch {
      // ignore individual failures
    }
  }
  return downloaded;
}

async function main() {
  const outContentDir = path.join(process.cwd(), 'src', 'content', 'builds');
  const outAssetsDir = path.join(process.cwd(), 'src', 'assets', 'builds');
  await mkdir(outContentDir, { recursive: true });
  await mkdir(outAssetsDir, { recursive: true });

  const startUrl = `${ORIGIN}/`;
  const queue = [startUrl];
  const seen = new Set();
  const pages = [];

  while (queue.length) {
    const url = queue.shift();
    const pathname = normalizePathname(url);
    if (seen.has(pathname)) continue;
    seen.add(pathname);

    // avoid obvious non-pages
    if (/\.(png|jpg|jpeg|webp|gif|svg|css|js|ico|pdf)$/i.test(pathname)) continue;

    let html;
    try {
      html = await fetchText(url);
    } catch {
      continue;
    }

    // enqueue links
    const $ = load(html);
    $('a[href]')
      .toArray()
      .map((el) => $(el).attr('href'))
      .filter(Boolean)
      .map((href) => new URL(href, ORIGIN).toString())
      .filter((u) => isInternalUrl(u))
      .forEach((u) => queue.push(u));

    // identify "build-like" pages: those containing SPECIFICATIONS + ABOUT THIS PROJECT
    const text = cleanText($('body').text()).toUpperCase();
    const isBuildPage = text.includes('SPECIFICATIONS') && text.includes('ABOUT THIS PROJECT');

    if (pathname === '/contact' || isBuildPage || pathname === '/' || pathname === '/guitars') {
      const extracted = extractPage(html, pathname);
      pages.push(extracted);

      if (isBuildPage) {
        const fm = toFrontmatterYaml(extracted);
        const md = `${fm}\n## Specifications\n\n${extracted.specs
          .map((s) => `- ${s}`)
          .join('\n')}\n\n## About this project\n\n${extracted.about}\n\n## Details\n\n${extracted.callouts
          .map((c) => `### ${c.heading}\n\n${c.text}\n`)
          .join('\n')}\n`;
        await writeFile(path.join(outContentDir, `${extracted.slug}.md`), md, 'utf8');
        await downloadImages(html, outAssetsDir, extracted.slug);
      }
    }
  }

  await writeFile(
    path.join(process.cwd(), 'src', 'content', 'scrape-manifest.json'),
    JSON.stringify({ origin: ORIGIN, crawled: [...seen], extractedPages: pages }, null, 2),
    'utf8'
  );

  // Ensure contact page capture exists as a simple JSON record for now
  const contact = pages.find((p) => p.pathname === '/contact');
  if (contact) {
    await writeFile(
      path.join(process.cwd(), 'src', 'content', 'contact.json'),
      JSON.stringify({ email: 'contact@george-guitars.com', sourcePath: '/contact' }, null, 2),
      'utf8'
    );
  }

  console.log(`Done. Extracted ${pages.length} pages; builds in ${outContentDir}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});

