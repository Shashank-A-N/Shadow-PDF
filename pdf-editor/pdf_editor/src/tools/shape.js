import { BaseTool } from './base-tool.js'
import { CURSORS, EVENTS } from '../constants.js'

/**
 * Tool for drawing simple shapes like rectangles, ovals, and lines.
 *
 * Supports:
 * - Snapping to grid (from BaseTool)
 * - Shift-key to constrain aspect ratio (squares/circles) or angle (horizontal/vertical lines)
 * - Alt-key (new!) to draw from the center
 * - "Click" prevention (removes tiny shapes)
 */
export class ShapeTool extends BaseTool {
  constructor(state, renderer, elements, eventBus, shapeType) {
    super(state, renderer, elements, eventBus)
    this.shapeType = shapeType
    this.cursor = CURSORS.CROSSHAIR
    this.drawing = false
    this.currentShape = null
    this.startPoint = null
  }

  /**
   * Cleans up the tool's state, resetting drawing flags.
   */
  cleanup() {
    this.drawing = false
    this.currentShape = null
    this.startPoint = null
  }

  /**
   * Called on pointer down.
   * Creates the initial shape object and adds it to the state.
   * @param {PointerEvent} e
   */
  onPointerDown(e) {
    const point = this.snapToGrid(this.getPoint(e))
    this.drawing = true
    this.startPoint = point

    const settings = this.state.toolSettings.shape

    this.currentShape = this.createObject(this.shapeType, {
      x: point.x,
      y: point.y,
      width: 1,
      height: 1,
      stroke: settings.stroke,
      strokeWidth: settings.strokeWidth,
      fill: settings.fill,
      opacity: settings.opacity,
      lineCap: 'round',
      lineJoin: 'round',
    })

    // Add to state immediately for real-time collaboration.
    // We will remove it in onPointerUp if it's too small (a "click").
    this.state.objects.push(this.currentShape)
    this.emit(EVENTS.OBJECT_ADDED, { object: this.currentShape })
  }

  /**
   * Called on pointer move.
   * Updates the shape's dimensions based on pointer position and modifiers (Shift/Alt).
   * @param {PointerEvent} e
   */
  onPointerMove(e) {
    if (!this.drawing || !this.currentShape || !this.startPoint) return

    const point = this.snapToGrid(this.getPoint(e))

    let x = this.startPoint.x
    let y = this.startPoint.y
    let width = point.x - x
    let height = point.y - y

    // --- Handle Shift Key (Constrain Aspect Ratio / Angle) ---
    if (e.shiftKey) {
      if (this.shapeType === 'oval' || this.shapeType === 'rect') {
        // Constrain to square/circle
        const size = Math.max(Math.abs(width), Math.abs(height))
        // Use Math.sign to preserve the drawing direction (quadrant)
        width = Math.sign(width) * size
        height = Math.sign(height) * size
      } else if (this.shapeType === 'line') {
        // Constrain to horizontal or vertical
        if (Math.abs(width) > Math.abs(height)) {
          height = 0
        } else {
          width = 0
        }
      }
    }

    // --- ADVANCEMENT: Handle Alt Key (Draw from Center) ---
    // This logic works in conjunction with the onPointerUp normalization.
    if (e.altKey && this.shapeType !== 'line') {
      x = this.startPoint.x - width
      y = this.startPoint.y - height
      width *= 2
      height *= 2
    }

    // Update the shape's properties
    this.currentShape.x = x
    this.currentShape.y = y
    this.currentShape.width = width
    this.currentShape.height = height

    // Emit update for real-time collaboration
    this.emit(EVENTS.OBJECT_UPDATED, { object: this.currentShape })
    this.renderer.render()
  }

  /**
   * Called on pointer up.
   * Finalizes the shape, removing it if it's too small,
   * or normalizing it (adjusting for negative width/height) if it's valid.
   * @param {PointerEvent} e
   */
  onPointerUp(e) {
    if (!this.drawing) return

    this.drawing = false

    if (this.currentShape) {
      // Check if the shape is just a "click" (i.e., too small)
      const isClick = Math.abs(this.currentShape.width) < 5 && Math.abs(this.currentShape.height) < 5

      if (isClick) {
        // CORRECTION: Remove the object and emit a removal event
        const index = this.state.objects.indexOf(this.currentShape)
        if (index >= 0) {
          this.state.objects.splice(index, 1)
        }
        // Since we fired OBJECT_ADDED, we MUST fire OBJECT_REMOVED for consistency
        this.emit(EVENTS.OBJECT_REMOVED, { object: this.currentShape })
      
      } else {
        // It's a valid shape, perform normalization

        // CORRECTION: Do NOT normalize 'line' shapes.
        // Their x/y is the start point, and width/height is the vector to the end point,
        // which can validly be negative.
        if (this.shapeType !== 'line') {
          // Normalize rects/ovals to have a top-left origin
          // and positive width/height.
          if (this.currentShape.width < 0) {
            this.currentShape.x += this.currentShape.width
            this.currentShape.width = Math.abs(this.currentShape.width)
          }
          if (this.currentShape.height < 0) {
            this.currentShape.y += this.currentShape.height
            this.currentShape.height = Math.abs(this.currentShape.height)
          }
        }

        // Finalize selection and state
        this.state.selection = [this.currentShape]
        this.emit(EVENTS.OBJECT_UPDATED, { object: this.currentShape })
        this.emit(EVENTS.SELECTION_CHANGED, { selection: [this.currentShape] })
      }
    }

    this.currentShape = null
    this.renderer.render()
  }
}