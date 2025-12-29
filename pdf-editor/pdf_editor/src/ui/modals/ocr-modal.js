import { BaseModal } from './base-modal.js'
import { EVENTS, OCR_LANGUAGES } from '../../constants.js'

export class OcrModal extends BaseModal {
  constructor(state, eventBus, renderer, pdfService) {
    super(eventBus)
    this.state = state
    this.renderer = renderer
    this.pdfService = pdfService
    this.worker = null
    this.isProcessing = false
  }

  show() {
    const content = this.getContent()
    this.create(content, {
      title: 'OCR Text Recognition',
      size: 'lg',
      closeOnBackdrop: false
    })

    this.open()
    this.bindEvents()
  }

  getContent() {
    return `
      <div class="p-6 space-y-6">
        <div id="ocr-setup" class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Language</label>
            <select id="ocr-language" class="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:border-blue-500 outline-none">
              <option value="${OCR_LANGUAGES.ENG}">English</option>
              <option value="${OCR_LANGUAGES.SPA}">Spanish</option>
              <option value="${OCR_LANGUAGES.FRA}">French</option>
              <option value="${OCR_LANGUAGES.DEU}">German</option>
              <option value="${OCR_LANGUAGES.ITA}">Italian</option>
              <option value="${OCR_LANGUAGES.POR}">Portuguese</option>
              <option value="${OCR_LANGUAGES.RUS}">Russian</option>
              <option value="${OCR_LANGUAGES.CHI_SIM}">Chinese (Simplified)</option>
              <option value="${OCR_LANGUAGES.JPN}">Japanese</option>
              <option value="${OCR_LANGUAGES.KOR}">Korean</option>
              <option value="${OCR_LANGUAGES.ARA}">Arabic</option>
            </select>
          </div>

          <div>
            <label class="block text-sm font-medium mb-2">Pages to Process</label>
            <div class="space-y-2">
              <label class="flex items-center gap-2">
                <input type="radio" name="ocr-range" value="current" checked class="w-4 h-4 text-blue-500">
                <span class="text-sm">Current page only (Page ${this.state.view.page})</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="ocr-range" value="all" class="w-4 h-4 text-blue-500">
                <span class="text-sm">All pages (${this.state.document.pages} pages)</span>
              </label>
            </div>
          </div>

          <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
              </svg>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-yellow-900 dark:text-yellow-100 mb-1">Processing Time</h4>
                <p class="text-sm text-yellow-700 dark:text-yellow-300">
                  OCR processing may take several seconds per page. Please be patient.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div id="ocr-progress" class="hidden space-y-4">
          <div class="flex items-center justify-center py-8">
            <div class="relative">
              <div class="w-20 h-20 border-4 border-slate-200 dark:border-slate-700 rounded-full"></div>
              <div class="absolute top-0 left-0 w-20 h-20 border-4 border-t-blue-500 rounded-full animate-spin"></div>
            </div>
          </div>

          <div>
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm font-medium">Processing...</span>
              <span id="ocr-percentage" class="text-sm font-mono">0%</span>
            </div>
            <div class="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-3">
              <div id="ocr-progress-bar" class="bg-blue-500 h-3 rounded-full transition-all duration-300" style="width: 0%"></div>
            </div>
          </div>

          <p id="ocr-status" class="text-sm text-center text-slate-600 dark:text-slate-400">
            Initializing OCR engine...
          </p>
        </div>

        <div id="ocr-results" class="hidden space-y-4">
          <div>
            <div class="flex justify-between items-center mb-2">
              <label class="text-sm font-medium">Extracted Text</label>
              <span id="word-count" class="text-xs text-slate-500 dark:text-slate-400"></span>
            </div>
            <textarea id="ocr-text" class="w-full h-64 px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 font-mono text-sm resize-none focus:border-blue-500 outline-none" readonly></textarea>
          </div>

          <div class="flex gap-3">
            <button id="copy-text" class="flex-1 px-4 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition">
              <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
              </svg>
              Copy Text
            </button>
            <button id="add-text-layer" class="flex-1 px-4 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg hover:shadow-xl">
              <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
              Add as Text
            </button>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button id="cancel-ocr" class="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition">
            Cancel
          </button>
          <button id="start-ocr" class="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg hover:shadow-xl">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
            </svg>
            Start OCR
          </button>
        </div>
      </div>
    `
  }

