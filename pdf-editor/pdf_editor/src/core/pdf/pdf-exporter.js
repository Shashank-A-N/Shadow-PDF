import { EXPORT_FORMATS, MIME_TYPES, STANDARD_FONTS, CONFIG } from '../../constants.js'

export class PdfExporter {
  constructor(state, pdfService) {
    this.state = state
    this.pdfService = pdfService
    this.renderer = null // optional; set via setRenderer for overlay flattening
  }

  // Optional injection to avoid changing constructor usage
  setRenderer(renderer) {
    this.renderer = renderer
  }

  async exportToPdf(options = {}) {
    const {
      compress = true,
      flatten = false,
      pdfA = false,
      pageRange = 'all',
      includeObjects = true
    } = options

    try {
      const pdfDoc = await PDFLib.PDFDocument.load(await this.pdfService.pdflib.save())
      const pages = pdfDoc.getPages()
      const fontCache = new Map()

      if (includeObjects) {
        for (const obj of this.state.objects) {
          const pageIndex = (obj.page || 1) - 1
          if (pageIndex < 0 || pageIndex >= pages.length) continue

          const page = pages[pageIndex]
          const pageSize = this.state.document.pageSizes?.[pageIndex] || page.getSize()

          await this.drawObjectToPdf(pdfDoc, page, obj, pageSize, fontCache)
        }
      }

      for (let i = 0; i < pages.length; i++) {
        const bgColor = this.state.document?.backgrounds?.get?.(i)
        if (bgColor) {
          const page = pages[i]
          const { width, height } = page.getSize()
          const color = this.hexToRgb(bgColor)
          
          page.drawRectangle({
            x: 0, y: 0, width, height,
            color: PDFLib.rgb(color.r, color.g, color.b),
            opacity: 1, borderWidth: 0
          })
        }
      }

      if (this.state.document?.metadata) {
        const meta = this.state.document.metadata
        pdfDoc.setTitle(meta.title || this.state.document.name)
        pdfDoc.setAuthor(meta.author || '')
        pdfDoc.setSubject(meta.subject || '')
        pdfDoc.setKeywords(meta.keywords || [])
        pdfDoc.setProducer(CONFIG.APP_NAME)
        pdfDoc.setCreator(CONFIG.APP_NAME)
        pdfDoc.setCreationDate(new Date())
        pdfDoc.setModificationDate(new Date())
      }

      const pdfBytes = compress
        ? await pdfDoc.save({ useObjectStreams: true })
        : await pdfDoc.save()

      return new Blob([pdfBytes], { type: MIME_TYPES.PDF })
    } catch (error) {
      console.error('Failed to export PDF:', error)
      throw error
    }
  }

  async drawObjectToPdf(pdfDoc, page, obj, pageSize, fontCache) {
    const { height: pageHeight } = pageSize

    switch (obj.type) {
      case 'text':
        await this.drawTextObject(pdfDoc, page, obj, pageHeight, fontCache)
        break
      case 'rect':
        this.drawRectObject(page, obj, pageHeight)
        break
      case 'oval':
        this.drawOvalObject(page, obj, pageHeight)
        break
      case 'line':
        this.drawLineObject(page, obj, pageHeight)
        break
      case 'path':
      case 'draw':
        this.drawPathObject(page, obj, pageHeight)
        break
      case 'image':
        await this.drawImageObject(pdfDoc, page, obj, pageHeight)
        break
      case 'signature':
        await this.drawImageObject(pdfDoc, page, { ...obj, data: obj.signatureData, format: 'png' }, pageHeight)
        break
      case 'highlight':
        this.drawHighlightObject(page, obj, pageHeight)
        break
    }
  }

