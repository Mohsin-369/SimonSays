# Simon Says 🎮 | Ultimate Edition

A visually stunning, high-performance, and feature-rich implementation of the classic **Simon Says** memory game built with vanilla web technologies.

## ✨ Features

- **Glassmorphic Glass UI**: Premium glassmorphic cards using CSS variable systems, smooth gradients, glowing drop shadows, and modern font face integrations.
- **Micro-interactions & Motion**: Smooth hover scales, card shakes, and screen flash indicators on failure utilizing modern CSS transform properties and animations.
- **Synthesized Audio System**: Utilizes the native **Web Audio API** to generate musical notes dynamically on keypresses/clicks (avoiding bulky external audio resources).
- **Controls & Accessibility**: 
  - Mobile-friendly "Start Game" button for touchscreens, alongside traditional Keyboard `Enter` press support.
  - Sound customization (Mute/Unmute toggle).
  - Input lock during pattern display to prevent accidental clicks while Simon is showing the pattern.
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
Simply locate and double-click the `simon.html` file in your file explorer.

### Option B: Local Server
To run via a local development server:
1. Open your terminal in the directory.
2. Spin up a static server (e.g., using Python):
   ```bash
   python3 -m http.server 8080
   ```
3. Open [http://localhost:8080/simon.html](http://localhost:8080/simon.html) in your browser.

---

## 🐛 Bug Fixes & Code Enhancements
- **Green Color Bug Fixed**: Resolved an index limitation where the green button (`index 3`) was omitted from random selection in JavaScript.
- **Sequential Playback**: Adjusted pattern presentation to sequentially play audio/visual flashes with structured intervals.
- **Hinglish Comments**: Maintained user's commenting style mixing Hindi and English for educational clarity.
