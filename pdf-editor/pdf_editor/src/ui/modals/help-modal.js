import { BaseModal } from './base-modal.js'

export class HelpModal extends BaseModal {
  constructor(eventBus) {
    super(eventBus)
  }

  show() {
    const content = this.getContent()
    this.create(content, {
      title: 'Help & Documentation',
      size: 'xl'
    })

    this.open()
    // Add event listener for the new copy button
    this.attachCopyHandler()
  }

  /**
   * Attaches the click event listener to the copy email button.
   */
  attachCopyHandler() {
    const copyButton = document.getElementById('copy-email-btn')
    const emailAddress = document.getElementById('support-email-address')
    if (!copyButton || !emailAddress) return

    copyButton.addEventListener('click', () => {
      const email = emailAddress.textContent

      // Use the modern Navigator Clipboard API
      navigator.clipboard.writeText(email).then(() => {
        // Success! Show feedback to the user
        const originalText = copyButton.textContent
        copyButton.textContent = 'Copied!'
        copyButton.disabled = true

        // Reset button text after 2 seconds
        setTimeout(() => {
          copyButton.textContent = originalText
          copyButton.disabled = false
        }, 2000)
      }).catch(err => {
        // Handle error (e.g., if permissions are denied)
        console.error('Failed to copy email: ', err)
        copyButton.textContent = 'Failed'
        setTimeout(() => {
          copyButton.textContent = 'Copy'
        }, 2000)
      })
    })
  }

  getContent() {
    return `
      <div class="p-6 space-y-6 max-h-[70vh] overflow-y-auto">
        <section>
          <h3 class="text-xl font-bold mb-4">Getting Started</h3>
          <div class="space-y-3 text-sm">
            <p>PDF Editor Ultra is a comprehensive tool for editing PDF documents directly in your browser.</p>
            <ol class="list-decimal list-inside space-y-2 pl-4">
              <li>Click "Open PDF" or drag and drop a PDF file</li>
              <li>Use the toolbar to select editing tools</li>
              <li>Add text, shapes, images, and annotations</li>
              <li>Save your edited PDF when done</li>
            </ol>
          </div>
        </section>

        <section>
          <h3 class="text-xl font-bold mb-4">Tools Overview</h3>
          <div class="grid grid-cols-2 gap-4">
            ${this.getToolsHTML()}
          </div>
        </section>

        <section>
          <h3 class="text-xl font-bold mb-4">Keyboard Shortcuts</h3>
          <div class="grid grid-cols-2 gap-3 text-sm">
            ${this.getShortcutsHTML()}
          </div>
        </section>

        <section>
          <h3 class="text-xl font-bold mb-4">Tips & Tricks</h3>
          <ul class="space-y-2 text-sm list-disc list-inside">
            <li>Hold Shift while drawing shapes to maintain aspect ratio</li>
            <li>Use Ctrl+Click to select multiple objects</li>
            <li>Double-click text objects to edit them quickly</li>
            <li>Right-click on objects for more options</li>
            <li>Use the grid and snap features for precise alignment</li>
            <li>Layers help organize complex documents</li>
          </ul>
        </section>

        <section>
          <h3 class="text-xl font-bold mb-4">Troubleshooting</h3>
          <div class="space-y-3 text-sm">
            <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 class="font-semibold mb-2">PDF won't load?</h4>
              <p>Make sure the file is a valid PDF and not corrupted. Try with a different PDF file.</p>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 class="font-semibold mb-2">Performance issues?</h4>
              <p>Try reducing the render quality in settings or close other browser tabs.</p>
            </div>
            <div class="bg-slate-50 dark:bg-slate-800 p-4 rounded-lg">
              <h4 class="font-semibold mb-2">Can't save changes?</h4>
              <p>Check your browser's download permissions and available disk space.</p>
            </div>
          </div>
        </section>

        <section>
          <h3 class="text-xl font-bold mb-4">Need More Help?</h3>
          <div class="space-y-6">
            
            <div>
              <h4 class="text-lg font-semibold mb-2">Read the Docs</h4>
              <p class="text-sm mb-3 text-slate-600 dark:text-slate-400">Browse the full documentation for in-depth guides and API references.</p>
              <a href="documentation.html" class="inline-block w-full sm:w-auto px-4 py-3 bg-blue-500 text-white rounded-lg text-center font-semibold hover:bg-blue-600 transition" target="_blank">
                View Documentation
              </a>
            </div>

            <div>
              <h4 class="text-lg font-semibold mb-2">Contact Support</h4>
              <p class="text-sm mb-3 text-slate-600 dark:text-slate-400">For issues or questions, please email us directly. Click the button to copy the address.</p>
              <div class="flex flex-col sm:flex-row gap-2 p-3 rounded-lg bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700">
                <span class="flex-1 text-sm font-medium text-slate-700 dark:text-slate-300 my-auto break-all" id="support-email-address">shashankan077@gmail.com</span>
                <button id="copy-email-btn" class="flex-shrink-0 px-3 py-1.5 bg-blue-500 text-white rounded-md text-xs font-semibold hover:bg-blue-600 transition">
                  Copy
                </button>
              </div>
            </div>

          </div>
        </section>
      </div>
    `
  }

  getToolsHTML() {
    const tools = [
      { icon: '✓', name: 'Select', desc: 'Select and move objects' },
      { icon: '✋', name: 'Hand', desc: 'Pan around the document' },
      { icon: 'T', name: 'Text', desc: 'Add text annotations' },
      { icon: '✎', name: 'Draw', desc: 'Free-form drawing' },
      { icon: 'H', name: 'Highlight', desc: 'Highlight areas' },
      { icon: '▭', name: 'Rectangle', desc: 'Draw rectangles' },
      { icon: '○', name: 'Oval', desc: 'Draw circles/ovals' },
      { icon: '/', name: 'Line', desc: 'Draw straight lines' },
      { icon: '🖼', name: 'Image', desc: 'Insert images' },
      { icon: '✍', name: 'Signature', desc: 'Add signatures' },
      { icon: '📋', name: 'Form', desc: 'Create form fields' },
      { icon: '👁', name: 'OCR', desc: 'Extract text from images' }
    ]

    return tools.map(t => `
      <div class="flex items-start gap-3 p-3 rounded-lg bg-slate-50 dark:bg-slate-800">
        <span class="text-2xl">${t.icon}</span>
        <div>
          <div class="font-semibold">${t.name}</div>
          <div class="text-xs text-slate-600 dark:text-slate-400">${t.desc}</div>
        </div>
      </div>
    `).join('')
  }

  getShortcutsHTML() {
    const shortcuts = [
      ['Save', 'Ctrl+S'],
      ['Undo', 'Ctrl+Z'],
      ['Redo', 'Ctrl+Y'],
      ['Copy', 'Ctrl+C'],
      ['Paste', 'Ctrl+V'],
      ['Delete', 'Del'],
      ['Select Tool', 'V'],
      ['Hand Tool', 'H'],
      ['Text Tool', 'T'],
      ['Draw Tool', 'P']
    ]

    return shortcuts.map(([action, key]) => `
      <div class="flex justify-between items-center py-2">
        <span>${action}</span>
        <kbd class="px-2 py-1">${key}</kbd>
      </div>
    `).join('')
  }
}