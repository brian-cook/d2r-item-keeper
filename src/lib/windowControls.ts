import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri } from "./tauri";

const PIN_STORAGE_KEY = "d2r-keeper-pinned";

export function loadPinnedPreference(): boolean {
  try {
    const stored = localStorage.getItem(PIN_STORAGE_KEY);
    if (stored === "false") return false;
    if (stored === "true") return true;
  } catch {
    /* ignore */
  }
  return true;
}

export function savePinnedPreference(pinned: boolean): void {
  try {
    localStorage.setItem(PIN_STORAGE_KEY, String(pinned));
  } catch {
    /* ignore */
  }
}

/** Apply always-on-top and confirm with the window API (Windows can drop TOPMOST). */
export async function applyAlwaysOnTop(on: boolean): Promise<boolean> {
  if (!isTauri()) return on;

  const win = getCurrentWindow();
  await win.setAlwaysOnTop(on);

  // Toggle off/on once to refresh TOPMOST on Windows when enabling
  if (on) {
    await win.setAlwaysOnTop(false);
    await win.setAlwaysOnTop(true);
  }

  const actual = await win.isAlwaysOnTop();
  return actual === on;
}

export async function readAlwaysOnTop(): Promise<boolean> {
  if (!isTauri()) return true;
  return getCurrentWindow().isAlwaysOnTop();
}

export async function minimizeWindow(): Promise<void> {
  if (!isTauri()) return;
  await getCurrentWindow().minimize();
}

export async function closeWindow(): Promise<void> {
  if (!isTauri()) return;
  const win = getCurrentWindow();
  await win.destroy();
}

/** Call from pointerdown on the drag handle (required for frameless Windows). */
export function startDragging(): void {
  if (!isTauri()) return;
  void getCurrentWindow().startDragging();
}
