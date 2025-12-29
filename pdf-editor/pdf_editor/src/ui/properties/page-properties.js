import { EVENTS, PAGE_SIZES } from '../../constants.js'

export class PageProperties {
  constructor(state, eventBus, renderer, history) {
    this.state = state
    this.eventBus = eventBus
    this.renderer = renderer
    this.history = history
  }

  render() {
    const currentPage = this.state.view.page
    const pageSize = this.state.document.pageSizes[currentPage - 1] || PAGE_SIZES.A4
    const bgColor = this.state.document.backgrounds.get(currentPage - 1) || '#FFFFFF'

    return `
      <div class="space-y-4">
        <div class="text-center py-6">
          <svg class="w-16 h-16 mx-auto mb-3 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          <h3 class="text-lg font-bold mb-1">Page ${currentPage}</h3>
          <p class="text-sm text-slate-500 dark:text-slate-400">Page properties and settings</p>
        </div>

        <div class="property-section">
          <label class="property-label">Page Size</label>
          <div class="grid grid-cols-2 gap-3 text-sm">
            <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
              <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Width</div>
              <div class="font-mono font-semibold">${Math.round(pageSize.width)} pt</div>
            </div>
            <div class="bg-slate-50 dark:bg-slate-900 p-3 rounded-lg">
              <div class="text-xs text-slate-500 dark:text-slate-400 mb-1">Height</div>
              <div class="font-mono font-semibold">${Math.round(pageSize.height)} pt</div>
            </div>
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Background Color</label>
          <div class="grid grid-cols-4 gap-2 mb-3">
            ${this.getColorSwatches(['#FFFFFF', '#F8FAFC', '#F1F5F9', '#E2E8F0', '#FEF3C7', '#FEE2E2', '#DBEAFE', '#D1FAE5'], bgColor)}
          </div>
          <input type="color" id="page-bg-color" value="${bgColor}" class="property-input h-12 mb-2">
          <div class="grid grid-cols-2 gap-2">
            <button id="apply-bg-color" class="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-semibold transition text-sm">
              Apply
            </button>
            <button id="remove-bg-color" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 rounded-lg font-semibold transition text-sm">
              Remove
            </button>
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Page Rotation</label>
          <div class="grid grid-cols-4 gap-2">
            <button id="rotate-0" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              0°
            </button>
            <button id="rotate-90" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              90°
            </button>
            <button id="rotate-180" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              180°
            </button>
            <button id="rotate-270" class="px-3 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 rounded-lg text-sm font-medium transition">
              270°
            </button>
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Page Objects</label>
          <div class="bg-slate-50 dark:bg-slate-900 p-4 rounded-lg">
            <div class="text-sm">
              <div class="flex justify-between mb-2">
                <span class="text-slate-600 dark:text-slate-400">Total objects:</span>
                <span class="font-semibold">${this.state.objects.filter(o => o.page === currentPage).length}</span>
              </div>
              <div class="flex justify-between">
                <span class="text-slate-600 dark:text-slate-400">Visible objects:</span>
                <span class="font-semibold">${this.state.objects.filter(o => o.page === currentPage && !o.hidden).length}</span>
              </div>
            </div>
          </div>
        </div>

        <div class="property-section">
          <label class="property-label">Quick Actions</label>
          <div class="grid grid-cols-2 gap-2">
            <button id="clear-page" class="px-4 py-2 bg-orange-500 hover:bg-orange-600 text-white rounded-lg font-semibold transition text-sm">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear Page
            </button>
            <button id="duplicate-page" class="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg font-semibold transition text-sm">
              <svg class="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Duplicate
            </button>
          </div>
        </div>

        <div class="property-section bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
            </svg>
            <div class="flex-1">
              <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Tip</h4>
              <p class="text-xs text-blue-700 dark:text-blue-300">
                Changes to page settings affect only the current page. To apply to all pages, use the bulk actions in the file menu.
              </p>
            </div>
          </div>
        </div>
      </div>
    `
  }

  bind() {
    const bgColorSwatches = document.querySelectorAll('.bg-color-swatch')
    bgColorSwatches.forEach(swatch => {
      swatch.addEventListener('click', (e) => {
        const color = e.target.dataset.color
        document.getElementById('page-bg-color').value = color
      })
    })

    document.getElementById('apply-bg-color')?.addEventListener('click', () => {
      const color = document.getElementById('page-bg-color').value
      this.state.document.backgrounds.set(this.state.view.page - 1, color)
      this.history.checkpoint('Change page background')
      this.renderer.render()
      this.eventBus.emit(EVENTS.INFO, { message: 'Background color applied' })
    })

    document.getElementById('remove-bg-color')?.addEventListener('click', () => {
      this.state.document.backgrounds.delete(this.state.view.page - 1)
      this.history.checkpoint('Remove page background')
      this.renderer.render()
      this.eventBus.emit(EVENTS.INFO, { message: 'Background color removed' })
    })

    document.getElementById('rotate-0')?.addEventListener('click', () => this.rotatePage(0))
    document.getElementById('rotate-90')?.addEventListener('click', () => this.rotatePage(90))
    document.getElementById('rotate-180')?.addEventListener('click', () => this.rotatePage(180))
    document.getElementById('rotate-270')?.addEventListener('click', () => this.rotatePage(270))

    document.getElementById('clear-page')?.addEventListener('click', () => {
      if (confirm('Clear all objects from this page? This cannot be undone.')) {
        this.state.objects = this.state.objects.filter(o => o.page !== this.state.view.page)
        this.history.checkpoint('Clear page')
        this.renderer.render()
        this.eventBus.emit(EVENTS.INFO, { message: 'Page cleared' })
        
        const panel = document.getElementById('properties-panel')
        if (panel) {
          panel.innerHTML = this.render()
          this.bind()
        }
      }
    })

    document.getElementById('duplicate-page')?.addEventListener('click', () => {
      this.eventBus.emit('action:duplicate-page')
    })
  }

  rotatePage(rotation) {
    this.state.view.rotation = rotation
    this.history.checkpoint('Rotate page')
    this.renderer.resize()
    this.renderer.render()
    this.eventBus.emit(EVENTS.INFO, { message: `Page rotated to ${rotation}°` })
  }

  getColorSwatches(colors, current) {
    return colors.map(color => `
      <button class="bg-color-swatch w-full h-10 rounded-lg border-2 transition-all ${
        color === current ? 'border-blue-500 ring-2 ring-blue-200 dark:ring-blue-800' : 'border-slate-300 dark:border-slate-600 hover:border-blue-400'
      }" style="background-color: ${color}" data-color="${color}"></button>
    `).join('')
  }
}