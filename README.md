# MemoryDeck - English Learning App

![MemoryDeck Banner](https://img.shields.io/badge/Desktop-Ready-sky500?style=for-the-badge&logo=electron)
![MemoryDeck Platform](https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge&logo=windows)

Welcome to **MemoryDeck**, an interactive, offline-first English learning application designed to help users master new vocabulary through a variety of engaging exercises and a robust spaced-repetition system.

---

## 🚀 Quick Start

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js)
- **Git** (to clone the repository)

### Installation Guide
1. **Clone the repository:**
   ```powershell
   git clone https://github.com/your-username/MemoryDeck.git
   cd MemoryDeck/MemoryDeckPC
   ```

2. **Install dependencies:**
   ```powershell
   npm install
   ```

3. **Start in Development Mode (Vite Dev Server):**
   ```powershell
   npm run dev
   ```

4. **Start in Development Mode (Desktop/Electron):**
   ```powershell
   npm run electron:dev
   ```

---

## 🛠 Developer Guide

### Project Structure
- `/components`: Core React UI components.
- `/hooks`: Custom hooks for state management (SQLite, Toast, Modal).
- `/electron`: Electron main process and SQLite database bridging.
- `/docs`: Detailed project documentation.
- `vite.config.ts`: Configuration for Vite with Tailwind CSS v4 support.

### Build and Package
To build the application and package it as a Windows executable:
1. **Build the production web bundle:**
   ```powershell
   npm run build
   ```
2. **Generate the Windows Installer:**
   ```powershell
   npm run electron:build
   ```
   *Note: This command builds the frontend and then packages it using electron-builder.*

---

## 📖 Detailed Documentation
Expand your knowledge of MemoryDeck by exploring our specialized guides:

- [**Project Overview**](./docs/overview.md) - Deep dive into core features and design.
- [**User Guide**](./docs/user.md) - Learn how to manage decks, add cards, and use learning modes.
- [**Technical Details**](./docs/technical.md) - Tech stack, SQLite architecture, and Electron integration.

---

## ✨ Features at a Glance
- **Custom Decks**: Organize your learning into specialized categories (Decks).
- **Spaced Repetition**: Enhanced flashcards with "Easy", "Good", and "Hard" feedback loops to optimize review frequency.
- **Multi-Modal Learning**: Quiz, Matching Game, and a voice-powered **Spelling Check** mode.
- **Premium Aesthetics**: Modern interface with glassmorphism, smooth animations, and automatic Dark Mode persistence.
- **Robust Persistence**: All data is stored locally in a **SQLite** database (`memorydeck.db`), ensuring your progress is safe and fast.
- **Bulk Import**: Quickly add cards using tab-separated text data.