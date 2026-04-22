#!/usr/bin/env node
/**
 * scrape-jobs.js — Playwright scraper for Web3 job boards
 *
 * Usage:  node scrape-jobs.js <board>
 * Boards: wellfound | web3career | jobstash
 *
 * Outputs a JSON array of { source, url, title, company, raw_text } to stdout.
 * Progress/errors go to stderr.
 */

const { chromium } = require('playwright');

// ─── URLs to scrape per board ─────────────────────────────────────────────────

const URLS = {
  jobstash: [
    'https://jobstash.xyz/jobs',
    'https://jobstash.xyz/t-typescript',
    'https://jobstash.xyz/t-react',
  ],
  web3career: [
    'https://web3.career/',
    'https://web3.career/typescript-jobs',
    'https://web3.career/full-stack-jobs',
  ],
  wellfound: [
    'https://wellfound.com/jobs?query=web3+typescript+senior&remote=true',
    'https://wellfound.com/jobs?query=defi+founding+engineer&remote=true',
    'https://wellfound.com/jobs?query=blockchain+tech+lead&remote=true',
  ],
};

// ─── Browser helpers ──────────────────────────────────────────────────────────

async function loadPage(page, url) {
  try {
    await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
  } catch {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
  }
  // Scroll to trigger lazy loading
  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => window.scrollBy(0, window.innerHeight));
    await page.waitForTimeout(600);
  }
}

// ─── Dedup ────────────────────────────────────────────────────────────────────

function dedup(jobs) {
  const seen = new Set();
  return jobs.filter((j) => {
    const key = j.url || j.title;
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return (j.raw_text || '').length > 20;
  });
}

// ─── jobstash.xyz ─────────────────────────────────────────────────────────────
// Job cards each end with an <a> whose text is "View Details".
// The href is the canonical job URL: /slug-company/6charID
// Grab the container above it for context.

async function extractJobstash(page) {
  return page.evaluate(() => {
    const results = [];

    // "View Details" anchors are the reliable job-card anchors
    const detailLinks = [...document.querySelectorAll('a')].filter(
      (a) => a.innerText.trim() === 'View Details' && a.href.includes('jobstash.xyz'),
    );

    detailLinks.forEach((link) => {
      // Walk up to find a reasonable card boundary (stop at body)
      let container = link.parentElement;
      for (let i = 0; i < 6; i++) {
        if (!container || container === document.body) break;
        // A card typically has at least 3 newline-separated blocks of text
        if (container.innerText.split('\n').filter((l) => l.trim()).length >= 4) break;
        container = container.parentElement;
      }

      const raw = container ? container.innerText.trim() : '';
      // Strip UI noise from card text before extracting title/company
      const NOISE = new Set(['urgently hiring', 'check eligibility', 'jobs for you', 'view details', 'view organization details']);
      const lines = raw.split('\n')
        .map((l) => l.trim())
        .filter((l) => l.length > 2 && !NOISE.has(l.toLowerCase()));
      const title = lines[0] || '';
      // Company is usually "CompanyName·date" — grab part before ·
      const company = lines[1] ? lines[1].split('·')[0].trim() : '';

      results.push({
        source: 'jobstash.xyz',
        url: link.href,
        title,
        company,
        raw_text: raw.slice(0, 1000),
      });
    });

    return results;
  });
}

// ─── web3.career ─────────────────────────────────────────────────────────────
// Job URLs match the pattern: /slug-with-hyphens/numeric-id
// Each job has 2–3 links with this URL (empty text, title text, company text).
// Keep only non-empty-text anchors; dedup by URL.

async function extractWeb3Career(page) {
  return page.evaluate(() => {
    const JOB_URL_RE = /web3\.career\/[a-z0-9-]+\/\d+/;
    const seen = new Set();
    const results = [];

    [...document.querySelectorAll('a[href]')]
      .filter((a) => JOB_URL_RE.test(a.href) && a.innerText.trim())
      .forEach((a) => {
        if (seen.has(a.href)) return;
        seen.add(a.href);

        // The container row/card holds: title, company, date, location, salary, tags
        const container =
          a.closest('tr,li,[class*="row"],[class*="card"],[class*="job"]') ||
          a.parentElement?.parentElement;

        results.push({
          source: 'web3.career',
          url: a.href,
          title: a.innerText.trim(),
          company: '', // will be parsed from raw_text by Claude
          raw_text: container ? container.innerText.trim().slice(0, 1000) : a.innerText.trim(),
        });
      });

    return results;
  });
}

// ─── wellfound.com ────────────────────────────────────────────────────────────
// Wellfound is a React SPA with hashed classnames. Use link-pattern fallback.
// Job URLs contain /jobs/ with a numeric suffix.

async function extractWellfound(page) {
  return page.evaluate(() => {
    const results = [];

    // Try structured cards first
    const cards = [
      ...document.querySelectorAll('[data-test*="StartupResult"]'),
      ...document.querySelectorAll('[class*="JobListing"]'),
      ...document.querySelectorAll('[class*="job-listing"]'),
    ];

    if (cards.length > 0) {
      cards.forEach((card) => {
        const link = card.querySelector('a[href*="/jobs/"]') || card.querySelector('a');
        results.push({
          source: 'wellfound.com',
          url: link
            ? new URL(link.getAttribute('href') || '', 'https://wellfound.com').href
            : '',
          title: card.querySelector('h2,h3,[class*="title"]')?.innerText.trim() || '',
          company: card.querySelector('[class*="company"],[class*="startup"]')?.innerText.trim() || '',
          raw_text: card.innerText.slice(0, 1000).trim(),
        });
      });
    } else {
      // Fallback: /jobs/ links with surrounding context
      document.querySelectorAll('a[href*="/jobs/"]').forEach((a) => {
        const container =
          a.closest('[class*="item"],[class*="card"],li,article') ||
          a.parentElement?.parentElement;
        if (!container || container.innerText.length < 30) return;
        results.push({
          source: 'wellfound.com',
          url: new URL(a.getAttribute('href') || '', 'https://wellfound.com').href,
          title: a.innerText.trim(),
          company: '',
          raw_text: container.innerText.slice(0, 1000).trim(),
        });
      });
    }

    return results;
  });
}

// ─── Main ─────────────────────────────────────────────────────────────────────

const EXTRACTORS = {
  jobstash: extractJobstash,
  web3career: extractWeb3Career,
  wellfound: extractWellfound,
};

async function main() {
  const board = process.argv[2];
  if (!board || !URLS[board]) {
    process.stderr.write(`Usage: node scrape-jobs.js <board>\nBoards: ${Object.keys(URLS).join(' | ')}\n`);
    process.exit(1);
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    viewport: { width: 1280, height: 900 },
  });
  const page = await context.newPage();
  const all = [];

  for (const url of URLS[board]) {
    try {
      process.stderr.write(`Scraping ${url}\n`);
      await loadPage(page, url);
      const jobs = await EXTRACTORS[board](page);
      process.stderr.write(`  → ${jobs.length} listings\n`);
      all.push(...jobs);
    } catch (err) {
      process.stderr.write(`  ✗ ${err.message}\n`);
    }
  }

  await browser.close();

  const unique = dedup(all);
  process.stderr.write(`Total unique: ${unique.length}\n`);
  process.stdout.write(JSON.stringify(unique, null, 2) + '\n');
}

main().catch((err) => {
  process.stderr.write(`Fatal: ${err.message}\n`);
  process.exit(1);
});
