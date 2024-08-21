const { chromium } = require("playwright");

async function sortHackerNewsArticles() {
  // Launch browser
  const browser = await chromium.launch({ headless: false });
  const context = await browser.newContext();
  const page = await context.newPage();

  // Go to Hacker News "Newest" page
  await page.goto("https://news.ycombinator.com/newest");

  // Extract the timestamps of the first 100 articles
  const timestamps = await page.$$eval('.age', elements => 
    elements.slice(0, 100).map(el => el.getAttribute('title'))
  );

  // Convert timestamps to Unix time (or any comparable format)
  const times = timestamps.map(time => new Date(time).getTime());

  // Check if the array is sorted in descending order
  const isSorted = times.every((time, i) => i === 0 || time <= times[i - 1]);

  if (isSorted) {
    console.log("The articles are sorted correctly from newest to oldest.");
  } else {
    console.log("The articles are NOT sorted correctly.");
  }

  // Close browser
  await browser.close();
}

(async () => {
  await sortHackerNewsArticles();
})();
