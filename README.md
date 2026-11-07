# Hacker News Sorting Validator — Playwright QA Lab

**Independent repair of my historical QA Wolf take-home practice.** This repository is not endorsed by, maintained by, or submitted on behalf of QA Wolf. This is a personal software quality engineering example; it is not evidence of employment at QA Wolf.

## Problem and test strategy
Hacker News' newest feed shows around 30 articles per page. A naïve script could say 100 items are sorted while only checking the first page. This project uses **Playwright Chromium** to follow pagination until it has **exactly 100 article rows**, validates each submission ID and age timestamp, rejects duplicates, and fails on newer items appearing after older ones. Equal timestamps are acceptable. Browser resources are closed in a `finally` block and errors return a nonzero exit status.

## What is actually verified
- `tests/hackernews.unit.test.js`: deterministic Node tests for timestamp parsing, exactly-100 assertions, duplicates, missing values, and ordering boundaries.
- `tests/hackernews.browser.spec.js`: real Playwright browser tests using **local HTML responses** routed to a simulated Hacker News feed. Includes multi-page success, malformed metadata, duplicates, out-of-order data, and insufficient pagination.
- `.github/workflows/verify.yml`: reproducible CI using `npm ci`, `node --test`, Playwright Chromium, and a failure trace/report artifact.
- `node index.js`: optional **live-site** check against `news.ycombinator.com`; this depends on site/network availability and changing live data and is intentionally **not** a CI acceptance test.

## Run
Requires Node.js 20+ and Git.

```bash
npm ci
npx playwright install chromium
npm run test:unit
npm run test:browser
# Optional live-site verification:
npm run verify:live
```

See [the test strategy and known limitations](docs/TEST_STRATEGY.md). Historical assignment instructions have been preserved for context in [docs/ORIGINAL_ASSIGNMENT.md](docs/ORIGINAL_ASSIGNMENT.md); the original nested files and Git history are also retained.

## Risk and limitations
- Live Hacker News may change its DOM or paginated content between requests. A live failure needs investigation; it can reflect source-site behavior rather than a bug in this validator.
- Mocked tests demonstrate the **validator and browser extraction logic**, not a guarantee that the live Hacker News site will always satisfy the rule.
- No AI model is used or benchmarked here; this project focuses on Playwright testing fundamentals. For a broader automated QA and AI-grading lab, see [CommerceQA / FarmFresh](https://github.com/Esoham/QA-Automation-Project).
