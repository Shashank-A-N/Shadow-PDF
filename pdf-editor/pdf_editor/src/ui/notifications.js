import { EVENTS } from '../constants.js'

export class Notifications {
  constructor(eventBus) {
    this.eventBus = eventBus
    this.container = document.getElementById('notification-container')
  }

  init() {
    this.eventBus.on(EVENTS.INFO, (data) => {
      this.show(data.message, 'info')
    })

    this.eventBus.on(EVENTS.WARNING, (data) => {
      this.show(data.message, 'warning')
    })

    this.eventBus.on(EVENTS.ERROR, (data) => {
      this.show(data.message, 'error')
    })

    this.eventBus.on(EVENTS.DOCUMENT_SAVED, (data) => {
      this.show(`Saved ${data.name}`, 'success')
    })
  }

  show(message, type = 'info', duration = 3000) {
    const notification = document.createElement('div')
    notification.className = `notification ${type} flex items-start gap-3 bg-white dark:bg-slate-800 rounded-lg shadow-lg p-4 border-l-4 mb-2`

    const icon = this.getIcon(type)
    const color = this.getColor(type)

    notification.classList.add(`border-${color}`)

    notification.innerHTML = `
      <div class="flex-shrink-0 text-${color} text-xl">
        ${icon}
      </div>
      <div class="flex-1">
        <p class="text-sm font-medium text-slate-900 dark:text-slate-100">${message}</p>
      </div>
      <button class="flex-shrink-0 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
        ✕
      </button>
    `

    const closeBtn = notification.querySelector('button')
    closeBtn.addEventListener('click', () => {
      this.hide(notification)
    })

    this.container.appendChild(notification)

    setTimeout(() => {
      notification.style.animation = 'slideUp 0.3s ease-out'
    }, 10)

    if (duration > 0) {
      setTimeout(() => {
        this.hide(notification)
      }, duration)
    }
  }

  hide(notification) {
    notification.style.animation = 'fadeOut 0.2s ease-in'
    setTimeout(() => {
      notification.remove()
    }, 200)
  }

  getIcon(type) {
    const icons = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    }
    return icons[type] || icons.info
  }

  getColor(type) {
    const colors = {
      info: 'blue-500',
      success: 'green-500',
      warning: 'yellow-500',
      error: 'red-500'
    }
    return colors[type] || colors.info
  }
}