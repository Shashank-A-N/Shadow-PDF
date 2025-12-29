import { EVENTS, TOOLS, CONFIG } from '../constants.js'

export class Toolbar {
  constructor(state, elements, eventBus, toolManager, renderer, pdfService) {
    this.state = state
    this.els = elements
    this.eventBus = eventBus
    this.toolManager = toolManager
    this.renderer = renderer
    this.pdfService = pdfService
  }

  init() {
    this.bindFileOperations()
    this.bindEditOperations()
    this.bindToolButtons()
    this.bindZoomControls()
    this.bindViewControls()
    this.updateUI()
  }

  bindFileOperations() {
    this.els.openBtn?.addEventListener('click', () => {
      this.els.fileInput.click()
    })

    this.els.saveBtn?.addEventListener('click', async () => {
      await this.handleSave()
    })

    this.els.exportBtn?.addEventListener('click', () => {
      this.eventBus.emit('modal:export:open')
    })

    this.els.newFileBtn?.addEventListener('click', async () => {
      if (this.state.flags.dirty) {
        const confirm = window.confirm('You have unsaved changes. Continue?')
        if (!confirm) return
      }
      await this.pdfService.createBlankPdf()
      this.renderer.init()
      this.renderer.render()
      await this.renderer.renderThumbnails()
    })
  }

  bindEditOperations() {
    this.els.undoBtn?.addEventListener('click', () => {
      this.eventBus.emit('history:undo')
    })

    this.els.redoBtn?.addEventListener('click', () => {
      this.eventBus.emit('history:redo')
    })

    this.els.cutBtn?.addEventListener('click', () => {
      this.toolManager.activeTool.cut()
      this.eventBus.emit('history:checkpoint')
      this.renderer.render()
    })

    this.els.copyBtn?.addEventListener('click', () => {
      this.toolManager.activeTool.copy()
    })

    this.els.pasteBtn?.addEventListener('click', () => {
      this.toolManager.activeTool.paste()
      this.eventBus.emit('history:checkpoint')
      this.renderer.render()
    })

    this.els.deleteBtn?.addEventListener('click', () => {
      this.toolManager.activeTool.deleteSelection()
      this.eventBus.emit('history:checkpoint')
      this.renderer.render()
    })
  }

  bindToolButtons() {
    const toolButtons = {
      'tool-select': TOOLS.SELECT,
      'tool-hand': TOOLS.HAND,
      'tool-text': TOOLS.TEXT,
      'tool-draw': TOOLS.DRAW,
      'tool-highlight': TOOLS.HIGHLIGHT,
      'tool-rect': TOOLS.RECT,
      'tool-oval': TOOLS.OVAL,
      'tool-line': TOOLS.LINE,
      'tool-image': TOOLS.IMAGE,
      'tool-signature': TOOLS.SIGNATURE,
      'tool-form': TOOLS.FORM,
      'tool-ocr': TOOLS.OCR,
      'tool-eraser': TOOLS.ERASER
    }

    for (const [id, tool] of Object.entries(toolButtons)) {
      const btn = document.getElementById(id)
      if (btn) {
        btn.addEventListener('click', () => {
          this.toolManager.setTool(tool)
          this.updateToolButtons(tool)
        })
      }
    }
  }

  bindZoomControls() {
    this.els.zoomIn?.addEventListener('click', () => {
      this.changeZoom(CONFIG.ZOOM_STEP)
    })

    this.els.zoomOut?.addEventListener('click', () => {
      this.changeZoom(-CONFIG.ZOOM_STEP)
    })

    this.els.zoomSelect?.addEventListener('change', (e) => {
      const value = e.target.value
      
      if (value === 'fit') {
        this.renderer.fitWidth()
      } else if (value === 'page') {
        this.renderer.fitPage()
      } else {
        const zoom = parseFloat(value)
        this.setZoom(zoom)
      }
    })
  }

  bindViewControls() {
    const gridToggle = document.getElementById('toggle-grid')
    const rulersToggle = document.getElementById('toggle-rulers')
    const snapToggle = document.getElementById('toggle-snap')

    gridToggle?.addEventListener('click', () => {
      this.state.view.grid = !this.state.view.grid
      const overlay = document.getElementById('grid-overlay')
      if (overlay) {
        overlay.classList.toggle('active', this.state.view.grid)
      }
      gridToggle.classList.toggle('tool-active', this.state.view.grid)
    })

    rulersToggle?.addEventListener('click', () => {
      this.state.view.rulers = !this.state.view.rulers
      this.els.rulerH?.classList.toggle('hidden', !this.state.view.rulers)
      this.els.rulerV?.classList.toggle('hidden', !this.state.view.rulers)
      rulersToggle.classList.toggle('tool-active', this.state.view.rulers)
      
      if (this.state.view.rulers) {
        this.renderer.drawRulers()
      }
    })

    snapToggle?.addEventListener('click', () => {
      this.state.view.snap = !this.state.view.snap
      snapToggle.classList.toggle('tool-active', this.state.view.snap)
      this.eventBus.emit(EVENTS.INFO, {
        message: `Snap to grid ${this.state.view.snap ? 'enabled' : 'disabled'}`
      })
    })
  }

