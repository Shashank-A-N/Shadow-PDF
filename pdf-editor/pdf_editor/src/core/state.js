import { uid } from '../utils/misc.js'
import { CONFIG, TOOLS } from '../constants.js'

export function createState() {
  return {
    meta: {
      version: CONFIG.VERSION,
      created: Date.now(),
      modified: Date.now()
    },
    
    document: {
      name: '',
      bytes: 0,
      pages: 0,
      pageSizes: [],
      backgrounds: new Map(),
      metadata: {
        title: '',
        author: '',
        subject: '',
        keywords: [],
        creator: CONFIG.APP_NAME,
        producer: CONFIG.APP_NAME,
        creationDate: null,
        modDate: null
      },
      permissions: {
        printing: true,
        modifying: true,
        copying: true,
        annotating: true,
        fillingForms: true,
        contentAccessibility: true,
        documentAssembly: true
      },
      encrypted: false
    },
    
    view: {
      page: 1,
      zoom: CONFIG.DEFAULT_ZOOM,
      rotation: 0,
      fit: null,
      grid: false,
      rulers: false,
      snap: false,
      guides: [],
      scrollX: 0,
      scrollY: 0
    },
    
    canvas: {
      width: 0,
      height: 0,
      cssWidth: 0,
      cssHeight: 0,
      ratio: window.devicePixelRatio || 1,
      offsetX: 0,
      offsetY: 0
    },
    
    layers: [
      {
        id: uid(),
        name: 'Layer 1',
        visible: true,
        locked: false,
        opacity: 1,
        blendMode: 'normal',
        order: 0
      }
    ],
    
    currentLayer: 0,
    
    objects: [],
    
    selection: [],
    
    clipboard: [],
    
    bookmarks: [],
    
    annotations: [],
    
    formFields: [],
    
    currentTool: TOOLS.SELECT,
    
    toolSettings: {
      draw: {
        color: CONFIG.DEFAULT_COLOR,
        size: CONFIG.DEFAULT_LINE_WIDTH,
        opacity: 1,
        smoothing: true
      },
      text: {
        font: CONFIG.DEFAULT_FONT,
        size: CONFIG.DEFAULT_FONT_SIZE,
        color: CONFIG.DEFAULT_COLOR,
        bold: false,
        italic: false,
        underline: false,
        strikethrough: false,
        align: 'left',
        lineHeight: 1.2
      },
      shape: {
        stroke: CONFIG.DEFAULT_COLOR,
        strokeWidth: CONFIG.DEFAULT_LINE_WIDTH,
        fill: CONFIG.DEFAULT_FILL,
        opacity: 1
      },
      highlight: {
        color: '#FFFF00',
        opacity: 0.4
      },
      eraser: {
        size: 20
      }
    },
    
    settings: {
      autoSave: true,
      autoSaveInterval: CONFIG.AUTO_SAVE_INTERVAL,
      showTooltips: true,
      smoothScrolling: true,
      gridSize: CONFIG.GRID_SIZE,
      snapThreshold: CONFIG.SNAP_THRESHOLD,
      renderQuality: 'medium',
      theme: 'light',
      language: 'en',
      recentFilesLimit: 10
    },
    
    recentFiles: [],
    
    flags: {
      dirty: false,
      loading: false,
      saving: false,
      rendering: false,
      processing: false
    },
    
    ui: {
      leftSidebarVisible: true,
      rightSidebarVisible: true,
      leftSidebarPanel: 'pages',
      contextMenuVisible: false,
      contextMenuX: 0,
      contextMenuY: 0,
      modalsOpen: []
    },
    
    performance: {
      lastRenderTime: 0,
      averageRenderTime: 0,
      renderCount: 0,
      objectCount: 0,
      memoryUsage: 0
    }
  }
}

export class StateManager {
  constructor(initialState = null) {
    this.state = initialState || createState()
    this.listeners = new Map()
    this.middleware = []
  }
  
  getState() {
    return this.state
  }
  
  setState(updates, path = null) {
    const oldState = JSON.parse(JSON.stringify(this.state))
    
    if (path) {
      const keys = path.split('.')
      let target = this.state
      for (let i = 0; i < keys.length - 1; i++) {
        target = target[keys[i]]
      }
      target[keys[keys.length - 1]] = updates
    } else {
      Object.assign(this.state, updates)
    }
    
    this.state.meta.modified = Date.now()
    
    for (const fn of this.middleware) {
      fn(this.state, oldState)
    }
    
    this.notify(path || 'root', this.state, oldState)
  }
  
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set())
    }
    this.listeners.get(path).add(callback)
    
    return () => {
      const listeners = this.listeners.get(path)
      if (listeners) {
        listeners.delete(callback)
        if (listeners.size === 0) {
          this.listeners.delete(path)
        }
      }
    }
  }
  
  notify(path, newState, oldState) {
    const listeners = this.listeners.get(path)
    if (listeners) {
      for (const callback of listeners) {
        callback(newState, oldState)
      }
    }
    
    const rootListeners = this.listeners.get('root')
    if (rootListeners && path !== 'root') {
      for (const callback of rootListeners) {
        callback(newState, oldState)
      }
    }
  }
  
  use(fn) {
    this.middleware.push(fn)
  }
  
  batch(fn) {
    const oldNotify = this.notify
    const changes = []
    
    this.notify = (path, newState, oldState) => {
      changes.push({ path, newState, oldState })
    }
    
    fn()
    
    this.notify = oldNotify
    
    for (const change of changes) {
      this.notify(change.path, change.newState, change.oldState)
    }
  }
  
  reset() {
    const oldState = this.state
    this.state = createState()
    this.notify('root', this.state, oldState)
  }
  
  snapshot() {
    return JSON.stringify(this.state)
  }
  
  restore(snapshot) {
    try {
      const oldState = this.state
      this.state = JSON.parse(snapshot)
      this.notify('root', this.state, oldState)
      return true
    } catch (e) {
      console.error('Failed to restore state:', e)
      return false
    }
  }
}