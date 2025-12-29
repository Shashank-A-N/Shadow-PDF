import { EVENTS } from '../constants.js'

export class ContextMenu {
  constructor(state, elements, eventBus, history, renderer) {
    this.state = state
    this.els = elements
    this.eventBus = eventBus
    this.history = history
    this.renderer = renderer
    this.visible = false
  }

  init() {
    this.els.objectsCanvas.addEventListener('contextmenu', (e) => {
      e.preventDefault()
      this.show(e.clientX, e.clientY)
    })

    document.addEventListener('click', () => {
      if (this.visible) {
        this.hide()
      }
    })

    this.bindActions()
  }

  show(x, y) {
    const menu = this.els.contextMenu
    if (!menu) return

    menu.innerHTML = this.getMenuItems()
    menu.style.left = x + 'px'
    menu.style.top = y + 'px'
    menu.classList.remove('hidden')
    this.visible = true

    this.ensureOnScreen(menu, x, y)
    this.bindMenuActions()
  }

  hide() {
    if (this.els.contextMenu) {
      this.els.contextMenu.classList.add('hidden')
      this.visible = false
    }
  }

  getMenuItems() {
    const hasSelection = this.state.selection.length > 0
    const hasClipboard = this.state.clipboard.length > 0

    return `
      <div class="menu-item ${!hasSelection ? 'opacity-50 pointer-events-none' : ''}" data-action="cut">
        <i class="w-4 inline-block">✂</i> Cut
        <span class="ml-auto text-xs text-slate-400">Ctrl+X</span>
      </div>
      <div class="menu-item ${!hasSelection ? 'opacity-50 pointer-events-none' : ''}" data-action="copy">
        <i class="w-4 inline-block">⎘</i> Copy
        <span class="ml-auto text-xs text-slate-400">Ctrl+C</span>
      </div>
      <div class="menu-item ${!hasClipboard ? 'opacity-50 pointer-events-none' : ''}" data-action="paste">
        <i class="w-4 inline-block">📋</i> Paste
        <span class="ml-auto text-xs text-slate-400">Ctrl+V</span>
      </div>
      <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <div class="menu-item ${!hasSelection ? 'opacity-50 pointer-events-none' : ''}" data-action="delete">
        <i class="w-4 inline-block">🗑</i> Delete
        <span class="ml-auto text-xs text-slate-400">Del</span>
      </div>
      <div class="menu-item ${!hasSelection ? 'opacity-50 pointer-events-none' : ''}" data-action="duplicate">
        <i class="w-4 inline-block">⎘</i> Duplicate
        <span class="ml-auto text-xs text-slate-400">Ctrl+D</span>
      </div>
      <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <div class="menu-item ${!hasSelection ? 'opacity-50 pointer-events-none' : ''}" data-action="bring-front">
        <i class="w-4 inline-block">⬆</i> Bring to Front
      </div>
      <div class="menu-item ${!hasSelection ? 'opacity-50 pointer-events-none' : ''}" data-action="bring-forward">
        <i class="w-4 inline-block">↑</i> Bring Forward
      </div>
      <div class="menu-item ${!hasSelection ? 'opacity-50 pointer-events-none' : ''}" data-action="send-backward">
        <i class="w-4 inline-block">↓</i> Send Backward
      </div>
      <div class="menu-item ${!hasSelection ? 'opacity-50 pointer-events-none' : ''}" data-action="send-back">
        <i class="w-4 inline-block">⬇</i> Send to Back
      </div>
      <div class="h-px bg-slate-200 dark:bg-slate-700 my-1"></div>
      <div class="menu-item" data-action="select-all">
        <i class="w-4 inline-block">☑</i> Select All
        <span class="ml-auto text-xs text-slate-400">Ctrl+A</span>
      </div>
      <div class="menu-item ${this.state.selection.length <= 1 ? 'opacity-50 pointer-events-none' : ''}" data-action="group">
        <i class="w-4 inline-block">▣</i> Group
      </div>
    `
  }

  bindMenuActions() {
    const items = this.els.contextMenu.querySelectorAll('.menu-item')
    items.forEach(item => {
      item.addEventListener('click', (e) => {
        const action = item.dataset.action
        this.executeAction(action)
        this.hide()
      })
    })
  }

  bindActions() {}

  executeAction(action) {
    switch (action) {
      case 'cut':
        this.cut()
        break
      case 'copy':
        this.copy()
        break
      case 'paste':
        this.paste()
        break
      case 'delete':
        this.delete()
        break
      case 'duplicate':
        this.duplicate()
        break
      case 'bring-front':
        this.bringToFront()
        break
      case 'bring-forward':
        this.bringForward()
        break
      case 'send-backward':
        this.sendBackward()
        break
      case 'send-back':
        this.sendToBack()
        break
      case 'select-all':
        this.selectAll()
        break
      case 'group':
        this.group()
        break
    }
  }