  async drawTextObject(pdfDoc, page, obj, pageHeight, fontCache) {
    const parsedSize = parseInt(obj.size ?? obj.font?.match(/\d+/)?.[0] ?? 16, 10)
    const fontSize = Number.isFinite(parsedSize) ? parsedSize : 16
    const cssFontFamily = obj.font?.includes('px') ? obj.font.split(' ').slice(1).join(' ') : obj.font
    const fontFamily = obj.fontFamily || cssFontFamily || 'Helvetica'

    const key = `${fontFamily}_${obj.bold ? 'b' : ''}${obj.italic ? 'i' : ''}`
    let font = fontCache.get(key)
    if (!font) {
      const standardFont = this.getStandardFont(fontFamily, obj.bold, obj.italic)
      font = await pdfDoc.embedFont(standardFont)
      fontCache.set(key, font)
    }

    const color = this.hexToRgb(obj.color || '#000000')
    const y = pageHeight - (obj.y ?? 0)

    if (obj.highlight) {
      const textWidth = font.widthOfTextAtSize(obj.text || '', fontSize)
      const textHeight = font.heightAtSize(fontSize)
      page.drawRectangle({
        x: obj.x ?? 0,
        y: y - textHeight,
        width: textWidth,
        height: textHeight,
        color: PDFLib.rgb(1, 1, 0),
        opacity: 0.4,
        borderWidth: 0
      })
    }

    page.drawText(obj.text || '', {
      x: obj.x ?? 0,
      y,
      size: fontSize,
      font,
      color: PDFLib.rgb(color.r, color.g, color.b)
    })

    if (obj.underline) {
      const textWidth = font.widthOfTextAtSize(obj.text || '', fontSize)
      page.drawLine({
        start: { x: obj.x ?? 0, y: y - 2 },
        end: { x: (obj.x ?? 0) + textWidth, y: y - 2 },
        thickness: 1,
        color: PDFLib.rgb(color.r, color.g, color.b)
      })
    }

    if (obj.strikethrough) {
      const textWidth = font.widthOfTextAtSize(obj.text || '', fontSize)
      const textHeight = font.heightAtSize(fontSize)
      page.drawLine({
        start: { x: obj.x ?? 0, y: y + textHeight / 2 },
        end: { x: (obj.x ?? 0) + textWidth, y: y + textHeight / 2 },
        thickness: 1,
        color: PDFLib.rgb(color.r, color.g, color.b)
      })
    }
  }

  drawRectObject(page, obj, pageHeight) {
    const y = pageHeight - (obj.y ?? 0) - (obj.height ?? 0)
    const fillHex = obj.fill ?? obj.fillColor
    const strokeHex = obj.stroke ?? obj.strokeColor
    const fill = fillHex && fillHex !== 'transparent' ? this.hexToRgb(fillHex) : null
    const stroke = strokeHex && strokeHex !== 'transparent' ? this.hexToRgb(strokeHex) : null
    const strokeWidth = obj.strokeWidth ?? obj.lineWidth ?? 2

    page.drawRectangle({
      x: obj.x ?? 0,
      y,
      width: obj.width ?? 0,
      height: obj.height ?? 0,
      color: fill ? PDFLib.rgb(fill.r, fill.g, fill.b) : undefined,
      borderColor: stroke ? PDFLib.rgb(stroke.r, stroke.g, stroke.b) : undefined,
      borderWidth: stroke ? strokeWidth : 0,
      opacity: obj.opacity ?? 1
    })
  }

  drawOvalObject(page, obj, pageHeight) {
    const yCenter = pageHeight - (obj.y ?? 0) - (obj.height ?? 0) / 2
    const fillHex = obj.fill ?? obj.fillColor
    const strokeHex = obj.stroke ?? obj.strokeColor
    const fill = fillHex && fillHex !== 'transparent' ? this.hexToRgb(fillHex) : null
    const stroke = strokeHex && strokeHex !== 'transparent' ? this.hexToRgb(strokeHex) : null
    const strokeWidth = obj.strokeWidth ?? obj.lineWidth ?? 2

    page.drawEllipse({
      x: (obj.x ?? 0) + (obj.width ?? 0) / 2,
      y: yCenter,
      xScale: Math.abs((obj.width ?? 0) / 2),
      yScale: Math.abs((obj.height ?? 0) / 2),
      color: fill ? PDFLib.rgb(fill.r, fill.g, fill.b) : undefined,
      borderColor: stroke ? PDFLib.rgb(stroke.r, stroke.g, stroke.b) : undefined,
      borderWidth: stroke ? strokeWidth : 0,
      opacity: obj.opacity ?? 1
    })
  }

