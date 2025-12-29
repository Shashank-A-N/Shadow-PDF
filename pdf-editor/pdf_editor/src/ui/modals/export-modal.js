import { BaseModal } from './base-modal.js'
import { EXPORT_FORMATS, EVENTS } from '../../constants.js'

export class ExportModal extends BaseModal {
  constructor(state, eventBus, pdfService) {
    super(eventBus)
    this.state = state
    this.pdfService = pdfService
    this.exporter = pdfService.exporter
  }

  show() {
    const content = this.getContent()
    this.create(content, {
      title: 'Export Document',
      size: 'lg'
    })

    this.open()
    this.bindEvents()
  }

  getContent() {
    return `
      <div class="p-6 space-y-6">
        <div class="space-y-4">
          <div>
            <label class="block text-sm font-medium mb-2">Export Format</label>
            <select id="export-format" class="w-full px-4 py-3 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 focus:border-blue-500 outline-none">
              <option value="pdf">PDF Document</option>
              <option value="png">PNG Images</option>
              <option value="jpg">JPG Images</option>
              <option value="svg">SVG Vector</option>
              <option value="html">HTML Document</option>
            </select>
          </div>

          <div id="pdf-options">
            <label class="block text-sm font-medium mb-3">PDF Options</label>
            <div class="space-y-3 pl-4">
              <label class="flex items-center gap-2">
                <input type="checkbox" id="compress-pdf" checked class="w-4 h-4 text-blue-500 rounded">
                <span class="text-sm">Compress PDF (smaller file size)</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" id="flatten-pdf" class="w-4 h-4 text-blue-500 rounded">
                <span class="text-sm">Flatten all annotations</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="checkbox" id="pdf-a" class="w-4 h-4 text-blue-500 rounded">
                <span class="text-sm">PDF/A compliant (archival)</span>
              </label>
            </div>
          </div>

          <div id="image-options" class="hidden">
            <label class="block text-sm font-medium mb-3">Image Options</label>
            <div class="space-y-4 pl-4">
              <div>
                <div class="flex justify-between items-center mb-2">
                  <label class="text-sm">Quality</label>
                  <span id="quality-value" class="text-sm font-mono">92%</span>
                </div>
                <input type="range" id="image-quality" min="10" max="100" value="92" class="w-full">
              </div>
              <div>
                <label class="text-sm mb-2 block">DPI (Resolution)</label>
                <select id="image-dpi" class="w-full px-4 py-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900">
                  <option value="72">72 DPI (Screen)</option>
                  <option value="150">150 DPI (Web)</option>
                  <option value="300" selected>300 DPI (Print)</option>
                  <option value="600">600 DPI (High Quality)</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label class="block text-sm font-medium mb-3">Pages to Export</label>
            <div class="space-y-2 pl-4">
              <label class="flex items-center gap-2">
                <input type="radio" name="page-range" value="all" checked class="w-4 h-4 text-blue-500">
                <span class="text-sm">All pages (${this.state.document.pages} pages)</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="page-range" value="current" class="w-4 h-4 text-blue-500">
                <span class="text-sm">Current page only (Page ${this.state.view.page})</span>
              </label>
              <label class="flex items-center gap-2">
                <input type="radio" name="page-range" value="custom" class="w-4 h-4 text-blue-500">
                <span class="text-sm">Custom range</span>
              </label>
              <input type="text" id="custom-range" placeholder="e.g., 1-3, 5, 7-9" class="w-full px-4 py-2 mt-2 border-2 border-slate-300 dark:border-slate-600 rounded-lg bg-white dark:bg-slate-900 hidden">
            </div>
          </div>

          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <div class="flex items-start gap-3">
              <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"/>
              </svg>
              <div class="flex-1">
                <h4 class="text-sm font-medium text-blue-900 dark:text-blue-100 mb-1">Export Information</h4>
                <p id="export-info" class="text-sm text-blue-700 dark:text-blue-300">
                  Your document will be exported with all annotations and objects.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div class="flex justify-end gap-3 pt-4 border-t border-slate-200 dark:border-slate-700">
          <button id="cancel-export" class="px-6 py-3 bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg font-semibold hover:bg-slate-300 dark:hover:bg-slate-600 transition">
            Cancel
          </button>
          <button id="confirm-export" class="px-6 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg hover:shadow-xl">
            <svg class="w-5 h-5 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"/>
            </svg>
            Export
          </button>
        </div>
      </div>
    `
  }