  cut() {
    this.copy()
    this.delete()
  }

  copy() {
    if (this.state.selection.length === 0) return

    this.state.clipboard = this.state.selection.map(obj => {
      const clone = JSON.parse(JSON.stringify(obj))
      if (obj.image) {
        clone.image = obj.image
      }
      return clone
    })

    this.eventBus.emit(EVENTS.INFO, { message: `Copied ${this.state.selection.length} object(s)` })
  }

  paste() {
    if (this.state.clipboard.length === 0) return

    const newObjects = this.state.clipboard.map(obj => {
      const clone = JSON.parse(JSON.stringify(obj))
      clone.id = this.generateId()
      clone.x = (clone.x || 0) + 20
      clone.y = (clone.y || 0) + 20
      clone.page = this.state.view.page

      if (obj.image) {
        clone.image = obj.image
      }

      return clone
    })

    this.state.objects.push(...newObjects)
    this.state.selection = newObjects
    this.history.checkpoint('Paste')
    this.renderer.render()
    this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: newObjects })
    this.eventBus.emit(EVENTS.INFO, { message: `Pasted ${newObjects.length} object(s)` })
  }

  delete() {
    if (this.state.selection.length === 0) return

    const count = this.state.selection.length

    this.state.selection.forEach(obj => {
      const index = this.state.objects.indexOf(obj)
      if (index >= 0) {
        this.state.objects.splice(index, 1)
      }
    })

    this.state.selection = []
    this.history.checkpoint('Delete')
    this.renderer.render()
    this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: [] })
    this.eventBus.emit(EVENTS.INFO, { message: `Deleted ${count} object(s)` })
  }

  duplicate() {
    if (this.state.selection.length === 0) return

    const clones = this.state.selection.map(obj => {
      const clone = JSON.parse(JSON.stringify(obj))
      clone.id = this.generateId()
      clone.x = (clone.x || 0) + 10
      clone.y = (clone.y || 0) + 10

      if (obj.image) {
        clone.image = obj.image
      }

      return clone
    })

    this.state.objects.push(...clones)
    this.state.selection = clones
    this.history.checkpoint('Duplicate')
    this.renderer.render()
    this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: clones })
  }

  bringToFront() {
    if (this.state.selection.length === 0) return

    this.state.selection.forEach(obj => {
      const index = this.state.objects.indexOf(obj)
      if (index >= 0) {
        this.state.objects.splice(index, 1)
        this.state.objects.push(obj)
      }
    })

    this.history.checkpoint('Bring to front')
    this.renderer.render()
  }

  bringForward() {
    if (this.state.selection.length === 0) return

    for (let i = this.state.objects.length - 1; i >= 0; i--) {
      const obj = this.state.objects[i]
      if (this.state.selection.includes(obj) && i < this.state.objects.length - 1) {
        [this.state.objects[i], this.state.objects[i + 1]] = 
        [this.state.objects[i + 1], this.state.objects[i]]
      }
    }

    this.history.checkpoint('Bring forward')
    this.renderer.render()
  }

  sendBackward() {
    if (this.state.selection.length === 0) return

    for (let i = 0; i < this.state.objects.length; i++) {
      const obj = this.state.objects[i]
      if (this.state.selection.includes(obj) && i > 0) {
        [this.state.objects[i], this.state.objects[i - 1]] = 
        [this.state.objects[i - 1], this.state.objects[i]]
      }
    }

    this.history.checkpoint('Send backward')
    this.renderer.render()
  }

  sendToBack() {
    if (this.state.selection.length === 0) return

    this.state.selection.forEach(obj => {
      const index = this.state.objects.indexOf(obj)
      if (index >= 0) {
        this.state.objects.splice(index, 1)
        this.state.objects.unshift(obj)
      }
    })

    this.history.checkpoint('Send to back')
    this.renderer.render()
  }

  selectAll() {
    this.state.selection = this.state.objects.filter(obj => obj.page === this.state.view.page)
    this.renderer.render()
    this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: this.state.selection })
  }

  group() {
    if (this.state.selection.length <= 1) return
  }

  ensureOnScreen(menu, x, y) {
    const rect = menu.getBoundingClientRect()
    
    if (rect.right > window.innerWidth) {
      menu.style.left = (window.innerWidth - rect.width - 10) + 'px'
    }
    
    if (rect.bottom > window.innerHeight) {
      menu.style.top = (window.innerHeight - rect.height - 10) + 'px'
    }
  }

  generateId() {
    return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
  }
}