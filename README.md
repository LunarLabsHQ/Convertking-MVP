# ConvertKing MVP

A modern, **100% client-side** media conversion web application. Convert video, audio, images, and documents **directly in your browser** - no uploads, no server, completely private!

## 🚀 New: 100% Browser-Based Conversion!

All conversions now happen **in your browser** using WebAssembly:
- ✅ **No uploads** - Files never leave your device
- ✅ **Completely private** - Zero data sent to servers
- ✅ **Free hosting** - Deploy to Netlify for $0/month
- ✅ **No backend** - Just static files

## Features

**Video Converters:** MP4, GIF, MOV to MP4, General Video Converter
**Audio Converters:** MP3, MP4 to MP3, Video to MP3, General Audio Converter
**Image Converters:** JPG/PNG → PDF, PDF → JPG, HEIC → JPG
**Document Converters:** PDF → Word, Images → PDF

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Conversion Engine**: FFmpeg.wasm (WebAssembly)
- **PDF Processing**: pdf-lib
- **Image Processing**: Canvas API

## Quick Start

**Prerequisites:** Node.js v18+ only (no FFmpeg needed!)

```bash
# Install dependencies
cd client
npm install

# Run development server
npm run dev
```

Access the app at **http://localhost:3000**

**Deploy to Netlify** (2 minutes):
```bash
npm run build
npx netlify-cli deploy --prod
```

See [DEPLOY-NETLIFY.md](./DEPLOY-NETLIFY.md) for detailed deployment instructions.

---

## Project Structure

```
convertking-mvp/
├── client/                      # React frontend (ONLY FOLDER NEEDED!)
│   ├── public/                 # Static assets, sitemap, robots.txt
│   ├── src/
│   │   ├── components/        # React components
│   │   ├── utils/             # Conversion services
│   │   │   ├── ffmpegService.js      # Video/audio (FFmpeg.wasm)
│   │   │   ├── imageService.js       # Image processing
│   │   │   ├── documentService.js    # PDF operations
│   │   │   └── conversionService.js  # Main orchestrator
│   │   └── App.jsx
│   ├── netlify.toml           # Required headers for deployment
│   └── package.json
│
├── server/                     # Legacy backend (NOT NEEDED ANYMORE)
├── DEPLOY-NETLIFY.md          # Deployment guide
└── README.md                  # This file
```

## Usage

1. Start the app: `npm run dev` (from `client` folder)
2. Open http://localhost:3000
3. Select a converter (Video/Audio/Image/Document)
4. **Drag and drop** or click to select your file
5. Click "Convert" - conversion happens **in your browser**
6. Download the converted file

**Supported Formats:**
- **Video**: MP4, MOV, AVI, MKV → MP4, GIF
- **Audio**: Any video → MP3 (audio extraction)
- **Image**: JPG, PNG, HEIC → PDF or JPG
- **Document**: PDF → Word (RTF), Images → PDF

**Recommended File Size:** < 100MB for best performance (browser memory limited)

---

## How It Works

ConvertKing uses **FFmpeg.wasm** - a WebAssembly port of FFmpeg:

1. User selects a file (no upload!)
2. File loads into browser memory
3. FFmpeg.wasm processes it using user's CPU
4. Converted file downloads automatically
5. Everything cleans up from memory

**Your files NEVER touch a server!**

---

## Development

**Start dev server:**
```bash
cd client
npm run dev
```

Hot reload is enabled - edit files in `client/src/`

**Add new converter:**
1. Add to converter config (e.g., `VideoConverters.jsx`)
2. Add case to `conversionService.js`
3. Implement in respective service file

## Production Deployment

**Netlify (Recommended - Free!):**
```bash
cd client
npm run build
npx netlify-cli deploy --prod
```

**Other hosts (Vercel, Cloudflare Pages, etc.):**
1. Build command: `npm run build`
2. Publish directory: `dist`
3. **Important:** Add these headers (see `netlify.toml`):
   - `Cross-Origin-Embedder-Policy: require-corp`
   - `Cross-Origin-Opener-Policy: same-origin`

These headers are **required** for SharedArrayBuffer (used by FFmpeg.wasm)

---

## Key Features

- 🎨 Modern UI with glassmorphism and smooth animations
- 📱 Fully responsive design
- 📊 Real-time progress tracking
- 🔒 100% private - files never uploaded
- ⚡ Client-side processing with WebAssembly
- 🆓 Zero server costs
- 🌐 SEO-optimized (sitemap.xml, robots.txt)

---

## Troubleshooting

### "SharedArrayBuffer is not defined"
Add required headers in `netlify.toml` (already included). Redeploy if needed.

### Conversion is slow
Normal! Browser conversions are slower than server-side:
- Small files (< 10MB): 5-30 seconds
- Medium files (10-50MB): 30-120 seconds
- Large files (> 50MB): May timeout

### Out of memory / Browser crash
File is too large for browser. Recommend:
- Use files < 100MB
- Close other browser tabs
- Use Chrome/Edge (better WebAssembly support)

### Conversion fails
- Check browser console for errors
- Try smaller file
- Ensure modern browser (Chrome/Edge/Firefox)
- Some formats may not be supported client-side

---

## License

MIT License

Built with FFmpeg, React, Express, Tailwind CSS, and Framer Motion.
