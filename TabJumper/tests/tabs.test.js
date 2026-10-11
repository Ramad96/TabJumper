import { test } from 'node:test';
import assert from 'node:assert/strict';
import { indexTabs, findTabs, switchToTab } from '../tabs.js';

const windows = [
  { id: 1, tabs: [{ id: 11, index: 0, title: 'Inbox – Mail', url: 'https://mail.example.com/' }] },
  { id: 2, tabs: [
    { id: 21, index: 0, title: 'Docs: GitHub API', url: 'https://docs.github.com/rest', active: true },
    { id: 22, index: 1, title: 'Pull requests', url: 'https://github.com/pulls', pinned: true },
    { id: 23, index: 2, title: '', pendingUrl: 'https://music.example.com/', audible: true }
  ] }
];

test('indexTabs puts the current window first and labels the others', () => {
  const entries = indexTabs(windows, 2);
  assert.deepEqual(entries.map(e => e.id), [21, 22, 23, 11]);
  assert.deepEqual(entries.map(e => e.windowLabel), ['This window', 'This window', 'This window', 'Window 2']);
  assert.equal(entries[2].url, 'https://music.example.com/');
  assert.equal(entries[2].audible, true);
  assert.equal(entries[1].pinned, true);
  assert.equal(entries[3].current, false);
});

test('indexTabs tolerates windows without tabs', () => {
  assert.deepEqual(indexTabs([{ id: 1 }], 1), []);
});

test('findTabs scopes to the current window unless all windows are requested', () => {
  const entries = indexTabs(windows, 2);
  assert.equal(findTabs(entries, { mode: 'window', query: '' }).length, 3);
  assert.equal(findTabs(entries, { mode: 'all', query: '' }).length, 4);
});

test('findTabs requires every word and ranks title matches first', () => {
  const entries = indexTabs(windows, 2);
  assert.deepEqual(findTabs(entries, { mode: 'all', query: 'github' }).map(e => e.id), [21, 22]);
  assert.deepEqual(findTabs(entries, { mode: 'all', query: '  PULL   github ' }).map(e => e.id), [22]);
  assert.deepEqual(findTabs(entries, { mode: 'window', query: 'inbox' }), []);
  assert.deepEqual(findTabs(entries, { mode: 'all', query: 'inbox' }).map(e => e.id), [11]);
});

test('switchToTab activates the tab and focuses other windows only', async () => {
  const calls = [];
  const api = { tabs: { update: async (...a) => calls.push(['tab', ...a]) }, windows: { update: async (...a) => calls.push(['window', ...a]) } };
  const [here, , , elsewhere] = indexTabs(windows, 2);
  await switchToTab(here, api);
  assert.deepEqual(calls, [['tab', 21, { active: true }]]);
  calls.length = 0;
  await switchToTab(elsewhere, api);
  assert.deepEqual(calls, [['tab', 11, { active: true }], ['window', 1, { focused: true }]]);
});

test('switchToTab rejects missing tabs with a helpful message', async () => {
  await assert.rejects(switchToTab(undefined, {}), /no longer available/);
  await assert.rejects(switchToTab({ id: undefined }, {}), /no longer available/);
});
