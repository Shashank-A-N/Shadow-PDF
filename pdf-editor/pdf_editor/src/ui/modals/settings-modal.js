import { BaseModal } from './base-modal.js'
import { CONFIG, EVENTS } from '../../constants.js'

export class SettingsModal extends BaseModal {
  constructor(state, eventBus, storage) {
    super(eventBus)
    this.state = state
    this.storage = storage
  }

  show() {
    const content = this.getContent()
    this.create(content, {
      title: 'Settings',
      size: 'xl'
    })

    this.open()
    this.bindEvents()
    this.loadSettings()
  }

 getContent() {
    return `
      <div class="p-6">
        <div class="grid grid-cols-4 gap-6">
          <div class="col-span-1 space-y-2">
            <button data-tab="general" class="settings-tab w-full text-left px-4 py-3 rounded-lg bg-blue-500 text-white font-medium">
              General
            </button>
            <button data-tab="editor" class="settings-tab w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              Editor
            </button>
            <button data-tab="performance" class="settings-tab w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              Performance
            </button>
            <button data-tab="shortcuts" class="settings-tab w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              Shortcuts
            </button>
            <button data-tab="about" class="settings-tab w-full text-left px-4 py-3 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700">
              About
            </button>
          </div>

          <div class="col-span-3">
            <div id="tab-general" class="settings-panel space-y-6">
              <h3 class="text-xl font-bold mb-4">General Settings</h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Auto-save</label>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Automatically save your work</p>
                  </div>
                  <input type="checkbox" id="setting-autosave" class="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 accent-blue-500">
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Auto-save interval (minutes)</label>
                    <p class="text-sm text-slate-500 dark:text-slate-400">How often to auto-save</p>
                  </div>
                  <input type="number" id="setting-autosave-interval" min="1" max="60" class="w-24 px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Show tooltips</label>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Display helpful tooltips</p>
                  </div>
                  <input type="checkbox" id="setting-tooltips" class="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 accent-blue-500">
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Theme</label>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Interface color scheme</p>
                  </div>
                  <select id="setting-theme" class="px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                    <option value="light">Light</option>
                    <option value="dark">Dark</option>
                    <option value="auto">Auto</option>
                  </select>
                </div>
              </div>
            </div>

            <div id="tab-editor" class="settings-panel hidden space-y-6">
              <h3 class="text-xl font-bold mb-4">Editor Settings</h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Default font</label>
                  </div>
                  <select id="setting-default-font" class="px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                    <option value="Helvetica">Helvetica</option>
                    <option value="Times-Roman">Times New Roman</option>
                    <option value="Courier">Courier</option>
                  </select>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Default font size</label>
                  </div>
                  <input type="number" id="setting-default-font-size" min="8" max="72" class="w-24 px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Grid size (pixels)</label>
                  </div>
                  <input type="number" id="setting-grid-size" min="5" max="100" class="w-24 px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Snap threshold (pixels)</label>
                  </div>
                  <input type="number" id="setting-snap-threshold" min="1" max="20" class="w-24 px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                </div>
              </div>
            </div>

            <div id="tab-performance" class="settings-panel hidden space-y-6">
              <h3 class="text-xl font-bold mb-4">Performance Settings</h3>
              
              <div class="space-y-4">
                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Render quality</label>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Higher quality uses more resources</p>
                  </div>
                  <select id="setting-render-quality" class="px-3 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white text-slate-900 dark:bg-slate-700 dark:text-slate-100">
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>

                <div class="flex items-center justify-between">
                  <div>
                    <label class="font-medium">Smooth scrolling</label>
                    <p class="text-sm text-slate-500 dark:text-slate-400">Enable smooth scrolling animations</p>
                  </div>
                  <input type="checkbox" id="setting-smooth-scroll" class="w-5 h-5 rounded border-slate-300 dark:border-slate-600 bg-white dark:bg-slate-700 accent-blue-500">
                </div>
              </div>
            </div>

            <div id="tab-shortcuts" class="settings-panel hidden space-y-6">
              <h3 class="text-xl font-bold mb-4">Keyboard Shortcuts</h3>
              
              <div class="space-y-2 max-h-96 overflow-y-auto">
                ${this.getShortcutsHTML()}
              </div>
            </div>

            <div id="tab-about" class="settings-panel hidden space-y-6">
              <h3 class="text-xl font-bold mb-4">About PDF Editor Ultra</h3>
              
              <div class="space-y-4">
                <div class="text-center py-8">
                  <div class="text-6xl mb-4">📄</div>
                  <h4 class="text-2xl font-bold mb-2">PDF Editor Ultra</h4>
                  <p class="text-slate-600 dark:text-slate-400">Version ${CONFIG.VERSION}</p>
                </div>

                <div class="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <p class="text-sm text-slate-600 dark:text-slate-400 mb-4">
                    A professional PDF editor built with modern web technologies.
                  </p>
                  
                  <div class="space-y-2 text-sm">
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400">Built with:</span>
                      <span class="font-medium">PDF.js, PDF-lib, Tesseract.js</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-slate-600 dark:text-slate-400">License:</span>
                      <span class="font-medium">MIT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 mt-6 pt-6 border-t border-slate-200 dark:border-slate-700">
          <button id="reset-settings" class="px-6 py-3 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 transition">
            Reset to Defaults
          </button>
          <button id="save-settings" class="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg hover:shadow-xl">
            Save Settings
          </button>
        </div>
      </div>
    `
  }

