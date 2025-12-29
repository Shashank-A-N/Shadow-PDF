import { CONFIG, EVENTS, ERROR_MESSAGES, PAGE_SIZES } from '../../constants.js'
import { uid, formatBytes } from '../../utils/misc.js'

export class PdfService {
  constructor(state, eventBus) {
    this.state = state
    this.eventBus = eventBus
    this.pdfjs = null
    this.pdflib = null
    this.originalBytes = null
    this.loadingTask = null
  }

  async openFile(file) {
    if (!file || file.type !== 'application/pdf') {
      throw new Error(ERROR_MESSAGES.INVALID_FILE_TYPE)
    }

    if (file.size > CONFIG.MAX_FILE_SIZE) {
      throw new Error(ERROR_MESSAGES.FILE_TOO_LARGE)
    }

    this.state.flags.loading = true
    
    try {
      this.originalBytes = await file.arrayBuffer()
      
      if (this.loadingTask) {
        this.loadingTask.destroy()
      }

      this.loadingTask = pdfjsLib.getDocument({ data: this.originalBytes })
      this.pdfjs = await this.loadingTask.promise
      this.pdflib = await PDFLib.PDFDocument.load(this.originalBytes)

      await this.extractMetadata()
      await this.extractPageInfo()

      this.state.document.name = file.name
      this.state.document.bytes = file.size
      this.state.view.page = 1

      this.addToRecentFiles({
        name: file.name,
        size: file.size,
        pages: this.state.document.pages,
        lastOpened: Date.now()
      })

      if (this.eventBus) {
        this.eventBus.emit(EVENTS.DOCUMENT_LOADED, {
          name: file.name,
          pages: this.state.document.pages,
          size: file.size
        })
      }

      return true
    } catch (error) {
      console.error('Failed to open PDF:', error)
      if (this.eventBus) {
        this.eventBus.emit(EVENTS.ERROR, {
          message: ERROR_MESSAGES.LOAD_FAILED,
          error
        })
      }
      throw error
    } finally {
      this.state.flags.loading = false
    }
  }

  async createBlankPdf(pageSize = PAGE_SIZES.A4) {
    this.state.flags.loading = true

    try {
      this.pdflib = await PDFLib.PDFDocument.create()
      const page = this.pdflib.addPage([pageSize.width, pageSize.height])

      const pdfBytes = await this.pdflib.save()
      this.originalBytes = pdfBytes

      this.loadingTask = pdfjsLib.getDocument({ data: pdfBytes })
      this.pdfjs = await this.loadingTask.promise

      await this.extractPageInfo()

      this.state.document.name = 'Untitled.pdf'
      this.state.document.bytes = pdfBytes.byteLength
      this.state.view.page = 1

      if (this.eventBus) {
        this.eventBus.emit(EVENTS.DOCUMENT_LOADED, {
          name: 'Untitled.pdf',
          pages: 1,
          size: pdfBytes.byteLength
        })
      }

      return true
    } catch (error) {
      console.error('Failed to create PDF:', error)
      if (this.eventBus) {
        this.eventBus.emit(EVENTS.ERROR, {
          message: 'Failed to create PDF',
          error
        })
      }
      throw error
    } finally {
      this.state.flags.loading = false
    }
  }

  async extractMetadata() {
    try {
      const metadata = await this.pdfjs.getMetadata()
      
      if (metadata.info) {
        this.state.document.metadata = {
          title: metadata.info.Title || '',
          author: metadata.info.Author || '',
          subject: metadata.info.Subject || '',
          keywords: metadata.info.Keywords ? metadata.info.Keywords.split(',').map(k => k.trim()) : [],
          creator: metadata.info.Creator || CONFIG.APP_NAME,
          producer: metadata.info.Producer || CONFIG.APP_NAME,
          creationDate: metadata.info.CreationDate || null,
          modDate: metadata.info.ModDate || null
        }
      }

      const permissions = await this.pdfjs.getPermissions()
      if (permissions) {
        this.state.document.permissions = {
          printing: permissions.includes(pdfjsLib.PermissionFlag.PRINT),
          modifying: permissions.includes(pdfjsLib.PermissionFlag.MODIFY_CONTENTS),
          copying: permissions.includes(pdfjsLib.PermissionFlag.COPY),
          annotating: permissions.includes(pdfjsLib.PermissionFlag.MODIFY_ANNOTATIONS),
          fillingForms: permissions.includes(pdfjsLib.PermissionFlag.FILL_INTERACTIVE_FORMS),
          contentAccessibility: permissions.includes(pdfjsLib.PermissionFlag.ASSEMBLE),
          documentAssembly: permissions.includes(pdfjsLib.PermissionFlag.ASSEMBLE)
        }
      }

      this.state.document.encrypted = metadata.isEncrypted || false
    } catch (error) {
      console.warn('Failed to extract metadata:', error)
    }
  }

