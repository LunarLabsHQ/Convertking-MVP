# ConvertKing MVP

A modern, full-stack media conversion web application built with React, Tailwind CSS, and Node.js.

## Features

- 🎥 **Video Converters**
  - MP4 Converter
  - Video to GIF
  - MOV to MP4
  - General Video Converter

- 🎵 **Audio Converters**
  - MP3 Converter
  - MP4 to MP3
  - Video to MP3
  - General Audio Converter

## Tech Stack

- **Frontend**: React + Vite + Tailwind CSS + Framer Motion
- **Backend**: Node.js + Express
- **File Processing**: FFmpeg (via fluent-ffmpeg)

---

## 📋 Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Software

1. **Node.js** (v18 or higher)
   - Download from: https://nodejs.org/
   - Verify installation: `node --version` and `npm --version`

2. **FFmpeg** (Required for file conversion)
   - This is essential for the conversion functionality to work

### Installing FFmpeg

#### Windows:
**Option 1: Using Chocolatey (Recommended)**
```bash
choco install ffmpeg
```

**Option 2: Manual Installation**
1. Download FFmpeg from https://ffmpeg.org/download.html
2. Extract the ZIP file to a location (e.g., `C:\ffmpeg`)
3. Add FFmpeg to your system PATH:
   - Open System Properties → Environment Variables
   - Edit the "Path" variable
   - Add the `bin` folder path (e.g., `C:\ffmpeg\bin`)
4. Verify installation: Open Command Prompt and run `ffmpeg -version`

#### macOS:
```bash
# Using Homebrew
brew install ffmpeg

# Verify installation
ffmpeg -version
```

#### Linux (Ubuntu/Debian):
```bash
sudo apt update
sudo apt install ffmpeg

# Verify installation
ffmpeg -version
```

#### Linux (CentOS/RHEL):
```bash
sudo yum install epel-release
sudo yum install ffmpeg

# Verify installation
ffmpeg -version
```

---

## 🚀 Installation Guide

### Step 1: Clone or Navigate to the Project

If you have the project files, navigate to the project directory:
```bash
cd "Convertking MVP"
```

### Step 2: Install All Dependencies

The project uses a root package.json that helps manage both client and server dependencies. Run:

```bash
npm run install:all
```

This command will:
1. Install root-level dependencies (concurrently for running both servers)
2. Install client dependencies (React, Vite, Tailwind, etc.)
3. Install server dependencies (Express, Multer, FFmpeg wrapper, etc.)

**Alternative: Manual Installation**

If the above command doesn't work, you can install dependencies manually:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..

# Install server dependencies
cd server
npm install
cd ..
```

### Step 3: Verify Installation

Check that all dependencies are installed correctly:

```bash
# Check root dependencies
npm list --depth=0

# Check client dependencies
cd client && npm list --depth=0 && cd ..

# Check server dependencies
cd server && npm list --depth=0 && cd ..
```

---

## 🏃 Running the Application

### Option 1: Run Both Frontend and Backend Together (Recommended)

From the root directory, run:

```bash
npm run dev
```

This will start:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

The `concurrently` package runs both servers simultaneously.

### Option 2: Run Frontend and Backend Separately

Open two terminal windows:

**Terminal 1 - Frontend:**
```bash
cd client
npm run dev
```
Frontend will be available at http://localhost:3000

**Terminal 2 - Backend:**
```bash
cd server
npm run dev
```
Backend API will be available at http://localhost:5000

### Option 3: Production Build

To create a production build:

```bash
# Build the frontend
cd client
npm run build
cd ..