  drawLineObject(page, obj, pageHeight) {
    const x1 = ('x1' in obj) ? obj.x1 : (obj.x ?? 0)
    const y1 = ('y1' in obj) ? obj.y1 : (obj.y ?? 0)
    const x2 = ('x2' in obj) ? obj.x2 : ((obj.x ?? 0) + (obj.width ?? 0))
    const y2 = ('y2' in obj) ? obj.y2 : ((obj.y ?? 0) + (obj.height ?? 0))

    const colorHex = obj.stroke ?? obj.color ?? obj.strokeColor ?? '#000000'
    const color = this.hexToRgb(colorHex)
    const thickness = obj.strokeWidth ?? obj.lineWidth ?? 2

    page.drawLine({
      start: { x: x1, y: pageHeight - y1 },
      end: { x: x2, y: pageHeight - y2 },
      thickness,
      color: PDFLib.rgb(color.r, color.g, color.b),
      opacity: obj.opacity ?? 1
    })
  }

  drawPathObject(page, obj, pageHeight) {
    if (!obj.points || obj.points.length < 2) return

    const colorHex = obj.color ?? obj.stroke ?? obj.strokeColor ?? '#000000'
    const color = this.hexToRgb(colorHex)
    const thickness = obj.size ?? obj.lineWidth ?? 2

    for (let i = 1; i < obj.points.length; i++) {
      const p1 = obj.points[i - 1]
      const p2 = obj.points[i]
      page.drawLine({
        start: { x: p1.x, y: pageHeight - p1.y },
        end: { x: p2.x, y: pageHeight - p2.y },
        thickness,
        color: PDFLib.rgb(color.r, color.g, color.b),
        opacity: obj.opacity ?? 1
      })
    }
  }

  async drawImageObject(pdfDoc, page, obj, pageHeight) {
    const data = obj.data || obj.imageData || obj.signatureData
    if (!data) return

    try {
      const isPng = obj.format === 'png' || data.startsWith?.('data:image/png')
      const embeddedImage = isPng ? await pdfDoc.embedPng(data) : await pdfDoc.embedJpg(data)
      const y = pageHeight - (obj.y ?? 0) - (obj.height ?? 0)

      page.drawImage(embeddedImage, {
        x: obj.x ?? 0,
        y,
        width: obj.width ?? embeddedImage.width,
        height: obj.height ?? embeddedImage.height,
        opacity: obj.opacity ?? 1
      })
    } catch (error) {
      console.error('Failed to draw image:', error)
    }
  }

  drawHighlightObject(page, obj, pageHeight) {
    const y = pageHeight - (obj.y ?? 0) - (obj.height ?? 0)
    const colorHex = obj.color || '#FFFF00'
    const color = this.hexToRgb(colorHex)

    page.drawRectangle({
      x: obj.x ?? 0,
      y,
      width: obj.width ?? 0,
      height: obj.height ?? 0,
      color: PDFLib.rgb(color.r, color.g, color.b),
      opacity: obj.opacity ?? 0.4,
      borderWidth: 0
    })
  }

  // ---------- Overlay flattening helpers (for image exports) ----------
  _getCanvases() {
    // Try renderer.els, then DOM fallback
    const rEls = this.renderer?.els || {}
    const pdfCanvas = rEls.pdfCanvas || document.getElementById('pdf-canvas')
    const objectsCanvas = rEls.objectsCanvas || document.getElementById('objects-canvas')
    const annotationCanvas = rEls.annotationCanvas || document.getElementById('annotation-canvas')
    return { pdfCanvas, objectsCanvas, annotationCanvas }
  }

