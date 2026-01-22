import { Hono } from 'hono'
import { cors } from 'hono/cors'
import { serve } from '@hono/node-server'
import { serveStatic } from '@hono/node-server/serve-static'
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
import archiver from 'archiver'
import { Canvas, Image } from 'canvas'
import { pdfToPng } from 'pdf-to-png-converter'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Node.js Canvas factory for pdfjs
class NodeCanvasFactory {
  create(width, height) {
    const canvas = createCanvas(width, height)
    const context = canvas.getContext('2d')
    // Make Image available to context for pdfjs to use
    context.createImageBitmap = async (image) => image
    return {
      canvas,
      context
    }
  }

  reset(canvasAndContext, width, height) {
    canvasAndContext.canvas.width = width
    canvasAndContext.canvas.height = height
  }

  destroy(canvasAndContext) {
    canvasAndContext.canvas.width = 0
    canvasAndContext.canvas.height = 0
    canvasAndContext.canvas = null
    canvasAndContext.context = null
  }
}

// Canvas and Image for pdfjs
const createImageConstructor = () => Image

const app = new Hono()
const PORT = process.env.PORT || 5000

// CORS configuration
const allowedOrigins = [
  'http://localhost:3000',
  'https://convertking.xyz',
  'https://www.convertking.xyz',
  'https://convertking-mvp.vercel.app',
].filter(Boolean)

