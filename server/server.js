import express from 'express'
import cors from 'cors'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Middleware
app.use(cors())
app.use(express.json())

// Serve static files with proper headers for downloads
app.use('/uploads', express.static(path.join(__dirname, 'uploads')))
app.use('/converted', express.static(path.join(__dirname, 'converted'), {
  setHeaders: (res, filePath) => {
    // Set proper headers for file downloads
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(filePath)}"`)
    res.setHeader('Access-Control-Allow-Origin', '*')
  }
}))

// Ensure directories exist
const uploadsDir = path.join(__dirname, 'uploads')
const convertedDir = path.join(__dirname, 'converted')

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}
if (!fs.existsSync(convertedDir)) {
  fs.mkdirSync(convertedDir, { recursive: true })
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
    cb(null, uniqueSuffix + path.extname(file.originalname))
  }
})

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 500 * 1024 * 1024 // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept video and audio files
    const allowedMimes = [
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
      'video/webm', 'video/3gpp', 'video/x-flv', 'video/mpeg',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac',
      'audio/flac', 'audio/webm', 'application/octet-stream'
    ]

    // Also check file extension as fallback
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpeg', '.mpg',
      '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma']
    const fileExtension = path.extname(file.originalname).toLowerCase()

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Please upload a video or audio file.'))
    }
  }
})

// Conversion function
const convertFile = (inputPath, outputPath, options) => {
  return new Promise((resolve, reject) => {
    let command = ffmpeg(inputPath)

    // Apply conversion options
    if (options.format) {
      command = command.format(options.format)
    }
    if (options.videoCodec) {
      command = command.videoCodec(options.videoCodec)
    }
    if (options.audioCodec) {
      command = command.audioCodec(options.audioCodec)
    }
    if (options.videoBitrate) {
      command = command.videoBitrate(options.videoBitrate)
    }
    if (options.audioBitrate) {
      command = command.audioBitrate(options.audioBitrate)
    }
    if (options.fps) {
      command = command.fps(options.fps)
    }
    if (options.size) {
      command = command.size(options.size)
    }
    if (options.noVideo) {
      command = command.noVideo()
    }
    if (options.noAudio === false) {
      command = command.audioCodec('libmp3lame')
    }

    command
      .on('end', () => {
        resolve(outputPath)
      })
      .on('error', (err) => {
        reject(err)
      })
      .save(outputPath)
  })
}

// Conversion endpoint
app.post('/api/convert', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, error: 'No file uploaded' })
    }

    const { converterId, type } = req.body
    const inputPath = req.file.path
    const inputExt = path.extname(req.file.originalname).toLowerCase()
    const uniqueId = Date.now() + '-' + Math.round(Math.random() * 1E9)

    let outputPath
    let options = {}

    // Determine output format based on converter type
    switch (converterId) {
      case 'mp4':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mp4`)
        options = { format: 'mp4', videoCodec: 'libx264', audioCodec: 'aac' }
        break

      case 'gif':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.gif`)
        options = { format: 'gif', fps: 10, size: '800x600' }
        break

      case 'mov-mp4':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mp4`)
        options = { format: 'mp4', videoCodec: 'libx264', audioCodec: 'aac' }
        break

      case 'mp3':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mp3`)
        options = { format: 'mp3', audioCodec: 'libmp3lame', audioBitrate: '192k', noVideo: true }
        break

      case 'mp4-mp3':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mp3`)
        options = { format: 'mp3', audioCodec: 'libmp3lame', audioBitrate: '192k', noVideo: true }
        break

      case 'video-mp3':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mp3`)
        options = { format: 'mp3', audioCodec: 'libmp3lame', audioBitrate: '192k', noVideo: true }
        break

      case 'video-general':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mp4`)
        options = { format: 'mp4', videoCodec: 'libx264', audioCodec: 'aac' }
        break

      case 'audio-general':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mp3`)
        options = { format: 'mp3', audioCodec: 'libmp3lame', audioBitrate: '192k', noVideo: true }
        break

      default:
        return res.status(400).json({ success: false, error: 'Invalid converter type' })
    }

    // Perform conversion
    await convertFile(inputPath, outputPath, options)

    // Clean up input file
    fs.unlinkSync(inputPath)

    const downloadUrl = `/converted/${path.basename(outputPath)}`

    res.json({
      success: true,
      downloadUrl: downloadUrl,
      filename: path.basename(outputPath)
    })

  } catch (error) {
    console.error('Conversion error:', error)
    
    // Clean up files on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path)
    }

    res.status(500).json({
      success: false,
      error: error.message || 'Conversion failed. Please ensure FFmpeg is installed and the file is valid.'
    })
  }
})

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'ConvertKing API is running' })
})

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`)
  console.log(`📁 Uploads directory: ${uploadsDir}`)
  console.log(`📁 Converted directory: ${convertedDir}`)
})