  async getFlattenedPageCanvas(page, { scale = 1 } = {}) {
    if (!this.renderer) throw new Error('Renderer not available for overlay flattening')

    const prevPage = this.state.view.page
    const prevZoom = this.state.view.zoom

    try {
      if (prevPage !== page) this.state.view.page = page
      if (typeof scale === 'number' && !Number.isNaN(scale)) this.state.view.zoom = scale

      await this.renderer.renderAll?.()

      const { pdfCanvas, objectsCanvas, annotationCanvas } = this._getCanvases()
      if (!pdfCanvas || !pdfCanvas.width || !pdfCanvas.height) {
        throw new Error('Base PDF canvas is not available or has zero size')
      }

      const w = pdfCanvas.width
      const h = pdfCanvas.height

      const out = document.createElement('canvas')
      out.width = w
      out.height = h
      const ctx = out.getContext('2d')
      ctx.imageSmoothingEnabled = true
      ctx.imageSmoothingQuality = 'high'

      const draw = (c) => {
        if (c && c.width && c.height) ctx.drawImage(c, 0, 0, w, h)
      }
      draw(pdfCanvas)
      draw(objectsCanvas)
      draw(annotationCanvas)

      return out
    } finally {
      this.state.view.page = prevPage
      this.state.view.zoom = prevZoom
      await this.renderer.renderAll?.()
    }
  }

  // ---------- Image export API ----------
  // Backward-compatible call shape:
  // - exportToImages('png', 0.92, 300)
  // - exportToImages({ format: 'png', quality: 0.92, dpi: 300, pageRange: 'current' | 'all' | 'range', from, to, pages: [1,3], includeOverlays: true })
  async exportToImages(formatOrOptions = 'png', qualityArg = 0.92, dpiArg = 300) {
    const defaults = { format: 'png', quality: 0.92, dpi: 300, pageRange: 'all', includeOverlays: true }
    const opts = typeof formatOrOptions === 'object'
      ? { ...defaults, ...formatOrOptions }
      : { ...defaults, format: formatOrOptions, quality: qualityArg, dpi: dpiArg }

    const pages = this._resolvePages(opts)
    const fmt = String(opts.format).toLowerCase()
    const mime = `image/${fmt === 'jpg' ? 'jpeg' : fmt}`
    const scale = (opts.dpi || 300) / 72

    const images = []
    for (const p of pages) {
      try {
        const canvas = (opts.includeOverlays && this.renderer)
          ? await this.getFlattenedPageCanvas(p, { scale })
          : await this._renderBasePdfPageToCanvas(p, { scale })

        const blob = await new Promise(resolve => canvas.toBlob(resolve, mime, opts.quality))
        images.push({
          page: p,
          blob,
          name: `${(this.state.document.name || 'document').replace(/\.pdf$/i, '')}_page_${p}.${fmt === 'jpeg' ? 'jpg' : fmt}`
        })
      } catch (error) {
        console.error(`Failed to export page ${p}:`, error)
      }
    }
    return images
  }

  // Single-page helper (used by UI when "current page" is chosen)
  async exportPageAsImage(page, options = {}) {
    const { format = 'png', quality = 0.92, dpi = 300, includeOverlays = true } = options
    const [image] = await this.exportToImages({ format, quality, dpi, includeOverlays, pages: [page] })
    return image // { page, blob, name }
  }

  async _renderBasePdfPageToCanvas(pageNumber, { scale }) {
    const page = await this.pdfService.pdfjs.getPage(pageNumber)
    const viewport = page.getViewport({ scale })
    const canvas = document.createElement('canvas')
    canvas.width = viewport.width
    canvas.height = viewport.height
    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise
    return canvas
  }

