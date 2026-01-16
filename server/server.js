import express from 'express'
import cors from 'cors'
import multer from 'multer'
import ffmpeg from 'fluent-ffmpeg'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'
import sharp from 'sharp'
import { PDFDocument, rgb } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs'
import { createCanvas } from 'canvas'
import EPub from 'epub'
import { JSDOM } from 'jsdom'
import PDFParser from 'pdf2json'

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
    // Accept video, audio, image, and document files
    const allowedMimes = [
      'video/mp4', 'video/quicktime', 'video/x-msvideo', 'video/x-matroska',
      'video/webm', 'video/3gpp', 'video/x-flv', 'video/mpeg',
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/aac',
      'audio/flac', 'audio/webm',
      'image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/heic', 'image/heif',
      'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/epub+zip', 'application/x-mobipocket-ebook',
      'application/octet-stream'
    ]

    // Also check file extension as fallback
    const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpeg', '.mpg',
      '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma',
      '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
      '.pdf', '.doc', '.docx', '.epub', '.mobi']
    const fileExtension = path.extname(file.originalname).toLowerCase()

    if (allowedMimes.includes(file.mimetype) || allowedExtensions.includes(fileExtension)) {
      cb(null, true)
    } else {
      cb(new Error('Invalid file type. Please upload a video, audio, image, or document file.'))
    }
  }
})

// Check FFmpeg availability at startup
ffmpeg.getAvailableFormats((err, formats) => {
  if (err) {
    console.warn('⚠️  FFmpeg not found. Please install FFmpeg to enable file conversion.')
    console.warn('   Download from: https://www.gyan.dev/ffmpeg/builds/')
    console.warn('   Or use: winget install ffmpeg (if winget is available)')
  } else {
    console.log('✅ FFmpeg is available and ready')
  }
})

// Conversion function for video/audio
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

// Conversion function for images
const convertImage = async (inputPath, outputPath, conversionType) => {
  try {
    switch (conversionType) {
      case 'jpg-pdf':
      case 'image-pdf': {
        // Convert image to PDF
        const image = sharp(inputPath)
        const metadata = await image.metadata()
        const pdfDoc = await PDFDocument.create()
        
        let pdfImage
        // Handle different image formats
        if (metadata.format === 'png') {
          const imageBuffer = await image.png().toBuffer()
          pdfImage = await pdfDoc.embedPng(imageBuffer)
        } else {
          // Convert to JPEG for other formats
          const imageBuffer = await image.jpeg({ quality: 90 }).toBuffer()
          pdfImage = await pdfDoc.embedJpg(imageBuffer)
        }
        
        const page = pdfDoc.addPage([metadata.width || 800, metadata.height || 600])
        page.drawImage(pdfImage, {
          x: 0,
          y: 0,
          width: metadata.width || 800,
          height: metadata.height || 600,
        })
        const pdfBytes = await pdfDoc.save()
        fs.writeFileSync(outputPath, pdfBytes)
        break
      }
      case 'pdf-jpg': {
        // Extract first page of PDF as JPG using pdf.js
        const data = new Uint8Array(fs.readFileSync(inputPath))
        const loadingTask = pdfjsLib.getDocument({ data })
        const pdfDocument = await loadingTask.promise
        const page = await pdfDocument.getPage(1) // Get first page

        const viewport = page.getViewport({ scale: 2.0 })
        const canvas = createCanvas(viewport.width, viewport.height)
        const context = canvas.getContext('2d')

        await page.render({
          canvasContext: context,
          viewport: viewport
        }).promise

        // Convert canvas to buffer and save as JPG using sharp
        const buffer = canvas.toBuffer('image/png')
        await sharp(buffer)
          .jpeg({ quality: 90 })
          .toFile(outputPath)
        break
      }
      case 'heic-jpg': {
        // Convert HEIC to JPG
        await sharp(inputPath)
          .jpeg({ quality: 90 })
          .toFile(outputPath)
        break
      }
      default:
        throw new Error('Unsupported image conversion type')
    }
    return outputPath
  } catch (error) {
    throw error
  }
}

