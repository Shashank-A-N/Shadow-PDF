import { BaseTool } from './base-tool.js'
import { CURSORS, EVENTS, FORM_FIELD_TYPES } from '../constants.js'

export class FormTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)

    this.cursor = CURSORS.CROSSHAIR
    this.fieldType = FORM_FIELD_TYPES.TEXT_INPUT

    // interactive creation state
    this.creating = false
    this.createStartPdf = null
    this.createCurrentPdf = null

    // default visual size (in PDF units at zoom=1). We'll scale so it looks consistent.
    this.baseWidthPdf = 200
    this.baseHeightPdf = 30

    // preferences
    this.centerOnAlt = true // hold Alt to center (default behavior)
    this.snapWhileSizing = true

    // keep last pointer event for overlay debugging/preview
    this._lastPointerEvent = null
  }

  activate() {
    super.activate()
    if (this.els && this.els.objectsCanvas) {
      this.els.objectsCanvas.style.touchAction = this.els.objectsCanvas.style.touchAction || 'none'
      this.els.objectsCanvas.style.cursor = this.cursor || 'crosshair'
      // listen for pointer events on canvas (BaseTool may already do this; redundant registration is safe)
    }
  }

  deactivate() {
    super.deactivate()
    if (this.els && this.els.objectsCanvas) {
      this.els.objectsCanvas.style.cursor = 'default'
    }
    // clear any in-progress creation
    this.creating = false
    this.createStartPdf = null
    this.createCurrentPdf = null
    this.renderer && this.renderer.render && this.renderer.render()
  }

  setFieldType(type) {
    this.fieldType = type
  }

  setDefaultSize(widthPdf, heightPdf) {
    this.baseWidthPdf = widthPdf
    this.baseHeightPdf = heightPdf
  }

  // Prefer renderer's clientToPdf to keep mapping consistent with renderer
  getPdfPointFromEvent(e) {
    if (this.renderer && typeof this.renderer.clientToPdf === 'function') {
      return this.renderer.clientToPdf(e)
    }
    // fallback: compute CSS pixel coords and call canvasToPdf if available
    const canvas = this.els.objectsCanvas
    const rect = canvas.getBoundingClientRect()
    const xCss = (typeof e.offsetX === 'number' && e.target === canvas) ? e.offsetX : (e.clientX - rect.left)
    const yCss = (typeof e.offsetY === 'number' && e.target === canvas) ? e.offsetY : (e.clientY - rect.top)

    if (this.renderer && typeof this.renderer.canvasToPdf === 'function') {
      return this.renderer.canvasToPdf({ x: xCss, y: yCss })
    }

    const zoom = this.state.view.zoom || 1
    return {
      x: (xCss / zoom) + (this.state.view.pageX || 0),
      y: (yCss / zoom) + (this.state.view.pageY || 0)
    }
  }

  // ---------- Pointer events ----------
  onPointerDown(e) {
    // pointer capture for robust dragging across browsers
    try {
      if (e.pointerId && this.els.objectsCanvas.setPointerCapture) {
        this.els.objectsCanvas.setPointerCapture(e.pointerId)
      }
    } catch (err) {}

    this._lastPointerEvent = e
    const pdfPt = this.getPdfPointFromEvent(e)

    // start interactive creation
    this.creating = true
    this.createStartPdf = pdfPt
    this.createCurrentPdf = pdfPt

    // If user just clicks (no move) we'll place a default sized field on pointer up.
    // But if they drag, we'll resize according to pointer.
    this.renderer && this.renderer.render && this.renderer.render()
    this.drawCreationPreview()
  }

  onPointerMove(e) {
    if (!this.creating) return
    this._lastPointerEvent = e
    const pdfPt = this.getPdfPointFromEvent(e)
    this.createCurrentPdf = pdfPt

    // optionally snap preview corners to grid
    if (this.snapWhileSizing && this.snapToGrid) {
      this.createCurrentPdf = this.snapToGrid(this.createCurrentPdf)
    }

    this.renderer && this.renderer.render && this.renderer.render()
    this.drawCreationPreview()
  }

  onPointerUp(e) {
    if (!this.creating) {
      // nothing to finalize
      try {
        if (e.pointerId && this.els.objectsCanvas.releasePointerCapture) {
          this.els.objectsCanvas.releasePointerCapture(e.pointerId)
        }
      } catch (err) {}
      return
    }

    // finalize creation
    this._lastPointerEvent = e
    const pdfPt = this.getPdfPointFromEvent(e)
    this.createCurrentPdf = (this.snapWhileSizing && this.snapToGrid) ? this.snapToGrid(pdfPt) : pdfPt

    // if start and end are nearly identical (click), create default-size field
    const dx = Math.abs(this.createCurrentPdf.x - this.createStartPdf.x)
    const dy = Math.abs(this.createCurrentPdf.y - this.createStartPdf.y)
    const threshold = (4 / 72) // ~4 PDF points tolerance
    let x, y, width, height

    const zoom = this.state.view.zoom || 1
    const scaleForZoom = 1 / (zoom || 1) // if you want field to be visually same at different zoom, adjust differently

    if (dx < threshold && dy < threshold) {
      // single click: default size, optionally center under cursor with Alt
      width = this.baseWidthPdf
      height = this.baseHeightPdf

      if (this.centerOnAlt && (e.altKey || e.metaKey)) {
        x = this.createStartPdf.x - width / 2
        y = this.createStartPdf.y - height / 2
      } else {
        // top-left anchored at pointer
        x = this.createStartPdf.x
        y = this.createStartPdf.y
      }
    } else {
      // drag-based sizing: normalize box from start->current
      const box = this.normalizeBox({
        x1: this.createStartPdf.x,
        y1: this.createStartPdf.y,
        x2: this.createCurrentPdf.x,
        y2: this.createCurrentPdf.y
      })
      x = box.x
      y = box.y
      width = box.width || 1
      height = box.height || 1
    }

    // create the object in PDF coords
    const formField = this.createObject('form-field', {
      fieldType: this.fieldType,
      x,
      y,
      width,
      height,
      label: this.fieldType === FORM_FIELD_TYPES.CHECKBOX ? '' : 'Form Field',
      value: '',
      required: false,
      placeholder: '',
      options: []
    })

    // add to state arrays safely
    if (!Array.isArray(this.state.formFields)) this.state.formFields = []
    this.state.formFields.push(formField)

    if (!Array.isArray(this.state.objects)) this.state.objects = []
    this.state.objects.push(formField)

    this.state.selection = [formField]

    this.emit && this.emit(EVENTS.OBJECT_ADDED, { object: formField })
    this.emit && this.emit(EVENTS.SELECTION_CHANGED, { selection: [formField] })

    // cleanup creation state
    this.creating = false
    this.createStartPdf = null
    this.createCurrentPdf = null

    try {
      if (e.pointerId && this.els.objectsCanvas.releasePointerCapture) {
        this.els.objectsCanvas.releasePointerCapture(e.pointerId)
      }
    } catch (err) {}

    this.renderer && this.renderer.render && this.renderer.render()
  }

  // ---------- Helpers ----------
  normalizeBox(box) {
    const x = Math.min(box.x1, box.x2)
    const y = Math.min(box.y1, box.y2)
    const width = Math.abs(box.x2 - box.x1)
    const height = Math.abs(box.y2 - box.y1)
    return { x, y, width, height }
  }

  // Draw a live preview rectangle on the overlay canvas (call after renderer.render())
  drawCreationPreview() {
    if (!this.creating || !this.createStartPdf || !this.createCurrentPdf) return
    const ctx = this.els.objectsCanvas.getContext('2d')
    ctx.save()
    // match renderer transform (so pdfToCanvas returns CSS px that align to ctx)
    const ratio = (this.state.canvas && this.state.canvas.ratio) || window.devicePixelRatio || 1
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

    // compute box in PDF coords and convert to canvas coords for drawing
    const box = this.normalizeBox({
      x1: this.createStartPdf.x,
      y1: this.createStartPdf.y,
      x2: this.createCurrentPdf.x,
      y2: this.createCurrentPdf.y
    })

    // If user hasn't dragged (zero-size) show a default centered preview at pointer
    let drawBox = box
    if (box.width === 0 && box.height === 0) {
      const w = this.baseWidthPdf
      const h = this.baseHeightPdf
      if (this.centerOnAlt && this._lastPointerEvent && (this._lastPointerEvent.altKey || this._lastPointerEvent.metaKey)) {
        drawBox = { x: this.createStartPdf.x - w / 2, y: this.createStartPdf.y - h / 2, width: w, height: h }
      } else {
        drawBox = { x: this.createStartPdf.x, y: this.createStartPdf.y, width: w, height: h }
      }
    }

    const p1 = this.renderer.pdfToCanvas({ x: drawBox.x, y: drawBox.y })
    const p2 = this.renderer.pdfToCanvas({ x: drawBox.x + drawBox.width, y: drawBox.y + drawBox.height })
    const w = p2.x - p1.x
    const h = p2.y - p1.y

    // draw dashed outline + translucent fill
    ctx.save()
    ctx.strokeStyle = '#10B981' // greenish preview
    ctx.fillStyle = 'rgba(16,184,129,0.08)'
    ctx.lineWidth = 1
    ctx.setLineDash([6, 4])
    ctx.fillRect(p1.x, p1.y, w, h)
    ctx.strokeRect(p1.x, p1.y, w, h)
    ctx.restore()

    // optional small cross at origin
    ctx.save()
    ctx.fillStyle = '#10B981'
    ctx.beginPath()
    ctx.arc(p1.x + 4, p1.y + 4, 3, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()

    ctx.restore()
  }
}
