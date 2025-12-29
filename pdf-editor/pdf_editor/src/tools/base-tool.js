export class BaseTool {
  constructor(state, renderer, elements, eventBus) {
    this.state = state
    this.renderer = renderer
    this.els = elements
    this.eventBus = eventBus
    this.active = false
    this.cursor = 'default'
  }

  activate() {
    this.active = true
    this.updateCursor()
  }

  deactivate() {
    this.active = false
    this.cleanup()
  }

  cleanup() {}

  onPointerDown(e) {}
  onPointerMove(e) {}
  onPointerUp(e) {}
  onKeyDown(e) {}
  onKeyUp(e) {}
  onDoubleClick(e) {}

  updateCursor() {
    if (this.els.objectsCanvas) {
      this.els.objectsCanvas.style.cursor = this.cursor
    }
  }

  deleteSelection() {
    if (this.state.selection.length === 0) return

    this.state.selection.forEach(obj => {
      const index = this.state.objects.indexOf(obj)
      if (index >= 0) {
        this.state.objects.splice(index, 1)
      }
    })

    this.state.selection = []
  }

  copy() {
    if (this.state.selection.length === 0) return

    this.state.clipboard = this.state.selection.map(obj => {
      const clone = JSON.parse(JSON.stringify(obj))
      if (obj.image) {
        clone.image = obj.image
      }
      return clone
    })
  }

  cut() {
    this.copy()
    this.deleteSelection()
  }

  paste() {
    if (this.state.clipboard.length === 0) return

    const newObjects = this.state.clipboard.map(obj => {
      const clone = JSON.parse(JSON.stringify(obj))
      clone.x = (clone.x || 0) + 20
      clone.y = (clone.y || 0) + 20
      clone.page = this.state.view.page

      if (obj.image) {
        clone.image = obj.image
      }

      return clone
    })

    this.state.objects.push(...newObjects)
    this.state.selection = newObjects
  }

  getPoint(e) {
    return this.renderer.clientToPdf(e)
  }

  snapToGrid(point) {
    if (!this.state.view.snap) return point

    const gridSize = this.state.settings.gridSize
    return {
      x: Math.round(point.x / gridSize) * gridSize,
      y: Math.round(point.y / gridSize) * gridSize
    }
  }

  createObject(type, props = {}) {
    return {
      id: this.generateId(),
      type,
      page: this.state.view.page,
      layerId: this.state.layers[this.state.currentLayer]?.id,
      created: Date.now(),
      modified: Date.now(),
      ...props
    }
  }

  generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }

  emit(event, data) {
    if (this.eventBus) {
      this.eventBus.emit(event, data)
    }
  }
}