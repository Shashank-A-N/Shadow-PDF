import { BaseTool } from './base-tool.js'
import { EVENTS, OCR_LANGUAGES } from '../constants.js'

export class OcrTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)
    this.worker = null
  }

  activate() {
    super.activate()
    this.startOCR()
  }

  async startOCR() {
    this.emit(EVENTS.INFO, { message: 'Starting OCR process...' })

    try {
      const canvas = document.createElement('canvas')
      const page = await this.renderer.pdfService.pdfjs.getPage(this.state.view.page)
      const viewport = page.getViewport({ scale: 2 })

      canvas.width = viewport.width
      canvas.height = viewport.height

      const ctx = canvas.getContext('2d')
      await page.render({ canvasContext: ctx, viewport }).promise

      const imageData = canvas.toDataURL('image/png')

      this.worker = await Tesseract.createWorker()
      await this.worker.loadLanguage(OCR_LANGUAGES.ENG)
      await this.worker.initialize(OCR_LANGUAGES.ENG)

      this.emit(EVENTS.INFO, { message: 'Processing image...' })

      const result = await this.worker.recognize(imageData)

      await this.worker.terminate()

      this.processOCRResult(result.data)

      this.emit(EVENTS.INFO, { message: 'OCR completed successfully' })
    } catch (error) {
      console.error('OCR failed:', error)
      this.emit(EVENTS.ERROR, { message: 'OCR processing failed', error })
      
      if (this.worker) {
        await this.worker.terminate()
      }
    }
  }

  processOCRResult(data) {
    const modal = this.createResultModal(data.text)
    document.body.appendChild(modal)
  }

  createResultModal(text) {
    const modal = document.createElement('div')
    modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50'
    modal.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-xl shadow-2xl w-full max-w-2xl p-6">
        <h3 class="text-xl font-bold mb-4">OCR Results</h3>
        <textarea class="w-full h-64 p-4 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm" readonly>${text}</textarea>
        <div class="flex justify-end gap-3 mt-4">
          <button class="copy-text px-4 py-2 bg-blue-500 text-white rounded">Copy Text</button>
          <button class="add-as-text px-4 py-2 bg-green-500 text-white rounded">Add as Text</button>
          <button class="close-modal px-4 py-2 bg-slate-200 dark:bg-slate-700 rounded">Close</button>
        </div>
      </div>
    `

    modal.querySelector('.copy-text').addEventListener('click', () => {
      navigator.clipboard.writeText(text)
      this.emit(EVENTS.INFO, { message: 'Text copied to clipboard' })
    })

    modal.querySelector('.add-as-text').addEventListener('click', () => {
      const textObj = this.createObject('text', {
        text: text,
        x: 50,
        y: 100,
        font: 'Helvetica',
        size: 12,
        color: '#000000',
        width: 0,
        height: 0
      })

      this.state.objects.push(textObj)
      this.renderer.render()
      modal.remove()
      this.emit(EVENTS.INFO, { message: 'Text added to document' })
    })

    modal.querySelector('.close-modal').addEventListener('click', () => {
      modal.remove()
    })

    return modal
  }
}