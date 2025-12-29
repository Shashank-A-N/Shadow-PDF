import { EVENTS } from '../../constants.js'
import { TextProperties } from './text-properties.js'
import { ShapeProperties } from './shape-properties.js'
import { ImageProperties } from './image-properties.js'
import { PageProperties } from './page-properties.js'

export class PropertiesManager {
  constructor(state, elements, eventBus, renderer, history) {
    this.state = state
    this.els = elements
    this.eventBus = eventBus
    this.renderer = renderer
    this.history = history

    this.textProps = new TextProperties(state, eventBus, renderer, history)
    this.shapeProps = new ShapeProperties(state, eventBus, renderer, history)
    this.imageProps = new ImageProperties(state, eventBus, renderer, history)
    this.pageProps = new PageProperties(state, eventBus, renderer, history)

    this.currentPanel = null
  }

  init() {
    this.eventBus.on(EVENTS.SELECTION_CHANGED, (data) => {
      this.updatePanel(data.selection)
    })

    this.eventBus.on(EVENTS.PAGE_CHANGED, () => {
      if (this.state.selection.length === 0) {
        this.showPageProperties()
      }
    })
  }

  updatePanel(selection) {
    const panel = this.els.propertiesPanel
    if (!panel) return

    if (selection.length === 0) {
      this.showPageProperties()
    } else if (selection.length === 1) {
      this.showSingleObjectProperties(selection[0])
    } else {
      this.showMultipleObjectsProperties(selection)
    }
  }

  showSingleObjectProperties(obj) {
    const panel = this.els.propertiesPanel

    switch (obj.type) {
      case 'text':
        this.currentPanel = this.textProps
        panel.innerHTML = this.textProps.render(obj)
        this.textProps.bind(obj)
        break

      case 'rect':
      case 'oval':
      case 'line':
        this.currentPanel = this.shapeProps
        panel.innerHTML = this.shapeProps.render(obj)
        this.shapeProps.bind(obj)
        break

      case 'image':
        this.currentPanel = this.imageProps
        panel.innerHTML = this.imageProps.render(obj)
        this.imageProps.bind(obj)
        break

      case 'path':
        this.currentPanel = null
        panel.innerHTML = this.getPathProperties(obj)
        this.bindPathProperties(obj)
        break

      case 'highlight':
        this.currentPanel = null
        panel.innerHTML = this.getHighlightProperties(obj)
        this.bindHighlightProperties(obj)
        break

      default:
        this.currentPanel = null
        panel.innerHTML = this.getCommonProperties(obj)
        this.bindCommonProperties(obj)
    }
  }

  showMultipleObjectsProperties(selection) {
    this.currentPanel = null
    const panel = this.els.propertiesPanel
    panel.innerHTML = this.getMultipleSelectionProperties(selection)
    this.bindMultipleSelectionProperties(selection)
  }

  showPageProperties() {
    this.currentPanel = this.pageProps
    const panel = this.els.propertiesPanel
    panel.innerHTML = this.pageProps.render()
    this.pageProps.bind()
  }

  getPathProperties(obj) {
    return `
      <div class="space-y-4">
        <div class="text-center py-4">
          <svg class="w-12 h-12 mx-auto mb-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
          </svg>
          <h3 class="font-semibold">Drawing Path</h3>
        </div>

        <div class="property-section">
          <label class="property-label">Color</label>
          <input type="color" id="prop-path-color" value="${obj.color || '#000000'}" class="property-input h-12">
        </div>

        <div class="property-section">
          <label class="property-label">Thickness</label>
          <input type="range" id="prop-path-size" value="${obj.size || 2}" min="1" max="50" class="w-full">
          <div class="text-xs text-center mt-2 font-mono">${obj.size || 2}px</div>
        </div>

        <div class="property-section">
          <label class="property-label">Opacity</label>
          <input type="range" id="prop-path-opacity" value="${obj.opacity || 1}" min="0" max="1" step="0.1" class="w-full">
          <div class="text-xs text-center mt-2 font-mono">${Math.round((obj.opacity || 1) * 100)}%</div>
        </div>

        <div class="property-section">
          <label class="property-label">Points</label>
          <div class="text-sm text-slate-600 dark:text-slate-400">${obj.points?.length || 0} points</div>
        </div>

        ${this.getCommonActions(obj)}
      </div>
    `
  }

