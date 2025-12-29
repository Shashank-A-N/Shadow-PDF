import { BaseModal } from './base-modal.js'
import { CONFIG } from '../../constants.js'

export class AboutModal extends BaseModal {
  constructor(eventBus) {
    super(eventBus)
  }

  show() {
    const content = this.getContent()
    this.create(content, {
      title: 'About PDF Editor Ultra',
      size: 'xl',
      className: 'about-modal',
      closeOnBackdrop: true
    })
    this.open()
    this.enhanceLayout()
    this.bindEvents()
  }

  enhanceLayout() {
    const body = this.getBody()
    if (body) {
      body.classList.add('p-0')
      const container = body.querySelector('.about-scroll')
      if (container) {
        container.scrollTop = 0
      }
    }
  }

  getContent() {
    const techStack = [
      { name: 'PDF.js', url: 'https://mozilla.github.io/pdf.js/', desc: 'PDF Rendering Engine' },
      { name: 'PDF-lib', url: 'https://pdf-lib.js.org/', desc: 'PDF Creation & Modification' },
      { name: 'Tesseract.js', url: 'https://tesseract.projectnaptha.com/', desc: 'Client-side OCR' },
      { name: 'Tailwind CSS', url: 'https://tailwindcss.com/', desc: 'Utility-first UI' }
    ]

    const features = [
      'PDF Editing', 'Annotations', 'Digital Signatures', 'Form Fields',
      'Page Management', 'OCR', 'Multi-format Export', 'Layers & Bookmarks'
    ]

    const externalLinks = [
      { name: 'View on GitHub', url: 'https://github.com/Shashank-A-N/PDF-Editor', icon: this.getIcon('github') },
      { name: 'Report a Bug', url: 'https://github.com/Shashank-A-N/PDF-Editor/issues/new', icon: this.getIcon('bug') },
      { name: 'View License', url: 'https://github.com/Shashank-A-N/PDF-Editor/blob/main/LICENSE', icon: this.getIcon('license') }
    ]

    return `
      <div class="about-scroll max-h-[75vh] overflow-y-auto">
        <div class="p-6 md:p-8 space-y-8">
          <div class="text-center">
            <div class="text-7xl md:text-8xl leading-none mb-4" role="img" aria-label="PDF Document">📄</div>
            <h2 class="text-3xl md:text-4xl font-extrabold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              PDF Editor Ultra
            </h2>
            <p class="text-slate-500 dark:text-slate-400 mt-2 font-mono text-xs md:text-sm">Version ${CONFIG.VERSION}</p>
          </div>

          <p class="text-base md:text-lg text-center text-slate-700 dark:text-slate-300 max-w-3xl mx-auto">
            A professional, feature-rich PDF editor that runs entirely in your browser. All processing is done client-side, ensuring your documents remain private and secure.
          </p>

          <section class="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 class="text-lg font-bold text-center mb-4 text-slate-800 dark:text-slate-200">Key Features</h3>
            <div class="flex flex-wrap justify-center gap-2 max-w-3xl mx-auto">
              ${features.map(f => `
                <span class="bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300 text-xs md:text-sm font-medium px-3 py-1.5 rounded-full shadow-sm">
                  ${f}
                </span>
              `).join('')}
            </div>
          </section>

          <section class="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 class="text-lg font-bold text-center mb-4 text-slate-800 dark:text-slate-200">Built With</h3>
            <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 max-w-4xl mx-auto">
              ${techStack.map(tech => `
                <a href="${tech.url}" target="_blank" rel="noopener noreferrer"
                   class="group block p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl hover:bg-white dark:hover:bg-slate-700 hover:shadow-lg transition-all duration-200 transform hover:-translate-y-0.5">
                  <div class="font-bold text-slate-800 dark:text-slate-200 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                    ${tech.name}
                  </div>
                  <div class="text-xs text-slate-500 dark:text-slate-400 mt-1">${tech.desc}</div>
                </a>
              `).join('')}
            </div>
          </section>

          <section class="pt-4 border-t border-slate-200 dark:border-slate-700">
            <h3 class="text-lg font-bold text-center mb-4 text-slate-800 dark:text-slate-200">Project Links</h3>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-2 md:gap-3 max-w-3xl mx-auto">
              ${externalLinks.map(link => `
                <a href="${link.url}" target="_blank" rel="noopener noreferrer"
                   class="flex items-center justify-center gap-2 px-4 py-3 bg-slate-100 dark:bg-slate-800 rounded-lg font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition">
                  ${link.icon}
                  <span>${link.name}</span>
                </a>
              `).join('')}
            </div>
          </section>
        </div>

        <div class="sticky bottom-0 bg-white/90 dark:bg-slate-900/90 backdrop-blur border-t border-slate-200 dark:border-slate-700 p-4">
          <div class="flex justify-center">
            <button id="about-close" class="px-8 py-3 bg-blue-500 text-white rounded-lg font-semibold hover:bg-blue-600 transition shadow-lg hover:shadow-xl">
              Close
            </button>
          </div>
        </div>
      </div>
    `
  }

  getIcon(name) {
    const icons = {
      github: `
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path fill-rule="evenodd" d="M12 2C6.48 2 2 6.49 2 12c0 4.42 2.87 8.17 6.84 9.49.5.09.66-.22.66-.49 0-.24-.01-.86-.02-1.69-2.78.61-3.36-1.34-3.36-1.34-.46-1.16-1.12-1.47-1.12-1.47-.9-.62.07-.61.07-.61 1 .07 1.53 1.03 1.53 1.03.89 1.53 2.34 1.09 2.91.83.09-.65.35-1.09.64-1.34-2.22-.25-4.56-1.11-4.56-4.95 0-1.09.39-1.99 1.03-2.69-.1-.25-.45-1.27.1-2.65 0 0 .84-.27 2.75 1.03A9.6 9.6 0 0112 6.84c.86 0 1.7.11 2.5.33 1.9-1.3 2.75-1.03 2.75-1.03.54 1.38.2 2.4.1 2.65.64.7 1.03 1.6 1.03 2.69 0 3.84-2.34 4.69-4.57 4.94.36.31.68.92.68 1.86 0 1.34-.01 2.42-.01 2.74 0 .27.18.58.69.49A10.01 10.01 0 0022 12c0-5.51-4.49-10-10-10z" clip-rule="evenodd"/>
        </svg>
      `,
      bug: `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-1 12a2 2 0 01-2 2H8a2 2 0 01-2-2L5 7m6-3v4m0 0h4m-4 0H7" />
        </svg>
      `,
      license: `
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.59a1 1 0 01.7.29l5.42 5.42a1 1 0 01.29.7V19a2 2 0 01-2 2z"/>
        </svg>
      `
    }
    return icons[name] || ''
  }

  bindEvents() {
    this.modal.querySelector('#about-close')?.addEventListener('click', () => this.close())
  }
}