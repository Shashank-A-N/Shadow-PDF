import { BaseModal } from './base-modal.js'
import { EVENTS } from '../../constants.js'

export class SignatureModal extends BaseModal {
  constructor(state, eventBus, renderer) {
    super(eventBus)
    this.state = state
    this.renderer = renderer
    this.mode = 'draw'
    this.canvas = null
    this.ctx = null
    this.isDrawing = false
    this.isEmpty = true
  }

  show() {
    const content = this.getContent()
    this.create(content, {
      title: 'Create Signature',
      size: 'lg',
      className: 'signature-modal'
    })

    this.open()
    this.setupCanvas()
    this.bindEvents()
  }

  getContent() {
    return `
      <div class="p-6 space-y-6">
        <div class="flex gap-2">
          <button data-mode="draw" class="mode-btn flex-1 px-4 py-3 rounded-lg bg-blue-500 text-white font-semibold transition hover:bg-blue-600">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
            Draw
          </button>
          <button data-mode="type" class="mode-btn flex-1 px-4 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition hover:bg-slate-300 dark:hover:bg-slate-600">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
            </svg>
            Type
          </button>
          <button data-mode="upload" class="mode-btn flex-1 px-4 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition hover:bg-slate-300 dark:hover:bg-slate-600">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            Upload
          </button>
        </div>

        <div id="signature-draw-panel">
          <div class="border-2 border-slate-300 dark:border-slate-600 rounded-lg overflow-hidden bg-white">
            <canvas id="signature-canvas" width="600" height="250" class="w-full cursor-crosshair"></canvas>
          </div>
          <div class="flex items-center justify-between mt-4">
            <div class="flex items-center gap-4">
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium">Color:</label>
                <input type="color" id="signature-color" value="#000000" class="w-10 h-10 rounded-lg cursor-pointer border-2 border-slate-300 dark:border-slate-600">
              </div>
              <div class="flex items-center gap-2">
                <label class="text-sm font-medium">Size:</label>
                <input type="range" id="signature-size" min="1" max="15" value="3" class="w-32">
                <span id="signature-size-value" class="text-sm font-mono w-8">3px</span>
              </div>
            </div>
            <button id="clear-signature" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition">
              <svg class="w-5 h-5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
              </svg>
              Clear
            </button>
          </div>
        </div>

        <div id="signature-type-panel" class="hidden space-y-4">
          <input type="text" id="signature-text" placeholder="Type your signature here..." class="w-full px-4 py-3 text-lg border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:border-blue-500 outline-none transition">
          
          <div>
            <label class="text-sm font-medium mb-2 block">Font Style</label>
            <select id="signature-font" class="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:border-blue-500 outline-none transition">
              <option value="Brush Script MT">Brush Script MT (Elegant)</option>
              <option value="Lucida Handwriting">Lucida Handwriting (Classic)</option>
              <option value="Segoe Script">Segoe Script (Modern)</option>
              <option value="Monotype Corsiva">Monotype Corsiva (Formal)</option>
              <option value="Freestyle Script">Freestyle Script (Casual)</option>
            </select>
          </div>

          <div class="border-2 border-slate-300 dark:border-slate-600 rounded-lg p-8 bg-white dark:bg-slate-900 min-h-[150px] flex items-center justify-center">
            <div id="signature-preview" class="text-5xl text-center" style="font-family: 'Brush Script MT'">Your Signature</div>
          </div>
        </div>

        <div id="signature-upload-panel" class="hidden">
          <div class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-12 text-center bg-slate-50 dark:bg-slate-900/50 hover:border-blue-500 transition cursor-pointer" id="upload-zone">
            <svg class="w-16 h-16 mx-auto mb-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
            </svg>
            <p class="text-lg font-medium mb-2">Drop image here or click to upload</p>
            <p class="text-sm text-slate-500">PNG, JPG, or GIF up to 5MB</p>
            <input type="file" id="signature-file" accept="image/png,image/jpeg,image/gif" class="hidden">
          </div>
          <img id="signature-upload-preview" class="hidden mt-4 max-h-64 mx-auto border-2 border-slate-300 dark:border-slate-600 rounded-lg">
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button id="cancel-signature" class="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition">
            Cancel
          </button>
          <button id="save-signature" class="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg hover:shadow-xl">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Add Signature
          </button>
        </div>
      </div>
    `
  }

