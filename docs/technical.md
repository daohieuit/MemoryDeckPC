# Technical Details: Under the Hood

MemoryDeck is built with modern web and desktop technologies, focusing on performance, offline reliability, and a premium user experience.

---

## 🛠 Tech Stack

### Frontend Core
- **React 19**: Implementing modern hook-based state management and efficient UI updates.
- **TypeScript**: Ensuring strict type safety across the UI and data layer.
- **Tailwind CSS v4**: Utilizing the latest CSS-only configuration and the `@tailwindcss/vite` plugin for lightning-fast styling and reduced bundle sizes.
- **React Router (HashRouter)**: Providing stable client-side routing within the Electron `file://` protocol environment.

### Desktop Integration
- **Electron v34**: Wrapping the React application into a native desktop container.
- **SQLite (better-sqlite3)**: A high-performance, native database engine for persistent storage.
- **electron-builder**: Handles the creation of the production-ready NSIS installer (`MemoryDeck_installer.exe`).

---

## 💾 Data Architecture

### Persistent SQLite Storage
Unlike traditional web apps that rely on volatile storage, MemoryDeck uses **SQLite** for all production data.

- **Storage Location**: Data is stored in `memorydeck.db` within the application's local directory.
- **Schema**:
    - `decks`: Store collection names and metadata.
    - `terms`: Store words, definitions, IPA, and grammatical functions.
    - `progress`: Store SRS (Spaced Repetition System) data, including status (New, Learning, Mastered) and last review timestamps.
- **Web Fallback**: For development and browser previews, the app automatically transitions to `localStorage` when the Electron API is unavailable.

---

## 🔊 Native Features

### Voice & Speech
The **Spelling Check** mode utilizes the native `SpeechSynthesis` API.
- **Dynamic Selection**: The app queries the OS for available voices, prioritizing natural-sounding English variants.
- **Real-time Synthesis**: Provides immediate audio feedback for vocab terms, reinforcing auditory learning.

---

## 📦 Build & Development

### Vite Configuration
The project uses a custom Vite setup optimized for Electron:
- **Relative Paths**: `base: './'` ensures all assets load correctly from the filesystem.
- **Vite-Tailwind Bridge**: Integrated via `@tailwindcss/vite` to handle the modern Tailwind v4 syntax.

### Packaging Pipeline
1. **Build**: `npm run build` compiles the React source into the `/dist` directory.
2. **Main Process**: `electron/main.cjs` (CommonJS) bootstraps the Electron app and sets up IPC (Inter-Process Communication) for database access.
3. **Packaging**: `npm run electron:build` invokes `electron-builder` to bundle the app into a distributive installer.
