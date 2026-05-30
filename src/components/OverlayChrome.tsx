import { useCallback, useEffect, useState } from "react";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { isTauri } from "../lib/tauri";
import {
  applyAlwaysOnTop,
  closeWindow,
  loadPinnedPreference,
  minimizeWindow,
  readAlwaysOnTop,
  savePinnedPreference,
  startDragging,
} from "../lib/windowControls";
import "./OverlayChrome.css";

const PIN_REFRESH_MS = 2500;

export function OverlayChrome() {
  const [pinned, setPinned] = useState(loadPinnedPreference);
  const [pinError, setPinError] = useState<string | null>(null);

  const syncPin = useCallback(async (on: boolean) => {
    if (!isTauri()) {
      setPinned(on);
      return;
    }
    const ok = await applyAlwaysOnTop(on);
    if (!ok) {
      setPinError("Could not change stay-on-top");
      const actual = await readAlwaysOnTop();
      setPinned(actual);
      return;
    }
    setPinError(null);
    setPinned(on);
    savePinnedPreference(on);
  }, []);

  useEffect(() => {
    void syncPin(loadPinnedPreference());
  }, [syncPin]);

  // Re-assert TOPMOST when another app steals it (common when alt-tabbing or over games)
  useEffect(() => {
    if (!pinned || !isTauri()) return;

    const win = getCurrentWindow();
    let cancelled = false;

    const refresh = () => {
      if (!cancelled) void applyAlwaysOnTop(true);
    };

    const interval = window.setInterval(refresh, PIN_REFRESH_MS);

    let unlistenFocus: (() => void) | undefined;
    void win.onFocusChanged(({ payload: focused }) => {
      if (focused) refresh();
    }).then((fn) => {
      unlistenFocus = fn;
    });

    return () => {
      cancelled = true;
      window.clearInterval(interval);
      unlistenFocus?.();
    };
  }, [pinned]);

  const togglePin = () => {
    void syncPin(!pinned);
  };

  const onDragHandlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    if (target.closest("button")) return;
    startDragging();
  };

  return (
    <header className="chrome">
      <div
        className="chrome__drag"
        data-tauri-drag-region
        onPointerDown={onDragHandlePointerDown}
        title="Drag to move window"
      >
        <div className="chrome__title">
          <span className="chrome__brand">D2R Keeper</span>
          <span className="chrome__badge">S14 · 3.2</span>
          {!pinned && <span className="chrome__unpinned">not on top</span>}
        </div>
      </div>
      <div className="chrome__actions">
        <button
          type="button"
          className={`chrome__btn chrome__btn--pin ${pinned ? "chrome__btn--pin-active" : ""}`}
          onClick={togglePin}
          title={
            pinned
              ? "Stay on top: ON — click to let other windows cover this overlay"
              : "Stay on top: OFF — click to keep overlay above other windows"
          }
          aria-pressed={pinned}
          aria-label={pinned ? "Disable stay on top" : "Enable stay on top"}
        >
          {pinned ? "📌" : "📍"}
        </button>
        <button
          type="button"
          className="chrome__btn"
          onClick={() => void minimizeWindow()}
          title="Minimize"
        >
          —
        </button>
        <button
          type="button"
          className="chrome__btn chrome__btn--close"
          onClick={() => void closeWindow()}
          title="Close"
        >
          ×
        </button>
      </div>
      {pinError && <p className="chrome__error">{pinError}</p>}
    </header>
  );
}
