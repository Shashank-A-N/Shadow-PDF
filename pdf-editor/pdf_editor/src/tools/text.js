import { BaseTool } from './base-tool.js'
import { CURSORS, EVENTS } from '../constants.js'

export class TextTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)
    this.cursor = CURSORS.TEXT
  }

  onPointerDown(e) {
    const point = this.snapToGrid(this.getPoint(e))
    const settings = this.state.toolSettings.text

    const textObj = this.createObject('text', {
      text: 'New Text',
      x: point.x,
      y: point.y,
      font: settings.font,
      size: settings.size,
      color: settings.color,
      bold: settings.bold,
      italic: settings.italic,
      underline: settings.underline,
      strikethrough: settings.strikethrough,
      highlight: false,
      align: settings.align,
      lineHeight: settings.lineHeight,
      width: 0,
      height: 0
    })

    this.state.objects.push(textObj)
    this.state.selection = [textObj]

    this.emit(EVENTS.OBJECT_ADDED, { object: textObj })
    this.emit(EVENTS.SELECTION_CHANGED, { selection: [textObj] })

    this.renderer.render()
    this.openTextEditor(textObj)
  }

  openTextEditor(textObj) {
    const wrapper = this.els.canvasWrapper
    const bounds = this.renderer.getObjectBounds(textObj)
    
    const input = document.createElement('div')
    input.contentEditable = true
    input.className = 'absolute z-50 outline-none border-2 border-blue-500 bg-white dark:bg-slate-900 px-2 py-1 rounded min-w-[100px]'
    input.textContent = textObj.text

    const pos = this.renderer.pdfToCanvas({ x: textObj.x, y: textObj.y })
    
    input.style.left = pos.x + 'px'
    input.style.top = pos.y + 'px'
    input.style.fontSize = this.renderer.scaleValue(textObj.size) + 'px'
    input.style.fontFamily = textObj.font || 'Helvetica'
    input.style.fontWeight = textObj.bold ? 'bold' : 'normal'
    input.style.fontStyle = textObj.italic ? 'italic' : 'normal'
    input.style.color = textObj.color
    input.style.textAlign = textObj.align || 'left'

    wrapper.appendChild(input)
    input.focus()

    const range = document.createRange()
    range.selectNodeContents(input)
    const selection = window.getSelection()
    selection.removeAllRanges()
    selection.addRange(range)

    const finish = () => {
      const text = input.textContent.trim()
      if (text) {
        textObj.text = text
        textObj.modified = Date.now()
        this.emit(EVENTS.OBJECT_UPDATED, { object: textObj })
      } else {
        const index = this.state.objects.indexOf(textObj)
        if (index >= 0) {
          this.state.objects.splice(index, 1)
        }
        this.state.selection = []
      }
      
      input.remove()
      this.renderer.render()
    }

    input.addEventListener('blur', finish)
    input.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        input.remove()
        const index = this.state.objects.indexOf(textObj)
        if (index >= 0) {
          this.state.objects.splice(index, 1)
        }
        this.state.selection = []
        this.renderer.render()
      }
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault()
        finish()
      }
    })
  }
}