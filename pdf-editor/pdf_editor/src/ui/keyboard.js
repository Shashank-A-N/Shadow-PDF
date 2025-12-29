import { KEYBOARD_SHORTCUTS, EVENTS } from '../constants.js'

export class KeyboardManager {
  constructor(state, eventBus, toolManager, history) {
    this.state = state
    this.eventBus = eventBus
    this.toolManager = toolManager
    this.history = history
    this.handlers = new Map()
  }

  init() {
    document.addEventListener('keydown', (e) => this.handleKeyDown(e))
    this.setupDefaultHandlers()
  }

  setupDefaultHandlers() {
    this.register('save', () => {
      this.eventBus.emit('action:save')
    })

    this.register('open', () => {
      this.eventBus.emit('action:open')
    })

    this.register('undo', () => {
      this.history.undo()
      this.eventBus.emit('renderer:render')
    })

    this.register('redo', () => {
      this.history.redo()
      this.eventBus.emit('renderer:render')
    })

    this.register('copy', () => {
      if (this.toolManager.activeTool) {
        this.toolManager.activeTool.copy()
      }
    })

    this.register('paste', () => {
      if (this.toolManager.activeTool) {
        this.toolManager.activeTool.paste()
        this.history.checkpoint('Paste')
        this.eventBus.emit('renderer:render')
      }
    })

    this.register('cut', () => {
      if (this.toolManager.activeTool) {
        this.toolManager.activeTool.cut()
        this.history.checkpoint('Cut')
        this.eventBus.emit('renderer:render')
      }
    })

    this.register('delete', () => {
      if (this.toolManager.activeTool) {
        this.toolManager.activeTool.deleteSelection()
        this.history.checkpoint('Delete')
        this.eventBus.emit('renderer:render')
      }
    })

    this.register('selectAll', () => {
      this.state.selection = this.state.objects.filter(
        obj => obj.page === this.state.view.page
      )
      this.eventBus.emit(EVENTS.SELECTION_CHANGED, { selection: this.state.selection })
      this.eventBus.emit('renderer:render')
    })

    this.register('zoomIn', () => {
      this.eventBus.emit('action:zoom-in')
    })

    this.register('zoomOut', () => {
      this.eventBus.emit('action:zoom-out')
    })

    this.register('fitWidth', () => {
      this.eventBus.emit('action:fit-width')
    })

    this.register('toolSelect', () => {
      this.toolManager.setTool('select')
    })

    this.register('toolHand', () => {
      this.toolManager.setTool('hand')
    })

    this.register('toolText', () => {
      this.toolManager.setTool('text')
    })

    this.register('toolDraw', () => {
      this.toolManager.setTool('draw')
    })

    this.register('toolRect', () => {
      this.toolManager.setTool('rect')
    })

    this.register('toolOval', () => {
      this.toolManager.setTool('oval')
    })

    this.register('toolLine', () => {
      this.toolManager.setTool('line')
    })
  }

  handleKeyDown(e) {
    if (this.isInputFocused()) return

    for (const [name, shortcut] of Object.entries(KEYBOARD_SHORTCUTS)) {
      if (this.matchesShortcut(e, shortcut)) {
        e.preventDefault()
        const handler = this.handlers.get(shortcut.action)
        if (handler) {
          handler(e)
        }
        break
      }
    }
  }

  matchesShortcut(event, shortcut) {
    const ctrlMatch = shortcut.ctrl ? (event.ctrlKey || event.metaKey) : !event.ctrlKey && !event.metaKey
    const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey
    const altMatch = shortcut.alt ? event.altKey : !event.altKey
    const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase()

    return ctrlMatch && shiftMatch && altMatch && keyMatch
  }

  isInputFocused() {
    const active = document.activeElement
    return active && (
      active.tagName === 'INPUT' ||
      active.tagName === 'TEXTAREA' ||
      active.tagName === 'SELECT' ||
      active.isContentEditable
    )
  }

  register(action, handler) {
    this.handlers.set(action, handler)
  }

  unregister(action) {
    this.handlers.delete(action)
  }
}