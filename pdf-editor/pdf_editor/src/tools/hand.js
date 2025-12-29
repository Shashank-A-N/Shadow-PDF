import { BaseTool } from './base-tool.js'
import { CURSORS } from '../constants.js'

export class HandTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)
    this.cursor = CURSORS.GRAB
    this.panning = false
    this.startPoint = null
    this.startScroll = null
  }

  onPointerDown(e) {
    this.panning = true
    this.startPoint = { x: e.clientX, y: e.clientY }
    
    const container = this.els.canvasWrapper.parentElement
    this.startScroll = {
      x: container.scrollLeft,
      y: container.scrollTop
    }

    this.cursor = CURSORS.GRABBING
    this.updateCursor()
  }

  onPointerMove(e) {
    if (!this.panning) return

    const container = this.els.canvasWrapper.parentElement
    const dx = e.clientX - this.startPoint.x
    const dy = e.clientY - this.startPoint.y

    container.scrollLeft = this.startScroll.x - dx
    container.scrollTop = this.startScroll.y - dy
  }

  onPointerUp(e) {
    this.panning = false
    this.cursor = CURSORS.GRAB
    this.updateCursor()
  }
}