  bindEvents() {
    document.getElementById('cancel-ocr')?.addEventListener('click', () => {
      if (this.isProcessing && this.worker) {
        this.worker.terminate()
        this.isProcessing = false
      }
      this.close()
    })

    document.getElementById('start-ocr')?.addEventListener('click', () => this.startOCR())
    document.getElementById('copy-text')?.addEventListener('click', () => this.copyText())
    document.getElementById('add-text-layer')?.addEventListener('click', () => this.addTextLayer())
  }

  async startOCR() {
    const language = document.getElementById('ocr-language').value
    const range = document.querySelector('input[name="ocr-range"]:checked').value

    document.getElementById('ocr-setup').classList.add('hidden')
    document.getElementById('ocr-progress').classList.remove('hidden')
    document.getElementById('start-ocr').disabled = true

    this.isProcessing = true

    try {
      const pages = range === 'all' 
        ? Array.from({ length: this.state.document.pages }, (_, i) => i + 1)
        : [this.state.view.page]

      let allText = ''

      for (let i = 0; i < pages.length; i++) {
        const pageNum = pages[i]
        const percentage = Math.round(((i + 1) / pages.length) * 100)

        this.updateProgress(percentage, `Processing page ${pageNum} of ${pages.length}...`)

        const text = await this.processPage(pageNum, language)
        allText += `\n=== Page ${pageNum} ===\n${text}\n`
      }

      this.showResults(allText.trim())

    } catch (error) {
      console.error('OCR failed:', error)
      this.eventBus.emit(EVENTS.ERROR, { message: 'OCR processing failed', error })
      this.close()
    } finally {
      this.isProcessing = false
    }
  }

  async processPage(pageNum, language) {
    const canvas = document.createElement('canvas')
    const page = await this.pdfService.pdfjs.getPage(pageNum)
    const viewport = page.getViewport({ scale: 2 })

    canvas.width = viewport.width
    canvas.height = viewport.height

    const ctx = canvas.getContext('2d')
    await page.render({ canvasContext: ctx, viewport }).promise

    const imageData = canvas.toDataURL('image/png')

    if (!this.worker) {
      this.worker = await Tesseract.createWorker()
      await this.worker.loadLanguage(language)
      await this.worker.initialize(language)
    }

    const result = await this.worker.recognize(imageData)
    return result.data.text
  }

  updateProgress(percentage, status) {
    const progressBar = document.getElementById('ocr-progress-bar')
    const percentageLabel = document.getElementById('ocr-percentage')
    const statusLabel = document.getElementById('ocr-status')

    if (progressBar) progressBar.style.width = `${percentage}%`
    if (percentageLabel) percentageLabel.textContent = `${percentage}%`
    if (statusLabel) statusLabel.textContent = status
  }

  showResults(text) {
    document.getElementById('ocr-progress').classList.add('hidden')
    document.getElementById('ocr-results').classList.remove('hidden')

    const textarea = document.getElementById('ocr-text')
    textarea.value = text

    const wordCount = text.split(/\s+/).filter(w => w.length > 0).length
    document.getElementById('word-count').textContent = `${wordCount} words`

    if (this.worker) {
      this.worker.terminate()
      this.worker = null
    }
  }

  copyText() {
    const textarea = document.getElementById('ocr-text')
    textarea.select()
    document.execCommand('copy')
    this.eventBus.emit(EVENTS.INFO, { message: 'Text copied to clipboard' })
  }

  addTextLayer() {
    const text = document.getElementById('ocr-text').value

    if (!text.trim()) {
      this.eventBus.emit(EVENTS.WARNING, { message: 'No text to add' })
      return
    }

    const textObj = {
      id: this.generateId(),
      type: 'text',
      page: this.state.view.page,
      layerId: this.state.layers[this.state.currentLayer]?.id,
      text: text,
      x: 50,
      y: 100,
      font: 'Helvetica',
      size: 12,
      color: '#000000',
      bold: false,
      italic: false,
      underline: false,
      created: Date.now(),
      modified: Date.now()
    }

    this.state.objects.push(textObj)
    this.eventBus.emit(EVENTS.OBJECT_ADDED, { object: textObj })
    this.renderer.render()
    this.close()

    this.eventBus.emit(EVENTS.INFO, { message: 'Text added to document' })
  }

  generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }
}