  changeZoom(delta) {
    const newZoom = this.state.view.zoom + delta
    this.setZoom(newZoom)
  }

  setZoom(zoom) {
    const clampedZoom = Math.max(CONFIG.MIN_ZOOM, Math.min(CONFIG.MAX_ZOOM, zoom))
    this.state.view.zoom = clampedZoom
    
    this.els.zoomSelect.value = clampedZoom.toString()
    
    const zoomLabel = document.getElementById('zoom-label')
    if (zoomLabel) {
      zoomLabel.textContent = `${Math.round(clampedZoom * 100)}%`
    }

    this.renderer.resize()
    this.renderer.render()

    this.eventBus.emit(EVENTS.ZOOM_CHANGED, { zoom: clampedZoom })
  }

  updateToolButtons(activeTool) {
    document.querySelectorAll('[id^="tool-"]').forEach(btn => {
      btn.classList.remove('tool-active')
    })

    const activeBtn = document.getElementById(`tool-${activeTool}`)
    if (activeBtn) {
      activeBtn.classList.add('tool-active')
    }
  }

  updateUI() {
    this.eventBus.on(EVENTS.DOCUMENT_LOADED, () => {
      this.updatePageInfo()
      this.updateFileInfo()
    })

    this.eventBus.on(EVENTS.PAGE_CHANGED, () => {
      this.updatePageInfo()
    })

    this.eventBus.on(EVENTS.SELECTION_CHANGED, (data) => {
      this.updateSelectionInfo(data.selection)
    })

    this.eventBus.on(EVENTS.HISTORY_CHANGED, (data) => {
      if (this.els.undoBtn) {
        this.els.undoBtn.disabled = !data.canUndo
      }
      if (this.els.redoBtn) {
        this.els.redoBtn.disabled = !data.canRedo
      }
    })
  }

  updatePageInfo() {
    if (this.els.pageLabel) {
      this.els.pageLabel.textContent = this.state.view.page
    }
    if (this.els.pageCount) {
      this.els.pageCount.textContent = this.state.document.pages
    }
  }

  updateFileInfo() {
    if (this.els.fileLabel) {
      this.els.fileLabel.textContent = this.state.document.name
    }
    if (this.els.filesizeLabel) {
      this.els.filesizeLabel.textContent = this.formatFileSize(this.state.document.bytes)
    }
  }

  updateSelectionInfo(selection) {
    const label = this.els.selectionLabel
    if (!label) return

    if (selection.length === 0) {
      label.textContent = ''
    } else if (selection.length === 1) {
      label.textContent = `1 object selected`
    } else {
      label.textContent = `${selection.length} objects selected`
    }
  }

  async handleSave() {
    this.state.flags.saving = true
    
    try {
      const exporter = this.pdfService.exporter
      const blob = await exporter.exportToPdf({
        compress: true,
        includeObjects: true
      })

      await exporter.downloadBlob(blob, this.state.document.name)

      this.state.flags.dirty = false
      this.eventBus.emit(EVENTS.DOCUMENT_SAVED, { name: this.state.document.name })
      this.eventBus.emit(EVENTS.INFO, { message: 'PDF saved successfully' })

      const saveStatus = document.getElementById('save-status')
      if (saveStatus) {
        saveStatus.classList.remove('hidden')
        setTimeout(() => saveStatus.classList.add('hidden'), 3000)
      }
    } catch (error) {
      console.error('Save failed:', error)
      this.eventBus.emit(EVENTS.ERROR, { message: 'Failed to save PDF', error })
    } finally {
      this.state.flags.saving = false
    }
  }

  formatFileSize(bytes) {
    const units = ['B', 'KB', 'MB', 'GB']
    let size = bytes
    let unitIndex = 0

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024
      unitIndex++
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`
  }
  refreshAfterMutation() {
    this.eventBus.emit('object:modified');       // triggers renderAll via app.js listener
    this.renderer?.renderThumbnails?.();         // optional thumbnails refresh
  }
}