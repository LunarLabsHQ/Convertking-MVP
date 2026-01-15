# ConvertKing MVP - Installation & Setup Guide

This is a detailed step-by-step guide to install and set up the ConvertKing MVP application.

---

## 📋 Table of Contents

1. [Prerequisites](#prerequisites)
2. [Installing Node.js](#installing-nodejs)
3. [Installing FFmpeg](#installing-ffmpeg)
4. [Installing Project Dependencies](#installing-project-dependencies)
5. [Verifying Installation](#verifying-installation)
6. [Running the Application](#running-the-application)
7. [Troubleshooting](#troubleshooting)

---

## Prerequisites

Before installing ConvertKing MVP, you need:

1. **Node.js** (version 18 or higher)
2. **npm** (comes with Node.js)
3. **FFmpeg** (for file conversion)

---

## Installing Node.js

### Windows

1. Visit https://nodejs.org/
2. Download the LTS (Long Term Support) version
3. Run the installer (.msi file)
4. Follow the installation wizard
5. **Important**: Check the box "Add to PATH" during installation
6. Restart your terminal/command prompt

**Verify Installation:**
```bash
node --version
npm --version
```

You should see version numbers (e.g., v18.17.0 and 9.6.7)

### macOS

**Option 1: Using Homebrew (Recommended)**
```bash
brew install node
```

**Option 2: Official Installer**
1. Visit https://nodejs.org/
2. Download the macOS installer (.pkg file)
3. Run the installer
4. Follow the installation steps

**Verify Installation:**
```bash
node --version
npm --version
```

### Linux (Ubuntu/Debian)

```bash
# Update package index
sudo apt update

# Install Node.js and npm
sudo apt install nodejs npm

# Verify installation
node --version
npm --version
```

**Note**: If you get an older version, use NodeSource repository:
```bash
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs
```

---

## Installing FFmpeg

FFmpeg is **REQUIRED** for the file conversion functionality to work.

### Windows

#### Method 1: Using Chocolatey (Easiest)

1. Install Chocolatey (if not installed):
   - Open PowerShell as Administrator
   - Run: `Set-ExecutionPolicy Bypass -Scope Process -Force; [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072; iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))`

2. Install FFmpeg:
```bash
choco install ffmpeg
```

#### Method 2: Manual Installation

1. Download FFmpeg:
   - Visit https://www.gyan.dev/ffmpeg/builds/
   - Download "ffmpeg-release-essentials.zip"

2. Extract the ZIP file:
   - Extract to `C:\ffmpeg` (or your preferred location)

3. Add to PATH:
   - Press `Win + X` and select "System"
   - Click "Advanced system settings"
   - Click "Environment Variables"
   - Under "System variables", find and select "Path"
   - Click "Edit"
   - Click "New"
   - Add: `C:\ffmpeg\bin` (or your extraction path + `\bin`)
   - Click "OK" on all windows

4. Restart your terminal/command prompt

**Verify Installation:**
```bash
ffmpeg -version
```

You should see FFmpeg version information.

### macOS

```bash
# Using Homebrew
brew install ffmpeg

# Verify installation
ffmpeg -version
```

### Linux (Ubuntu/Debian)

```bash
# Update package list
sudo apt update

# Install FFmpeg
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

### Linux (CentOS/RHEL/Fedora)

```bash
# For CentOS/RHEL
sudo yum install epel-release
sudo yum install ffmpeg

# For Fedora
sudo dnf install ffmpeg

# Verify installation
ffmpeg -version
```

---

## Installing Project Dependencies

### Step 1: Navigate to Project Directory

Open your terminal/command prompt and navigate to the project folder:

```bash
cd "C:\Users\shash\OneDrive\Desktop\Convertking MVP"
```

Or if you're in a different location:
```bash
cd path/to/your/project
```

### Step 2: Install All Dependencies

The project has a convenient script that installs all dependencies at once:

```bash
npm run install:all
```

This command will:
1. Install root-level dependencies (concurrently package)
2. Install client dependencies (React, Vite, Tailwind, etc.)
3. Install server dependencies (Express, Multer, FFmpeg wrapper, etc.)

**Expected Output:**
You should see installation progress for:
- Root dependencies
- Client dependencies (in `client/` folder)
- Server dependencies (in `server/` folder)

**Time Required:** 2-5 minutes depending on your internet connection

### Alternative: Manual Installation

If `npm run install:all` doesn't work, install dependencies manually:

```bash
# 1. Install root dependencies
npm install

# 2. Install client dependencies
cd client
npm install
cd ..

# 3. Install server dependencies
cd server
npm install
cd ..
```

---

## Verifying Installation

### Check Node.js and npm

```bash
node --version    # Should show v18.x.x or higher
npm --version     # Should show 9.x.x or higher
```

### Check FFmpeg

```bash
ffmpeg -version   # Should show FFmpeg version information
```

### Check Project Dependencies

```bash
# Check root dependencies
npm list --depth=0

# Check client dependencies
cd client
npm list --depth=0
cd ..

# Check server dependencies
cd server
npm list --depth=0
cd ..
```

**Expected Packages:**

**Root:**
- concurrently

**Client:**
- react
- react-dom
- vite
- tailwindcss
- framer-motion
- axios

**Server:**
- express
- cors
- multer
- fluent-ffmpeg
- dotenv

---

## Running the Application

### Quick Start (Recommended)

From the root directory, run:

```bash
npm run dev
```

This starts both frontend and backend simultaneously.

**You should see:**
- Frontend running on http://localhost:3000
- Backend running on http://localhost:5000

### Separate Terminals

If you prefer to run them separately:

**Terminal 1 - Frontend:**
```bash
cd client
npm run dev
```

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```

### Access the Application

1. Open your web browser
2. Navigate to: **http://localhost:3000**
3. You should see the ConvertKing MVP interface

---

## Troubleshooting

### Issue: "npm: command not found"

**Solution:**
- Node.js is not installed or not in PATH
- Reinstall Node.js and ensure "Add to PATH" is checked
- Restart your terminal

### Issue: "ffmpeg: command not found"

**Solution:**
- FFmpeg is not installed or not in PATH
- Reinstall FFmpeg and add to PATH
- Restart your terminal
- Verify with: `ffmpeg -version`

### Issue: "Port 3000 already in use"

**Solution:**
- Another application is using port 3000
- Change the port in `client/vite.config.js`:
  ```javascript
  server: {
    port: 3001,  // Change to a different port
  }
  ```

### Issue: "Port 5000 already in use"

**Solution:**
- Another application is using port 5000
- Change the port in `server/server.js`:
  ```javascript
  const PORT = process.env.PORT || 5001;  // Change to a different port
  ```

### Issue: "Cannot find module" errors

**Solution:**
- Dependencies are not installed correctly
- Delete `node_modules` folders and `package-lock.json` files
- Run `npm run install:all` again

### Issue: "EACCES: permission denied"

**Solution (Linux/macOS):**
- Use `sudo` for npm install (not recommended)
- Or fix npm permissions: https://docs.npmjs.com/resolving-eacces-permissions-errors-when-installing-packages-globally

### Issue: File conversion fails

**Solution:**
- Verify FFmpeg is installed: `ffmpeg -version`
- Check that the input file is a valid media file
- Check server console for detailed error messages
- Ensure file size is under 500MB

### Issue: CORS errors in browser

**Solution:**
- Ensure backend is running on port 5000
- Check `server/server.js` has CORS enabled
- Verify `client/vite.config.js` proxy configuration

---

## Next Steps

After successful installation:

1. ✅ Verify the application runs: `npm run dev`
2. ✅ Open http://localhost:3000 in your browser
3. ✅ Test file conversion with a sample media file
4. ✅ Check the README.md for usage instructions

---

## Need Help?

If you're still experiencing issues:

1. Check the **Troubleshooting** section above
2. Review server console logs for errors
3. Check browser developer console (F12) for frontend errors
4. Verify all prerequisites are installed correctly
5. Ensure you're in the correct directory when running commands

---

**Installation Complete! 🎉**

You're now ready to use ConvertKing MVP!