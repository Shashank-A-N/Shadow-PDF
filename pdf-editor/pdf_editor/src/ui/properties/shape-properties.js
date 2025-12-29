import { EVENTS } from '../../constants.js'

export class ShapeProperties {
  constructor(state, eventBus, renderer, history) {
    this.state = state
    this.eventBus = eventBus
    this.renderer = renderer
    this.history = history
  }

  render(obj) {
    const shapeIcons = {
      rect: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h12a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V6z"/>',
      oval: '<circle cx="12" cy="12" r="8" stroke-width="2"/>',
      line: '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19L19 5"/>'
    }

    const shapeNames = {
      rect: 'Rectangle',
      oval: 'Oval',
      line: 'Line'
    }

    return `
      <div class="space-y-4">
        <div class="text-center py-4">
          <svg class="w-12 h-12 mx-auto mb-2 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            ${shapeIcons[obj.type] || shapeIcons.rect}
          </svg>
          <h3 class="font-semibold">${shapeNames[obj.type] || 'Shape'}</h3>
        </div>

        ${obj.type !== 'line' ? this.getFillSection(obj) : ''}
        ${this.getStrokeSection(obj)}
        ${this.getDimensionsSection(obj)}
        ${this.getCommonActions(obj)}
      </div>
    `
  }

  getFillSection(obj) {
    return `
      <div class="property-section">
        <label class="property-label">Fill</label>
        <div class="grid grid-cols-4 gap-2 mb-3">
          ${this.getColorSwatches(
            ['#000000', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
            obj.fill !== 'transparent' ? obj.fill : null,
            'fill'
          )}
        </div>
        <input type="color" id="prop-shape-fill" value="${obj.fill !== 'transparent' ? obj.fill : '#000000'}" class="property-input h-12 mb-2">
        <label class="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" id="prop-shape-fill-transparent" ${obj.fill === 'transparent' ? 'checked' : ''} class="w-4 h-4 text-blue-500 rounded">
          <span class="text-sm">No Fill (Transparent)</span>
        </label>
      </div>
    `
  }

  getStrokeSection(obj) {
    return `
      <div class="property-section">
        <label class="property-label">Stroke</label>
        <div class="grid grid-cols-4 gap-2 mb-3">
          ${this.getColorSwatches(
            ['#000000', '#FFFFFF', '#EF4444', '#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'],
            obj.stroke !== 'transparent' ? obj.stroke : null,
            'stroke'
          )}
        </div>
        <input type="color" id="prop-shape-stroke" value="${obj.stroke !== 'transparent' ? obj.stroke : '#000000'}" class="property-input h-12 mb-2">
        <label class="flex items-center gap-2 cursor-pointer mb-3">
          <input type="checkbox" id="prop-shape-stroke-transparent" ${obj.stroke === 'transparent' ? 'checked' : ''} class="w-4 h-4 text-blue-500 rounded">
          <span class="text-sm">No Stroke (Transparent)</span>
        </label>
        
        <label class="property-label">Stroke Width</label>
        <div class="flex items-center gap-3">
          <input type="range" id="prop-shape-stroke-width" value="${obj.strokeWidth || 2}" min="0" max="20" step="0.5" class="flex-1">
          <input type="number" id="prop-shape-stroke-width-num" value="${obj.strokeWidth || 2}" min="0" max="20" step="0.5" class="w-20 px-2 py-1 border-2 border-slate-300 dark:border-slate-600 rounded text-sm">
        </div>
        <div class="mt-2">
          <label class="property-label">Line Cap</label>
          <select id="prop-shape-line-cap" class="property-input">
            <option value="round" ${obj.lineCap === 'round' ? 'selected' : ''}>Round</option>
            <option value="square" ${obj.lineCap === 'square' ? 'selected' : ''}>Square</option>
            <option value="butt" ${obj.lineCap === 'butt' ? 'selected' : ''}>Butt</option>
          </select>
        </div>
      </div>
    `
  }

  getDimensionsSection(obj) {
    return `
      <div class="property-section">
        <label class="property-label">Dimensions</label>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Width</label>
            <div class="relative">
              <input type="number" id="prop-shape-width" value="${Math.round(Math.abs(obj.width || 0))}" min="1" class="property-input pr-10">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">px</span>
            </div>
          </div>
          <div>
            <label class="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Height</label>
            <div class="relative">
              <input type="number" id="prop-shape-height" value="${Math.round(Math.abs(obj.height || 0))}" min="1" class="property-input pr-10">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">px</span>
            </div>
          </div>
        </div>
        ${obj.type !== 'line' ? `
          <label class="flex items-center gap-2 cursor-pointer mt-3">
            <input type="checkbox" id="prop-shape-aspect-ratio" class="w-4 h-4 text-blue-500 rounded">
            <span class="text-sm">Lock aspect ratio</span>
          </label>
        ` : ''}
      </div>
    `
  }

  getCommonActions(obj) {
    return `
      <div class="property-section pt-4 border-t border-slate-200 dark:border-slate-700">
        <label class="property-label">Position</label>
        <div class="grid grid-cols-2 gap-3">
          <div>
            <label class="text-xs text-slate-600 dark:text-slate-400">X</label>
            <input type="number" id="prop-common-x" value="${Math.round(obj.x || 0)}" class="property-input">
          </div>
          <div>
            <label class="text-xs text-slate-600 dark:text-slate-400">Y</label>
            <input type="number" id="prop-common-y" value="${Math.round(obj.y || 0)}" class="property-input">
          </div>
        </div>
      </div>

      <div class="property-section">
        <button id="prop-duplicate" class="w-full px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition mb-2">
          <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
          </svg>
          Duplicate Shape
        </button>
        <button id="prop-delete" class="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition">
          Delete Shape
        </button>
      </div>
    `
  }