app.use('/*', cors({
  origin: (origin) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return '*'
    // Check if origin is in allowed list
    if (allowedOrigins.includes(origin)) return origin
    // Allow all localhost origins for development
    if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      return origin
    }
    return false
  },
  credentials: true
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

// Serve static files
app.use('/uploads/*', serveStatic({ root: __dirname }))
app.use('/converted/*', serveStatic({
  root: __dirname,
  onNotFound: (path, c) => {
    return c.text('File not found', 404)
  },
  rewriteRequestPath: (path) => path
}))

// Add custom headers for downloads
app.use('/converted/*', async (c, next) => {
  await next()
  if (c.res.status === 200) {
    const filename = path.basename(c.req.path)
    c.res.headers.set('Content-Disposition', `attachment; filename="${filename}"`)
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

// Conversion function for images (supports multiple images for PDF conversion)
const convertImage = async (inputPaths, outputPath, conversionType) => {
  try {
    // Support both single path and array of paths
    const pathArray = Array.isArray(inputPaths) ? inputPaths : [inputPaths]

    switch (conversionType) {
      case 'jpg-pdf':
      case 'image-pdf': {
        // Convert image(s) to PDF
        const pdfDoc = await PDFDocument.create()

        // Process each image
        for (const inputPath of pathArray) {
          // Check if file is actually a PDF
          const ext = path.extname(inputPath).toLowerCase()
          if (ext === '.pdf') {
            throw new Error('Cannot convert PDF to PDF. Please use the "PDF to JPG" converter for PDF files.')
          }

          const image = sharp(inputPath)
          const metadata = await image.metadata()

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
        }

        const pdfBytes = await pdfDoc.save()
        fs.writeFileSync(outputPath, pdfBytes)
        break
      }
      case 'pdf-jpg': {
        // Convert PDF pages to images using pdf-to-png-converter
        const pdfPath = pathArray[0]
        console.log('[PDF-JPG] Starting conversion for:', pdfPath)

        // Convert PDF to PNG images
        const pngPages = await pdfToPng(pdfPath, {
          outputFolder: path.dirname(outputPath),
          disableFontFace: false,
          viewportScale: 2.0
        })

        console.log(`[PDF-JPG] Converted ${pngPages.length} pages to PNG`)

        const imagePaths = []
        const convertedDir = path.dirname(outputPath)
        const baseFilename = path.basename(outputPath, path.extname(outputPath))

        // Convert PNGs to JPG
        for (let i = 0; i < pngPages.length; i++) {
          const page = pngPages[i]
          const pagePath = pngPages.length === 1
            ? outputPath
            : path.join(convertedDir, `${baseFilename}-page-${i + 1}.jpg`)

          await sharp(page.content)
            .jpeg({ quality: 90 })
            .toFile(pagePath)

          if (pngPages.length > 1) {
            imagePaths.push(pagePath)
          }
          console.log(`[PDF-JPG] Saved page ${i + 1} as JPG`)
        }

        // If multiple pages, create zip
        if (pngPages.length > 1) {
          const zipPath = outputPath.replace(/\.[^.]+$/, '.zip')
          await new Promise((resolve, reject) => {
            const output = fs.createWriteStream(zipPath)
            const archive = archiver('zip', { zlib: { level: 9 } })

            output.on('close', () => {
              console.log(`[PDF-JPG] Created zip with ${archive.pointer()} bytes`)
              // Clean up individual image files
              imagePaths.forEach(imgPath => {
                if (fs.existsSync(imgPath)) fs.unlinkSync(imgPath)
              })
              resolve(zipPath)
            })

            archive.on('error', (err) => reject(err))
            archive.pipe(output)

            // Add each image to zip
            imagePaths.forEach((imgPath, index) => {
              archive.file(imgPath, { name: `page-${index + 1}.jpg` })
            })

            archive.finalize()
          })

          // Update outputPath to point to zip file
          outputPath = zipPath
        }
        break
      }
      case 'heic-jpg': {
        // Convert HEIC to JPG
        // Use first path from array
        const heicPath = pathArray[0]
        await sharp(heicPath)
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

// Helper function to save uploaded file
const saveUploadedFile = async (file) => {
  const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9)
  const ext = path.extname(file.name)
  const filename = uniqueSuffix + ext
  const filepath = path.join(uploadsDir, filename)

  // Write file to disk
  const buffer = await file.arrayBuffer()
  fs.writeFileSync(filepath, Buffer.from(buffer))

  return {
    path: filepath,
    filename: filename,
    originalname: file.name,
    size: file.size
  }
}

// File type validation
const isValidFileType = (filename, mimetype) => {
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

  const allowedExtensions = ['.mp4', '.mov', '.avi', '.mkv', '.webm', '.flv', '.wmv', '.mpeg', '.mpg',
    '.mp3', '.wav', '.ogg', '.aac', '.flac', '.m4a', '.wma',
    '.jpg', '.jpeg', '.png', '.gif', '.webp', '.heic', '.heif',
    '.pdf', '.doc', '.docx', '.epub', '.mobi']

  const fileExtension = path.extname(filename).toLowerCase()

  return allowedMimes.includes(mimetype) || allowedExtensions.includes(fileExtension)
}

// Helper function to clean up uploaded files
const cleanupFiles = (files) => {
  files.forEach(file => {
    if (file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path)
      } catch (err) {
        console.error('Error cleaning up file:', file.path, err)
      }
    }
  })
}

// Conversion endpoint
app.post('/api/convert', async (c) => {
  let uploadedFiles = []

  try {
    // Parse body with all option to get all files with same field name
    const body = await c.req.parseBody({ all: true })

    console.log('Received body keys:', Object.keys(body))
    console.log('Files field:', body.files)
    console.log('File field:', body.file)

    // Handle both single file ('file') and multiple files ('files')
    let file = body.file
    const filesInput = body.files

    // Determine if we have multiple files
    let filesToProcess = []
    if (filesInput) {
      // Multiple files sent - could be array or single file
      filesToProcess = Array.isArray(filesInput) ? filesInput : [filesInput]
      console.log('Processing multiple files:', filesToProcess.length)
    } else if (file) {
      // Single file sent
      filesToProcess = Array.isArray(file) ? file : [file]
      console.log('Processing single file')
    }

    console.log('Total files to process:', filesToProcess.length)

    if (filesToProcess.length === 0) {
      return c.json({ success: false, error: 'No file uploaded' }, 400)
    }

    // Validate all files
    for (const fileItem of filesToProcess) {
      if (!(fileItem instanceof File)) {
        return c.json({ success: false, error: 'Invalid file format' }, 400)
      }

      // Validate file size (500MB limit per file)
      if (fileItem.size > 500 * 1024 * 1024) {
        return c.json({ success: false, error: `File ${fileItem.name} is too large. Maximum size is 500MB per file.` }, 400)
      }

      // Validate file type
      if (!isValidFileType(fileItem.name, fileItem.type)) {
        return c.json({
          success: false,
          error: `Invalid file type for ${fileItem.name}. Please upload a video, audio, image, or document file.`
        }, 400)
      }
    }

    // Save all uploaded files
    for (const fileItem of filesToProcess) {
      const savedFile = await saveUploadedFile(fileItem)
      uploadedFiles.push(savedFile)
    }

    const { converterId, type } = body

    // For single file conversions, use the first file path
    // For multi-file conversions (like image-pdf), use array of paths
    const inputPath = uploadedFiles.length === 1 ? uploadedFiles[0].path : uploadedFiles.map(f => f.path)
    const inputExt = path.extname(uploadedFiles[0].originalname).toLowerCase()
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
        cleanupFiles(uploadedFiles)
        return c.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'pdf-jpg':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.jpg`)
        // convertImage will return the actual path (jpg for single page, zip for multiple pages)
        const actualOutputPath = await convertImage(inputPath, outputPath, 'pdf-jpg')
        cleanupFiles(uploadedFiles)
        return c.json({
          success: true,
          downloadUrl: `/converted/${path.basename(actualOutputPath)}`,
          filename: path.basename(actualOutputPath)
        })

      case 'heic-jpg':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.jpg`)
        await convertImage(inputPath, outputPath, 'heic-jpg')
        cleanupFiles(uploadedFiles)
        return c.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'image-pdf':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.pdf`)
        await convertImage(inputPath, outputPath, 'image-pdf')
        cleanupFiles(uploadedFiles)
        return c.json({
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
        cleanupFiles(uploadedFiles)
        return c.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      // Document conversions
      case 'pdf-word':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.docx`)
        await convertDocument(inputPath, outputPath, 'pdf-word')
        cleanupFiles(uploadedFiles)
        return c.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'epub-pdf':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.pdf`)
        await convertDocument(inputPath, outputPath, 'epub-pdf')
        cleanupFiles(uploadedFiles)
        return c.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'epub-mobi':
        outputPath = path.join(convertedDir, `converted-${uniqueId}.mobi`)
        await convertDocument(inputPath, outputPath, 'epub-mobi')
        cleanupFiles(uploadedFiles)
        return c.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      case 'document-general':
        // Default document conversion
        outputPath = path.join(convertedDir, `converted-${uniqueId}${inputExt}`)
        // For now, just copy the file
        fs.copyFileSync(inputPath, outputPath)
        cleanupFiles(uploadedFiles)
        return c.json({
          success: true,
          downloadUrl: `/converted/${path.basename(outputPath)}`,
          filename: path.basename(outputPath)
        })

      default:
        return c.json({ success: false, error: 'Invalid converter type' }, 400)
    }

    // Perform conversion for video/audio
    console.log('Starting conversion:', { inputPath, outputPath, options })
    await convertFile(inputPath, outputPath, options)
    console.log('Conversion completed successfully')

    // Clean up input files
    cleanupFiles(uploadedFiles)

    const downloadUrl = `/converted/${path.basename(outputPath)}`
    console.log('Sending response:', { downloadUrl, filename: path.basename(outputPath) })

    return c.json({
      success: true,
      downloadUrl: downloadUrl,
      filename: path.basename(outputPath)
    })

  } catch (error) {
    console.error('Conversion error:', error)

    // Clean up files on error
    cleanupFiles(uploadedFiles)

    // Provide more helpful error messages
    let errorMessage = 'Conversion failed. Please ensure FFmpeg is installed and the file is valid.'
    if (error.message && error.message.includes('Cannot find ffmpeg')) {
      errorMessage = 'FFmpeg is not installed. Please install FFmpeg to use this service. Visit https://www.gyan.dev/ffmpeg/builds/ for Windows installation.'
    } else if (error.message) {
      errorMessage = error.message
    }

    return c.json({
      success: false,
      error: errorMessage
    }, 500)
  }
})

// Delete converted file endpoint
app.delete('/api/converted/:filename', async (c) => {
  try {
    const filename = c.req.param('filename')
    const filePath = path.join(convertedDir, filename)

    // Validate filename to prevent path traversal
    if (filename.includes('..') || filename.includes('/') || filename.includes('\\')) {
      return c.json({ success: false, error: 'Invalid filename' }, 400)
    }

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      return c.json({ success: false, error: 'File not found' }, 404)
    }

    // Delete the file
    fs.unlinkSync(filePath)
    console.log('Deleted converted file:', filename)

    return c.json({ success: true, message: 'File deleted successfully' })
  } catch (error) {
    console.error('Error deleting file:', error)
    return c.json({ success: false, error: 'Failed to delete file' }, 500)
  }
})

// Health check endpoint
app.get('/api/health', (c) => {
  return c.json({ status: 'ok', message: 'ConvertKing API is running' })
})

// Start server
console.log(`🚀 Starting ConvertKing server with Hono...`)
serve({
  fetch: app.fetch,
  port: PORT
}, (info) => {
  console.log(`🚀 Server running on http://localhost:${info.port}`)
  console.log(`📁 Uploads directory: ${uploadsDir}`)
  console.log(`📁 Converted directory: ${convertedDir}`)
})
