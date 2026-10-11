# Tab Jumper

<img src="TabJumper/icons/icon-128.png" alt="Tab Jumper logo" width="96" height="96">

Search your open tabs by name and jump straight to the one you need.

Built with plain HTML, CSS, and JavaScript using Manifest V3. No build step, dependencies, account, or external service is required.

## Install

1. Download or clone this repository to a folder on your computer.
2. Open `chrome://extensions` in Chrome (version 110 or newer).
3. Turn on **Developer mode**.
4. Click **Load unpacked** and select the `TabJumper` subfolder, which contains `manifest.json`.
5. Open Chrome’s extensions menu (the puzzle icon) and pin **Tab Jumper** for a toolbar button.

Click the toolbar button or press **Ctrl+Shift+K** on Windows/Linux, or **Command+Shift+K** on macOS.

The popup header shows Chrome’s assigned shortcut. To change it, use **Keyboard shortcut settings** in the popup or open `chrome://extensions/shortcuts` and edit Tab Jumper’s **Activate the extension** shortcut. If the default shortcut does nothing, check this page: another extension or the operating system may already use it.

## Use

- **This window** opens by default and lists the tabs in the current window. **All windows** lists tabs across every normal Chrome window, with the current window first.
- Search matches tab titles and addresses. It ignores case and matches every space-separated word, regardless of word order. Tabs whose title matches come before tabs that only match by address.
- Each result shows the tab’s favicon, title, and address, plus labels for pinned tabs, tabs playing audio, and (in **All windows**) which window the tab is in.
- Use **↑ / ↓** to select a result. Press **Enter** or click it to switch to that tab; tabs in another window also bring that window to the front.
- Press **Alt+←** for **This window** and **Alt+→** for **All windows**.
- Press **Escape** to close the popup. Choosing the tab you are already on also closes it.

Each popup opening reads a fresh snapshot of your tabs; reopen it after opening or closing tabs elsewhere. If a tab closes while the popup is open, choosing it shows an error instead of switching.

## Privacy and permissions

Tab Jumper requests two permissions:

- `tabs`, used to read the titles and addresses of your open tabs and switch between them. Chrome describes this permission broadly, but this extension does not read page contents, history, or browsing activity, and does not close or move tabs. The only tab it opens is Chrome’s shortcut settings page, when you ask for it.
- `favicon`, used to show each tab’s icon from Chrome’s own favicon cache, so no favicon requests leave your device.

Search happens locally. Nothing is stored, and there is no analytics, remote code, or external request.

## Development

Run these from the `TabJumper` subfolder. They need Node.js 20 or newer; the extension itself has no dependencies.

- `npm test` runs the unit tests in `tests/`.
- `npm run check` syntax-checks the scripts.
- `npm run icons` regenerates the PNGs in `icons/`.
- `npm run bump` increments the patch version in `manifest.json` and `package.json`.
