import { BaseTool } from './base-tool.js'
import { CURSORS, EVENTS } from '../constants.js'

/**
 * DrawTool (full file)
 *
 * Features:
 * - Live smoothing (weighted moving average) with configurable smoothing level
 * - Velocity & pressure-based thickness
 * - Brush styles: 'solid', 'calligraphy', 'neon', 'spray' (renderer must implement visuals)
 * - RequestAnimationFrame batching for renders (performance)
 * - Intermediate history checkpoints for undo granularity
 * - Douglas–Peucker simplification on pointer up
 * - Listens to TOOL_SETTINGS_CHANGED events so properties panel updates affect in-flight drawing
 *
 * Notes:
 * - This tool writes per-stroke settings onto the created path object (color, size, smoothing, style, opacity).
 * - Renderer must read `path.points` where each point can be {x, y, t, pressure, size} and draw accordingly.
 * - If your history object is optional, the code checks for its presence before calling checkpoints.
 */
export class DrawTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)

    this.cursor = CURSORS.CROSSHAIR

    // runtime variables
    this.drawing = false
    this.currentPath = null
    this.lastPoint = null
    this.pointBuffer = []     // raw points for smoothing during draw
    this.smoothedPoints = []  // smoothed points (added to path.points)
    this._needsRender = false
    this._rafHandle = null
    this._lastCheckpointTime = 0
    this._checkpointInterval = 400 // ms
    this._minDistance = 2 // px

    // Listen for global tool settings changes (emitted by properties manager)
    this.eventBus?.on && this.eventBus.on('TOOL_SETTINGS_CHANGED', ({ tool, key, value }) => {
      if (tool !== 'draw') return
      // update current in-flight path (so changes reflect immediately while drawing)
      if (this.currentPath) {
        this.currentPath[key] = value
      }
      // persist into state.toolSettings.draw so future strokes pick up new defaults
      if (!this.state.toolSettings) this.state.toolSettings = {}
      if (!this.state.toolSettings.draw) this.state.toolSettings.draw = {}
      this.state.toolSettings.draw[key] = value
    })
  }

  cleanup() {
    this.drawing = false
    this.currentPath = null
    this.lastPoint = null
    this.pointBuffer = []
    this.smoothedPoints = []
    this._needsRender = false
    if (this._rafHandle) cancelAnimationFrame(this._rafHandle)
    this._rafHandle = null
  }

  onPointerDown(e) {
    const point = this.getPoint(e)
    this.drawing = true
    this.lastPoint = point

    const settings = (this.state.toolSettings && this.state.toolSettings.draw) ? this.state.toolSettings.draw : {}

    // create new path object and copy defaults
    this.currentPath = this.createObject('path', {
      points: [{ x: point.x, y: point.y, t: Date.now(), pressure: (typeof e.pressure === 'number' ? e.pressure : 0.5), size: settings.size || 2 }],
      rawPoints: [{ x: point.x, y: point.y, t: Date.now(), pressure: (typeof e.pressure === 'number' ? e.pressure : 0.5) }],
      color: settings.color || '#000000',
      size: settings.size || 2,
      opacity: (settings.opacity !== undefined) ? settings.opacity : 1,
      smoothing: (settings.smoothing !== undefined) ? settings.smoothing : 0.3,
      style: settings.style || 'solid',
      createdAt: Date.now()
    })

    this.state.objects.push(this.currentPath)
    this.pointBuffer = [ this.currentPath.rawPoints[0] ]
    this.smoothedPoints = [ this.currentPath.points[0] ]

    // notify app
    this.emit && this.emit(EVENTS.OBJECT_ADDED, { object: this.currentPath })

    // start a render loop (batched)
    this.scheduleRender()

    // initial history checkpoint (if history provided)
    this._lastCheckpointTime = Date.now()
    this.history?.checkpoint && this.history.checkpoint('Start drawing')
  }

  onPointerMove(e) {
    if (!this.drawing || !this.currentPath) return

    const p = this.getPoint(e)
    const last = this.lastPoint || p
    const distance = this.getDistance(last, p)
    if (distance < this._minDistance) return

    const t = Date.now()
    const pressure = (typeof e.pressure === 'number') ? e.pressure : 0.5

    const rawPoint = { x: p.x, y: p.y, t, pressure }
    // push into rawPoints for later use (simplification)
    this.currentPath.rawPoints.push(rawPoint)
    this.pointBuffer.push(rawPoint)

    // maintain buffer length reasonable
    if (this.pointBuffer.length > 8) this.pointBuffer.shift()

    // determine smoothing level (prefer per-path, fallback to tool defaults)
    const smoothing = (this.currentPath.smoothing !== undefined)
      ? this.currentPath.smoothing
      : (this.state.toolSettings?.draw?.smoothing ?? 0.3)

    // compute smoothed point
    const smoothed = this.applySmoothing(this.pointBuffer, smoothing)
    // compute velocity using recent rawPoints
    const velocity = this.getVelocity()
    // compute base size preference (per-path or tool default)
    const baseSize = (this.currentPath.size !== undefined) ? this.currentPath.size : (this.state.toolSettings?.draw?.size || 2)
    const size = this.computeSizeFromVelocity(baseSize, velocity, pressure)

    const pointWithMeta = { x: smoothed.x, y: smoothed.y, t: smoothed.t, pressure: smoothed.pressure, size }

    this.currentPath.points.push(pointWithMeta)
    this.smoothedPoints.push(pointWithMeta)

    this.lastPoint = p

    // intermediate history checkpoints for better undo granularity
    if (t - this._lastCheckpointTime > this._checkpointInterval) {
      this.history?.checkpoint && this.history.checkpoint('Drawing checkpoint')
      this._lastCheckpointTime = t
    }

    // schedule a batched render
    this._needsRender = true
    this.scheduleRender()
  }

  onPointerUp(e) {
    if (!this.drawing) return
    this.drawing = false

    if (!this.currentPath) return

    // if stroke too short, remove it
    if ((this.currentPath.points?.length || 0) < 2) {
      const idx = this.state.objects.indexOf(this.currentPath)
      if (idx >= 0) this.state.objects.splice(idx, 1)
      this.emit && this.emit(EVENTS.OBJECT_DELETED, { object: this.currentPath })
    } else {
      // simplify rawPoints using Douglas-Peucker to reduce size/noise
      const simplified = this.simplifyPath(this.currentPath.rawPoints, 1.5) // epsilon can be tuned
      // map simplified raw points to final point objects with estimated size
      const finalPoints = simplified.map((rp, i, arr) => {
        const vel = this.estimateVelocityAtPoint(rp, arr)
        const size = this.computeSizeFromVelocity(this.currentPath.size || 2, vel, rp.pressure || 0.5)
        return { x: rp.x, y: rp.y, t: rp.t, pressure: rp.pressure || 0.5, size }
      })

      this.currentPath.points = finalPoints
      this.currentPath.rawPoints = simplified

      this.emit && this.emit(EVENTS.OBJECT_UPDATED, { object: this.currentPath })
      this.history?.checkpoint && this.history.checkpoint('Finish drawing')
    }

    // clear buffers & render final
    this.pointBuffer = []
    this.smoothedPoints = []
    this._needsRender = true
    this.scheduleRender()

    this.currentPath = null
    this.lastPoint = null
  }

  // -- Rendering loop (batched) --
  scheduleRender() {
    if (this._rafHandle) return
    this._rafHandle = requestAnimationFrame(() => {
      this._rafHandle = null
      if (this._needsRender) {
        this.renderer.render()
        this._needsRender = false
      }
    })
  }

  // -- Motion / velocity helpers --
  getVelocity() {
    const pts = (this.currentPath && this.currentPath.rawPoints) ? this.currentPath.rawPoints : this.pointBuffer
    if (!pts || pts.length < 2) return 0
    const a = pts[pts.length - 2]
    const b = pts[pts.length - 1]
    const dt = Math.max((b.t || Date.now()) - (a.t || Date.now() - 16), 1)
    const d = this.getDistance(a, b)
    return d / dt // pixels per ms
  }

  estimateVelocityAtPoint(point, list) {
    const idx = list.indexOf(point)
    if (idx <= 0 || idx >= list.length - 1) return 0
    const a = list[idx - 1], b = list[idx + 1]
    const dt = Math.max((b.t || Date.now()) - (a.t || Date.now()), 1)
    const d = Math.sqrt(Math.pow(b.x - a.x, 2) + Math.pow(b.y - a.y, 2))
    return d / dt
  }

  computeSizeFromVelocity(baseSize, velocity, pressure = 0.5) {
    // Faster -> thinner; Slower -> thicker
    // Normalize velocity and use a curve
    const v = Math.min(velocity * 4, 4)
    const velocityFactor = 1 - Math.tanh(v) // yields ~1 when small velocity, ~0 when large
    const pressureFactor = 0.5 + (pressure * 0.5) // 0.5..1.0
    const size = baseSize * (0.6 + velocityFactor * 0.8) * pressureFactor
    return Math.max(0.5, size)
  }

  // Weighted smoothing (moving average influenced by smoothingLevel)
  applySmoothing(buffer, smoothingLevel = 0.3) {
    const n = buffer.length
    if (n === 0) return { x: 0, y: 0, t: Date.now(), pressure: 0.5 }
    if (n === 1) {
      const b = buffer[0]
      return { x: b.x, y: b.y, t: b.t || Date.now(), pressure: b.pressure || 0.5 }
    }

    const window = Math.min(4, n)
    let wsum = 0, xsum = 0, ysum = 0, tsum = 0, psum = 0
    for (let i = 0; i < window; i++) {
      const p = buffer[n - 1 - i]
      // center point heavier; neighbors attenuated by smoothingLevel
      const weight = (i === 0) ? 1 : (1 - smoothingLevel) * Math.pow(0.6, i - 1)
      xsum += p.x * weight
      ysum += p.y * weight
      tsum += (p.t || Date.now()) * weight
      psum += (p.pressure || 0.5) * weight
      wsum += weight
    }
    return { x: xsum / wsum, y: ysum / wsum, t: Math.round(tsum / wsum), pressure: psum / wsum }
  }

  // -- Geometry utilities --
  getDistance(p1, p2) {
    if (!p1 || !p2) return 0
    const dx = (p2.x || 0) - (p1.x || 0)
    const dy = (p2.y || 0) - (p1.y || 0)
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Douglas-Peucker simplification for rawPoints (expects objects with x,y,t,pressure)
  simplifyPath(points, epsilon) {
    if (!points || points.length < 3) return points.slice()
    const pts = points.map(p => ({ x: p.x, y: p.y, t: p.t, pressure: p.pressure }))

    const dP = (arr) => {
      if (arr.length <= 2) return arr
      const first = arr[0], last = arr[arr.length - 1]
      let index = -1, maxDist = 0
      for (let i = 1; i < arr.length - 1; i++) {
        const d = this.perpDistance(arr[i], first, last)
        if (d > maxDist) {
          index = i
          maxDist = d
        }
      }
      if (maxDist > epsilon) {
        const left = dP(arr.slice(0, index + 1))
        const right = dP(arr.slice(index))
        return left.slice(0, left.length - 1).concat(right)
      } else {
        return [first, last]
      }
    }

    // Return simplified list (keeps x,y,t,pressure)
    return dP(pts)
  }

  perpDistance(pt, lineStart, lineEnd) {
    const x0 = pt.x, y0 = pt.y
    const x1 = lineStart.x, y1 = lineStart.y
    const x2 = lineEnd.x, y2 = lineEnd.y
    const num = Math.abs((y2 - y1) * x0 - (x2 - x1) * y0 + x2 * y1 - y2 * x1)
    const den = Math.sqrt((y2 - y1) * (y2 - y1) + (x2 - x1) * (x2 - x1))
    return den === 0 ? 0 : num / den
  }
}
