# Technical Details: Under the Hood

MemoryDeck is built with modern web and desktop technologies, focusing on performance, offline capability, and a premium user experience.

---

## 🛠 Tech Stack

### Frontend Core
- **React 19**: Utilizing the latest features for efficient rendering.
- **TypeScript**: Ensuring type safety across the entire application.
- **Tailwind CSS**: A utility-first CSS framework for rapid, responsive design.
- **React Router (HashRouter)**: Enabling client-side routing that works perfectly in both browser and Electron environments.

### Desktop Integration
- **Electron**: Wrapping the web application into a native Windows executable.
- **electron-builder**: Managing the packaging and installation process (`memorydeck_installer.exe`).
- **electron-packager**: Used as a fallback for generating portable standalone folders.

---

## 💾 Data Architecture

### SQLite Persistence
MemoryDeck is strictly offline-first. It now leverages a structured **SQLite** database for superior data integrity and performance on desktop.

- **SQLite (Desktop)**: All Decks, Cards, and user progress are stored in a native `memorydeck.db` file handled by `better-sqlite3`.
- **Local Storage (Fallback)**: For browser-based previews, the app seamlessly falls back to the browser's `localStorage`.

---

## 🔊 Native Features

### Web Speech API
The **Spelling Check** feature leverages the `window.speechSynthesis` API. 
- **TTS Engine**: It automatically detects and uses the highest-quality voice available on the host operating system (e.g., Microsoft David/Zira on Windows).
- **Dynamic Feedback**: Provides audio cues for correct/incorrect answers during learning sessions.

---

## 📦 Build Process

### Relative Asset Loading
To ensure compatibility with the `file://` protocol used in Electron, the Vite configuration is set to:
```typescript
base: './'
```
This forces all imports (JS, CSS, Images) to use relative paths, preventing "404 Not Found" errors in the packaged executable.

### Packaging Lifecycle
1. **Compilation**: `npm run build` generates a minified `/dist` folder.
2. **Main Process**: `electron/main.cjs` initializes the Electron window and loads the local `index.html`.
3. **Packaging**: `electron-builder` compresses the resources into an NSIS installer.
