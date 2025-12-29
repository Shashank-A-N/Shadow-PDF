import { CONFIG } from '../../constants.js'

export class PdfRenderer {
  constructor(state) {
    this.state = state
    this.renderCache = new Map()
    this.maxCacheSize = 10
  }

  async renderPageToCanvas(pdfPage, canvas, options = {}) {
    const {
      scale = 1,
      rotation = 0,
      background = null,
      renderAnnotations = true,
      renderForms = true
    } = options

    const viewport = pdfPage.getViewport({ scale, rotation })
    const outputScale = window.devicePixelRatio || 1

    canvas.width = Math.floor(viewport.width * outputScale)
    canvas.height = Math.floor(viewport.height * outputScale)
    canvas.style.width = Math.floor(viewport.width) + 'px'
    canvas.style.height = Math.floor(viewport.height) + 'px'

    const ctx = canvas.getContext('2d')
    ctx.setTransform(outputScale, 0, 0, outputScale, 0, 0)

    if (background) {
      ctx.fillStyle = background
      ctx.fillRect(0, 0, viewport.width, viewport.height)
    }

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport,
      renderInteractiveForms: renderForms,
      background: background ? 'transparent' : 'white'
    }

    await pdfPage.render(renderContext).promise

    if (renderAnnotations) {
      await this.renderAnnotations(pdfPage, ctx, viewport)
    }

    return canvas
  }

  async renderAnnotations(pdfPage, ctx, viewport) {
    try {
      const annotations = await pdfPage.getAnnotations()
      
      for (const annotation of annotations) {
        if (annotation.subtype === 'Link') continue

        const rect = viewport.convertToViewportRectangle(annotation.rect)
        
        ctx.save()
        ctx.strokeStyle = '#FF0000'
        ctx.lineWidth = 2
        ctx.strokeRect(rect[0], rect[1], rect[2] - rect[0], rect[3] - rect[1])
        ctx.restore()
      }
    } catch (error) {
      console.warn('Failed to render annotations:', error)
    }
  }

  async renderPageToImage(pdfPage, format = 'png', quality = 0.92) {
    const canvas = document.createElement('canvas')
    await this.renderPageToCanvas(pdfPage, canvas, { scale: 2 })

    return new Promise((resolve, reject) => {
      canvas.toBlob(
        blob => {
          if (blob) {
            resolve(blob)
          } else {
            reject(new Error('Failed to create blob'))
          }
        },
        `image/${format}`,
        quality
      )
    })
  }

  async renderThumbnail(pdfPage, maxWidth = 150) {
    const cacheKey = `thumb_${pdfPage.pageNumber}_${maxWidth}`
    
    if (this.renderCache.has(cacheKey)) {
      return this.renderCache.get(cacheKey)
    }

    const viewport = pdfPage.getViewport({ scale: 1 })
    const scale = maxWidth / viewport.width

    const canvas = document.createElement('canvas')
    await this.renderPageToCanvas(pdfPage, canvas, { scale })

    const dataUrl = canvas.toDataURL('image/png')
    
    this.renderCache.set(cacheKey, dataUrl)
    
    if (this.renderCache.size > this.maxCacheSize) {
      const firstKey = this.renderCache.keys().next().value
      this.renderCache.delete(firstKey)
    }

    return dataUrl
  }

  clearCache() {
    this.renderCache.clear()
  }
}