  _resolvePages(opts) {
    const total = this.state.document.pages || 1

    // Highest priority: explicit pages array
    if (Array.isArray(opts.pages) && opts.pages.length) {
      return [...new Set(opts.pages
        .map(n => parseInt(n, 10))
        .filter(n => Number.isFinite(n) && n >= 1 && n <= total)
      )].sort((a,b) => a - b)
    }

    // Range: { pageRange: 'range', from, to }
    if (opts.pageRange === 'range') {
      const from = Math.max(1, Math.min(total, parseInt(opts.from, 10) || 1))
      const to = Math.max(1, Math.min(total, parseInt(opts.to, 10) || from))
      const [start, end] = from <= to ? [from, to] : [to, from]
      return Array.from({ length: end - start + 1 }, (_, i) => start + i)
    }

    // Current page
    if (opts.pageRange === 'current') {
      const cur = this.state.view?.page || 1
      return [Math.max(1, Math.min(total, cur))]
    }

    // Default: all pages
    return Array.from({ length: total }, (_, i) => i + 1)
  }

  // ---------- Other formats (unchanged except for safer guards) ----------
  async exportToSvg() {
    const svgs = []
    const total = this.state.document.pages || 1

    for (let i = 1; i <= total; i++) {
      try {
        const page = await this.pdfService.pdfjs.getPage(i)
        const viewport = page.getViewport({ scale: 1 })

        const svgGfx = new pdfjsLib.SVGGraphics(page.commonObjs, page.objs)
        const svg = await svgGfx.getSVG(page, viewport)

        const serializer = new XMLSerializer()
        const svgString = serializer.serializeToString(svg)

        svgs.push({
          page: i,
          svg: svgString,
          name: `${(this.state.document.name || 'document').replace(/\.pdf$/i, '')}_page_${i}.svg`
        })
      } catch (error) {
        console.error(`Failed to export SVG for page ${i}:`, error)
      }
    }

    return svgs
  }

  async exportToHtml() {
    let html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>${this.state.document.name}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
    .page { page-break-after: always; margin-bottom: 40px; }
    h1 { color: #333; }
  </style>
</head>
<body>
  <h1>${this.state.document.name}</h1>
`

    for (let i = 1; i <= (this.state.document.pages || 1); i++) {
      try {
        const textContent = await this.pdfService.extractText(i)
        html += `  <div class="page">\n`
        html += `    <h2>Page ${i}</h2>\n`
        for (const item of textContent) {
          html += `    <p>${this.escapeHtml(item.text)}</p>\n`
        }
        html += `  </div>\n`
      } catch (error) {
        console.error(`Failed to extract text from page ${i}:`, error)
      }
    }

    html += `</body>\n</html>`

    return new Blob([html], { type: MIME_TYPES.HTML })
  }

  getStandardFont(fontFamily, bold, italic) {
    const fallback = 'Helvetica'
    const map = {
      Arial: 'Helvetica',
      'Times New Roman': 'TimesRoman',
      'Courier New': 'Courier',
      Georgia: 'TimesRoman',
      Verdana: 'Helvetica'
    }
    const family = map[fontFamily] || fontFamily || fallback

    if (bold && italic) return PDFLib.StandardFonts[`${family}BoldOblique`] || PDFLib.StandardFonts.HelveticaBoldOblique
    if (bold) return PDFLib.StandardFonts[`${family}Bold`] || PDFLib.StandardFonts.HelveticaBold
    if (italic) return PDFLib.StandardFonts[`${family}Oblique`] || PDFLib.StandardFonts.HelveticaOblique
    return PDFLib.StandardFonts[family] || PDFLib.StandardFonts.Helvetica
  }

  hexToRgb(hex) {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex || '')
    return result ? {
      r: parseInt(result[1], 16) / 255,
      g: parseInt(result[2], 16) / 255,
      b: parseInt(result[3], 16) / 255
    } : { r: 0, g: 0, b: 0 }
  }

  escapeHtml(text) {
    const div = document.createElement('div')
    div.textContent = text ?? ''
    return div.innerHTML
  }

  async downloadBlob(blob, filename) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }
}