/** Flatten Chrome's windows into tabs: the current window first, then the rest in Chrome's order. */
export function indexTabs(windows, currentWindowId) {
  const ordered = [...windows].sort((a, b) => (b.id === currentWindowId) - (a.id === currentWindowId));
  return ordered.flatMap((win, i) => (win.tabs ?? []).map(tab => ({
    id: tab.id,
    windowId: win.id,
    index: tab.index,
    title: tab.title || '',
    url: tab.url || tab.pendingUrl || '',
    active: Boolean(tab.active),
    pinned: Boolean(tab.pinned),
    audible: Boolean(tab.audible),
    current: win.id === currentWindowId,
    windowLabel: win.id === currentWindowId ? 'This window' : `Window ${i + 1}`
  })));
}

/** Match every space-separated word against title and URL; tabs whose title matches come first. */
export function findTabs(entries, { mode, query }) {
  const words = query.trim().toLocaleLowerCase().split(/\s+/).filter(Boolean);
  const scoped = mode === 'window' ? entries.filter(entry => entry.current) : entries;
  if (!words.length) return scoped;
  const matches = scoped.filter(entry => words.every(word => `${entry.title} ${entry.url}`.toLocaleLowerCase().includes(word)));
  const inTitle = entry => words.every(word => entry.title.toLocaleLowerCase().includes(word));
  return matches.sort((a, b) => inTitle(b) - inTitle(a));
}

export async function switchToTab(entry, { tabs, windows }) {
  if (!entry || !Number.isInteger(entry.id)) throw new Error('This tab is no longer available. Reopen Tab Jumper to refresh the list.');
  await tabs.update(entry.id, { active: true });
  if (!entry.current) await windows.update(entry.windowId, { focused: true });
}
