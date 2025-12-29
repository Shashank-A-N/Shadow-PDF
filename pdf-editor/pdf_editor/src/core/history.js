// src/core/history.js
import { CONFIG, EVENTS } from '../constants.js'

const deepClone = (v, fallback) => {
  if (v == null) return fallback
  return JSON.parse(JSON.stringify(v))
}

export class History {
  constructor(state, eventBus) {
    this.state = state
    this.eventBus = eventBus
    this.stack = []
    this.index = -1
    this.limit = CONFIG.HISTORY_SIZE
    this.isRestoring = false
    this.lastContentHash = null // content-only hash for dedupe
  }
  
  // Build a content-only snapshot for deduping (no timestamp/description)
  buildContentSnapshot() {
    if (this.isRestoring) return null

    const content = {
      objects: deepClone(this.state.objects, []),
      layers: deepClone(this.state.layers, []),
      bookmarks: deepClone(this.state.bookmarks, []),
      backgrounds: Array.from((this.state.document?.backgrounds || new Map()).entries()),
      page: this.state.view?.page || 1
    }

    const contentStr = JSON.stringify(content)
    if (contentStr === this.lastContentHash) {
      return null // nothing changed
    }

    this.lastContentHash = contentStr
    return content
  }
  
  checkpoint(description = '') {
    const content = this.buildContentSnapshot()
    if (!content) return

    const snapshot = {
      ...content,
      description,
      timestamp: Date.now()
    }
    
    this.stack = this.stack.slice(0, this.index + 1)
    this.stack.push(snapshot)
    this.index++
    
    if (this.stack.length > this.limit) {
      this.stack.shift()
      this.index--
    }
    
    // Ensure flags exists
    this.state.flags = this.state.flags || {}
    this.state.flags.dirty = true
    
    this.eventBus?.emit(EVENTS.HISTORY_CHANGED, {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      stackSize: this.stack.length,
      index: this.index
    })
  }
  
  restore(snapshot) {
    this.isRestoring = true
    
    this.state.objects = deepClone(snapshot.objects, [])
    this.state.layers = deepClone(snapshot.layers, [])
    this.state.bookmarks = deepClone(snapshot.bookmarks, [])
    this.state.document.backgrounds = new Map(snapshot.backgrounds || [])
    this.state.view.page = snapshot.page || 1
    this.state.selection = []

    // Update dedupe hash to match restored state
    this.lastContentHash = JSON.stringify({
      objects: snapshot.objects,
      layers: snapshot.layers,
      bookmarks: snapshot.bookmarks,
      backgrounds: snapshot.backgrounds,
      page: snapshot.page
    })
    
    this.isRestoring = false

    // Refresh same path as cut/delete
    this.eventBus?.emit('object:modified')          // triggers render in app.js
    this.eventBus?.emit(EVENTS.RENDER_REQUESTED)    // extra safety
  }
  
  undo() {
    if (!this.canUndo()) return false
    
    this.index--
    const snapshot = this.stack[this.index]
    this.restore(snapshot)
    
    this.eventBus?.emit(EVENTS.HISTORY_CHANGED, {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      action: 'undo',
      description: snapshot.description
    })
    
    return true
  }
  
  redo() {
    if (!this.canRedo()) return false
    
    this.index++
    const snapshot = this.stack[this.index]
    this.restore(snapshot)
    
    this.eventBus?.emit(EVENTS.HISTORY_CHANGED, {
      canUndo: this.canUndo(),
      canRedo: this.canRedo(),
      action: 'redo',
      description: snapshot.description
    })
    
    return true
  }
  
  canUndo() {
    return this.index > 0
  }
  
  canRedo() {
    return this.index < this.stack.length - 1
  }
  
  clear() {
    this.stack = []
    this.index = -1
    this.lastContentHash = null
    
    this.eventBus?.emit(EVENTS.HISTORY_CHANGED, {
      canUndo: false,
      canRedo: false,
      stackSize: 0,
      index: -1
    })
  }
  
  getHistory() {
    return {
      stack: this.stack.map(s => ({
        description: s.description,
        timestamp: s.timestamp
      })),
      index: this.index,
      canUndo: this.canUndo(),
      canRedo: this.canRedo()
    }
  }
}