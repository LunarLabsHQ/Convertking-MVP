import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'
import * as pdfjsLib from 'pdfjs-dist'
import ePub from 'epubjs'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx'

// Configure PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = '/pdf.worker.min.mjs'

export const convertPDFToWord = async (file) => {
  // Extracts text from PDF and creates a proper DOCX file using docx library

  try {
    const arrayBuffer = await file.arrayBuffer()

    // Load PDF using PDF.js for text extraction
    const loadingTask = pdfjsLib.getDocument({ data: arrayBuffer })
    const pdf = await loadingTask.promise

    const documentChildren = []

    // Extract text from each page
    for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
      const page = await pdf.getPage(pageNum)
      const textContent = await page.getTextContent()

      // Add page heading
      documentChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: `Page ${pageNum}`,
              bold: true,
              size: 28,
            })
          ],
          heading: HeadingLevel.HEADING_2,
          spacing: {
            before: 240,
            after: 120,
          }
        })
      )

      // Better text extraction with line break detection
      const lines = []
      let currentLine = ''
      let lastY = null

      textContent.items.forEach((item, index) => {
        // Check if we've moved to a new line (y coordinate changed significantly)
        if (lastY !== null && Math.abs(item.transform[5] - lastY) > 5) {
          if (currentLine.trim()) {
            lines.push(currentLine.trim())
          }
          currentLine = ''
        }

        // Add space before text if needed
        if (currentLine && item.str.trim() && !currentLine.endsWith(' ')) {
          currentLine += ' '
        }

        currentLine += item.str
        lastY = item.transform[5]
      })

      // Add the last line
      if (currentLine.trim()) {
        lines.push(currentLine.trim())
      }

      // Add lines as paragraphs
      if (lines.length === 0) {
        documentChildren.push(
          new Paragraph({
            children: [
              new TextRun({
                text: '[No text content on this page]',
                italics: true,
              })
            ]
          })
        )
      } else {
        lines.forEach(line => {
          documentChildren.push(
            new Paragraph({
              children: [
                new TextRun({
                  text: line,
                  size: 24,
                })
              ],
              spacing: {
                after: 120,
              }
            })
          )
        })
      }
    }

    // If no content was extracted
    if (documentChildren.length === 0) {
      documentChildren.push(
        new Paragraph({
          children: [
            new TextRun({
              text: 'No text content could be extracted from this PDF. The PDF may contain only images or scanned content.',
              italics: true,
            })
          ]
        })
      )
    }

    // Create Word document
    const doc = new Document({
      sections: [{
        properties: {},
        children: documentChildren,
      }],
    })

    // Generate DOCX file using toBuffer for reliable output
    const buffer = await Packer.toBuffer(doc)

    // Create blob with correct MIME type for DOCX
    const docxBlob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    })
    return docxBlob
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

export const convertEPUBToHTML = async (file) => {
  try {
    const arrayBuffer = await file.arrayBuffer()
    const book = ePub(arrayBuffer)
    await book.ready

    const metadata = await book.loaded.metadata
    const spine = await book.loaded.spine
    const spineItems = spine.items

    if (!spineItems || spineItems.length === 0) {
      throw new Error('No content found in EPUB file')
    }

    // Build HTML structure with proper styling
    let htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${metadata.title || 'Converted Book'}</title>
  <style>
    body {
      font-family: Georgia, 'Times New Roman', serif;
      line-height: 1.6;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
      background-color: #fff;
      color: #333;
    }
    h1 {
      color: #2c3e50;
      border-bottom: 3px solid #3498db;
      padding-bottom: 10px;
      margin-bottom: 20px;
    }
    h2 {
      color: #34495e;
      margin-top: 30px;
      margin-bottom: 15px;
      border-bottom: 1px solid #ecf0f1;
      padding-bottom: 5px;
    }
    .metadata {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      margin-bottom: 30px;
      border-left: 4px solid #3498db;
    }
    .metadata p {
      margin: 5px 0;
    }
    .chapter {
      margin-bottom: 40px;
    }
    hr {
      border: none;
      border-top: 2px solid #ecf0f1;
      margin: 30px 0;
    }
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 20px auto;
    }
  </style>
</head>
<body>
  <h1>${metadata.title || 'Converted Book'}</h1>
  <div class="metadata">
    ${metadata.creator ? `<p><strong>Author:</strong> ${metadata.creator}</p>` : ''}
    ${metadata.publisher ? `<p><strong>Publisher:</strong> ${metadata.publisher}</p>` : ''}
    ${metadata.date ? `<p><strong>Date:</strong> ${metadata.date}</p>` : ''}
    ${metadata.description ? `<p><strong>Description:</strong> ${metadata.description}</p>` : ''}
  </div>
`

    // Extract content from each chapter
    for (const item of spineItems) {
      try {
        const doc = await book.load(item.href)
        const content = doc.body || doc.documentElement

        if (content) {
          const title = item.label || `Chapter ${spineItems.indexOf(item) + 1}`
          htmlContent += `\n  <div class="chapter">\n    <h2>${title}</h2>\n`
          
          // Get innerHTML to preserve formatting and images
          const chapterContent = content.innerHTML || content.textContent || ''
          htmlContent += chapterContent
          
          htmlContent += '\n  </div>\n'
        }
      } catch (chapterError) {
        console.warn('Error loading chapter:', chapterError)
        continue
      }
    }

    htmlContent += `
</body>
</html>`

    // Create blob as HTML
    const blob = new Blob([htmlContent], { type: 'text/html' })
    return blob
  } catch (error) {
    throw new Error(`EPUB to HTML conversion failed: ${error.message}`)
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
