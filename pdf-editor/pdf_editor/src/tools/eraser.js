import { BaseTool } from './base-tool.js'
import { CURSORS, EVENTS } from '../constants.js'

export class EraserTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)
    this.cursor = CURSORS.CROSSHAIR
    this.erasing = false
    this.eraserSize = 20
    this.mode = 'stroke' // 'stroke' | 'object'
    this._erasedSomething = false
    this._overlay = null
    this._overlayCtx = null
    this._lastPreview = null
    this._onResize = null
  }

  activate() {
    super.activate()
    this.ensureOverlay()
  }

  deactivate() {
    super.deactivate()
    this.removeOverlay()
  }

  // Public API to control tool
  setEraserSize(px) {
    const v = Math.max(2, Math.min(200, Number(px) || 20))
    this.eraserSize = v
    this.drawPreview(this._lastPreview)
    this.emit('tool:eraser:size-changed', { size: v })
  }
  setMode(mode) {
    if (mode === 'stroke' || mode === 'object') {
      this.mode = mode
      this.emit('tool:eraser:mode-changed', { mode })
    }
  }

  onPointerDown(e) {
    this.erasing = true
    this._erasedSomething = false
    this.erase(e)
  }

  onPointerMove(e) {
    const p = this.getPoint(e)
    this.drawPreview(p)
    if (!this.erasing) return
    this.erase(e)
  }

  onPointerUp() {
    this.erasing = false
    this.clearPreview()
    if (this._erasedSomething) {
      this.emit('history:checkpoint', 'Erase')
      this._erasedSomething = false
    }
  }

  // Core
  erase(e) {
    const point = this.getPoint(e)
    const r = this.eraserSize / 2
    const page = this.state.view.page

    const objects = this.state.objects
    const survivors = []
    const deletions = []

    for (let i = 0; i < objects.length; i++) {
      const obj = objects[i]
      if (obj.page !== page) {
        survivors.push(obj)
        continue
      }

      if (this.mode === 'stroke' && (obj.type === 'path' || obj.type === 'draw')) {
        const result = this.eraseStroke(obj, point, r)
        if (result.modified) {
          this._erasedSomething = true
          if (result.fragments.length > 0) {
            survivors.push(...result.fragments)
          } // if no fragments remain, it's fully erased
        } else {
          survivors.push(obj)
        }
      } else {
        // object mode or non-stroke in stroke mode: decide deletion
        const hit = this.hitObject(obj, point, r)
        if (hit) {
          deletions.push(obj)
          this._erasedSomething = true
        } else {
          survivors.push(obj)
        }
      }
    }

    if (deletions.length) {
      deletions.forEach(o => this.emit(EVENTS.OBJECT_DELETED, { object: o }))
    }

    if (this._erasedSomething) {
      this.state.objects = survivors
      this.renderer.render?.()
      this.renderer.renderAll?.()
    }
  }

  // Stroke erasing and splitting
  eraseStroke(obj, point, radius) {
    if (!Array.isArray(obj.points) || obj.points.length < 2) return { modified: false, fragments: [] }

    const keepMask = new Array(obj.points.length)
    let anyErased = false

    for (let i = 0; i < obj.points.length; i++) {
      const p = obj.points[i]
      const d = Math.hypot(p.x - point.x, p.y - point.y)
      const keep = d > radius
      keepMask[i] = keep
      if (!keep) anyErased = true
    }

    if (!anyErased) return { modified: false, fragments: [] }

    // Build subpaths from contiguous keep segments
    const fragments = []
    let current = []

    const pushFragment = () => {
      if (current.length >= 2) {
        const frag = { ...obj, points: current.map(pt => ({ x: pt.x, y: pt.y })) }
        fragments.push(frag)
      }
      current = []
    }

    for (let i = 0; i < obj.points.length; i++) {
      const keep = keepMask[i]
      const pt = obj.points[i]
      if (keep) current.push(pt)
      else pushFragment()
    }
    pushFragment()

    return { modified: true, fragments }
  }

  // Hit-testing for object erasing
  hitObject(obj, point, radius) {
    switch (obj.type) {
      case 'rect': {
        return this.intersectsRectCircle({ x: obj.x, y: obj.y, w: obj.width, h: obj.height }, point.x, point.y, radius)
      }
      case 'oval': {
        // approximate ellipse with its bounding rect
        return this.intersectsRectCircle({ x: obj.x, y: obj.y, w: obj.width, h: obj.height }, point.x, point.y, radius)
      }
      case 'line': {
        return this.segmentDistance(point.x, point.y, obj.x1, obj.y1, obj.x2, obj.y2) <= radius
      }
      case 'image':
      case 'signature':
      case 'highlight':
      case 'text': {
        return this.intersectsRectCircle({ x: obj.x, y: obj.y, w: obj.width || 1, h: obj.height || 1 }, point.x, point.y, radius)
      }
      case 'path':
      case 'draw': {
        // object mode: if any point within radius => delete entire stroke
        return obj.points?.some(p => Math.hypot(p.x - point.x, p.y - point.y) <= radius)
      }
      default:
        return false
    }
  }

  // Geometry helpers
  segmentDistance(px, py, x1, y1, x2, y2) {
    const dx = x2 - x1
    const dy = y2 - y1
    if (dx === 0 && dy === 0) return Math.hypot(px - x1, py - y1)
    const t = ((px - x1) * dx + (py - y1) * dy) / (dx * dx + dy * dy)
    const tt = Math.max(0, Math.min(1, t))
    const cx = x1 + tt * dx
    const cy = y1 + tt * dy
    return Math.hypot(px - cx, py - cy)
  }

  intersectsRectCircle(rect, cx, cy, r) {
    const rx = rect.x
    const ry = rect.y
    const rw = rect.w
    const rh = rect.h
    const nearestX = Math.max(rx, Math.min(cx, rx + rw))
    const nearestY = Math.max(ry, Math.min(cy, ry + rh))
    const dist = Math.hypot(cx - nearestX, cy - nearestY)
    return dist <= r
  }

  // Preview overlay
  ensureOverlay() {
    if (this._overlay) return
    const host = this.els.canvasWrapper || this.els.objectsCanvas?.parentElement
    if (!host) return
    const base = this.els.objectsCanvas || this.els.pdfCanvas
    const c = document.createElement('canvas')
    c.style.position = 'absolute'
    c.style.left = '0'
    c.style.top = '0'
    c.style.pointerEvents = 'none'
    c.width = base.width
    c.height = base.height
    c.style.width = base.style.width
    c.style.height = base.style.height
    host.appendChild(c)
    this._overlay = c
    this._overlayCtx = c.getContext('2d')

    this._onResize = () => {
      const b = this.els.objectsCanvas || this.els.pdfCanvas
      if (!b) return
      c.width = b.width
      c.height = b.height
      c.style.width = b.style.width
      c.style.height = b.style.height
    }
    window.addEventListener('resize', this._onResize)
  }

  removeOverlay() {
    if (this._overlay?.parentNode) this._overlay.parentNode.removeChild(this._overlay)
    this._overlay = null
    this._overlayCtx = null
    if (this._onResize) window.removeEventListener('resize', this._onResize)
    this._onResize = null
    this._lastPreview = null
  }

  clearPreview() {
    if (!this._overlayCtx || !this._overlay) return
    this._overlayCtx.clearRect(0, 0, this._overlay.width, this._overlay.height)
  }

  drawPreview(pdfPoint) {
    if (!this._overlayCtx || !pdfPoint) return
    this._lastPreview = pdfPoint

    const canvasPt = this.renderer.pdfToCanvas(pdfPoint)
    const ctx = this._overlayCtx
    this.clearPreview()
    ctx.save()
    ctx.beginPath()
    ctx.lineWidth = 1.5
    ctx.strokeStyle = 'rgba(59,130,246,0.95)' // blue-500
    ctx.setLineDash([6, 4])
    const scale = this.renderer?.state?.view?.zoom || 1
    const radiusCanvas = (this.eraserSize / 2) * (this._overlay.width / (this.els.pdfCanvas?.width || this._overlay.width)) * scale
    ctx.arc(canvasPt.x, canvasPt.y, Math.max(6, radiusCanvas), 0, Math.PI * 2)
    ctx.stroke()
    ctx.setLineDash([])
    ctx.restore()
  }
}