  bindEvents() {
    const formatSelect = document.getElementById('export-format')
    const pdfOptions = document.getElementById('pdf-options')
    const imageOptions = document.getElementById('image-options')
    const qualityInput = document.getElementById('image-quality')
    const qualityValue = document.getElementById('quality-value')
    const customRangeRadio = document.querySelector('input[name="page-range"][value="custom"]')
    const customRangeInput = document.getElementById('custom-range')

    formatSelect?.addEventListener('change', (e) => {
      const format = e.target.value
      pdfOptions.classList.toggle('hidden', format !== 'pdf')
      imageOptions.classList.toggle('hidden', !['png', 'jpg'].includes(format))
      this.updateExportInfo(format)
    })

    qualityInput?.addEventListener('input', (e) => {
      qualityValue.textContent = `${e.target.value}%`
    })

    customRangeRadio?.addEventListener('change', () => {
      customRangeInput.classList.toggle('hidden', !customRangeRadio.checked)
    })

    document.querySelectorAll('input[name="page-range"]').forEach(radio => {
      radio.addEventListener('change', () => {
        customRangeInput.classList.toggle('hidden', !customRangeRadio.checked)
      })
    })

    document.getElementById('cancel-export')?.addEventListener('click', () => this.close())
    document.getElementById('confirm-export')?.addEventListener('click', () => this.handleExport())
  }

  updateExportInfo(format) {
    const info = document.getElementById('export-info')
    const messages = {
      pdf: 'Your document will be exported as a PDF with all annotations and objects.',
      png: 'Each page will be exported as a high-quality PNG image.',
      jpg: 'Each page will be exported as a JPG image. Transparency will be replaced with white.',
      svg: 'Pages will be exported as vector SVG files (text and shapes only).',
      html: 'Document will be converted to HTML with extracted text content.'
    }
    info.textContent = messages[format] || messages.pdf
  }

  async handleExport() {
    const format = document.getElementById('export-format').value
    const pageRange = document.querySelector('input[name="page-range"]:checked').value

    this.eventBus.emit(EVENTS.INFO, { message: 'Preparing export...' })
    this.close()

    try {
      if (format === 'pdf') {
        await this.exportPDF()
      } else if (format === 'png' || format === 'jpg') {
        await this.exportImages(format)
      } else if (format === 'svg') {
        await this.exportSVG()
      } else if (format === 'html') {
        await this.exportHTML()
      }

      this.eventBus.emit(EVENTS.INFO, { message: 'Export completed successfully' })
    } catch (error) {
      console.error('Export failed:', error)
      this.eventBus.emit(EVENTS.ERROR, { message: 'Export failed', error })
    }
  }

  async exportPDF() {
    const compress = document.getElementById('compress-pdf').checked
    const flatten = document.getElementById('flatten-pdf').checked
    const pdfA = document.getElementById('pdf-a').checked

    const blob = await this.exporter.exportToPdf({
      compress,
      flatten,
      pdfA,
      includeObjects: true
    })

    await this.exporter.downloadBlob(blob, this.state.document.name || 'document.pdf')
  }

  async exportImages(format) {
    const quality = parseInt(document.getElementById('image-quality').value) / 100
    const dpi = parseInt(document.getElementById('image-dpi').value)

    const images = await this.exporter.exportToImages(format, quality, dpi)

    for (const img of images) {
      await this.exporter.downloadBlob(img.blob, img.name)
      await this.delay(100)
    }
  }

  async exportSVG() {
    const svgs = await this.exporter.exportToSvg()

    for (const svg of svgs) {
      const blob = new Blob([svg.svg], { type: 'image/svg+xml' })
      await this.exporter.downloadBlob(blob, svg.name)
      await this.delay(100)
    }
  }

  async exportHTML() {
    const blob = await this.exporter.exportToHtml()
    const filename = this.state.document.name.replace('.pdf', '.html')
    await this.exporter.downloadBlob(blob, filename)
  }

  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
}