'use strict';

const TARGET = 'https://news.ycombinator.com/newest';
const REQUIRED = 100;

/** Hacker News .age[title] is typically `ISO_LOCAL_DATETIME epoch-seconds`. */
function parseAgeTitle(value) {
  if (typeof value !== 'string' || !value.trim()) {
    throw new Error('Missing article timestamp');
  }
  const trimmed = value.trim();
  const match = trimmed.match(/(?:^|\s)(\d{10})(?:\s|$)/);
  if (match) {
    const seconds = Number(match[1]);
    if (Number.isFinite(seconds) && seconds > 0) return seconds * 1000;
  }
  const iso = trimmed.split(/\s+/)[0];
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:Z)?$/.test(iso)) {
    throw new Error(`Unrecognized Hacker News timestamp format: ${trimmed}`);
  }
  const timestamp = Date.parse(iso.endsWith('Z') ? iso : `${iso}Z`);
  if (!Number.isFinite(timestamp)) throw new Error(`Invalid timestamp: ${trimmed}`);
  return timestamp;
}

/** Fail on malformed rows, duplicated IDs, incorrect count, or out-of-order timestamps. */
function assertNewestFirst(items, expectedCount = REQUIRED) {
  if (!Array.isArray(items) || items.length !== expectedCount) {
    throw new Error(`Expected exactly ${expectedCount} articles, received ${items?.length ?? 'none'}`);
  }
  const ids = new Set();
  for (const [index, article] of items.entries()) {
    if (!article || typeof article.id !== 'string' || !/^\d+$/.test(article.id)) {
      throw new Error(`Article at position ${index + 1} lacks a valid Hacker News ID`);
    }
    if (ids.has(article.id)) throw new Error(`Duplicate article ID ${article.id} at position ${index + 1}`);
    ids.add(article.id);
    const time = parseAgeTitle(article.ageTitle);
    if (index > 0 && time > parseAgeTitle(items[index - 1].ageTitle)) {
      throw new Error(`Wrong order at positions ${index} and ${index + 1}: ${items[index - 1].id} precedes newer ${article.id}`);
    }
  }
  return { checked: items.length, newest: items[0].id, oldest: items[items.length - 1].id };
}

/**
 * Traverse live Hacker News `more` links using a real Playwright Page.
 * It must retrieve 100 distinct article rows, not simply first-page timestamps.
 */
async function collectFirstArticles(page, { startUrl = TARGET, count = REQUIRED, maxPages = 10 } = {}) {
  if (!Number.isInteger(count) || count < 1) throw new Error('count must be a positive integer');
  const visitedUrls = new Set();
  const rows = [];
  let url = startUrl;
  while (rows.length < count) {
    if (visitedUrls.size >= maxPages) throw new Error(`Exceeded ${maxPages} pages before finding ${count} articles`);
    if (visitedUrls.has(url)) throw new Error(`Pagination loop detected at ${url}`);
    visitedUrls.add(url);
    const response = await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
    if (!response || !response.ok()) throw new Error(`Could not open Hacker News: HTTP ${response?.status() ?? 'unknown'}`);
    const pageData = await page.evaluate(() => ({
      articles: Array.from(document.querySelectorAll('tr.athing')).map(row => ({
        id: row.getAttribute('id'),
        title: row.querySelector('.titleline a')?.textContent?.trim() ?? '',
        ageTitle: row.nextElementSibling?.querySelector('span.age')?.getAttribute('title') ?? null
      })),
      moreHref: document.querySelector('a.morelink')?.getAttribute('href') ?? null
    }));
    if (!pageData.articles.length) throw new Error(`No article rows found at ${url}`);
    for (const item of pageData.articles) {
      if (rows.length === count) break;
      rows.push(item);
    }
    if (rows.length === count) break;
    if (!pageData.moreHref) throw new Error(`Pagination ended after ${rows.length} articles; expected ${count}`);
    const next = new URL(pageData.moreHref, url);
    if (next.hostname !== 'news.ycombinator.com' || next.protocol !== 'https:') {
      throw new Error(`Unexpected pagination destination: ${next.href}`);
    }
    url = next.href;
  }
  return assertNewestFirst(rows, count);
}

module.exports = { TARGET, REQUIRED, parseAgeTitle, assertNewestFirst, collectFirstArticles };
