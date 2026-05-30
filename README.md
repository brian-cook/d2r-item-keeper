# D2R Item Keeper

A lightweight desktop overlay for **Diablo II: Resurrected** that helps you decide, in a few seconds, whether a dropped item is worth keeping — a **base** for a runeword, or a **magic/rare** with high-value affixes. Built with Tauri + React for **Season 14 / Patch 3.2** data.

> Unofficial fan tool. Not affiliated with Blizzard Entertainment. Item data is community-sourced and may go stale between patches.

## Features

- **Base** tab — search a white base, set ethereal/sockets/superior, get a **KEEP / CHECK / CHUCK** verdict with the reason and runeword note.
- **Magic** tab — pick a slot, tap a known best-in-slot preset, or enter affix rolls for an automatic match.
- **Rare** tab — pick a slot (and build variant for gloves/belts), enter affix values, and compare against Season 14 keep rules with a max-rolls reference.
- **Overlay window** — frameless, semi-transparent, always-on-top, draggable; sits over the game (use borderless windowed mode).

## Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [Rust](https://www.rust-lang.org/tools/install) (toolchain for Tauri; provides `cargo`)
- Windows: [WebView2](https://developer.microsoft.com/en-us/microsoft-edge/webview2/) (preinstalled on Windows 11)

> The overlay currently targets Windows. The web UI (`npm run dev:web`) runs anywhere.

## Getting started

```bash
git clone https://github.com/brian-cook/d2r-item-keeper.git
cd d2r-item-keeper
npm install
npm run tauri:dev
```

The first `tauri:dev` run compiles Rust dependencies and may take a few minutes. If `cargo` is not found, install Rust and restart your terminal.

### UI only in the browser

For quick layout/logic work without building the native window:

```bash
npm run dev:web
```

Then open <http://localhost:1420>.

## Build a release

```bash
npm run tauri:build
```

Installers/executables are emitted under `src-tauri/target/release/bundle/`.

## Tests

Smoke tests for the keep/chuck evaluators:

```bash
npm test
```

## Usage

- Drag the window by the title bar. **Pin (📌)** toggles stay-on-top; **—** minimizes; **×** closes.
- Stay-on-top works over D2R in **borderless windowed** mode, not exclusive fullscreen.
- Keyboard shortcuts (Base tab): `/` focus search, `3`–`6` socket count, `E` cycle ethereal.

## Project layout

| Path | Purpose |
|------|---------|
| `src/` | React UI (components, evaluators in `src/lib/`) |
| `src-tauri/` | Tauri overlay window (Rust + config) |
| `data/` | Item rules: `bases.json`, `magic_presets.json`, `rare_slots.json` |
| `data/D2R_Items_To_Keep_Season14.md` | Source guide the rules are derived from |
| `scripts/` | Helper scripts (tests, optional desktop shortcut, GitHub CLI) |
| `ARCHITECTURE.md` | Full design notes and data model |

## Updating for a new season

1. Replace `data/D2R_Items_To_Keep_Season14.md` with the new guide.
2. Update the JSON in `data/` to match (bases, magic presets, rare slots).
3. Bump the `season`/`patch` fields and the badge in the UI.

## Optional: desktop shortcut (Windows)

If you prefer launching without a terminal, build once and create a shortcut:

```powershell
npm run desktop:install
```

This builds the release binary and adds a **D2R Item Keeper** shortcut to your desktop. For everyday use, the terminal command above is the simplest path.

## License

[MIT](LICENSE)
