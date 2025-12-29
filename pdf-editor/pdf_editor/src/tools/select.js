import { BaseTool } from './base-tool.js'
import { CURSORS, TRANSFORM_HANDLES, EVENTS } from '../constants.js'
import { pointInRect, rectIntersects } from '../utils/geom.js'

export class SelectTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)

    // state flags
    this.cursor = CURSORS.DEFAULT
    this.dragging = false
    this.resizing = false
    this.selecting = false

    // runtime values
    this.resizeHandle = null
    this.dragStart = null
    this.dragOffsets = []
    this.selectionBox = null
    this.transformStart = null

    // remember last raw event for modifiers (shift/alt)
    this._lastPointerEvent = null

    // config
    this.handleRenderSizePx = 8
    this.minSizePdf = 4 / 72 // ~4 points (PDF units) — change as needed
  }

  activate() {
    super.activate()
    this.els.objectsCanvas.addEventListener('dblclick', this.handleDoubleClick)
    // ensure canvas will receive pointer events and avoid browser gestures
    this.els.objectsCanvas.style.touchAction = this.els.objectsCanvas.style.touchAction || 'none'
  }

  deactivate() {
    super.deactivate()
    this.els.objectsCanvas.removeEventListener('dblclick', this.handleDoubleClick)
  }

  cleanup() {
    this.dragging = false
    this.resizing = false
    this.selecting = false
    this.selectionBox = null
    this.resizeHandle = null
    this.dragOffsets = []
    this.cursor = CURSORS.DEFAULT
    this.updateCursor()
  }

  // Ensure canvas cursor matches this.cursor
  updateCursor() {
    if (!this.els || !this.els.objectsCanvas) return
    this.els.objectsCanvas.style.cursor = this.cursor || 'default'
  }

  // Convert pointer event to PDF coordinates (matches object coords)
  getPdfPoint(e) {
    // Prefer renderer-provided mapping if present (keeps tool and renderer consistent)
    if (this.renderer && typeof this.renderer.clientToPdf === 'function') {
      return this.renderer.clientToPdf(e)
    }

    const rect = this.els.objectsCanvas.getBoundingClientRect()
    const xCanvasCss = (typeof e.offsetX === 'number' && e.target === this.els.objectsCanvas) ? e.offsetX : (e.clientX - rect.left)
    const yCanvasCss = (typeof e.offsetY === 'number' && e.target === this.els.objectsCanvas) ? e.offsetY : (e.clientY - rect.top)

    if (this.renderer && typeof this.renderer.canvasToPdf === 'function') {
      return this.renderer.canvasToPdf({ x: xCanvasCss, y: yCanvasCss })
    }

    const zoom = this.state.view.zoom || 1
    return {
      x: (xCanvasCss / zoom) + (this.state.view.pageX || 0),
      y: (yCanvasCss / zoom) + (this.state.view.pageY || 0)
    }
  }

  // ---------- Pointer events ----------
  onPointerDown(e) {
    // capture pointer so move/up continue to be delivered to canvas
    try {
      if (e.pointerId && this.els.objectsCanvas.setPointerCapture) {
        this.els.objectsCanvas.setPointerCapture(e.pointerId)
      }
    } catch (err) { /* ignore capture errors */ }

    this._lastPointerEvent = e
    const point = this.snapToGrid ? this.snapToGrid(this.getPdfPoint(e)) : this.getPdfPoint(e)
    this._pointerDownPdf = point

    const handle = this.getHandleAtPoint(point)
    if (handle) {
      this.startResize(point, handle, e)
      this.renderer.render()
      this.drawSelectionOverlay()
      return
    }

    const object = this.getObjectAtPoint(point)

    if (object) {
      // selection logic (toggle with shift)
      if (!e.shiftKey && !this.state.selection.includes(object)) {
        this.state.selection = [object]
      } else if (e.shiftKey) {
        if (this.state.selection.includes(object)) {
          this.state.selection = this.state.selection.filter(o => o !== object)
        } else {
          this.state.selection.push(object)
        }
      }

      if (this.state.selection.length > 0) {
        this.startDrag(point, e)
      }

      this.emit && this.emit(EVENTS.SELECTION_CHANGED, { selection: this.state.selection })
    } else {
      // click on empty area -> start box select
      if (!e.shiftKey) {
        this.state.selection = []
        this.emit && this.emit(EVENTS.SELECTION_CHANGED, { selection: [] })
      }
      this.startBoxSelect(point)
    }

    this.renderer.render()
    this.drawSelectionOverlay()
    this.updateCursor()
  }

  onPointerMove(e) {
    this._lastPointerEvent = e
    const point = this.snapToGrid ? this.snapToGrid(this.getPdfPoint(e)) : this.getPdfPoint(e)

    if (this.resizing) {
      this.updateResize(point, e)
      this.renderer.render()
      this.drawSelectionOverlay()
      return
    }

    if (this.dragging) {
      this.updateDrag(point)
      this.renderer.render()
      this.drawSelectionOverlay(point)
      return
    }

    if (this.selecting) {
      this.updateBoxSelect(point)
      this.renderer.render()
      this.drawSelectionBox()
      return
    }

    // not dragging/resizing/selecting: update hover cursor / handle highlight
    const handle = this.getHandleAtPoint(point)
    if (handle) {
      this.updateCursorForHandle(handle)
      this.renderer.render()
      this.drawSelectionOverlay()
      return
    }

    const object = this.getObjectAtPoint(point)
    this.cursor = object ? CURSORS.MOVE : CURSORS.DEFAULT
    this.updateCursor()
    this.renderer.render()
    this.drawSelectionOverlay()
  }

  onPointerUp(e) {
    this._lastPointerEvent = e

    try {
      if (e.pointerId && this.els.objectsCanvas.releasePointerCapture) {
        this.els.objectsCanvas.releasePointerCapture(e.pointerId)
      }
    } catch (err) { /* ignore */ }

    if (this.resizing) {
      this.resizing = false
      this.resizeHandle = null
      this.transformStart = null
    }

    if (this.dragging) {
      this.dragging = false
      this.transformStart = null
      this.dragOffsets = []
    }

    if (this.selecting) {
      this.finishBoxSelect()
      this.selecting = false
    }

    this.cursor = CURSORS.DEFAULT
    this.updateCursor()
    this.renderer.render()
    this.drawSelectionOverlay()
  }

  handleDoubleClick = (e) => {
    const point = this.getPdfPoint(e)
    const object = this.getObjectAtPoint(point)
    if (object && object.type === 'text') {
      this.editText(object)
    }
  }

  // ---------- Dragging ----------
  startDrag(point, e) {
    this.dragging = true
    this.dragStart = point

    // store snapshot of selected objects so we can apply deltas reproducibly
    this.transformStart = this.state.selection.map(obj => {
      const snapshot = {
        id: obj.id,
        type: obj.type,
        x: obj.x,
        y: obj.y,
        width: obj.width,
        height: obj.height
      }
      if (obj.type === 'path') {
        snapshot.points = (obj.points || []).map(p => ({ ...p }))
        snapshot.rawPoints = (obj.rawPoints || []).map(p => ({ ...p }))
      }
      return snapshot
    })

    // offsets used to keep relative positions for multi-select drag (pdf-space)
    this.dragOffsets = this.transformStart.map(s => ({
      x: this.dragStart.x - (s.x || 0),
      y: this.dragStart.y - (s.y || 0)
    }))

    this.updateCursor()
  }

  updateDrag(point) {
    if (!this.dragging || !this.transformStart) return

    // compute delta from dragStart
    const dx = point.x - this.dragStart.x
    const dy = point.y - this.dragStart.y

    this.state.selection.forEach((obj, index) => {
      const start = this.transformStart[index]
      if (!start) return

      if (obj.type === 'path') {
        if (Array.isArray(obj.points)) {
          for (let i = 0; i < obj.points.length; i++) {
            const sp = (start.points && start.points[i]) || { x: obj.points[i].x, y: obj.points[i].y }
            obj.points[i].x = sp.x + dx
            obj.points[i].y = sp.y + dy
          }
        }
        if (Array.isArray(obj.rawPoints)) {
          for (let i = 0; i < obj.rawPoints.length; i++) {
            const srp = (start.rawPoints && start.rawPoints[i]) || { x: obj.rawPoints[i].x, y: obj.rawPoints[i].y }
            obj.rawPoints[i].x = srp.x + dx
            obj.rawPoints[i].y = srp.y + dy
          }
        }

        if ('x' in obj) obj.x = (start.x || 0) + dx
        if ('y' in obj) obj.y = (start.y || 0) + dy
      } else {
        const targetX = (start.x || 0) + dx
        const targetY = (start.y || 0) + dy
        const snapped = this.snapToGrid ? this.snapToGrid({ x: targetX, y: targetY }) : { x: targetX, y: targetY }
        obj.x = snapped.x
        obj.y = snapped.y
      }

      obj.modified = Date.now()
    })

    this.emit && this.emit(EVENTS.OBJECT_UPDATED, { objects: this.state.selection })
  }

  // ---------- Resizing ----------
  startResize(point, handle, e) {
    if (this.state.selection.length !== 1) return
    this.resizing = true
    this.resizeHandle = handle
    this.dragStart = point
    this.transformStart = this.state.selection.map(obj => ({
      x: obj.x,
      y: obj.y,
      width: obj.width || 0,
      height: obj.height || 0
    }))
    this._resizePreserveAspect = !!(e && e.shiftKey)
    this.updateCursorForHandle(handle)
  }

  updateResize(point, e) {
    if (this.state.selection.length !== 1) return
    const obj = this.state.selection[0]
    const start = this.transformStart[0]
    const dx = point.x - this.dragStart.x
    const dy = point.y - this.dragStart.y
    const preserveAspect = this._resizePreserveAspect || (e && e.shiftKey)

    const clampSize = (w, h) => {
      w = Math.max(w, this.minSizePdf)
      h = Math.max(h, this.minSizePdf)
      return { w, h }
    }

    let newX = start.x
    let newY = start.y
    let newW = start.width
    let newH = start.height

    switch (this.resizeHandle) {
      case TRANSFORM_HANDLES.TOP_LEFT:
        newX = start.x + dx
        newY = start.y + dy
        newW = start.width - dx
        newH = start.height - dy
        break
      case TRANSFORM_HANDLES.TOP_CENTER:
        newY = start.y + dy
        newH = start.height - dy
        break
      case TRANSFORM_HANDLES.TOP_RIGHT:
        newY = start.y + dy
        newW = start.width + dx
        newH = start.height - dy
        break
      case TRANSFORM_HANDLES.MIDDLE_LEFT:
        newX = start.x + dx
        newW = start.width - dx
        break
      case TRANSFORM_HANDLES.MIDDLE_RIGHT:
        newW = start.width + dx
        break
      case TRANSFORM_HANDLES.BOTTOM_LEFT:
        newX = start.x + dx
        newW = start.width - dx
        newH = start.height + dy
        break
      case TRANSFORM_HANDLES.BOTTOM_CENTER:
        newH = start.height + dy
        break
      case TRANSFORM_HANDLES.BOTTOM_RIGHT:
        newW = start.width + dx
        newH = start.height + dy
        break
    }

    if (preserveAspect && start.width > 0 && start.height > 0) {
      const aspect = start.height / start.width
      if (Math.abs(newW - start.width) > Math.abs(newH - start.height)) {
        newH = newW * aspect
        if ([TRANSFORM_HANDLES.TOP_LEFT, TRANSFORM_HANDLES.MIDDLE_LEFT, TRANSFORM_HANDLES.BOTTOM_LEFT].includes(this.resizeHandle)) {
          newX = start.x + (start.width - newW)
        }
        if ([TRANSFORM_HANDLES.TOP_LEFT, TRANSFORM_HANDLES.TOP_CENTER, TRANSFORM_HANDLES.TOP_RIGHT].includes(this.resizeHandle)) {
          newY = start.y + (start.height - newH)
        }
      } else {
        newW = newH / aspect
        if ([TRANSFORM_HANDLES.TOP_LEFT, TRANSFORM_HANDLES.MIDDLE_LEFT, TRANSFORM_HANDLES.BOTTOM_LEFT].includes(this.resizeHandle)) {
          newX = start.x + (start.width - newW)
        }
        if ([TRANSFORM_HANDLES.TOP_LEFT, TRANSFORM_HANDLES.TOP_CENTER, TRANSFORM_HANDLES.TOP_RIGHT].includes(this.resizeHandle)) {
          newY = start.y + (start.height - newH)
        }
      }
    }

    const clamped = clampSize(newW, newH)
    newW = clamped.w
    newH = clamped.h

    obj.x = newX
    obj.y = newY
    obj.width = newW
    obj.height = newH

    obj.modified = Date.now()
    this.emit(EVENTS.OBJECT_UPDATED, { objects: [obj] })
  }

  // ---------- Box selection ----------
  startBoxSelect(point) {
    this.selecting = true
    this.selectionBox = { x1: point.x, y1: point.y, x2: point.x, y2: point.y }
  }

  updateBoxSelect(point) {
    if (this.selectionBox) {
      this.selectionBox.x2 = point.x
      this.selectionBox.y2 = point.y
    }
  }

  finishBoxSelect() {
    if (!this.selectionBox) return

    const box = this.normalizeBox(this.selectionBox)
    const pageObjects = this.state.objects.filter(obj => obj.page === this.state.view.page)

    this.state.selection = pageObjects.filter(obj => {
      if (obj.type === 'path') {
        return obj.points.some(p => pointInRect(p, box))
      }

      const objRect = {
        x: obj.x,
        y: obj.y,
        width: obj.width || 0,
        height: obj.height || 0
      }

      return rectIntersects(box, objRect)
    })

    this.selectionBox = null
    this.emit(EVENTS.SELECTION_CHANGED, { selection: this.state.selection })
  }

  drawSelectionBox() {
    if (!this.selectionBox) return
    this.renderer.render()

    const ctx = this.els.objectsCanvas.getContext('2d')
    // Match renderer transform so pdfToCanvas results are drawn correctly
    ctx.save()
    const ratio = (this.state.canvas && this.state.canvas.ratio) || window.devicePixelRatio || 1
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

    const box = this.normalizeBox(this.selectionBox)
    const p1 = this.renderer.pdfToCanvas({ x: box.x, y: box.y })
    const p2 = this.renderer.pdfToCanvas({ x: box.x + box.width, y: box.y + box.height })

    ctx.strokeStyle = '#3B82F6'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.strokeRect(p1.x, p1.y, p2.x - p1.x, p2.y - p1.y)
    ctx.restore()
  }

  normalizeBox(box) {
    return {
      x: Math.min(box.x1, box.x2),
      y: Math.min(box.y1, box.y2),
      width: Math.abs(box.x2 - box.x1),
      height: Math.abs(box.y2 - box.y1)
    }
  }

  // ---------- Hit testing ----------
  getObjectAtPoint(point) {
    const pageObjects = [...this.state.objects]
      .filter(obj => obj.page === this.state.view.page && !obj.hidden)
      .reverse()

    for (const obj of pageObjects) {
      if (obj.type === 'path') {
        if (this.pointInPath(point, obj)) return obj
      } else {
        const rect = {
          x: obj.x,
          y: obj.y,
          width: obj.width || 0,
          height: obj.height || 0
        }
        if (pointInRect(point, rect)) return obj
      }
    }

    return null
  }

  pointInPath(point, pathObj) {
    if (!pathObj || !Array.isArray(pathObj.points) || pathObj.points.length === 0) return false

    const pts = pathObj.points
    let minX = pts[0].x, maxX = pts[0].x, minY = pts[0].y, maxY = pts[0].y
    for (let i = 1; i < pts.length; i++) {
      const p = pts[i]
      if (p.x < minX) minX = p.x
      if (p.x > maxX) maxX = p.x
      if (p.y < minY) minY = p.y
      if (p.y > maxY) maxY = p.y
    }

    const stroke = (pathObj.size || pathObj.strokeWidth || 2)
    const padding = Math.max(4 / 72, stroke * 0.6 / this.state.view.zoom)
    if (point.x < minX - padding || point.x > maxX + padding || point.y < minY - padding || point.y > maxY + padding) {
      return false
    }

    function distToSegment(ax, ay, bx, by, px, py) {
      const vx = bx - ax
      const vy = by - ay
      const wx = px - ax
      const wy = py - ay
      const vLen2 = vx * vx + vy * vy
      if (vLen2 === 0) {
        const dx = px - ax
        const dy = py - ay
        return Math.sqrt(dx * dx + dy * dy)
      }
      let t = (wx * vx + wy * vy) / vLen2
      if (t < 0) t = 0
      else if (t > 1) t = 1
      const projX = ax + t * vx
      const projY = ay + t * vy
      const dx = px - projX
      const dy = py - projY
      return Math.sqrt(dx * dx + dy * dy)
    }

    let minDist = Infinity
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i]
      const b = pts[i + 1]
      const d = distToSegment(a.x, a.y, b.x, b.y, point.x, point.y)
      if (d < minDist) minDist = d
      if (minDist <= padding) return true
    }

    if (pts.length === 1) {
      const dx = point.x - pts[0].x
      const dy = point.y - pts[0].y
      minDist = Math.sqrt(dx * dx + dy * dy)
    }

    return minDist <= padding
  }

  getHandleAtPoint(point) {
    if (this.state.selection.length !== 1) return null

    const obj = this.state.selection[0]
    if (obj.type === 'path') return null

    const bounds = this.renderer.getObjectBounds(obj)
    if (!bounds) return null

    const handles = this.renderer.getTransformHandles(bounds)
    const handleRadiusPdf = (this.handleRenderSizePx / 2) / this.state.view.zoom

    for (const [name, pos] of Object.entries(handles)) {
      const dist = Math.sqrt(
        Math.pow(point.x - pos.x, 2) + Math.pow(point.y - pos.y, 2)
      )

      if (dist <= handleRadiusPdf) {
        return name
      }
    }

    return null
  }

  updateCursorForHandle(handle) {
    const cursorMap = {
      [TRANSFORM_HANDLES.TOP_LEFT]: CURSORS.RESIZE_NW,
      [TRANSFORM_HANDLES.TOP_CENTER]: CURSORS.RESIZE_N,
      [TRANSFORM_HANDLES.TOP_RIGHT]: CURSORS.RESIZE_NE,
      [TRANSFORM_HANDLES.MIDDLE_LEFT]: CURSORS.RESIZE_W,
      [TRANSFORM_HANDLES.MIDDLE_RIGHT]: CURSORS.RESIZE_E,
      [TRANSFORM_HANDLES.BOTTOM_LEFT]: CURSORS.RESIZE_SW,
      [TRANSFORM_HANDLES.BOTTOM_CENTER]: CURSORS.RESIZE_S,
      [TRANSFORM_HANDLES.BOTTOM_RIGHT]: CURSORS.RESIZE_SE
    }

    this.cursor = cursorMap[handle] || CURSORS.DEFAULT
    this.updateCursor()
  }

  // ---------- In-place text editing (unchanged) ----------
  editText(textObj) {
    const input = document.createElement('input')
    input.type = 'text'
    input.value = textObj.text
    input.className = 'absolute z-50 border-2 border-blue-500 rounded px-2 py-1'

    const bounds = this.renderer.getObjectBounds(textObj)
    const pos = this.renderer.pdfToCanvas({ x: textObj.x, y: textObj.y })

    input.style.left = pos.x + 'px'
    input.style.top = pos.y + 'px'
    input.style.fontSize = (textObj.size * this.state.view.zoom) + 'px'
    input.style.fontFamily = textObj.font || 'Helvetica'

    this.els.canvasWrapper.appendChild(input)
    input.focus()
    input.select()

    const finish = () => {
      textObj.text = input.value || 'Text'
      textObj.modified = Date.now()
      input.remove()
      this.renderer.render()
      this.emit(EVENTS.OBJECT_UPDATED, { objects: [textObj] })
    }

    input.addEventListener('blur', finish)
    input.addEventListener('keydown', e => {
      if (e.key === 'Enter') finish()
      if (e.key === 'Escape') {
        input.remove()
        this.renderer.render()
      }
    })
  }

  // ---------- Overlay drawing: handles, border, crosshair ----------
  // call this after renderer.render() to draw interactive overlays on top canvas
  drawSelectionOverlay(cursorPointPdf) {
    const ctx = this.els.objectsCanvas.getContext('2d')
    ctx.save()
    const ratio = (this.state.canvas && this.state.canvas.ratio) || window.devicePixelRatio || 1
    ctx.setTransform(ratio, 0, 0, ratio, 0, 0)

    // Draw selection visuals only if selection exists on current page
    const selection = (this.state.selection || []).filter(s => s.page === this.state.view.page)

    if (selection.length === 1) {
      const obj = selection[0]
      if (obj.type !== 'path') {
        const bounds = this.renderer.getObjectBounds(obj)
        if (bounds) {
          this._drawSelectionBoundsAndHandles(ctx, bounds)
        }
      } else {
        const bounds = this.renderer.getObjectBounds(obj)
        if (bounds) {
          this._drawSelectionBoundsAndHandles(ctx, bounds)
        }
      }
    } else if (selection.length > 1) {
      const boxes = selection.map(o => this.renderer.getObjectBounds(o)).filter(Boolean)
      if (boxes.length) {
        const union = boxes.reduce((acc, b) => {
          if (!acc) return { ...b }
          const x = Math.min(acc.x, b.x)
          const y = Math.min(acc.y, b.y)
          const x2 = Math.max(acc.x + acc.width, b.x + b.width)
          const y2 = Math.max(acc.y + acc.height, b.y + b.height)
          return { x, y, width: x2 - x, height: y2 - y }
        }, null)
        if (union) this._drawSelectionBoundsAndHandles(ctx, union)
      }
    }

    if (this.dragging) {
      const pointerPdf = cursorPointPdf || this.dragStart
      if (pointerPdf) this._drawCrosshair(ctx, pointerPdf)
    }

    // DEBUG DOT (optional) — draw small red dot at last pointer event to verify mapping.
    // Remove/comment this block when fixed.
    if (this._lastPointerEvent) {
      try {
        const pdfPt = this.getPdfPoint(this._lastPointerEvent)
        if (pdfPt) {
          const cp = this.renderer.pdfToCanvas(pdfPt) // returns CSS pixels
          ctx.beginPath()
          ctx.fillStyle = 'rgba(255,0,0,0.9)'
          ctx.arc(cp.x, cp.y, 4, 0, Math.PI * 2)
          ctx.fill()
        }
      } catch (err) {
        // ignore debug errors
      }
    }

    ctx.restore()
  }

  _drawSelectionBoundsAndHandles(ctx, bounds) {
    const topLeftCanvas = this.renderer.pdfToCanvas({ x: bounds.x, y: bounds.y })
    const bottomRightCanvas = this.renderer.pdfToCanvas({ x: bounds.x + bounds.width, y: bounds.y + bounds.height })
    const w = bottomRightCanvas.x - topLeftCanvas.x
    const h = bottomRightCanvas.y - topLeftCanvas.y

    ctx.save()
    ctx.strokeStyle = '#3B82F6'
    ctx.lineWidth = Math.max(1, 1 * this.state.view.zoom)
    ctx.setLineDash([4, 4])
    ctx.strokeRect(topLeftCanvas.x, topLeftCanvas.y, w, h)
    ctx.restore()

    const handlePositions = this.renderer.getTransformHandles(bounds)
    const handleSize = this.handleRenderSizePx
    for (const pos of Object.values(handlePositions)) {
      const c = this.renderer.pdfToCanvas(pos)
      ctx.save()
      ctx.fillStyle = '#fff'
      ctx.strokeStyle = '#2563EB'
      ctx.lineWidth = 1
      ctx.fillRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize)
      ctx.strokeRect(c.x - handleSize / 2, c.y - handleSize / 2, handleSize, handleSize)
      ctx.restore()
    }

    const centerPdf = { x: bounds.x + bounds.width / 2, y: bounds.y + bounds.height / 2 }
    const centerCanvas = this.renderer.pdfToCanvas(centerPdf)
    ctx.save()
    ctx.beginPath()
    ctx.moveTo(centerCanvas.x - 6, centerCanvas.y)
    ctx.lineTo(centerCanvas.x + 6, centerCanvas.y)
    ctx.moveTo(centerCanvas.x, centerCanvas.y - 6)
    ctx.lineTo(centerCanvas.x, centerCanvas.y + 6)
    ctx.strokeStyle = '#2563EB'
    ctx.lineWidth = 1.5
    ctx.stroke()
    ctx.restore()
  }

  _drawCrosshair(ctx, pointerPdf) {
    const p = this.renderer.pdfToCanvas(pointerPdf)
    const ratio = (this.state.canvas && this.state.canvas.ratio) || window.devicePixelRatio || 1
    const canvasCssWidth = this.els.objectsCanvas.width / ratio
    const canvasCssHeight = this.els.objectsCanvas.height / ratio

    ctx.save()
    ctx.strokeStyle = 'rgba(37,99,235,0.9)'
    ctx.lineWidth = 1 / ratio
    ctx.setLineDash([2, 3])
    ctx.beginPath()
    ctx.moveTo(0, p.y)
    ctx.lineTo(canvasCssWidth, p.y)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(p.x, 0)
    ctx.lineTo(p.x, canvasCssHeight)
    ctx.stroke()
    ctx.restore()
  }
}
