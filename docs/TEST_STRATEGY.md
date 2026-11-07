# Test strategy and Agile QA exercise

**User story:** As a reviewer, I want the first 100 Hacker News newest articles checked in order, so that an incomplete page scan does not create a false pass.

**Acceptance criteria:**
1. The validator opens newest and traverses pagination until **exactly 100 entries** are collected.
2. Each item has a valid ID and parseable age metadata.
3. The 100 items contain no repeated submission IDs.
4. Each next timestamp is <= its predecessor; ties allowed.
5. Missing metadata, pagination failure, or incorrect order causes a nonzero process exit and actionable error.
6. Browser is closed even when validation fails.

**Testing levels:** deterministic unit tests for parsing/order, Playwright browser integration with route-fulfilled HTML, opt-in live-site system check.

**Risk:** Live feed is volatile; posts may be added during pagination; exact 100-item check is a snapshot collected over multiple navigations, not an atomic server-side snapshot. DOM changes may require locator updates. Unit/mock CI makes algorithm regressions reproducible without claiming live-site reliability.

**QA practice prompts:** Where would you put unit, integration and E2E tests in the test pyramid? Why should we fail on 30 articles, even if they are sorted? How would you triage a flaky live-site failure? What should a defect report include? What would you clarify with the Product Owner about concurrent new submissions and time ties?

**AI assistance policy:** AI may suggest test cases and code, but every output must be reviewed, checked against acceptance criteria, and verified with repeatable assertions. Do not present generated fixtures as a live-site benchmark.