# Start the server (production mode)
cd server
npm start
```

---

## 📁 Project Structure

```
convertking-mvp/
├── client/                      # React frontend application
│   ├── public/
│   │   ├── sitemap.xml         # SEO sitemap
│   │   └── robots.txt          # SEO robots file
│   ├── src/
│   │   ├── components/         # React components
│   │   │   ├── Header.jsx
│   │   │   ├── Hero.jsx
│   │   │   ├── VideoConverters.jsx
│   │   │   ├── AudioConverters.jsx
│   │   │   ├── ConverterCard.jsx
│   │   │   ├── FileUploader.jsx
│   │   │   └── Footer.jsx
│   │   ├── App.jsx             # Main app component
│   │   ├── main.jsx            # React entry point
│   │   └── index.css           # Global styles with Tailwind
│   ├── index.html
│   ├── package.json
│   ├── vite.config.js          # Vite configuration
│   ├── tailwind.config.js      # Tailwind CSS configuration
│   └── postcss.config.js       # PostCSS configuration
├── server/                      # Node.js backend application
│   ├── server.js               # Express server and API routes
│   ├── uploads/                # Temporary upload storage (auto-created)
│   ├── converted/              # Converted files storage (auto-created)
│   ├── package.json
│   └── .gitignore
├── public/                      # Root public files
│   ├── sitemap.xml
│   └── robots.txt
├── package.json                 # Root package.json with scripts
├── .gitignore
└── README.md                    # This file
```

---

## 🎯 Usage Guide

### Using the Application

1. **Start the application** (see Running the Application above)

2. **Open your browser** and navigate to http://localhost:3000

3. **Select a converter**:
   - Click on any converter card (Video or Audio section)
   - The card will expand to show the upload interface

4. **Upload a file**:
   - Click the upload area or drag and drop a file
   - Supported formats: MP4, MOV, AVI, MKV, WebM, MP3, WAV, OGG, AAC, FLAC

5. **Convert the file**:
   - Click the "Convert" button
   - Watch the progress bar as your file is processed
   - Wait for the conversion to complete

6. **Download the result**:
   - Once conversion is complete, a "Download" button will appear
   - Click to download your converted file

### Supported Conversions

**Video Conversions:**
- Any video → MP4
- Any video → GIF
- MOV → MP4
- General video format conversion

**Audio Conversions:**
- Any audio → MP3
- MP4 video → MP3 (extracts audio)
- Any video → MP3 (extracts audio)
- General audio format conversion

---

## 🔧 Troubleshooting

### Common Issues

**1. FFmpeg not found error**
- **Solution**: Ensure FFmpeg is installed and added to your system PATH
- Verify with: `ffmpeg -version` in your terminal

**2. Port already in use**
- **Solution**: Change the port in `client/vite.config.js` (frontend) or `server/server.js` (backend)
- Or stop the process using the port

**3. Dependencies installation fails**
- **Solution**: 
  - Clear npm cache: `npm cache clean --force`
  - Delete `node_modules` folders and `package-lock.json` files
  - Run `npm install` again

**4. File conversion fails**
- **Solution**: 
  - Check that the input file is a valid media file
  - Ensure FFmpeg supports the input format
  - Check server console for detailed error messages

**5. CORS errors**
- **Solution**: The backend is configured with CORS. If issues persist, check `server/server.js` CORS settings

### Getting Help

If you encounter issues:
1. Check the browser console for frontend errors
2. Check the server terminal for backend errors
3. Verify FFmpeg installation: `ffmpeg -version`
4. Ensure all dependencies are installed correctly

---

## ✨ Features

- ✨ Beautiful, modern UI with glassmorphism effects
- 🎨 Smooth animations using Framer Motion
- 📱 Fully responsive design (mobile, tablet, desktop)
- ⚡ Fast file conversion using FFmpeg
- 🔒 Secure file handling with automatic cleanup
- 📊 Real-time progress tracking
- 🎯 Multiple conversion formats supported
- 🌐 SEO-friendly with sitemap.xml and robots.txt

---

## 📝 Important Notes

- **Maximum file size**: 500MB (configurable in `server/server.js`)
- **File cleanup**: Uploaded and converted files are automatically deleted after processing
- **Supported input formats**: MP4, MOV, AVI, MKV, WebM, 3GP, FLV, MP3, WAV, OGG, AAC, FLAC
- **Output formats**: MP4, GIF, MP3
- **Processing time**: Depends on file size and system performance

---

## 🔐 Security Notes

- Files are stored temporarily and automatically deleted
- File type validation is enforced on both client and server
- Maximum file size limits prevent abuse
- CORS is configured for secure API access

---

## 📄 SEO Files

The project includes:
- **sitemap.xml**: Located in `client/public/sitemap.xml` for search engine indexing
- **robots.txt**: Located in `client/public/robots.txt` for crawler instructions

These files are automatically served by the Vite dev server and will be included in production builds.

---

## 🛠️ Development

### Making Changes

**Frontend Changes:**
- Edit files in `client/src/`
- Changes are hot-reloaded automatically
- Tailwind classes are available for styling

**Backend Changes:**
- Edit `server/server.js` for API changes
- Server restarts automatically with `--watch` flag

### Environment Variables

Create a `.env` file in the `server/` directory for custom configuration:

```env
PORT=5000
MAX_FILE_SIZE=524288000
```

---

## 📦 Production Deployment

### Building for Production

```bash
# Build the React app
cd client
npm run build
cd ..

# The server will serve the built files
cd server
npm start
```

### Deployment Considerations

1. **FFmpeg**: Must be installed on the production server
2. **Node.js**: v18 or higher required
3. **File Storage**: Ensure `uploads/` and `converted/` directories have write permissions
4. **Environment**: Set appropriate environment variables
5. **Reverse Proxy**: Consider using Nginx for production
6. **HTTPS**: Use SSL certificates for secure file transfers

---

## 📚 API Endpoints

### POST `/api/convert`
Converts uploaded media files.

**Request:**
- Method: POST
- Content-Type: multipart/form-data
- Body:
  - `file`: The media file to convert
  - `converterId`: The type of conversion (mp4, gif, mov-mp4, mp3, mp4-mp3, video-mp3, video-general, audio-general)
  - `type`: Either "video" or "audio"

**Response:**
```json
{
  "success": true,
  "downloadUrl": "/converted/converted-1234567890.mp4",
  "filename": "converted-1234567890.mp4"
}
```

### GET `/api/health`
Health check endpoint.

**Response:**
```json
{
  "status": "ok",
  "message": "ConvertKing API is running"
}
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

---

## 📄 License

MIT License - feel free to use this project for personal or commercial purposes.

---

## 🙏 Acknowledgments

- FFmpeg for powerful media processing
- React and Vite for the modern frontend
- Express.js for the robust backend
- Tailwind CSS for beautiful styling
- Framer Motion for smooth animations

---

## 📞 Support

For issues, questions, or contributions, please check:
- The troubleshooting section above
- Server console logs for detailed error messages
- Browser developer console for frontend errors

---

**Happy Converting! 🎬🎵**