  bindPathProperties(obj) {
    document.getElementById('prop-path-color')?.addEventListener('change', (e) => {
      obj.color = e.target.value
      obj.modified = Date.now()
      this.renderer.render()
    })

    const sizeInput = document.getElementById('prop-path-size')
    sizeInput?.addEventListener('input', (e) => {
      obj.size = parseInt(e.target.value)
      obj.modified = Date.now()
      e.target.nextElementSibling.textContent = `${obj.size}px`
      this.renderer.render()
    })

    const opacityInput = document.getElementById('prop-path-opacity')
    opacityInput?.addEventListener('input', (e) => {
      obj.opacity = parseFloat(e.target.value)
      obj.modified = Date.now()
      e.target.nextElementSibling.textContent = `${Math.round(obj.opacity * 100)}%`
      this.renderer.render()
    })

    this.bindCommonActions(obj)
  }

  getHighlightProperties(obj) {
    return `
      <div class="space-y-4">
        <div class="text-center py-4">
          <svg class="w-12 h-12 mx-auto mb-2 text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 20l4-16m2 16l4-16M6 9h14M4 15h14"/>
          </svg>
          <h3 class="font-semibold">Highlight</h3>
        </div>

        <div class="property-section">
          <label class="property-label">Color</label>
          <div class="grid grid-cols-4 gap-2 mt-2">
            ${this.getColorSwatches(['#FFFF00', '#FFD700', '#FF6B6B', '#4ECDC4', '#95E1D3', '#F38181', '#AA96DA', '#FCBAD3'], obj.color)}
          </div>
          <input type="color" id="prop-highlight-color" value="${obj.color || '#FFFF00'}" class="property-input h-12 mt-2">
        </div>

        <div class="property-section">
          <label class="property-label">Opacity</label>
          <input type="range" id="prop-highlight-opacity" value="${obj.opacity || 0.4}" min="0" max="1" step="0.1" class="w-full">
          <div class="text-xs text-center mt-2 font-mono">${Math.round((obj.opacity || 0.4) * 100)}%</div>
        </div>

        <div class="property-section">
          <label class="property-label">Dimensions</label>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-600 dark:text-slate-400">Width</label>
              <input type="number" id="prop-highlight-width" value="${Math.round(obj.width || 0)}" class="property-input">
            </div>
            <div>
              <label class="text-xs text-slate-600 dark:text-slate-400">Height</label>
              <input type="number" id="prop-highlight-height" value="${Math.round(obj.height || 0)}" class="property-input">
            </div>
          </div>
        </div>

        ${this.getCommonActions(obj)}
      </div>
    `
  }

