import { CONFIG } from '../constants.js'

export class Storage {
  constructor() {
    this.dbName = 'pdf-editor-ultra'
    this.dbVersion = 1
    this.db = null
  }
  
  async init() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(this.dbName, this.dbVersion)
      
      request.onerror = () => reject(request.error)
      request.onsuccess = () => {
        this.db = request.result
        resolve()
      }
      
      request.onupgradeneeded = (event) => {
        const db = event.target.result
        
        if (!db.objectStoreNames.contains('documents')) {
          db.createObjectStore('documents', { keyPath: 'id' })
        }
        
        if (!db.objectStoreNames.contains('autosaves')) {
          const autosaves = db.createObjectStore('autosaves', { keyPath: 'id' })
          autosaves.createIndex('timestamp', 'timestamp', { unique: false })
        }
        
        if (!db.objectStoreNames.contains('settings')) {
          db.createObjectStore('settings', { keyPath: 'key' })
        }
      }
    })
  }
  
  async saveDocument(id, data) {
    const transaction = this.db.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')
    
    const document = {
      id,
      data,
      timestamp: Date.now()
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(document)
      request.onsuccess = () => resolve(id)
      request.onerror = () => reject(request.error)
    })
  }
  
  async loadDocument(id) {
    const transaction = this.db.transaction(['documents'], 'readonly')
    const store = transaction.objectStore('documents')
    
    return new Promise((resolve, reject) => {
      const request = store.get(id)
      request.onsuccess = () => resolve(request.result?.data || null)
      request.onerror = () => reject(request.error)
    })
  }
  
  async deleteDocument(id) {
    const transaction = this.db.transaction(['documents'], 'readwrite')
    const store = transaction.objectStore('documents')
    
    return new Promise((resolve, reject) => {
      const request = store.delete(id)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async listDocuments() {
    const transaction = this.db.transaction(['documents'], 'readonly')
    const store = transaction.objectStore('documents')
    
    return new Promise((resolve, reject) => {
      const request = store.getAll()
      request.onsuccess = () => resolve(request.result || [])
      request.onerror = () => reject(request.error)
    })
  }
  
  async saveAutosave(data) {
    const transaction = this.db.transaction(['autosaves'], 'readwrite')
    const store = transaction.objectStore('autosaves')
    
    const autosave = {
      id: 'current',
      data,
      timestamp: Date.now()
    }
    
    return new Promise((resolve, reject) => {
      const request = store.put(autosave)
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async loadAutosave() {
    const transaction = this.db.transaction(['autosaves'], 'readonly')
    const store = transaction.objectStore('autosaves')
    
    return new Promise((resolve, reject) => {
      const request = store.get('current')
      request.onsuccess = () => resolve(request.result?.data || null)
      request.onerror = () => reject(request.error)
    })
  }
  
  async clearAutosave() {
    const transaction = this.db.transaction(['autosaves'], 'readwrite')
    const store = transaction.objectStore('autosaves')
    
    return new Promise((resolve, reject) => {
      const request = store.delete('current')
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async saveSetting(key, value) {
    const transaction = this.db.transaction(['settings'], 'readwrite')
    const store = transaction.objectStore('settings')
    
    return new Promise((resolve, reject) => {
      const request = store.put({ key, value })
      request.onsuccess = () => resolve()
      request.onerror = () => reject(request.error)
    })
  }
  
  async loadSetting(key, defaultValue = null) {
    const transaction = this.db.transaction(['settings'], 'readonly')
    const store = transaction.objectStore('settings')
    
    return new Promise((resolve, reject) => {
      const request = store.get(key)
      request.onsuccess = () => resolve(request.result?.value ?? defaultValue)
      request.onerror = () => reject(request.error)
    })
  }
  
  saveToLocalStorage(key, value) {
    try {
      localStorage.setItem(CONFIG.STORAGE_KEYS[key] || key, JSON.stringify(value))
      return true
    } catch (error) {
      console.error('Failed to save to localStorage:', error)
      return false
    }
  }
  
  loadFromLocalStorage(key, defaultValue = null) {
    try {
      const item = localStorage.getItem(CONFIG.STORAGE_KEYS[key] || key)
      return item ? JSON.parse(item) : defaultValue
    } catch (error) {
      console.error('Failed to load from localStorage:', error)
      return defaultValue
    }
  }
  
  clearLocalStorage(key = null) {
    if (key) {
      localStorage.removeItem(CONFIG.STORAGE_KEYS[key] || key)
    } else {
      localStorage.clear()
    }
  }
}