  async extractPageInfo() {
    this.state.document.pages = this.pdfjs.numPages
    this.state.document.pageSizes = []

    for (let i = 1; i <= this.state.document.pages; i++) {
      try {
        const page = await this.pdfjs.getPage(i)
        const viewport = page.getViewport({ scale: 1 })
        
        this.state.document.pageSizes.push({
          width: viewport.width,
          height: viewport.height,
          rotation: viewport.rotation || 0
        })
      } catch (error) {
        console.error(`Failed to get page ${i} info:`, error)
        this.state.document.pageSizes.push({
          width: PAGE_SIZES.A4.width,
          height: PAGE_SIZES.A4.height,
          rotation: 0
        })
      }
    }
  }

  async addBlankPage(afterPage = null, pageSize = PAGE_SIZES.A4) {
    this.state.flags.processing = true

    try {
      const tempDoc = await PDFLib.PDFDocument.create()
      const sourceDoc = await PDFLib.PDFDocument.load(await this.pdflib.save())
      const totalPages = sourceDoc.getPageCount()

      const insertIndex = afterPage !== null ? afterPage : this.state.view.page

      for (let i = 0; i < totalPages; i++) {
        const [copiedPage] = await tempDoc.copyPages(sourceDoc, [i])
        tempDoc.addPage(copiedPage)

        if (i === insertIndex - 1) {
          tempDoc.addPage([pageSize.width, pageSize.height])
        }
      }

      const pdfBytes = await tempDoc.save()
      this.originalBytes = pdfBytes
      
      this.pdflib = await PDFLib.PDFDocument.load(pdfBytes)
      this.pdfjs = await pdfjsLib.getDocument({ data: pdfBytes }).promise

      await this.extractPageInfo()

      this.state.document.bytes = pdfBytes.byteLength

      if (this.eventBus) {
        this.eventBus.emit(EVENTS.PAGE_CHANGED, {
          action: 'added',
          page: insertIndex + 1,
          total: this.state.document.pages
        })
      }

      return true
    } catch (error) {
      console.error('Failed to add page:', error)
      if (this.eventBus) {
        this.eventBus.emit(EVENTS.ERROR, {
          message: 'Failed to add page',
          error
        })
      }
      throw error
    } finally {
      this.state.flags.processing = false
    }
  }

  async duplicatePage(pageNum) {
    this.state.flags.processing = true

    try {
      const tempDoc = await PDFLib.PDFDocument.create()
      const sourceDoc = await PDFLib.PDFDocument.load(await this.pdflib.save())
      const totalPages = sourceDoc.getPageCount()

      for (let i = 0; i < totalPages; i++) {
        const [copiedPage] = await tempDoc.copyPages(sourceDoc, [i])
        tempDoc.addPage(copiedPage)

        if (i === pageNum - 1) {
          const [duplicatedPage] = await tempDoc.copyPages(sourceDoc, [i])
          tempDoc.addPage(duplicatedPage)
        }
      }

      const pdfBytes = await tempDoc.save()
      this.originalBytes = pdfBytes
      
      this.pdflib = await PDFLib.PDFDocument.load(pdfBytes)
      this.pdfjs = await pdfjsLib.getDocument({ data: pdfBytes }).promise

      await this.extractPageInfo()

      this.state.document.bytes = pdfBytes.byteLength

      if (this.eventBus) {
        this.eventBus.emit(EVENTS.PAGE_CHANGED, {
          action: 'duplicated',
          page: pageNum,
          total: this.state.document.pages
        })
      }

      return true
    } catch (error) {
      console.error('Failed to duplicate page:', error)
      if (this.eventBus) {
        this.eventBus.emit(EVENTS.ERROR, {
          message: 'Failed to duplicate page',
          error
        })
      }
      throw error
    } finally {
      this.state.flags.processing = false
    }
  }

  async deletePage(pageNum) {
    if (this.state.document.pages <= 1) {
      throw new Error('Cannot delete the last page')
    }

    this.state.flags.processing = true

    try {
      const tempDoc = await PDFLib.PDFDocument.create()
      const sourceDoc = await PDFLib.PDFDocument.load(await this.pdflib.save())
      const totalPages = sourceDoc.getPageCount()

      for (let i = 0; i < totalPages; i++) {
        if (i !== pageNum - 1) {
          const [copiedPage] = await tempDoc.copyPages(sourceDoc, [i])
          tempDoc.addPage(copiedPage)
        }
      }

      const pdfBytes = await tempDoc.save()
      this.originalBytes = pdfBytes
      
      this.pdflib = await PDFLib.PDFDocument.load(pdfBytes)
      this.pdfjs = await pdfjsLib.getDocument({ data: pdfBytes }).promise

      await this.extractPageInfo()

      this.state.document.bytes = pdfBytes.byteLength

      this.state.objects = this.state.objects.filter(obj => {
        if (obj.page === pageNum) return false
        if (obj.page > pageNum) obj.page--
        return true
      })

      const newBackgrounds = new Map()
      for (const [key, value] of this.state.document.backgrounds.entries()) {
        if (key < pageNum - 1) {
          newBackgrounds.set(key, value)
        } else if (key > pageNum - 1) {
          newBackgrounds.set(key - 1, value)
        }
      }
      this.state.document.backgrounds = newBackgrounds

      if (this.state.view.page === pageNum && pageNum > 1) {
        this.state.view.page--
      } else if (this.state.view.page > pageNum) {
        this.state.view.page--
      }

      if (this.eventBus) {
        this.eventBus.emit(EVENTS.PAGE_CHANGED, {
          action: 'deleted',
          page: pageNum,
          total: this.state.document.pages
        })
      }

      return true
    } catch (error) {
      console.error('Failed to delete page:', error)
      if (this.eventBus) {
        this.eventBus.emit(EVENTS.ERROR, {
          message: 'Failed to delete page',
          error
        })
      }
      throw error
    } finally {
      this.state.flags.processing = false
    }
  }

