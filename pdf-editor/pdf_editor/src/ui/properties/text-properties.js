import { EVENTS } from '../../constants.js'

export class TextProperties {
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
          <svg class="w-12 h-12 mx-auto mb-2 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
          </svg>
          <h3 class="font-semibold">Text Object</h3>
        </div>

        <div class="property-section">
          <label class="property-label">Content</label>
          <textarea id="prop-text-content" class="property-input h-28 resize-none font-mono text-sm">${obj.text || ''}</textarea>
          <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${(obj.text || '').length} characters</div>
        </div>

        <div class="property-section">
          <label class="property-label">Font</label>
          <select id="prop-text-font" class="property-input">
            <option value="Helvetica" ${obj.font === 'Helvetica' ? 'selected' : ''}>Helvetica</option>
            <option value="Times-Roman" ${obj.font === 'Times-Roman' ? 'selected' : ''}>Times New Roman</option>
            <option value="Courier" ${obj.font === 'Courier' ? 'selected' : ''}>Courier</option>
            <option value="Georgia" ${obj.font === 'Georgia' ? 'selected' : ''}>Georgia</option>
            <option value="Verdana" ${obj.font === 'Verdana' ? 'selected' : ''}>Verdana</option>
          </select>
        </div>

        <div class="property-section grid grid-cols-2 gap-3">
          <div>
            <label class="property-label">Size</label>
            <div class="relative">
              <input type="number" id="prop-text-size" value="${obj.size || 24}" min="8" max="144" class="property-input pr-10">
              <span class="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-500">px</span>
            </div>
          </div>
          <div>
            <label class="property-label">Color</label>
            <input type="color" id="prop-text-color" value="${obj.color || '#000000'}" class="property-input h-12">
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Text Style</label>
          <div class="grid grid-cols-4 gap-2">
            <button id="prop-text-bold" class="px-3 py-2 rounded-lg font-semibold transition ${
              obj.bold ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
            }">
              <strong>B</strong>
            </button>
            <button id="prop-text-italic" class="px-3 py-2 rounded-lg font-semibold transition ${
              obj.italic ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
            }">
              <em>I</em>
            </button>
            <button id="prop-text-underline" class="px-3 py-2 rounded-lg font-semibold transition ${
              obj.underline ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
            }">
              <u>U</u>
            </button>
            <button id="prop-text-strike" class="px-3 py-2 rounded-lg font-semibold transition ${
              obj.strikethrough ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
            }">
              <s>S</s>
            </button>
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Alignment</label>
          <div class="grid grid-cols-3 gap-2">
            <button id="prop-text-align-left" class="px-3 py-2 rounded-lg transition ${
              obj.align === 'left' || !obj.align ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
            }">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h10M4 18h7"/>
              </svg>
            </button>
            <button id="prop-text-align-center" class="px-3 py-2 rounded-lg transition ${
              obj.align === 'center' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
            }">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M7 12h10M9 18h6"/>
              </svg>
            </button>
            <button id="prop-text-align-right" class="px-3 py-2 rounded-lg transition ${
              obj.align === 'right' ? 'bg-blue-500 text-white' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'
            }">
              <svg class="w-4 h-4 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M10 12h10M13 18h7"/>
              </svg>
            </button>
          </div>
        </div>

        <div class="property-section">
          <label class="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" id="prop-text-highlight" ${obj.highlight ? 'checked' : ''} class="w-5 h-5 text-blue-500 rounded">
            <span class="font-medium">Highlight Text Background</span>
          </label>
        </div>

        ${this.getCommonActions(obj)}
      </div>
    `
  }

  bind(obj) {
    document.getElementById('prop-text-content')?.addEventListener('input', (e) => {
      obj.text = e.target.value
      obj.modified = Date.now()
      e.target.nextElementSibling.textContent = `${e.target.value.length} characters`
      this.renderer.render()
    })

    document.getElementById('prop-text-font')?.addEventListener('change', (e) => {
      obj.font = e.target.value
      obj.modified = Date.now()
      this.history.checkpoint('Change font')
      this.renderer.render()
    })

    document.getElementById('prop-text-size')?.addEventListener('input', (e) => {
      obj.size = parseInt(e.target.value)
      obj.modified = Date.now()
      this.renderer.render()
    })

    document.getElementById('prop-text-color')?.addEventListener('change', (e) => {
      obj.color = e.target.value
      obj.modified = Date.now()
      this.history.checkpoint('Change color')
      this.renderer.render()
    })

    this.bindToggle('prop-text-bold', obj, 'bold')
    this.bindToggle('prop-text-italic', obj, 'italic')
    this.bindToggle('prop-text-underline', obj, 'underline')
    this.bindToggle('prop-text-strike', obj, 'strikethrough')
    this.bindToggle('prop-text-highlight', obj, 'highlight')

    this.bindAlign('prop-text-align-left', obj, 'left')
    this.bindAlign('prop-text-align-center', obj, 'center')
    this.bindAlign('prop-text-align-right', obj, 'right')

    this.bindCommonActions(obj)
  }

  bindToggle(id, obj, prop) {
    document.getElementById(id)?.addEventListener('click', (e) => {
      obj[prop] = !obj[prop]
      obj.modified = Date.now()
      e.target.closest('button, label').classList.toggle('bg-blue-500')
      e.target.closest('button, label').classList.toggle('text-white')
      this.history.checkpoint(`Toggle ${prop}`)
      this.renderer.render()
    })
  }

  bindAlign(id, obj, align) {
    document.getElementById(id)?.addEventListener('click', () => {
      obj.align = align
      obj.modified = Date.now()
      this.history.checkpoint('Change alignment')
      const panel = document.getElementById('properties-panel')
      if (panel) {
        panel.innerHTML = this.render(obj)
        this.bind(obj)
      }
    })
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
}