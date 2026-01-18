import { PDFDocument, rgb, StandardFonts } from 'pdf-lib'

export const convertPDFToWord = async (file) => {
  // Note: True PDF to DOCX conversion requires complex parsing
  // This creates a simple RTF (which Word can open) with extracted text

  const arrayBuffer = await file.arrayBuffer()
  const pdfDoc = await PDFDocument.load(arrayBuffer)

  // Extract text from PDF pages
  let extractedText = 'PDF Content:\n\n'
  const pages = pdfDoc.getPages()

  for (let i = 0; i < pages.length; i++) {
    extractedText += `--- Page ${i + 1} ---\n\n`
    extractedText += '[Text extraction from PDF requires additional libraries]\n\n'
  }

  // Create RTF format (Word can open this)
  const rtfContent = `{\\rtf1\\ansi\\deff0
{\\fonttbl{\\f0 Times New Roman;}}
\\f0\\fs24
${extractedText.replace(/\n/g, '\\par\n')}
}`

  const blob = new Blob([rtfContent], { type: 'application/rtf' })
  return blob
}

export const convertEPUBToPDF = async (file) => {
  throw new Error('EPUB to PDF conversion is not available in browser. Please use an online converter or desktop software.')
}

export const convertEPUBToMOBI = async (file) => {
  throw new Error('EPUB to MOBI conversion requires Calibre. Please use Calibre desktop software or an online converter.')
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