  bind(obj) {
    const fillColorSwatches = document.querySelectorAll('.fill-color-swatch')
    fillColorSwatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color
        obj.fill = color
        obj.modified = Date.now()
        document.getElementById('prop-shape-fill').value = obj.fill
        document.getElementById('prop-shape-fill-transparent').checked = false
        this.history.checkpoint('Change fill color')
        this.renderer.render()
      })
    })

    const strokeColorSwatches = document.querySelectorAll('.stroke-color-swatch')
    strokeColorSwatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const color = e.currentTarget.dataset.color
        obj.stroke = color
        obj.modified = Date.now()
        document.getElementById('prop-shape-stroke').value = obj.stroke
        document.getElementById('prop-shape-stroke-transparent').checked = false
        this.history.checkpoint('Change stroke color')
        this.renderer.render()
      })
    })

    document.getElementById('prop-shape-fill')?.addEventListener('change', (e) => {
      obj.fill = e.target.value
      obj.modified = Date.now()
      document.getElementById('prop-shape-fill-transparent').checked = false
      this.history.checkpoint('Change fill color')
      this.renderer.render()
    })

    document.getElementById('prop-shape-fill-transparent')?.addEventListener('change', (e) => {
      obj.fill = e.target.checked ? 'transparent' : '#000000'
      obj.modified = Date.now()
      this.history.checkpoint('Toggle fill transparency')
      this.renderer.render()
    })

    document.getElementById('prop-shape-stroke')?.addEventListener('change', (e) => {
      obj.stroke = e.target.value
      obj.modified = Date.now()
      document.getElementById('prop-shape-stroke-transparent').checked = false
      this.history.checkpoint('Change stroke color')
      this.renderer.render()
    })

    document.getElementById('prop-shape-stroke-transparent')?.addEventListener('change', (e) => {
      obj.stroke = e.target.checked ? 'transparent' : '#000000'
      obj.modified = Date.now()
      this.history.checkpoint('Toggle stroke transparency')
      this.renderer.render()
    })

    const strokeWidthRange = document.getElementById('prop-shape-stroke-width')
    const strokeWidthNum = document.getElementById('prop-shape-stroke-width-num')

    strokeWidthRange?.addEventListener('input', (e) => {
      obj.strokeWidth = parseFloat(e.target.value)
      obj.modified = Date.now()
      strokeWidthNum.value = obj.strokeWidth
      this.renderer.render()
    })

    strokeWidthNum?.addEventListener('input', (e) => {
      obj.strokeWidth = parseFloat(e.target.value)
      obj.modified = Date.now()
      strokeWidthRange.value = obj.strokeWidth
      this.renderer.render()
    })

    document.getElementById('prop-shape-line-cap')?.addEventListener('change', (e) => {
      obj.lineCap = e.target.value
      obj.modified = Date.now()
      this.history.checkpoint('Change line cap')
      this.renderer.render()
    })

    const aspectRatio = Math.abs(obj.height) / Math.abs(obj.width)
    let lockAspectRatio = false

    document.getElementById('prop-shape-aspect-ratio')?.addEventListener('change', (e) => {
      lockAspectRatio = e.target.checked
    })

    const widthInput = document.getElementById('prop-shape-width')
    const heightInput = document.getElementById('prop-shape-height')

    widthInput?.addEventListener('input', (e) => {
      const newWidth = parseFloat(e.target.value)
      obj.width = obj.width < 0 ? -newWidth : newWidth
      if (lockAspectRatio && heightInput) {
        const newHeight = newWidth * aspectRatio
        obj.height = obj.height < 0 ? -newHeight : newHeight
        heightInput.value = Math.round(newHeight)
      }
      obj.modified = Date.now()
      this.renderer.render()
    })

    heightInput?.addEventListener('input', (e) => {
      const newHeight = parseFloat(e.target.value)
      obj.height = obj.height < 0 ? -newHeight : newHeight
      if (lockAspectRatio && widthInput) {
        const newWidth = newHeight / aspectRatio
        obj.width = obj.width < 0 ? -newWidth : newWidth
        widthInput.value = Math.round(newWidth)
      }
      obj.modified = Date.now()
      this.renderer.render()
    })

    this.bindCommonActions(obj)
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

    document.getElementById('prop-duplicate')?.addEventListener('click', () => {
      const clone = JSON.parse(JSON.stringify(obj))
      clone.id = this.generateId()
      clone.x = (clone.x || 0) + 10
      clone.y = (clone.y || 0) + 10
      
      this.state.objects.push(clone)
      this.state.selection = [clone]
      this.history.checkpoint('Duplicate shape')
      this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: [clone] })
      this.renderer.render()
    })

    document.getElementById('prop-delete')?.addEventListener('click', () => {
      const index = this.state.objects.indexOf(obj)
      if (index >= 0) {
        this.state.objects.splice(index, 1)
        this.state.selection = []
        this.history.checkpoint('Delete shape')
        this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: [] })
        this.renderer.render()
      }
    })
  }

  getColorSwatches(colors, current, type = 'fill') {
    // type should be 'fill' or 'stroke'
    const className = type === 'fill' ? 'fill-color-swatch' : 'stroke-color-swatch'
    return colors.map(color => `
      <button
        class="${className} w-full h-10 rounded-lg border-2 transition-all ${
          color === current ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
        }"
        style="background-color: ${color}"
        data-color="${color}"
        type="button"
        aria-label="${type} color ${color}"
      ></button>
    `).join('')
  }


  generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }
}