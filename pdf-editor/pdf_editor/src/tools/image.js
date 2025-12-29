import { BaseTool } from './base-tool.js'
import { CURSORS, EVENTS } from '../constants.js'

export class ImageTool extends BaseTool {
  constructor(state, renderer, elements, eventBus) {
    super(state, renderer, elements, eventBus)
    this.cursor = CURSORS.CROSSHAIR
  }

  activate() {
    super.activate()
    this.openFileDialog()
  }

  openFileDialog() {
    const input = this.els.hiddenImageInput
    input.value = ''
    
    input.onchange = async (e) => {
      const file = e.target.files[0]
      if (!file) return

      if (!file.type.startsWith('image/')) {
        this.emit(EVENTS.ERROR, { message: 'Please select an image file' })
        return
      }

      try {
        await this.loadImage(file)
      } catch (error) {
        this.emit(EVENTS.ERROR, { message: 'Failed to load image', error })
      }
    }

    input.click()
  }

  async loadImage(file) {
    const reader = new FileReader()

    return new Promise((resolve, reject) => {
      reader.onload = async (e) => {
        const img = new Image()
        
        img.onload = () => {
          const maxWidth = 300
          const aspectRatio = img.height / img.width
          const width = Math.min(img.width, maxWidth)
          const height = width * aspectRatio

          const pageSize = this.state.document.pageSizes[this.state.view.page - 1]
          const centerX = (pageSize.width - width) / 2
          const centerY = (pageSize.height - height) / 2

          const imageObj = this.createObject('image', {
            x: centerX,
            y: centerY,
            width: width,
            height: height,
            image: img,
            data: e.target.result,
            format: file.type.includes('png') ? 'png' : 'jpg',
            opacity: 1
          })

          this.state.objects.push(imageObj)
          this.state.selection = [imageObj]

          this.emit(EVENTS.OBJECT_ADDED, { object: imageObj })
          this.emit(EVENTS.SELECTION_CHANGED, { selection: [imageObj] })
          
          this.renderer.render()
          resolve()
        }

        img.onerror = () => {
          reject(new Error('Failed to load image'))
        }

        img.src = e.target.result
      }

      reader.onerror = () => {
        reject(new Error('Failed to read file'))
      }

      reader.readAsDataURL(file)
    })
  }
}