import { convertVideo, convertAudio } from './ffmpegService'
import {
  convertImageToPDF,
  convertPDFToImage,
  convertHEICToJPEG,
  convertImageFormat
} from './imageService'
import {
  convertPDFToWord,
  convertEPUBToPDF,
  convertEPUBToHTML,
  convertEPUBToMOBI
} from './documentService'
import JSZip from 'jszip'

export const performConversion = async (file, converterId, type, onProgress) => {
  console.log('Starting conversion:', { file: file.name, converterId, type })

  try {
    let outputBlob
    let outputFilename

    switch (converterId) {
      // Video conversions
      case 'mp4':
      case 'mov-mp4':
      case 'mkv-mp4':
      case 'video-general':
        outputBlob = await convertVideo(file, 'mp4', {}, onProgress)
        outputFilename = `converted-${Date.now()}.mp4`
        break

      case 'gif':
        outputBlob = await convertVideo(file, 'gif', {}, onProgress)
        outputFilename = `converted-${Date.now()}.gif`
        break

      // Audio conversions
      case 'mp3':
      case 'mp4-mp3':
      case 'video-mp3':
      case 'aac-mp3':
        outputBlob = await convertAudio(file, 'mp3', {}, onProgress)
        outputFilename = `converted-${Date.now()}.mp3`
        break

      // Image conversions
      case 'image-pdf':
        outputBlob = await convertImageToPDF(file)
        outputFilename = `converted-${Date.now()}.pdf`
        break

      case 'pdf-jpg':
        // Convert all pages to images
        const images = await convertPDFToImage(file, 'jpeg', onProgress)

        // If only one page, return the single image
        if (images.length === 1) {
          outputBlob = images[0].blob
          outputFilename = `converted-${Date.now()}.jpg`
        } else {
          // Create a zip file with all images
          const zip = new JSZip()

          images.forEach((img, index) => {
            zip.file(img.filename, img.blob)
          })

          outputBlob = await zip.generateAsync({ type: 'blob' })
          outputFilename = `converted-pages-${Date.now()}.zip`
        }
        break

      case 'image-jpg':
        outputBlob = await convertImageFormat(file, 'jpeg')
        outputFilename = `converted-${Date.now()}.jpg`
        break

      case 'heic-jpg':
        outputBlob = await convertHEICToJPEG(file)
        outputFilename = `converted-${Date.now()}.jpg`
        break

      case 'image-general':
        // Determine output based on input
        if (file.name.toLowerCase().endsWith('.heic') || file.name.toLowerCase().endsWith('.heif')) {
          outputBlob = await convertHEICToJPEG(file)
          outputFilename = `converted-${Date.now()}.jpg`
        } else {
          outputBlob = await convertImageToPDF(file)
          outputFilename = `converted-${Date.now()}.pdf`
        }
        break

      // Document conversions
      case 'pdf-word':
        outputBlob = await convertPDFToWord(file)
        outputFilename = `converted-${Date.now()}.docx`
        break

      case 'epub-pdf':
        outputBlob = await convertEPUBToPDF(file)
        outputFilename = `converted-${Date.now()}.pdf`
        break

      case 'epub-html':
        outputBlob = await convertEPUBToHTML(file)
        outputFilename = `converted-${Date.now()}.html`
        break

      case 'epub-mobi':
        outputBlob = await convertEPUBToMOBI(file)
        outputFilename = `converted-${Date.now()}.html`
        break

      case 'document-general':
        // For general documents, just return the original
        outputBlob = file
        outputFilename = file.name
        break

      default:
        throw new Error(`Unsupported converter type: ${converterId}`)
    }

    return {
      blob: outputBlob,
      filename: outputFilename
    }
  } catch (error) {
    console.error('Conversion error:', error)
    throw error
  }
}

export const getConversionEstimate = (file, converterId) => {
  // Provide rough time estimates for user
  const fileSizeMB = file.size / (1024 * 1024)

  const estimates = {
    'mp4': fileSizeMB * 2, // ~2 seconds per MB
    'gif': fileSizeMB * 3,
    'mp3': fileSizeMB * 1,
    'video-general': fileSizeMB * 2,
    'audio-general': fileSizeMB * 1,
    'image-pdf': 2,
    'pdf-jpg': 3,
    'heic-jpg': 2,
  }

  const estimatedSeconds = estimates[converterId] || 5
  return Math.max(estimatedSeconds, 3) // Minimum 3 seconds
}