  setupCanvas() {
    this.canvas = document.getElementById('signature-canvas')
    this.ctx = this.canvas.getContext('2d')
    
    this.ctx.strokeStyle = '#000000'
    this.ctx.lineWidth = 3
    this.ctx.lineCap = 'round'
    this.ctx.lineJoin = 'round'
  }

  bindEvents() {
    document.querySelectorAll('.mode-btn').forEach(btn => {
      btn.addEventListener('click', () => this.switchMode(btn.dataset.mode))
    })

    this.bindDrawMode()
    this.bindTypeMode()
    this.bindUploadMode()

    document.getElementById('cancel-signature')?.addEventListener('click', () => this.close())
    document.getElementById('save-signature')?.addEventListener('click', () => this.saveSignature())
  }

  switchMode(mode) {
    this.mode = mode

    document.querySelectorAll('.mode-btn').forEach(btn => {
      if (btn.dataset.mode === mode) {
        btn.className = 'mode-btn flex-1 px-4 py-3 rounded-lg bg-blue-500 text-white font-semibold transition hover:bg-blue-600'
      } else {
        btn.className = 'mode-btn flex-1 px-4 py-3 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 font-semibold transition hover:bg-slate-300 dark:hover:bg-slate-600'
      }
    })

    document.getElementById('signature-draw-panel').classList.toggle('hidden', mode !== 'draw')
    document.getElementById('signature-type-panel').classList.toggle('hidden', mode !== 'type')
    document.getElementById('signature-upload-panel').classList.toggle('hidden', mode !== 'upload')
  }

  bindDrawMode() {
    const colorInput = document.getElementById('signature-color')
    const sizeInput = document.getElementById('signature-size')
    const sizeValue = document.getElementById('signature-size-value')
    const clearBtn = document.getElementById('clear-signature')

    colorInput?.addEventListener('change', (e) => {
      this.ctx.strokeStyle = e.target.value
    })

    sizeInput?.addEventListener('input', (e) => {
      this.ctx.lineWidth = parseInt(e.target.value)
      sizeValue.textContent = `${e.target.value}px`
    })

    clearBtn?.addEventListener('click', () => {
      this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
      this.isEmpty = true
    })

    this.canvas?.addEventListener('mousedown', (e) => this.startDrawing(e))
    this.canvas?.addEventListener('mousemove', (e) => this.draw(e))
    this.canvas?.addEventListener('mouseup', () => this.stopDrawing())
    this.canvas?.addEventListener('mouseleave', () => this.stopDrawing())

    this.canvas?.addEventListener('touchstart', (e) => {
      e.preventDefault()
      this.startDrawing(e.touches[0])
    })
    this.canvas?.addEventListener('touchmove', (e) => {
      e.preventDefault()
      this.draw(e.touches[0])
    })
    this.canvas?.addEventListener('touchend', () => this.stopDrawing())
  }

  bindTypeMode() {
    const textInput = document.getElementById('signature-text')
    const fontSelect = document.getElementById('signature-font')
    const preview = document.getElementById('signature-preview')

    const updatePreview = () => {
      preview.textContent = textInput.value || 'Your Signature'
      preview.style.fontFamily = fontSelect.value
    }

    textInput?.addEventListener('input', updatePreview)
    fontSelect?.addEventListener('change', updatePreview)
  }