  bindHighlightProperties(obj) {
    document.querySelectorAll('.color-swatch').forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        obj.color = e.target.dataset.color
        obj.modified = Date.now()
        document.getElementById('prop-highlight-color').value = obj.color
        this.renderer.render()
      })
    })

    document.getElementById('prop-highlight-color')?.addEventListener('change', (e) => {
      obj.color = e.target.value
      obj.modified = Date.now()
      this.renderer.render()
    })

    const opacityInput = document.getElementById('prop-highlight-opacity')
    opacityInput?.addEventListener('input', (e) => {
      obj.opacity = parseFloat(e.target.value)
      obj.modified = Date.now()
      e.target.nextElementSibling.textContent = `${Math.round(obj.opacity * 100)}%`
      this.renderer.render()
    })

    document.getElementById('prop-highlight-width')?.addEventListener('input', (e) => {
      obj.width = parseFloat(e.target.value)
      obj.modified = Date.now()
      this.renderer.render()
    })

    document.getElementById('prop-highlight-height')?.addEventListener('input', (e) => {
      obj.height = parseFloat(e.target.value)
      obj.modified = Date.now()
      this.renderer.render()
    })

    this.bindCommonActions(obj)
  }

  getMultipleSelectionProperties(selection) {
    return `
      <div class="space-y-4">
        <div class="text-center py-6">
          <svg class="w-16 h-16 mx-auto mb-3 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
          </svg>
          <h3 class="text-lg font-bold mb-1">Multiple Selection</h3>
          <p class="text-sm text-slate-600 dark:text-slate-400">${selection.length} objects selected</p>
        </div>

        <div class="property-section">
          <label class="property-label">Alignment</label>
          <div class="grid grid-cols-3 gap-2">
            <button id="align-left" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h7"/>
              </svg>
              <span class="text-xs mt-1 block">Left</span>
            </button>
            <button id="align-center-h" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M9 18h6"/>
              </svg>
              <span class="text-xs mt-1 block">Center</span>
            </button>
            <button id="align-right" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M13 18h7"/>
              </svg>
              <span class="text-xs mt-1 block">Right</span>
            </button>
            <button id="align-top" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10h14M5 14h14M5 18h9"/>
              </svg>
              <span class="text-xs mt-1 block">Top</span>
            </button>
            <button id="align-center-v" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10h14M7 14h10M9 18h6"/>
              </svg>
              <span class="text-xs mt-1 block">Middle</span>
            </button>
            <button id="align-bottom" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 6h9M5 10h14M5 14h14"/>
              </svg>
              <span class="text-xs mt-1 block">Bottom</span>
            </button>
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Distribute</label>
          <div class="grid grid-cols-2 gap-2">
            <button id="distribute-h" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              Horizontally
            </button>
            <button id="distribute-v" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              Vertically
            </button>
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Group Operations</label>
          <div class="grid grid-cols-2 gap-2">
            <button id="group-objects" class="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"/>
              </svg>
              Group
            </button>
            <button id="duplicate-all" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Duplicate
            </button>
          </div>
        </div>

        <div class="property-section pt-4 border-t border-slate-200 dark:border-slate-700">
          <button id="delete-all" class="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition shadow-lg hover:shadow-xl">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
            </svg>
            Delete All Selected
          </button>
        </div>
      </div>
    `
  }

  bindMultipleSelectionProperties(selection) {
    document.getElementById('align-left')?.addEventListener('click', () => {
      const minX = Math.min(...selection.map(o => o.x || 0))
      selection.forEach(o => o.x = minX)
      this.history.checkpoint('Align left')
      this.renderer.render()
    })

    document.getElementById('align-center-h')?.addEventListener('click', () => {
      const minX = Math.min(...selection.map(o => o.x || 0))
      const maxX = Math.max(...selection.map(o => (o.x || 0) + (o.width || 0)))
      const centerX = (minX + maxX) / 2
      selection.forEach(o => o.x = centerX - (o.width || 0) / 2)
      this.history.checkpoint('Align center')
      this.renderer.render()
    })

    document.getElementById('align-right')?.addEventListener('click', () => {
      const maxX = Math.max(...selection.map(o => (o.x || 0) + (o.width || 0)))
      selection.forEach(o => o.x = maxX - (o.width || 0))
      this.history.checkpoint('Align right')
      this.renderer.render()
    })

    document.getElementById('align-top')?.addEventListener('click', () => {
      const minY = Math.min(...selection.map(o => o.y || 0))
      selection.forEach(o => o.y = minY)
      this.history.checkpoint('Align top')
      this.renderer.render()
    })

    document.getElementById('align-center-v')?.addEventListener('click', () => {
      const minY = Math.min(...selection.map(o => o.y || 0))
      const maxY = Math.max(...selection.map(o => (o.y || 0) + (o.height || 0)))
      const centerY = (minY + maxY) / 2
      selection.forEach(o => o.y = centerY - (o.height || 0) / 2)
      this.history.checkpoint('Align middle')
      this.renderer.render()
    })

    document.getElementById('align-bottom')?.addEventListener('click', () => {
      const maxY = Math.max(...selection.map(o => (o.y || 0) + (o.height || 0)))
      selection.forEach(o => o.y = maxY - (o.height || 0))
      this.history.checkpoint('Align bottom')
      this.renderer.render()
    })

    document.getElementById('distribute-h')?.addEventListener('click', () => {
      const sorted = [...selection].sort((a, b) => (a.x || 0) - (b.x || 0))
      const minX = sorted[0].x
      const maxX = sorted[sorted.length - 1].x + (sorted[sorted.length - 1].width || 0)
      const totalWidth = sorted.reduce((sum, o) => sum + (o.width || 0), 0)
      const gap = (maxX - minX - totalWidth) / (sorted.length - 1)
      
      let currentX = minX
      sorted.forEach(o => {
        o.x = currentX
        currentX += (o.width || 0) + gap
      })
      
      this.history.checkpoint('Distribute horizontally')
      this.renderer.render()
    })

    document.getElementById('distribute-v')?.addEventListener('click', () => {
      const sorted = [...selection].sort((a, b) => (a.y || 0) - (b.y || 0))
      const minY = sorted[0].y
      const maxY = sorted[sorted.length - 1].y + (sorted[sorted.length - 1].height || 0)
      const totalHeight = sorted.reduce((sum, o) => sum + (o.height || 0), 0)
      const gap = (maxY - minY - totalHeight) / (sorted.length - 1)
      
      let currentY = minY
      sorted.forEach(o => {
        o.y = currentY
        currentY += (o.height || 0) + gap
      })
      
      this.history.checkpoint('Distribute vertically')
      this.renderer.render()
    })

    document.getElementById('duplicate-all')?.addEventListener('click', () => {
      const clones = selection.map(obj => {
        const clone = JSON.parse(JSON.stringify(obj))
        clone.id = this.generateId()
        clone.x = (clone.x || 0) + 10
        clone.y = (clone.y || 0) + 10
        if (obj.image) clone.image = obj.image
        return clone
      })
      
      this.state.objects.push(...clones)
      this.state.selection = clones
      this.history.checkpoint('Duplicate objects')
      this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: clones })
      this.renderer.render()
    })

    document.getElementById('delete-all')?.addEventListener('click', () => {
      selection.forEach(obj => {
        const index = this.state.objects.indexOf(obj)
        if (index >= 0) this.state.objects.splice(index, 1)
      })
      this.state.selection = []
      this.history.checkpoint('Delete objects')
      this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: [] })
      this.renderer.render()
    })
  }

  getCommonActions(obj) {
    return `
      <div class="property-section pt-4 border-t border-slate-200 dark:border-slate-700">
        <label class="property-label">Position</label>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-600 dark:text-slate-400">X</label>
            <input type="number" id="prop-common-x" value="${Math.round(obj.x || 0)}" class="property-input" step="1">
          </div>
          <div>
            <label class="text-xs text-slate-600 dark:text-slate-400">Y</label>
            <input type="number" id="prop-common-y" value="${Math.round(obj.y || 0)}" class="property-input" step="1">
          </div>
        </div>
      </div>

      <div class="property-section">
        <label class="property-label">Layer</label>
        <select id="prop-layer" class="property-input">
          ${this.state.layers.map((layer, idx) => 
            `<option value="${idx}" ${obj.layerId === layer.id ? 'selected' : ''}>${layer.name}</option>`
          ).join('')}
        </select>
      </div>

      <div class="property-section">
        <button id="prop-duplicate" class="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition mb-2">
          <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Duplicate
        </button>
        <button id="prop-delete" class="w-full px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition">
          <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
          </svg>
          Delete Object
        </button>
      </div>
    `
  }

  bindCommonActions(obj) {
    document.getElementById('prop-common-x')?.addEventListener('input', (e) => {
      obj.x = parseFloat(e.target.value)
      obj.modified = Date.now()
      this.renderer.render()
    })

    document.getElementById('prop-common-y')?.addEventListener('input', (e) => {
      obj.y = parseFloat(e.target.value)
      obj.modified = Date.now()
      this.renderer.render()
    })

    document.getElementById('prop-layer')?.addEventListener('change', (e) => {
      const layerIndex = parseInt(e.target.value)
      obj.layerId = this.state.layers[layerIndex].id
      obj.modified = Date.now()
      this.history.checkpoint('Change layer')
      this.renderer.render()
    })

    document.getElementById('prop-duplicate')?.addEventListener('click', () => {
      const clone = JSON.parse(JSON.stringify(obj))
      clone.id = this.generateId()
      clone.x = (clone.x || 0) + 10
      clone.y = (clone.y || 0) + 10
      if (obj.image) clone.image = obj.image
      
      this.state.objects.push(clone)
      this.state.selection = [clone]
      this.history.checkpoint('Duplicate object')
      this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: [clone] })
      this.renderer.render()
    })

    document.getElementById('prop-delete')?.addEventListener('click', () => {
      const index = this.state.objects.indexOf(obj)
      if (index >= 0) {
        this.state.objects.splice(index, 1)
        this.state.selection = []
        this.history.checkpoint('Delete object')
        this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: [] })
        this.renderer.render()
      }
    })
  }

  getCommonProperties(obj) {
    return `
      <div class="space-y-4">
        <div class="text-center py-6">
          <svg class="w-16 h-16 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
          </svg>
          <h3 class="text-lg font-bold">Object Properties</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400 mt-1">Type: ${obj.type}</p>
        </div>
        ${this.getCommonActions(obj)}
      </div>
    `
  }

  getColorSwatches(colors, current) {
    return colors.map(color => `
      <button class="color-swatch w-full h-10 rounded-lg border-2 transition-all ${
        color === current ? 'border-blue-500 ring-2 ring-blue-200' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
      }" style="background-color: ${color}" data-color="${color}"></button>
    `).join('')
  }

  generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }
}