'use strict';
const { chromium } = require('playwright');
const { collectFirstArticles } = require('./src/hackernews');

async function main() {
  const browser = await chromium.launch({ headless: true });
  try {
    const context = await browser.newContext();
    const page = await context.newPage();
    const result = await collectFirstArticles(page);
    console.log(`PASS: verified ${result.checked} unique Hacker News articles newest-to-oldest (${result.newest} -> ${result.oldest}).`);
  } finally {
    await browser.close();
  }
}

if (require.main === module) {
  main().catch(error => {
    console.error('FAIL:', error.message);
    process.exitCode = 1;
  });
}
module.exports = { main };
