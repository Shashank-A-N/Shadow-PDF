import { EVENTS } from '../../constants.js'

export class ImageProperties {
  constructor(state, eventBus, renderer, history) {
    this.state = state
    this.eventBus = eventBus
    this.renderer = renderer
    this.history = history
  }

  render(obj) {
    return `
      <div class="space-y-4">
        <div class="text-center py-4">
          <svg class="w-12 h-12 mx-auto mb-2 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"/>
          </svg>
          <h3 class="font-semibold">${obj.isSignature ? 'Signature Image' : 'Image'}</h3>
        </div>

        <div class="property-section">
          <label class="property-label">Preview</label>
          <div class="border-2 border-slate-200 dark:border-slate-700 rounded-lg p-4 bg-slate-50 dark:bg-slate-900 flex items-center justify-center">
            <img src="${obj.data}" alt="Preview" class="max-w-full max-h-48 rounded shadow-sm">
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Dimensions</label>
          <div class="grid grid-cols-2 gap-3">
            <div>
              <label class="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Width</label>
              <div class="relative">
                <input type="number" id="prop-image-width" value="${Math.round(obj.width)}" min="1" class="property-input pr-10">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">px</span>
              </div>
            </div>
            <div>
              <label class="text-xs text-slate-600 dark:text-slate-400 mb-1 block">Height</label>
              <div class="relative">
                <input type="number" id="prop-image-height" value="${Math.round(obj.height)}" min="1" class="property-input pr-10">
                <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">px</span>
              </div>
            </div>
          </div>
          <label class="flex items-center gap-2 cursor-pointer mt-3">
            <input type="checkbox" id="prop-image-aspect-ratio" checked class="w-4 h-4 text-blue-500 rounded">
            <span class="text-sm">Lock aspect ratio</span>
          </label>
        </div>

        <div class="property-section">
          <label class="property-label">Opacity</label>
          <div class="flex items-center gap-3">
            <input type="range" id="prop-image-opacity" value="${obj.opacity || 1}" min="0" max="1" step="0.1" class="flex-1">
            <span id="prop-image-opacity-value" class="text-sm font-mono w-12 text-right">${Math.round((obj.opacity || 1) * 100)}%</span>
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Transform</label>
          <div class="grid grid-cols-2 gap-2">
            <button id="flip-horizontal" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"/>
              </svg>
              Flip H
            </button>
            <button id="flip-vertical" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"/>
              </svg>
              Flip V
            </button>
          </div>
        </div>

        <div class="property-section">
          <button id="replace-image" class="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition mb-2">
            <svg class="w-4 h-4 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"/>
            </svg>
            Replace Image
          </button>
          <input type="file" id="replace-image-input" accept="image/*" class="hidden">
        </div>

        ${this.getCommonActions(obj)}
      </div>
    `
  }

  bind(obj) {
    const aspectRatio = obj.height / obj.width
    let lockAspectRatio = true

    const aspectCheckbox = document.getElementById('prop-image-aspect-ratio')
    aspectCheckbox?.addEventListener('change', (e) => {
      lockAspectRatio = e.target.checked
    })

    const widthInput = document.getElementById('prop-image-width')
    const heightInput = document.getElementById('prop-image-height')

    widthInput?.addEventListener('input', (e) => {
      obj.width = parseFloat(e.target.value)
      if (lockAspectRatio && heightInput) {
        obj.height = obj.width * aspectRatio
        heightInput.value = Math.round(obj.height)
      }
      obj.modified = Date.now()
      this.renderer.render()
    })

    heightInput?.addEventListener('input', (e) => {
      obj.height = parseFloat(e.target.value)
      if (lockAspectRatio && widthInput) {
        obj.width = obj.height / aspectRatio
        widthInput.value = Math.round(obj.width)
      }
      obj.modified = Date.now()
      this.renderer.render()
    })

    const opacityInput = document.getElementById('prop-image-opacity')
    const opacityValue = document.getElementById('prop-image-opacity-value')
    
    opacityInput?.addEventListener('input', (e) => {
      obj.opacity = parseFloat(e.target.value)
      obj.modified = Date.now()
      opacityValue.textContent = `${Math.round(obj.opacity * 100)}%`
      this.renderer.render()
    })

    document.getElementById('flip-horizontal')?.addEventListener('click', () => {
      if (!obj.transform) obj.transform = {}
      obj.transform.scaleX = (obj.transform.scaleX || 1) * -1
      obj.modified = Date.now()
      this.history.checkpoint('Flip horizontal')
      this.renderer.render()
    })

    document.getElementById('flip-vertical')?.addEventListener('click', () => {
      if (!obj.transform) obj.transform = {}
      obj.transform.scaleY = (obj.transform.scaleY || 1) * -1
      obj.modified = Date.now()
      this.history.checkpoint('Flip vertical')
      this.renderer.render()
    })

    document.getElementById('replace-image')?.addEventListener('click', () => {
      document.getElementById('replace-image-input').click()
    })

    document.getElementById('replace-image-input')?.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (!file) return

      const reader = new FileReader()
      reader.onload = (event) => {
        const img = new Image()
        img.onload = () => {
          obj.image = img
          obj.data = event.target.result
          obj.format = file.type.includes('png') ? 'png' : 'jpg'
          obj.modified = Date.now()
          this.history.checkpoint('Replace image')
          this.renderer.render()
          
          const panel = document.getElementById('properties-panel')
          if (panel) {
            panel.innerHTML = this.render(obj)
            this.bind(obj)
          }
        }
        img.src = event.target.result
      }
      reader.readAsDataURL(file)
    })

    this.bindCommonActions(obj)
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
        <button id="prop-delete" class="w-full px-4 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition">
          Delete Image
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

    document.getElementById('prop-delete')?.addEventListener('click', () => {
      const index = this.state.objects.indexOf(obj)
      if (index >= 0) {
        this.state.objects.splice(index, 1)
        this.state.selection = []
        this.history.checkpoint('Delete image')
        this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: [] })
        this.renderer.render()
      }
    })
  }
}