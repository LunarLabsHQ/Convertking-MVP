import { PDFDocument } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import heic2any from 'heic2any'

// Set up PDF.js worker - use local worker file from public directory
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export const convertImageToPDF = async (files) => {
  // Support both single file and array of files
  const fileArray = Array.isArray(files) ? files : [files]

  const pdfDoc = await PDFDocument.create()

  for (const file of fileArray) {
    // Read the image file
    const imageBytes = await file.arrayBuffer()

    // Embed the image based on its type
    let image
    if (file.type === 'image/png') {
      image = await pdfDoc.embedPng(imageBytes)
    } else if (file.type === 'image/jpeg' || file.type === 'image/jpg') {
      image = await pdfDoc.embedJpg(imageBytes)
    } else {
      // For other formats, convert to PNG using Canvas first
      const imageDataUrl = await fileToDataURL(file)
      const pngBytes = await convertToPNG(imageDataUrl)
      image = await pdfDoc.embedPng(pngBytes)
    }

    // Create a page with the same dimensions as the image
    const { width, height } = image.scale(1)
    const page = pdfDoc.addPage([width, height])

    // Draw the image
    page.drawImage(image, {
      x: 0,
      y: 0,
      width: width,
      height: height,
    })
  }

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

export const convertPDFToImage = async (file, format = 'jpeg', onProgress) => {
  try {
    // Read PDF
    const arrayBuffer = await file.arrayBuffer()

    // Load PDF using PDF.js
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    const numPages = pdf.numPages
    const images = []

    // Convert each page to an image
    for (let pageNum = 1; pageNum <= numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)

      // Set scale for better quality
      const scale = 2.0
      const viewport = page.getViewport({ scale })

      // Prepare canvas
      const canvas = document.createElement('canvas')
      const context = canvas.getContext('2d')
      canvas.width = viewport.width
      canvas.height = viewport.height

      // Render PDF page to canvas
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }

      await page.render(renderContext).promise

      // Convert canvas to blob
      const blob = await new Promise((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert PDF page to image'))
          }
        }, `image/${format}`, 0.95)
      })

      images.push({
        blob,
        filename: `page-${pageNum}.${format === 'jpeg' ? 'jpg' : format}`
      })

      // Report progress
      if (onProgress) {
        const progress = Math.round((pageNum / numPages) * 100)
        onProgress(progress)
      }
    }

    return images
  } catch (error) {
    throw new Error(`PDF to image conversion failed: ${error.message}`)
  }
}

export const convertHEICToJPEG = async (file) => {
  try {
    // Use heic2any library to convert HEIC to JPEG
    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.95
    })

    // heic2any might return an array of blobs for multi-image HEIC files
    // We'll take the first one
    return Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob
  } catch (error) {
    throw new Error(`HEIC to JPEG conversion failed: ${error.message}`)
  }
}

export const convertImageFormat = async (file, targetFormat) => {
  try {
    // Check if file is HEIC/HEIF - convert to JPEG first using heic2any
    const isHeic = file.name.toLowerCase().endsWith('.heic') ||
                   file.name.toLowerCase().endsWith('.heif') ||
                   file.type === 'image/heic' ||
                   file.type === 'image/heif'

    let fileToConvert = file

    if (isHeic) {
      console.log('Converting HEIC file first using heic2any')
      fileToConvert = await convertHEICToJPEG(file)
    }

    const imageDataUrl = await fileToDataURL(fileToConvert)

    return new Promise((resolve, reject) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        canvas.width = img.width
        canvas.height = img.height

        const ctx = canvas.getContext('2d')

        // Fill with white background for JPEG (to handle transparency)
        if (targetFormat === 'jpeg') {
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)
        }

        ctx.drawImage(img, 0, 0)

        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to convert image'))
          }
        }, `image/${targetFormat}`, 0.95)
      }
      img.onerror = reject
      img.src = imageDataUrl
    })
  } catch (error) {
    throw new Error(`Image format conversion failed: ${error.message}`)
  }
}

// Helper functions
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

async function convertToPNG(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0)

      canvas.toBlob(async (blob) => {
        if (blob) {
          const arrayBuffer = await blob.arrayBuffer()
          resolve(new Uint8Array(arrayBuffer))
        } else {
          reject(new Error('Failed to convert to PNG'))
        }
      }, 'image/png')
    }
    img.onerror = reject
    img.src = dataUrl
  })
}

async function convertToJPEG(dataUrl) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')

      // Fill with white background for transparency
      ctx.fillStyle = 'white'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      ctx.drawImage(img, 0, 0)

      canvas.toBlob((blob) => {
        if (blob) {
          resolve(blob)
        } else {
          reject(new Error('Failed to convert to JPEG'))
        }
      }, 'image/jpeg', 0.95)
    }
    img.onerror = reject
    img.src = dataUrl
  })
}