  async reorderPages(fromIndex, toIndex) {
    this.state.flags.processing = true

    try {
      const tempDoc = await PDFLib.PDFDocument.create()
      const sourceDoc = await PDFLib.PDFDocument.load(await this.pdflib.save())
      const totalPages = sourceDoc.getPageCount()

      const pageOrder = Array.from({ length: totalPages }, (_, i) => i)
      const [removed] = pageOrder.splice(fromIndex, 1)
      pageOrder.splice(toIndex, 0, removed)

      for (const pageIndex of pageOrder) {
        const [copiedPage] = await tempDoc.copyPages(sourceDoc, [pageIndex])
        tempDoc.addPage(copiedPage)
      }

      const pdfBytes = await tempDoc.save()
      this.originalBytes = pdfBytes
      
      this.pdflib = await PDFLib.PDFDocument.load(pdfBytes)
      this.pdfjs = await pdfjsLib.getDocument({ data: pdfBytes }).promise

      await this.extractPageInfo()

      const pageMapping = new Map()
      pageOrder.forEach((oldIndex, newIndex) => {
        pageMapping.set(oldIndex + 1, newIndex + 1)
      })

      this.state.objects.forEach(obj => {
        if (pageMapping.has(obj.page)) {
          obj.page = pageMapping.get(obj.page)
        }
      })

      const newBackgrounds = new Map()
      for (const [key, value] of this.state.document.backgrounds.entries()) {
        const oldPage = key + 1
        if (pageMapping.has(oldPage)) {
          newBackgrounds.set(pageMapping.get(oldPage) - 1, value)
        }
      }
      this.state.document.backgrounds = newBackgrounds

      if (this.eventBus) {
        this.eventBus.emit(EVENTS.PAGE_CHANGED, {
          action: 'reordered',
          from: fromIndex,
          to: toIndex
        })
      }

      return true
    } catch (error) {
      console.error('Failed to reorder pages:', error)
      if (this.eventBus) {
        this.eventBus.emit(EVENTS.ERROR, {
          message: 'Failed to reorder pages',
          error
        })
      }
      throw error
    } finally {
      this.state.flags.processing = false
    }
  }

  async rotatePage(pageNum, degrees) {
    this.state.flags.processing = true

    try {
      const pages = this.pdflib.getPages()
      const page = pages[pageNum - 1]
      
      if (page) {
        const currentRotation = page.getRotation().angle
        page.setRotation(PDFLib.degrees((currentRotation + degrees) % 360))

        const pdfBytes = await this.pdflib.save()
        this.originalBytes = pdfBytes
        
        this.pdfjs = await pdfjsLib.getDocument({ data: pdfBytes }).promise
        await this.extractPageInfo()

        if (this.eventBus) {
          this.eventBus.emit(EVENTS.PAGE_CHANGED, {
            action: 'rotated',
            page: pageNum,
            degrees
          })
        }

        return true
      }

      return false
    } catch (error) {
      console.error('Failed to rotate page:', error)
      throw error
    } finally {
      this.state.flags.processing = false
    }
  }

  async extractText(pageNum) {
    try {
      const page = await this.pdfjs.getPage(pageNum)
      const textContent = await page.getTextContent()
      
      return textContent.items.map(item => ({
        text: item.str,
        x: item.transform[4],
        y: item.transform[5],
        width: item.width,
        height: item.height,
        fontName: item.fontName
      }))
    } catch (error) {
      console.error('Failed to extract text:', error)
      return []
    }
  }

  addToRecentFiles(fileInfo) {
    const existing = this.state.recentFiles.findIndex(f => f.name === fileInfo.name)
    
    if (existing >= 0) {
      this.state.recentFiles.splice(existing, 1)
    }

    this.state.recentFiles.unshift(fileInfo)

    if (this.state.recentFiles.length > this.state.settings.recentFilesLimit) {
      this.state.recentFiles = this.state.recentFiles.slice(0, this.state.settings.recentFilesLimit)
    }
  }

  destroy() {
    if (this.loadingTask) {
      this.loadingTask.destroy()
      this.loadingTask = null
    }
    
    this.pdfjs = null
    this.pdflib = null
    this.originalBytes = null
  }
}