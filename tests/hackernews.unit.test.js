'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const { parseAgeTitle, assertNewestFirst } = require('../src/hackernews');

function stories(count = 100) {
  return Array.from({ length: count }, (_, index) => ({
    id: String(90000 - index),
    ageTitle: `2026-01-01T00:00:00 ${1767225600 - index * 60}`
  }));
}

test('extracts epoch seconds from Hacker News age title', () => {
  assert.equal(parseAgeTitle('2026-01-01T00:00:00 1767225600'), 1767225600000);
});
test('accepts an ISO date when epoch seconds are absent', () => {
  assert.equal(parseAgeTitle('2026-01-01T00:00:00'), Date.UTC(2026, 0, 1));
});
test('rejects missing and invalid article timestamps', () => {
  assert.throws(() => parseAgeTitle(null), /Missing/);
  assert.throws(() => parseAgeTitle('yesterday'), /Unrecognized/);
  assert.throws(() => parseAgeTitle('2026-18-44T25:00:00'), /Invalid/);
});
test('accepts exactly 100 distinct descending articles', () => {
  const answer = assertNewestFirst(stories());
  assert.equal(answer.checked, 100);
});
test('rejects too few or too many articles', () => {
  assert.throws(() => assertNewestFirst(stories(30)), /exactly 100/);
  assert.throws(() => assertNewestFirst(stories(101)), /exactly 100/);
});
test('rejects duplicated IDs even if timestamps are sorted', () => {
  const rows = stories(); rows[80].id = rows[0].id;
  assert.throws(() => assertNewestFirst(rows), /Duplicate/);
});
test('rejects out-of-order timestamps with their positions', () => {
  const rows = stories(); rows[55].ageTitle = rows[54].ageTitle.replace(/\d{10}$/, String(1767225600));
  assert.throws(() => assertNewestFirst(rows), /Wrong order/);
});
test('permits equal timestamps from distinct submissions', () => {
  const rows = stories(); rows[1].ageTitle = rows[0].ageTitle;
  assert.equal(assertNewestFirst(rows).checked, 100);
});
test('rejects malformed IDs', () => {
  const rows = stories(); rows[2].id = null;
  assert.throws(() => assertNewestFirst(rows), /valid Hacker News ID/);
});
