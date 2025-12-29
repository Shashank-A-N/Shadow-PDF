import { BaseTool } from './base-tool.js'
import { CURSORS, EVENTS } from '../constants.js'

export class HighlightTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)
    this.cursor = CURSORS.CROSSHAIR
    this.drawing = false
    this.currentHighlight = null
    this.startPoint = null
  }

  cleanup() {
    this.drawing = false
    this.currentHighlight = null
  }

  onPointerDown(e) {
    const point = this.getPoint(e)
    this.drawing = true
    this.startPoint = point

    const settings = this.state.toolSettings.highlight

    this.currentHighlight = this.createObject('highlight', {
      x: point.x,
      y: point.y,
      width: 1,
      height: 1,
      color: settings.color,
      opacity: settings.opacity
    })

    this.state.objects.push(this.currentHighlight)
    this.emit(EVENTS.OBJECT_ADDED, { object: this.currentHighlight })
  }

  onPointerMove(e) {
    if (!this.drawing || !this.currentHighlight) return

    const point = this.getPoint(e)
    
    this.currentHighlight.width = point.x - this.startPoint.x
    this.currentHighlight.height = point.y - this.startPoint.y

    this.renderer.render()
  }

  onPointerUp(e) {
    if (!this.drawing) return

    this.drawing = false

    if (this.currentHighlight) {
      if (Math.abs(this.currentHighlight.width) < 5 && Math.abs(this.currentHighlight.height) < 5) {
        const index = this.state.objects.indexOf(this.currentHighlight)
        if (index >= 0) {
          this.state.objects.splice(index, 1)
        }
      } else {
        if (this.currentHighlight.width < 0) {
          this.currentHighlight.x += this.currentHighlight.width
          this.currentHighlight.width = Math.abs(this.currentHighlight.width)
        }
        if (this.currentHighlight.height < 0) {
          this.currentHighlight.y += this.currentHighlight.height
          this.currentHighlight.height = Math.abs(this.currentHighlight.height)
        }

        this.emit(EVENTS.OBJECT_UPDATED, { object: this.currentHighlight })
      }
    }

    this.currentHighlight = null
    this.renderer.render()
  }
}