  bindUploadMode() {
    const uploadZone = document.getElementById('upload-zone')
    const fileInput = document.getElementById('signature-file')
    const preview = document.getElementById('signature-upload-preview')

    uploadZone?.addEventListener('click', () => fileInput.click())

    uploadZone?.addEventListener('dragover', (e) => {
      e.preventDefault()
      uploadZone.classList.add('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')
    })

    uploadZone?.addEventListener('dragleave', () => {
      uploadZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')
    })

    uploadZone?.addEventListener('drop', (e) => {
      e.preventDefault()
      uploadZone.classList.remove('border-blue-500', 'bg-blue-50', 'dark:bg-blue-900/20')
      
      const file = e.dataTransfer.files[0]
      if (file && file.type.startsWith('image/')) {
        this.loadImageFile(file, preview)
      }
    })

    fileInput?.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        this.loadImageFile(file, preview)
      }
    })
  }

  loadImageFile(file, preview) {
    const reader = new FileReader()
    reader.onload = (e) => {
      preview.src = e.target.result
      preview.classList.remove('hidden')
    }
    reader.readAsDataURL(file)
  }

  startDrawing(e) {
    this.isDrawing = true
    this.isEmpty = false
    const pos = this.getCanvasPos(e)
    this.ctx.beginPath()
    this.ctx.moveTo(pos.x, pos.y)
  }

  draw(e) {
    if (!this.isDrawing) return
    const pos = this.getCanvasPos(e)
    this.ctx.lineTo(pos.x, pos.y)
    this.ctx.stroke()
  }

  stopDrawing() {
    this.isDrawing = false
  }

  getCanvasPos(e) {
    const rect = this.canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (this.canvas.width / rect.width),
      y: (e.clientY - rect.top) * (this.canvas.height / rect.height)
    }
  }

  saveSignature() {
    if (this.mode === 'draw') {
      if (this.isEmpty) {
        this.eventBus.emit(EVENTS.WARNING, { message: 'Please draw your signature first' })
        return
      }
      this.saveDrawnSignature()
    } else if (this.mode === 'type') {
      const text = document.getElementById('signature-text').value
      if (!text.trim()) {
        this.eventBus.emit(EVENTS.WARNING, { message: 'Please type your signature' })
        return
      }
      this.saveTypedSignature()
    } else if (this.mode === 'upload') {
      const preview = document.getElementById('signature-upload-preview')
      if (!preview.src) {
        this.eventBus.emit(EVENTS.WARNING, { message: 'Please upload a signature image' })
        return
      }
      this.saveUploadedSignature()
    }
  }

  saveDrawnSignature() {
    const dataUrl = this.canvas.toDataURL('image/png')
    this.addSignatureToDocument(dataUrl, this.canvas.width, this.canvas.height)
  }

  saveTypedSignature() {
    const text = document.getElementById('signature-text').value
    const font = document.getElementById('signature-font').value

    const tempCanvas = document.createElement('canvas')
    const tempCtx = tempCanvas.getContext('2d')

    tempCtx.font = `72px "${font}"`
    const metrics = tempCtx.measureText(text)
    
    tempCanvas.width = metrics.width + 40
    tempCanvas.height = 120

    tempCtx.font = `72px "${font}"`
    tempCtx.fillStyle = '#000000'
    tempCtx.textBaseline = 'middle'
    tempCtx.fillText(text, 20, 60)

    const dataUrl = tempCanvas.toDataURL('image/png')
    this.addSignatureToDocument(dataUrl, tempCanvas.width, tempCanvas.height)
  }

  saveUploadedSignature() {
    const preview = document.getElementById('signature-upload-preview')
    this.addSignatureToDocument(preview.src, preview.naturalWidth, preview.naturalHeight)
  }

  addSignatureToDocument(dataUrl, originalWidth, originalHeight) {
    const img = new Image()
    img.onload = () => {
      const maxWidth = 200
      const aspectRatio = originalHeight / originalWidth
      const width = Math.min(originalWidth, maxWidth)
      const height = width * aspectRatio

      const pageSize = this.state.document.pageSizes[this.state.view.page - 1]
      const x = (pageSize.width - width) / 2
      const y = pageSize.height - height - 50

      const signatureObj = {
        id: this.generateId(),
        type: 'image',
        page: this.state.view.page,
        layerId: this.state.layers[this.state.currentLayer]?.id,
        x,
        y,
        width,
        height,
        image: img,
        data: dataUrl,
        format: 'png',
        opacity: 1,
        isSignature: true,
        created: Date.now(),
        modified: Date.now()
      }

      this.state.objects.push(signatureObj)
      this.state.selection = [signatureObj]

      this.eventBus.emit(EVENTS.OBJECT_ADDED, { object: signatureObj })
      this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: [signatureObj] })
      
      this.renderer.render()
      this.close()

      this.eventBus.emit(EVENTS.INFO, { message: 'Signature added successfully' })
    }
    img.src = dataUrl
  }

  generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }
}