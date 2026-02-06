# MemoryDeck - English Learning App

![MemoryDeck Banner](https://img.shields.io/badge/Desktop-Ready-sky500?style=for-the-badge&logo=electron)
![MemoryDeck Platform](https://img.shields.io/badge/Platform-Windows-blue?style=for-the-badge&logo=windows)

Welcome to **MemoryDeck**, an interactive, offline-first English learning application designed to help users master new vocabulary through a variety of engaging exercises. 

---

## 🚀 Quick Start

### Prerequisites
Before you begin, ensure you have the following installed on your machine:
- **Node.js** (v18 or higher recommended)
- **npm** (comes with Node.js) or **yarn**
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

3. **Start in Development Mode (Web):**
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
- `/app` or `/components`: Core React components.
- `/electron`: Electron main and preload scripts.
- `/docs`: Detailed project documentation.
- `vite.config.ts`: Configuration for the Vite build system.

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
   *Note: This command requires administrative privileges to create symbolic links.*

---

## 📖 Detailed Documentation
Expand your knowledge of Memorydeck by exploring our specialized guides:

- [**Project Overview**](./docs/overview.md) - Deep dive into core features and design.
- [**User Guide**](./docs/user.md) - Learn how to manage decks, add cards, and use learning modes.
- [**Technical Details**](./docs/technical.md) - Tech stack, storage architecture, and Electron integration.

---

## ✨ Features at a Glance
- **Custom Decks**: Organize your learning into specialized categories.
- **Spaced Repetition**: Interactive flashcards with Easy/Good/Hard feedback loops.
- **Multi-Modal Learning**: Quiz, Matching, and the new **Spelling Check** mode.
- **Premium Aesthetics**: Sleek dark/light mode with glassmorphism effects.
- **Fully Offline**: All data is stored locally in your browser/app storage.