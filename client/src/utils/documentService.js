import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import ePub from 'epubjs'
import { jsPDF } from 'jspdf'

export const convertPDFToWord = async (file) => {
  // Note: True PDF to DOCX conversion requires complex parsing
  // This extracts text from PDF and creates an RTF file (which Word can open)

  try {
    const arrayBuffer = await file.arrayBuffer()

    // Load PDF using PDF.js for text extraction
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    let extractedText = ''

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Combine text items from the page
      const pageText = textContent.items
        .map(item => item.str)
        .join(' ')

      extractedText += `--- Page ${pageNum} ---\n\n${pageText}\n\n`
    }

    if (!extractedText.trim()) {
      extractedText = 'No text content could be extracted from this PDF.\nThe PDF may contain only images or scanned content.'
    }

    // Create RTF format (Word can open this)
    // Escape special RTF characters
    const escapedText = extractedText
      .replace(/\\/g, '\\\\')
      .replace(/\{/g, '\\{')
      .replace(/\}/g, '\\}')
      .replace(/\n/g, '\\par\n')

    const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
{\\colortbl;\\red0\\green0\\blue0;}
\\f0\\fs24
${escapedText}
}`

    const blob = new Blob([rtfContent], { type: 'application/rtf' })
    return blob
  } catch (error) {
    throw new Error(`PDF to Word conversion failed: ${error.message}`)
  }
}

export const convertEPUBToPDF = async (file) => {
  try {
    // Create ArrayBuffer from file
    const arrayBuffer = await file.arrayBuffer()

    // Initialize EPUB book
    const book = ePub(arrayBuffer)
    await book.ready

    // Get spine items (chapters/sections in reading order)
    const spine = await book.loaded.spine
    const spineItems = spine.items

    if (!spineItems || spineItems.length === 0) {
      throw new Error('No content found in EPUB file')
    }

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'pt',
      format: 'a4'
    })

    let isFirstPage = true

    // Extract and add content from each chapter
    for (const item of spineItems) {
      try {
        // Load chapter content
        const doc = await book.load(item.href)
        const content = doc.body || doc.documentElement

        // Extract text content
        let text = content.textContent || content.innerText || ''
        text = text.trim()

        if (!text) continue

        // Add new page for each chapter (except first)
        if (!isFirstPage) {
          pdf.addPage()
        }
        isFirstPage = false

        // Add chapter title if available
        const title = item.label || `Chapter ${spineItems.indexOf(item) + 1}`
        pdf.setFontSize(16)
        pdf.setFont(undefined, 'bold')
        pdf.text(title, 40, 40, { maxWidth: 515 })

        // Add chapter content
        pdf.setFontSize(12)
        pdf.setFont(undefined, 'normal')

        // Split text into lines and add to PDF
        const lines = pdf.splitTextToSize(text, 515)
        let yPosition = 70

        for (const line of lines) {
          if (yPosition > 800) {
            pdf.addPage()
            yPosition = 40
          }
          pdf.text(line, 40, yPosition)
          yPosition += 15
        }
      } catch (chapterError) {
        console.warn('Error loading chapter:', chapterError)
        continue
      }
    }

    // Generate PDF blob
    const pdfBlob = pdf.output('blob')
    return pdfBlob
  } catch (error) {
    throw new Error(`EPUB to PDF conversion failed: ${error.message}`)
  }
}

export const convertEPUBToMOBI = async (file) => {
  try {
    // MOBI is Amazon's proprietary format and true conversion is complex
    // As a workaround, we'll create a simplified text-based format
    // that preserves the content structure

    const arrayBuffer = await file.arrayBuffer()
    const book = ePub(arrayBuffer)
    await book.ready

    const metadata = await book.loaded.metadata
    const spine = await book.loaded.spine
    const spineItems = spine.items

    if (!spineItems || spineItems.length === 0) {
      throw new Error('No content found in EPUB file')
    }

    // Build MOBI-like structure (simplified HTML format that Kindle can read)
    let mobiContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml">
<head>
<title>${metadata.title || 'Converted Book'}</title>
<meta charset="UTF-8"/>
</head>
<body>
<h1>${metadata.title || 'Converted Book'}</h1>
${metadata.creator ? `<p><strong>Author:</strong> ${metadata.creator}</p>` : ''}
<hr/>
`

    // Extract content from each chapter
    for (const item of spineItems) {
      try {
        const doc = await book.load(item.href)
        const content = doc.body || doc.documentElement

        if (content) {
          const title = item.label || `Chapter ${spineItems.indexOf(item) + 1}`
          mobiContent += `\n<h2>${title}</h2>\n`
          mobiContent += content.innerHTML || content.textContent || ''
          mobiContent += '\n<hr/>\n'
        }
      } catch (chapterError) {
        console.warn('Error loading chapter:', chapterError)
        continue
      }
    }

    mobiContent += `
</body>
</html>`

    // Create blob as HTML (Kindle can read HTML files)
    // Note: True .mobi requires Amazon's proprietary tools
    // This creates an HTML file that Kindle devices/apps can read
    const blob = new Blob([mobiContent], { type: 'text/html' })
    return blob
  } catch (error) {
    throw new Error(`EPUB to MOBI conversion failed: ${error.message}`)
  }
}

export const convertTextToPDF = async (text, options = {}) => {
  const pdfDoc = await PDFDocument.create()
  const page = pdfDoc.addPage()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)

  const { width, height } = page.getSize()
  const fontSize = options.fontSize || 12
  const margin = options.margin || 50
  const lineHeight = fontSize * 1.5

  const maxWidth = width - (margin * 2)
  const lines = wrapText(text, font, fontSize, maxWidth)

  let y = height - margin

  for (const line of lines) {
    if (y < margin) {
      // Create new page
      const newPage = pdfDoc.addPage()
      y = newPage.getSize().height - margin

      newPage.drawText(line, {
        x: margin,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })
    } else {
      page.drawText(line, {
        x: margin,
        y: y,
        size: fontSize,
        font: font,
        color: rgb(0, 0, 0),
      })
    }

    y -= lineHeight
  }

  const pdfBytes = await pdfDoc.save()
  return new Blob([pdfBytes], { type: 'application/pdf' })
}

function wrapText(text, font, fontSize, maxWidth) {
  const words = text.split(/\s+/)
  const lines = []
  let currentLine = ''

  for (const word of words) {
    const testLine = currentLine + (currentLine ? ' ' : '') + word
    const testWidth = font.widthOfTextAtSize(testLine, fontSize)

    if (testWidth > maxWidth && currentLine) {
      lines.push(currentLine)
      currentLine = word
    } else {
      currentLine = testLine
    }
  }

  if (currentLine) {
    lines.push(currentLine)
  }

  return lines
}