// Conversion function for documents
const convertDocument = async (inputPath, outputPath, conversionType) => {
  try {
    switch (conversionType) {
      case 'pdf-word': {
        // PDF to Word conversion using pdf2json to extract text
        return new Promise((resolve, reject) => {
          const pdfParser = new PDFParser()

          pdfParser.on('pdfParser_dataError', errData => {
            reject(new Error('Failed to parse PDF: ' + errData.parserError))
          })

          pdfParser.on('pdfParser_dataReady', pdfData => {
            try {
              // Extract text from PDF
              let text = ''
              pdfData.Pages.forEach(page => {
                page.Texts.forEach(textItem => {
                  textItem.R.forEach(r => {
                    text += decodeURIComponent(r.T) + ' '
                  })
                  text += '\n'
                })
              })

              // Create a basic Word document (actually RTF format which Word can open)
              const rtfContent = `{\\rtf1\\ansi\\deff0\n{\\fonttbl{\\f0 Times New Roman;}}\n\\f0\\fs24\n${text.replace(/\n/g, '\\par\n')}\n}`
              fs.writeFileSync(outputPath, rtfContent)
              resolve(outputPath)
            } catch (error) {
              reject(new Error('Failed to create Word document: ' + error.message))
            }
          })

          pdfParser.loadPDF(inputPath)
        })
      }

      case 'epub-pdf': {
        // EPUB to PDF conversion
        return new Promise((resolve, reject) => {
          const epub = new EPub(inputPath)

          epub.on('error', (err) => {
            reject(new Error('Failed to parse EPUB: ' + err.message))
          })

          epub.on('end', async () => {
            try {
              const pdfDoc = await PDFDocument.create()
              const chapters = epub.flow.map(chapter => chapter.id)

              let fullText = ''

              // Extract text from all chapters
              for (const chapterId of chapters) {
                try {
                  const chapterText = await new Promise((res, rej) => {
                    epub.getChapter(chapterId, (error, text) => {
                      if (error) {
                        rej(error)
                      } else {
                        // Strip HTML tags
                        const dom = new JSDOM(text)
                        res(dom.window.document.body.textContent || '')
                      }
                    })
                  })
                  fullText += chapterText + '\n\n'
                } catch (err) {
                  console.warn('Failed to extract chapter:', chapterId, err)
                }
              }

              // Create PDF pages with text
              const page = pdfDoc.addPage()
              const { width, height } = page.getSize()
              const fontSize = 12
              const margin = 50
              const maxWidth = width - (margin * 2)

              // Split text into lines that fit the page width
              const words = fullText.split(/\s+/)
              let lines = []
              let currentLine = ''

              for (const word of words) {
                const testLine = currentLine + (currentLine ? ' ' : '') + word
                if (testLine.length * (fontSize * 0.5) > maxWidth) {
                  if (currentLine) lines.push(currentLine)
                  currentLine = word
                } else {
                  currentLine = testLine
                }
              }
              if (currentLine) lines.push(currentLine)

              // Add lines to pages
              let currentPage = page
              let y = height - margin

              for (const line of lines) {
                if (y < margin + fontSize) {
                  currentPage = pdfDoc.addPage()
                  y = height - margin
                }

                currentPage.drawText(line.substring(0, 100), {
                  x: margin,
                  y: y,
                  size: fontSize,
                  color: rgb(0, 0, 0)
                })
                y -= fontSize * 1.5
              }

              const pdfBytes = await pdfDoc.save()
              fs.writeFileSync(outputPath, pdfBytes)
              resolve(outputPath)
            } catch (error) {
              reject(new Error('Failed to create PDF: ' + error.message))
            }
          })

          epub.parse()
        })
      }

      case 'epub-mobi': {
        // EPUB to MOBI requires Calibre's ebook-convert tool
        throw new Error('EPUB to MOBI conversion requires Calibre to be installed. Please install Calibre and try again, or use an online converter.')
      }

      default:
        throw new Error('Unsupported document conversion type')
    }
  } catch (error) {
    throw error
  }
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

      // Image conversions
      case 'jpg-pdf':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.pdf`)
        await convertImage(inputPath, outputPath, 'jpg-pdf')
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'pdf-jpg':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.jpg`)
        await convertImage(inputPath, outputPath, 'pdf-jpg')
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'heic-jpg':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.jpg`)
        await convertImage(inputPath, outputPath, 'heic-jpg')
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'image-pdf':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.pdf`)
        await convertImage(inputPath, outputPath, 'image-pdf')
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'image-general':
        // Determine output based on input
        if (inputExt === '.heic' || inputExt === '.heif') {
          outputPath = path.join(convertedDir, `converted-${uniqueId}.jpg`)
          await convertImage(inputPath, outputPath, 'heic-jpg')
        } else {
          outputPath = path.join(convertedDir, `converted-${uniqueId}.pdf`)
          await convertImage(inputPath, outputPath, 'image-pdf')
        }
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      // Document conversions
      case 'pdf-word':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.docx`)
        await convertDocument(inputPath, outputPath, 'pdf-word')
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'epub-pdf':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.pdf`)
        await convertDocument(inputPath, outputPath, 'epub-pdf')
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'epub-mobi':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mobi`)
        await convertDocument(inputPath, outputPath, 'epub-mobi')
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'document-general':
        // Default document conversion
        outputPath = path.join(convertedDir, `converted-${uniqueId}${inputExt}`)
        // For now, just copy the file
        fs.copyFileSync(inputPath, outputPath)
        fs.unlinkSync(inputPath)
        return res.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      default:
        return res.status(400).json({ success: false, error: 'Invalid converter type' })
    }

    // Perform conversion for video/audio
    console.log('Starting conversion:', { inputPath, outputPath, options })
    await convertFile(inputPath, outputPath, options)
    console.log('Conversion completed successfully')

    // Clean up input file
    fs.unlinkSync(inputPath)

    const downloadUrl = `/converted/${path.basename(outputPath)}`
    console.log('Sending response:', { downloadUrl, filename: path.basename(outputPath) })

    return res.json({
      success: true,
      downloadUrl: downloadUrl,
      filename: path.basename(outputPath)
    })

  } catch (error) {
    console.error('Conversion error:', error)
    
    // Clean up files on error
    if (req.file && fs.existsSync(req.file.path)) {
      try {
        fs.unlinkSync(req.file.path)
      } catch (unlinkError) {
        console.error('Error cleaning up input file:', unlinkError)
      }
    }

    // Provide more helpful error messages
    let errorMessage = 'Conversion failed. Please ensure FFmpeg is installed and the file is valid.'
    if (error.message && error.message.includes('Cannot find ffmpeg')) {
      errorMessage = 'FFmpeg is not installed. Please install FFmpeg to use this service. Visit https://www.gyan.dev/ffmpeg/builds/ for Windows installation.'
    } else if (error.message) {
      errorMessage = error.message
    }

    res.status(500).json({
      success: false,
      error: errorMessage
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
