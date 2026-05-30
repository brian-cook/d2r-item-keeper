import { useState } from "react";

import type { AppMode } from "./types";

import { OverlayChrome } from "./components/OverlayChrome";

import { BaseChecker } from "./components/BaseChecker";

import { MagicChecker } from "./components/MagicChecker";

import { RareChecker } from "./components/RareChecker";

import "./App.css";



export default function App() {

  const [mode, setMode] = useState<AppMode>("base");



  return (

    <div className="app">

      <OverlayChrome />

      <nav className="tabs" aria-label="Item type">

        {(

          [

            ["base", "Base"],

            ["magic", "Magic"],

            ["rare", "Rare"],

          ] as const

        ).map(([id, label]) => (

          <button

            key={id}

            type="button"

            className={`tabs__btn ${mode === id ? "tabs__btn--active" : ""}`}

            onClick={() => setMode(id)}

          >

            {label}

          </button>

        ))}

      </nav>

      <main className="app__main">

        {mode === "base" && <BaseChecker />}

        {mode === "magic" && <MagicChecker />}

        {mode === "rare" && <RareChecker />}

      </main>

    </div>

  );

}

