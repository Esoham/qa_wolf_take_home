'use strict';
const { test, expect } = require('@playwright/test');
const { collectFirstArticles } = require('../src/hackernews');

function html(pageNo, { outOfOrder = false, duplicate = false, missing = false, shorter = false } = {}) {
  const start = (pageNo - 1) * 30;
  const total = shorter ? 65 : 120;
  const end = Math.min(start + 30, total);
  const trs = [];
  for (let i = start; i < end; i++) {
    const id = duplicate && i === 40 ? 100000 : 100000 + i;
    const seconds = outOfOrder && i === 48 ? 1768000000 : 1767225600 - i * 60;
    const attr = missing && i === 10 ? '' : ` title="2026-01-01T00:00:00 ${seconds}"`;
    trs.push(`<tr class="athing" id="${id}"><td><span class="titleline"><a href="item?id=${id}">Article ${i}</a></span></td></tr><tr><td><span class="age"${attr}>posted</span></td></tr>`);
  }
  const more = end < total ? `<a class="morelink" href="newest?p=${pageNo + 1}">More</a>` : '';
  return `<html><body><table>${trs.join('')}</table>${more}</body></html>`;
}

async function routeFixtures(page, options) {
  await page.route('https://news.ycombinator.com/newest*', async route => {
    const pageNo = Number(new URL(route.request().url()).searchParams.get('p') || 1);
    await route.fulfill({ status: 200, contentType: 'text/html', body: html(pageNo, options) });
  });
}

test('uses four real browser navigations to verify exactly the first 100 articles', async ({ page }) => {
  await routeFixtures(page, {});
  const result = await collectFirstArticles(page);
  expect(result.checked).toBe(100);
  expect(result.newest).toBe('100000');
  expect(result.oldest).toBe('100099');
});
test('fails if the second page contains a more recent item out of order', async ({ page }) => {
  await routeFixtures(page, { outOfOrder: true });
  await expect(collectFirstArticles(page)).rejects.toThrow(/Wrong order/);
});
test('fails if a duplicate appears across page boundaries', async ({ page }) => {
  await routeFixtures(page, { duplicate: true });
  await expect(collectFirstArticles(page)).rejects.toThrow(/Duplicate/);
});
test('fails if a story has no valid age title', async ({ page }) => {
  await routeFixtures(page, { missing: true });
  await expect(collectFirstArticles(page)).rejects.toThrow(/Missing article timestamp/);
});
test('fails instead of silently passing when pagination ends before 100', async ({ page }) => {
  await routeFixtures(page, { shorter: true });
  await expect(collectFirstArticles(page)).rejects.toThrow(/Pagination ended after 65 articles/);
});