  getShortcutsHTML() {
    const shortcuts = [
      { action: 'Save', keys: 'Ctrl+S' },
      { action: 'Open', keys: 'Ctrl+O' },
      { action: 'Undo', keys: 'Ctrl+Z' },
      { action: 'Redo', keys: 'Ctrl+Y' },
      { action: 'Copy', keys: 'Ctrl+C' },
      { action: 'Paste', keys: 'Ctrl+V' },
      { action: 'Cut', keys: 'Ctrl+X' },
      { action: 'Delete', keys: 'Delete' },
      { action: 'Select All', keys: 'Ctrl+A' },
      { action: 'Zoom In', keys: 'Ctrl+Plus' },
      { action: 'Zoom Out', keys: 'Ctrl+Minus' },
      { action: 'Fit Width', keys: 'Ctrl+0' },
      { action: 'Select Tool', keys: 'V' },
      { action: 'Hand Tool', keys: 'H' },
      { action: 'Text Tool', keys: 'T' },
      { action: 'Draw Tool', keys: 'P' }
    ]

    return shortcuts.map(s => `
      <div class="flex justify-between items-center py-2 px-3 rounded hover:bg-white-50 dark:hover:bg-white-800">
        <span class="text-sm">${s.action}</span>
        <kbd class="px-2 py-1">${s.keys}</kbd>
      </div>
    `).join('')
  }

  bindEvents() {
    document.querySelectorAll('.settings-tab').forEach(tab => {
      tab.addEventListener('click', () => this.switchTab(tab.dataset.tab))
    })

    document.getElementById('save-settings')?.addEventListener('click', () => this.saveSettings())
    document.getElementById('reset-settings')?.addEventListener('click', () => this.resetSettings())
  }

  switchTab(tabName) {
    document.querySelectorAll('.settings-tab').forEach(tab => {
      if (tab.dataset.tab === tabName) {
        tab.className = 'settings-tab w-full text-left px-4 py-3 rounded-lg bg-blue-500 text-white font-medium'
      } else {
        tab.className = 'settings-tab w-full text-left px-4 py-3 rounded-lg hover:bg-white-100 dark:hover:bg-white-700'
      }
    })

    document.querySelectorAll('.settings-panel').forEach(panel => {
      panel.classList.add('hidden')
    })

    document.getElementById(`tab-${tabName}`)?.classList.remove('hidden')
  }

  loadSettings() {
    document.getElementById('setting-autosave').checked = this.state.settings.autoSave
    document.getElementById('setting-autosave-interval').value = this.state.settings.autoSaveInterval / 60000
    document.getElementById('setting-tooltips').checked = this.state.settings.showTooltips
    document.getElementById('setting-theme').value = this.state.settings.theme
    document.getElementById('setting-default-font').value = this.state.settings.defaultFont
    document.getElementById('setting-default-font-size').value = CONFIG.DEFAULT_FONT_SIZE
    document.getElementById('setting-grid-size').value = this.state.settings.gridSize
    document.getElementById('setting-snap-threshold').value = this.state.settings.snapThreshold
    document.getElementById('setting-render-quality').value = this.state.settings.renderQuality
    document.getElementById('setting-smooth-scroll').checked = this.state.settings.smoothScrolling
  }

  saveSettings() {
    this.state.settings.autoSave = document.getElementById('setting-autosave').checked
    this.state.settings.autoSaveInterval = parseInt(document.getElementById('setting-autosave-interval').value) * 60000
    this.state.settings.showTooltips = document.getElementById('setting-tooltips').checked
    this.state.settings.theme = document.getElementById('setting-theme').value
    this.state.settings.defaultFont = document.getElementById('setting-default-font').value
    this.state.settings.gridSize = parseInt(document.getElementById('setting-grid-size').value)
    this.state.settings.snapThreshold = parseInt(document.getElementById('setting-snap-threshold').value)
    this.state.settings.renderQuality = document.getElementById('setting-render-quality').value
    this.state.settings.smoothScrolling = document.getElementById('setting-smooth-scroll').checked

    if (this.storage) {
      this.storage.saveToLocalStorage('settings', this.state.settings)
    }

    this.eventBus.emit(EVENTS.INFO, { message: 'Settings saved successfully' })
    this.close()
  }

  resetSettings() {
    if (confirm('Reset all settings to defaults?')) {
      this.state.settings = {
        autoSave: true,
        autoSaveInterval: CONFIG.AUTO_SAVE_INTERVAL,
        showTooltips: true,
        smoothScrolling: true,
        gridSize: CONFIG.GRID_SIZE,
        snapThreshold: CONFIG.SNAP_THRESHOLD,
        renderQuality: 'medium',
        theme: 'light',
        defaultFont: CONFIG.DEFAULT_FONT
      }

      this.loadSettings()
      this.eventBus.emit(EVENTS.INFO, { message: 'Settings reset to defaults' })
    }
  }
}