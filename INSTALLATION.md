# ConvertKing MVP - Installation Guide

Quick setup guide for ConvertKing MVP file converter application.

## Prerequisites

- **Node.js** v18+ ([Download](https://nodejs.org/))
- **FFmpeg** (required for conversions)

## Quick Install

### 1. Install Node.js

**Windows/macOS:** Download installer from [nodejs.org](https://nodejs.org/) and run it.

**Linux:**
```bash
sudo apt update && sudo apt install nodejs npm
```

Verify: `node --version` (should show v18+)

### 2. Install FFmpeg

**Windows (Chocolatey):**
```bash
choco install ffmpeg
```

**Windows (Manual):** Download from [gyan.dev/ffmpeg](https://www.gyan.dev/ffmpeg/builds/), extract to `C:\ffmpeg`, and add `C:\ffmpeg\bin` to PATH.

**macOS:**
```bash
brew install ffmpeg
```

**Linux:**
```bash
sudo apt install ffmpeg
```

Verify: `ffmpeg -version`

### 3. Install Project Dependencies

Navigate to project directory and run:
```bash
npm run install:all
```

This installs all dependencies for root, client, and server.

## Run the Application

From the project root:
```bash
npm run dev
```

Access the app at **http://localhost:3000**

Backend runs on **http://localhost:5000**

## Common Issues

**"npm not found"** - Reinstall Node.js, ensure "Add to PATH" is checked, restart terminal.

**"ffmpeg not found"** - Reinstall FFmpeg, add to PATH, restart terminal.

**"Port already in use"** - Change port in `client/vite.config.js` (3000) or `server/server.js` (5000).

**"Cannot find module"** - Delete `node_modules` folders and run `npm run install:all` again.

**Conversion fails** - Verify FFmpeg is installed and file is valid media format.