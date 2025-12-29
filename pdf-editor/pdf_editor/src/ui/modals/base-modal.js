export class BaseModal {
  constructor(eventBus) {
    this.eventBus = eventBus
    this.modal = null
    this.isOpen = false
    this.onCloseCallback = null
  }

  create(content, options = {}) {
    const {
      title = 'Modal',
      size = 'md',
      showClose = true,
      closeOnBackdrop = true,
      className = ''
    } = options

    const sizeClasses = {
      sm: 'max-w-md',
      md: 'max-w-lg',
      lg: 'max-w-2xl',
      xl: 'max-w-4xl',
      full: 'max-w-full mx-4'
    }

    this.modal = document.createElement('div')
    this.modal.className = 'fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn'
    
    this.modal.innerHTML = `
      <div class="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full ${sizeClasses[size]} ${className} animate-slideUp">
        <div class="flex items-center justify-between p-6 border-b border-slate-200 dark:border-slate-700">
          <h3 class="text-2xl font-bold text-slate-900 dark:text-white">${title}</h3>
          ${showClose ? `
            <button class="modal-close text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          ` : ''}
        </div>
        <div class="modal-body">
          ${content}
        </div>
      </div>
    `

    if (showClose) {
      const closeBtn = this.modal.querySelector('.modal-close')
      closeBtn?.addEventListener('click', () => this.close())
    }

    if (closeOnBackdrop) {
      this.modal.addEventListener('click', (e) => {
        if (e.target === this.modal) {
          this.close()
        }
      })
    }

    document.addEventListener('keydown', this.handleEscape)

    return this.modal
  }

  handleEscape = (e) => {
    if (e.key === 'Escape' && this.isOpen) {
      this.close()
    }
  }

  open() {
    if (this.modal) {
      document.body.appendChild(this.modal)
      this.isOpen = true
      document.body.style.overflow = 'hidden'
    }
  }

  close() {
    if (this.modal) {
      this.modal.style.animation = 'fadeOut 0.2s ease-in'
      setTimeout(() => {
        this.modal?.remove()
        this.isOpen = false
        document.body.style.overflow = ''
        document.removeEventListener('keydown', this.handleEscape)
        
        if (this.onCloseCallback) {
          this.onCloseCallback()
        }
      }, 200)
    }
  }

  onClose(callback) {
    this.onCloseCallback = callback
  }

  getBody() {
    return this.modal?.querySelector('.modal-body')
  }

  setContent(content) {
    const body = this.getBody()
    if (body) {
      body.innerHTML = content
    }
  }
}