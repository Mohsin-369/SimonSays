# Mohsin Says 🧠 | Brain Edition 

A visually stunning, high-performance, and feature-rich implementation of the classic **Mohsin Says** memory game built with vanilla web technologies.

## ✨ Features

- **Responsive Layout & Adaptive UI**: Beautiful side-by-side console interface on desktop, and stacked, immersive app-like layout on mobile devices.
- **Built-in Light & Dark Themes**: Interactive theme selector with persistent preferences saved directly to `localStorage`.
- **Keyboard Controls**: Fully playable using keyboard keys (`Q` for Yellow, `W` for Red, `A` for Purple, `S` for Green) with `Space`/`Enter` shortcuts to start.
- **Micro-interactions & Motion**: Smooth hover scales, card shakes, and screen flash indicators on failure utilizing modern CSS transform properties and animations.
- **Synthesized Audio System**: Utilizes the native **Web Audio API** to generate musical notes dynamically on keypresses/clicks (avoiding bulky external audio resources).
- **Controls & Accessibility**: 
  - Mobile-friendly "Start Game" button for touchscreens.
  - Sound customization (Mute/Unmute toggle).
  - Input lock during pattern display to prevent accidental clicks while Mohsin is showing the pattern.
- **Persistence**: High score tracking saved locally across sessions using `localStorage`.

---

## 🛠️ Technologies Used

- **HTML5**: Semantic tags and scoreboard layouts.
- **CSS3**: Custom properties (Variables), individual transform properties (`scale`, `translate`), flex/grid structures, and keyframe animations.
- **Vanilla JavaScript**: DOM interactions, event listeners, Audio Context synthesis, state management, and persistence.

---

## 🚀 How to Run Locally

You can launch this game instantly in your browser:

### Option A: Open directly
Simply locate and double-click the `index.html` file in your file explorer.

### Option B: Local Server
To run via a local development server:
1. Open your terminal in the directory.
2. Spin up a static server (e.g., using Python):
   ```bash
   python3 -m http.server 8080
   ```
3. Open [http://localhost:8080/index.html](http://localhost:8080/index.html) in your browser.

---
