import { BaseTool } from './base-tool.js'
import { CURSORS, EVENTS } from '../constants.js'

export class SignatureTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)
    this.cursor = CURSORS.CROSSHAIR
    this.modal = null
  }

  activate() {
    super.activate()
    this.openSignatureModal()
  }

  openSignatureModal() {
    this.modal = this.createModal()
    document.body.appendChild(this.modal)
    this.setupSignaturePad()
  }

  createModal() {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-md p-6 animate-fadeIn">
        <h3 class="text-xl font-bold mb-4">Create Signature</h3>
        
        <div class="flex gap-2 mb-4">
          <button data-mode="draw" class="signature-mode-btn flex-1 px-4 py-2 bg-blue-500 text-white rounded">Draw</button>
          <button data-mode="type" class="signature-mode-btn flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded">Type</button>
          <button data-mode="upload" class="signature-mode-btn flex-1 px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded">Upload</button>
        </div>

        <div id="signature-draw-panel">
          <canvas id="signature-canvas" width="400" height="200" class="border-2 border-slate-300 dark:border-slate-600 rounded-lg cursor-crosshair bg-white"></canvas>
          <div class="flex items-center justify-between mt-3">
            <div class="flex items-center gap-3">
              <label class="text-sm font-medium">Color:</label>
              <input type="color" id="signature-color" value="#000000" class="w-10 h-10 rounded cursor-pointer">
              <label class="text-sm font-medium">Size:</label>
              <input type="range" id="signature-size" min="1" max="10" value="2" class="w-24">
            </div>
            <button id="clear-signature" class="px-3 py-1 bg-slate-200 dark:bg-slate-700 rounded text-sm">Clear</button>
          </div>
        </div>

        <div id="signature-type-panel" class="hidden">
          <input type="text" id="signature-text" placeholder="Type your signature" class="w-full p-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg mb-3">
          <select id="signature-font" class="w-full p-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg">
            <option value="Dancing Script">Dancing Script (Cursive)</option>
            <option value="Great Vibes">Great Vibes (Script)</option>
            <option value="Pacifico">Pacifico (Handwriting)</option>
            <option value="Caveat">Caveat (Casual)</option>
          </select>
          <div id="signature-preview" class="mt-4 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg text-center text-4xl" style="font-family: 'Dancing Script'"></div>
        </div>

        <div id="signature-upload-panel" class="hidden">
          <div class="border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-lg p-8 text-center">
            <i class="fas fa-cloud-upload-alt text-4xl text-slate-400 mb-3"></i>
            <p class="text-sm text-slate-600 dark:text-slate-400 mb-2">Click to upload signature image</p>
            <input type="file" id="signature-file" accept="image/*" class="hidden">
            <button id="upload-signature-btn" class="px-4 py-2 bg-blue-500 text-white rounded">Choose File</button>
          </div>
          <img id="signature-upload-preview" class="hidden mt-4 max-h-48 mx-auto">
        </div>

        <div class="flex justify-end gap-3 mt-6">
          <button id="cancel-signature" class="px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded">Cancel</button>
          <button id="save-signature" class="px-4 py-2 bg-blue-500 text-white rounded">Add Signature</button>
        </div>
      </div>
    `
    return modal
  }

  setupSignaturePad() {
    const canvas = this.modal.querySelector('#signature-canvas')
    const ctx = canvas.getContext('2d')
    const colorInput = this.modal.querySelector('#signature-color')
    const sizeInput = this.modal.querySelector('#signature-size')
    const clearBtn = this.modal.querySelector('#clear-signature')
    const cancelBtn = this.modal.querySelector('#cancel-signature')
    const saveBtn = this.modal.querySelector('#save-signature')

    let drawing = false
    let isEmpty = true

    const startDrawing = (e) => {
      drawing = true
      const pos = this.getCanvasPos(e, canvas)
      ctx.beginPath()
      ctx.moveTo(pos.x, pos.y)
      isEmpty = false
    }

    const draw = (e) => {
      if (!drawing) return
      const pos = this.getCanvasPos(e, canvas)
      ctx.strokeStyle = colorInput.value
      ctx.lineWidth = parseInt(sizeInput.value)
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineTo(pos.x, pos.y)
      ctx.stroke()
    }

    const stopDrawing = () => {
      drawing = false
    }

    canvas.addEventListener('mousedown', startDrawing)
    canvas.addEventListener('mousemove', draw)
    canvas.addEventListener('mouseup', stopDrawing)
    canvas.addEventListener('mouseleave', stopDrawing)

    canvas.addEventListener('touchstart', (e) => { e.preventDefault(); startDrawing(e.touches[0]) })
    canvas.addEventListener('touchmove', (e) => { e.preventDefault(); draw(e.touches[0]) })
    canvas.addEventListener('touchend', stopDrawing)

    clearBtn.addEventListener('click', () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      isEmpty = true
    })

    this.modal.querySelectorAll('.signature-mode-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        this.modal.querySelectorAll('.signature-mode-btn').forEach(b => {
          b.classList.remove('bg-blue-500', 'text-white')
          b.classList.add('bg-slate-200', 'dark:bg-slate-700')
        })
        btn.classList.add('bg-blue-500', 'text-white')
        btn.classList.remove('bg-slate-200', 'dark:bg-slate-700')

        const mode = btn.dataset.mode
        this.modal.querySelector('#signature-draw-panel').classList.toggle('hidden', mode !== 'draw')
        this.modal.querySelector('#signature-type-panel').classList.toggle('hidden', mode !== 'type')
        this.modal.querySelector('#signature-upload-panel').classList.toggle('hidden', mode !== 'upload')
      })
    })

    const textInput = this.modal.querySelector('#signature-text')
    const fontSelect = this.modal.querySelector('#signature-font')
    const preview = this.modal.querySelector('#signature-preview')

    const updatePreview = () => {
      preview.textContent = textInput.value || 'Your Signature'
      preview.style.fontFamily = fontSelect.value
    }

    textInput.addEventListener('input', updatePreview)
    fontSelect.addEventListener('change', updatePreview)

    const uploadBtn = this.modal.querySelector('#upload-signature-btn')
    const fileInput = this.modal.querySelector('#signature-file')
    const uploadPreview = this.modal.querySelector('#signature-upload-preview')

    uploadBtn.addEventListener('click', () => fileInput.click())
    fileInput.addEventListener('change', (e) => {
      const file = e.target.files[0]
      if (file) {
        const reader = new FileReader()
        reader.onload = (e) => {
          uploadPreview.src = e.target.result
          uploadPreview.classList.remove('hidden')
        }
        reader.readAsDataURL(file)
      }
    })

    cancelBtn.addEventListener('click', () => {
      this.modal.remove()
    })

    saveBtn.addEventListener('click', () => {
      const activeMode = this.modal.querySelector('.signature-mode-btn.bg-blue-500').dataset.mode

      if (activeMode === 'draw') {
        if (isEmpty) {
          alert('Please draw a signature first')
          return
        }
        this.saveDrawnSignature(canvas)
      } else if (activeMode === 'type') {
        if (!textInput.value.trim()) {
          alert('Please type your signature')
          return
        }
        this.saveTypedSignature(textInput.value, fontSelect.value)
      } else if (activeMode === 'upload') {
        if (!uploadPreview.src) {
          alert('Please upload a signature image')
          return
        }
        this.saveUploadedSignature(uploadPreview.src)
      }

      this.modal.remove()
    })
  }

  saveDrawnSignature(canvas) {
    const dataUrl = canvas.toDataURL('image/png')
    this.addSignatureToDocument(dataUrl, canvas.width, canvas.height)
  }

  saveTypedSignature(text, font) {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    
    ctx.font = `64px "${font}"`
    const metrics = ctx.measureText(text)
    
    canvas.width = metrics.width + 20
    canvas.height = 100

    ctx.font = `64px "${font}"`
    ctx.fillStyle = '#000000'
    ctx.textBaseline = 'middle'
    ctx.fillText(text, 10, 50)

    const dataUrl = canvas.toDataURL('image/png')
    this.addSignatureToDocument(dataUrl, canvas.width, canvas.height)
  }

  saveUploadedSignature(dataUrl) {
    const img = new Image()
    img.onload = () => {
      this.addSignatureToDocument(dataUrl, img.width, img.height)
    }
    img.src = dataUrl
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

      const signatureObj = this.createObject('image', {
        x,
        y,
        width,
        height,
        image: img,
        data: dataUrl,
        format: 'png',
        opacity: 1,
        isSignature: true
      })

      this.state.objects.push(signatureObj)
      this.state.selection = [signatureObj]

      this.emit(EVENTS.OBJECT_ADDED, { object: signatureObj })
      this.emit(EVENTS.SELECTION_CHANGED, { selection: [signatureObj] })

      this.renderer.render()
    }
    img.src = dataUrl
  }

  getCanvasPos(e, canvas) {
    const rect = canvas.getBoundingClientRect()
    return {
      x: (e.clientX - rect.left) * (canvas.width / rect.width),
      y: (e.clientY - rect.top) * (canvas.height / rect.height)
    }
  }
}