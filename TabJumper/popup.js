import { indexTabs, findTabs, switchToTab } from './tabs.js';

const $ = id => document.getElementById(id);
const search = $('search');
let entries = [], results = [], selected = 0, mode = 'window';
let switching = false;

function showError(error) {
  $('error').textContent = error.message || 'Something went wrong. Close the popup and try again.';
  $('error').hidden = false;
}

function select(index) {
  selected = Math.max(0, Math.min(index, results.length - 1));
  for (const [i, row] of [...$('results').children].entries()) row.setAttribute('aria-selected', String(i === selected));
  const row = $('results').children[selected];
  if (row) {
    search.setAttribute('aria-activedescendant', row.id);
    row.scrollIntoView({ block: 'nearest' });
  } else search.removeAttribute('aria-activedescendant');
}

function setMode(next) {
  mode = next;
  render();
  search.focus();
}

function faviconFor(url) {
  const img = document.createElement('img');
  img.alt = '';
  img.width = img.height = 18;
  img.src = `${chrome.runtime.getURL('/_favicon/')}?pageUrl=${encodeURIComponent(url)}&size=32`;
  return img;
}

function detailFor(entry) {
  const flags = [mode === 'all' && entry.windowLabel, entry.pinned && 'Pinned', entry.audible && 'Playing audio'].filter(Boolean);
  return [...flags, entry.url.replace(/^https?:\/\/(www\.)?/, '')].join(' · ');
}

function render() {
  $('error').hidden = true;
  results = findTabs(entries, { mode, query: search.value });
  $('window').setAttribute('aria-pressed', String(mode === 'window'));
  $('all').setAttribute('aria-pressed', String(mode === 'all'));
  $('count').textContent = `${results.length} ${results.length === 1 ? 'tab' : 'tabs'}`;
  const fragment = document.createDocumentFragment();
  results.forEach((entry, i) => {
    const here = entry.current && entry.active;
    const row = document.createElement('div');
    row.className = `result${here ? ' here' : ''}`;
    row.id = `result-${i}`;
    row.setAttribute('role', 'option');
    const icon = document.createElement('span');
    icon.className = 'item-icon';
    icon.setAttribute('aria-hidden', 'true');
    icon.append(faviconFor(entry.url));
    const copy = document.createElement('div');
    copy.className = 'item-copy';
    const title = document.createElement('div');
    title.className = 'item-title';
    title.textContent = entry.title || entry.url || 'Untitled tab';
    const detail = document.createElement('div');
    detail.className = 'item-detail';
    detail.textContent = detailFor(entry);
    detail.title = entry.url;
    copy.append(title, detail);
    const action = document.createElement('span');
    action.className = 'item-action';
    action.textContent = here ? 'You are here' : 'Switch ↗';
    row.title = here ? 'This is the tab you are on' : `Switch to this tab${entry.current ? '' : ` in ${entry.windowLabel}`}`;
    row.append(icon, copy, action);
    row.addEventListener('click', () => { select(i); activate(); });
    fragment.append(row);
  });
  $('results').replaceChildren(fragment);
  $('results').scrollTop = 0;
  $('empty').hidden = results.length > 0;
  $('empty').textContent = search.value.trim()
    ? `No matches. Try another tab name or address${mode === 'window' ? ', or search All windows' : ''}.`
    : 'No tabs to show.';
  select(0);
}

async function activate() {
  const entry = results[selected];
  if (!entry || switching) return;
  if (entry.current && entry.active) return window.close();
  switching = true;
  try {
    await switchToTab(entry, { tabs: chrome.tabs, windows: chrome.windows });
    window.close();
  } catch (error) { showError(error); }
  finally { switching = false; }
}

search.addEventListener('input', render);
search.addEventListener('keydown', event => {
  if (event.isComposing) return;
  if (['ArrowDown', 'ArrowUp', 'Enter'].includes(event.key)) {
    event.preventDefault();
    if (event.key === 'Enter') activate();
    else select(selected + (event.key === 'ArrowDown' ? 1 : -1));
  }
});
document.addEventListener('keydown', event => {
  if (event.key === 'Escape') { event.preventDefault(); window.close(); }
  if (event.altKey && ['ArrowLeft', 'ArrowRight'].includes(event.key)) {
    event.preventDefault();
    setMode(event.key === 'ArrowLeft' ? 'window' : 'all');
  }
});
for (const scope of ['window', 'all']) $(scope).addEventListener('click', () => setMode(scope));

async function init() {
  $('version').textContent = `v${chrome.runtime.getManifest().version}`;
  search.focus();
  try {
    const [windows, current] = await Promise.all([chrome.windows.getAll({ populate: true, windowTypes: ['normal'] }), chrome.windows.getCurrent()]);
    entries = indexTabs(windows, current.id);
    render();
  } catch (error) { showError(error); }
  try {
    const commands = await chrome.commands.getAll();
    $('shortcut').textContent = commands.find(command => command.name === '_execute_action')?.shortcut || 'No shortcut assigned';
  } catch { /* Search remains available if the shortcut cannot be read. */ }
}
$('shortcut-settings').addEventListener('click', async () => {
  try { await chrome.tabs.create({ url: 'chrome://extensions/shortcuts' }); }
  catch (error) { showError(error); }
});
init();
