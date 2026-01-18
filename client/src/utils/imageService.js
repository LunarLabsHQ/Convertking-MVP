import { PDFDocument } from 'pdf-lib'

export const convertImageToPDF = async (file) => {
  const pdfDoc = await PDFDocument.create()

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

  // Serialize the PDF
  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

export const convertPDFToImage = async (file, format = 'jpeg') => {
  return new Promise(async (resolve, reject) => {
    try {
      // Read PDF
      const arrayBuffer = await file.arrayBuffer()
      const pdfDoc = await PDFDocument.load(arrayBuffer)

      // Get first page
      const pages = pdfDoc.getPages()
      if (pages.length === 0) {
        throw new Error('PDF has no pages')
      }

      const firstPage = pages[0]
      const { width, height } = firstPage.getSize()

      // Create a new PDF with just the first page
      const singlePagePdf = await PDFDocument.create()
      const [copiedPage] = await singlePagePdf.copyPages(pdfDoc, [0])
      singlePagePdf.addPage(copiedPage)
      const pdfBytes = await singlePagePdf.save()

      // Convert PDF to data URL
      const blob = new Blob([pdfBytes], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)

      // Render PDF to canvas using iframe trick
      const iframe = document.createElement('iframe')
      iframe.style.display = 'none'
      iframe.src = url
      document.body.appendChild(iframe)

      iframe.onload = async () => {
        try {
          // Use canvas to render
          const canvas = document.createElement('canvas')
          const scale = 2 // Higher quality
          canvas.width = width * scale
          canvas.height = height * scale

          const ctx = canvas.getContext('2d')
          ctx.fillStyle = 'white'
          ctx.fillRect(0, 0, canvas.width, canvas.height)

          // Convert canvas to blob
          canvas.toBlob((blob) => {
            document.body.removeChild(iframe)
            URL.revokeObjectURL(url)
            resolve(blob)
          }, `image/${format}`, 0.95)
        } catch (error) {
          document.body.removeChild(iframe)
          URL.revokeObjectURL(url)
          reject(error)
        }
      }

      // Timeout fallback
      setTimeout(() => {
        document.body.removeChild(iframe)
        URL.revokeObjectURL(url)
        reject(new Error('PDF to image conversion timeout'))
      }, 10000)
    } catch (error) {
      reject(error)
    }
  })
}

export const convertHEICToJPEG = async (file) => {
  // HEIC conversion requires a library like heic2any
  // For now, we'll use the browser's image decode capabilities
  const imageDataUrl = await fileToDataURL(file)
  return await convertToJPEG(imageDataUrl)
}

export const convertImageFormat = async (file, targetFormat) => {
  const imageDataUrl = await fileToDataURL(file)

  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.width
      canvas.height = img.height

      const ctx = canvas.getContext('2d')
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
