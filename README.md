# D2R Item Keeper

Desktop overlay for **Diablo 2: Resurrected** — quickly decide if a drop is a base worth keeping (Season 14 / Patch 3.2 data).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (for Tauri)
- Windows: [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (usually preinstalled on Windows 11)

## Run the app (terminal)

```powershell
cd c:\Users\wiggl\Documents\Python\D2-items
npm install
npm run tauri:dev
```

Install [Rust](https://www.rust-lang.org/tools/install) if `cargo` is not found, then restart your terminal.

**UI only in browser** (no overlay — layout testing):

```powershell
npm run dev:web
```

Open http://localhost:1420
## Build installer / exe

```powershell
npm run tauri:build
```

Output under `src-tauri/target/release/bundle/`.

## Overlay usage

- Window is **frameless**, **always on top**, and **semi-transparent** — drag via the title bar.
- **Pin (📌)** toggles **stay on top** only — you can still drag the window. Pinned = above normal windows; unpinned (📍) = can go behind other apps. Does not work over D2R in **exclusive fullscreen** (use borderless windowed).
- **—** minimizes; **×** closes.
- **Base** tab: search a white base, set eth/sockets, read **KEEP / CHECK / CHUCK**.
- Shortcuts: `/` focus search, `3`–`6` socket count, `E` cycle eth.

**Magic** tab: pick slot, tap a known BiS preset, or enter affix values for auto-match.

**Rare** tab: pick slot (and build variant for gloves/belts), enter affix values, see KEEP/CHECK/CHUCK vs S14 rules.

## Data

- Source markdown: `data/D2R_Items_To_Keep_Season14.md`
- Structured rules: `data/bases.json`

Update `bases.json` when the season guide changes.

## Project layout

- `src/` — React UI
- `src-tauri/` — Tauri overlay window
- `data/` — item rules

See `ARCHITECTURE.md` for full design notes.
