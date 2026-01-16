# ConvertKing MVP

A modern, full-stack media conversion web application for converting video, audio, image, and document files.

## Features

**Video Converters:** MP4, GIF, MOV to MP4, General Video Converter
**Audio Converters:** MP3, MP4 to MP3, Video to MP3, General Audio Converter
**Image Converters:** PNG, JPG, WebP, and more
**Document Converters:** PDF and various document formats

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express
- **File Processing**: FFmpeg + Sharp + pdf-lib

## Quick Start

**Prerequisites:** Node.js v18+ and FFmpeg

```bash
# Install all dependencies
npm run install:all

# Run the application
npm run dev
```

Access the app at **http://localhost:3000**

For detailed installation instructions, see [INSTALLATION.md](./INSTALLATION.md)

---

## Project Structure

```
convertking-mvp/
├── client/               # React frontend (Vite + Tailwind)
│   ├── public/          # Static assets, sitemap, robots.txt
│   └── src/             # React components and styles
├── server/              # Express backend + conversion APIs
│   ├── server.js        # Main server file
│   ├── uploads/         # Temporary file storage
│   └── converted/       # Converted files
└── package.json         # Root scripts
```

## Usage

1. Start the application: `npm run dev`
2. Open http://localhost:3000
3. Select a converter (Video/Audio/Image/Document)
4. Upload or drag-drop your file
5. Click "Convert" and wait for processing
6. Download the converted file

**Supported Formats:**
- **Video**: MP4, MOV, AVI, MKV, WebM, 3GP, FLV → MP4, GIF
- **Audio**: MP3, WAV, OGG, AAC, FLAC, MP4 (extract audio) → MP3
- **Image**: PNG, JPG, WebP, GIF, TIFF, BMP → PNG, JPG, WebP
- **Document**: PDF and various document formats

**File Size Limit:** 500MB (configurable in server/server.js:53)

---

## API Endpoints

### `POST /api/convert`
Converts uploaded media files.

**Request:** `multipart/form-data`
- `file`: Media file to convert
- `converterId`: Conversion type (mp4, gif, mp3, png, jpg, webp, pdf, etc.)
- `type`: File category (video, audio, image, document)

**Response:**
```json
{
  "success": true,
  "downloadUrl": "/converted/filename.ext",
  "filename": "filename.ext"
}
```

### `GET /api/health`
Health check endpoint. Returns `{ "status": "ok", "message": "ConvertKing API is running" }`

---

## Development

**Environment Variables** (create `server/.env`):
```env
PORT=5000
MAX_FILE_SIZE=524288000
```

**Frontend**: Edit `client/src/` - hot reload enabled
**Backend**: Edit `server/server.js` - auto-restart with `--watch` flag

## Production Deployment

```bash
# Build frontend
cd client && npm run build && cd ..

# Start server
cd server && npm start
```

**Requirements:**
- FFmpeg installed on server
- Node.js v18+
- Write permissions for `uploads/` and `converted/` directories
- Consider using Nginx as reverse proxy with SSL

---

## Key Features

- Modern UI with glassmorphism and smooth animations
- Fully responsive design
- Real-time progress tracking
- Secure file handling with automatic cleanup
- File validation on client and server
- SEO-optimized (sitemap.xml, robots.txt)

---

## Troubleshooting

See [INSTALLATION.md](./INSTALLATION.md) for common issues and solutions.

**Quick Checks:**
- Verify FFmpeg: `ffmpeg -version`
- Check server logs for detailed errors
- Inspect browser console for frontend issues
- Ensure all dependencies are installed: `npm run install:all`

---

## License

MIT License

Built with FFmpeg, React, Express, Tailwind CSS, and Framer Motion.
