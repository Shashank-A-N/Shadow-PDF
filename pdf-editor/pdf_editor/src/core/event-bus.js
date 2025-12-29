export class EventBus {
  constructor() {
    this.listeners = new Map()
    this.onceListeners = new Map()
  }
  
  on(event, callback, context = null) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, [])
    }
    
    this.listeners.get(event).push({ callback, context })
    
    return () => this.off(event, callback)
  }
  
  once(event, callback, context = null) {
    if (!this.onceListeners.has(event)) {
      this.onceListeners.set(event, [])
    }
    
    this.onceListeners.get(event).push({ callback, context })
  }
  
  off(event, callback = null) {
    if (callback === null) {
      this.listeners.delete(event)
      this.onceListeners.delete(event)
      return
    }
    
    if (this.listeners.has(event)) {
      const filtered = this.listeners.get(event).filter(
        listener => listener.callback !== callback
      )
      if (filtered.length > 0) {
        this.listeners.set(event, filtered)
      } else {
        this.listeners.delete(event)
      }
    }
  }
  
  emit(event, data = null) {
    if (this.listeners.has(event)) {
      const listeners = this.listeners.get(event)
      for (const { callback, context } of listeners) {
        try {
          callback.call(context, data)
        } catch (error) {
          console.error(`Error in event listener for '${event}':`, error)
        }
      }
    }
    
    if (this.onceListeners.has(event)) {
      const listeners = this.onceListeners.get(event)
      for (const { callback, context } of listeners) {
        try {
          callback.call(context, data)
        } catch (error) {
          console.error(`Error in once listener for '${event}':`, error)
        }
      }
      this.onceListeners.delete(event)
    }
  }
  
  clear() {
    this.listeners.clear()
    this.onceListeners.clear()
  }
  
  listenerCount(event) {
    const regular = this.listeners.get(event)?.length || 0
    const once = this.onceListeners.get(event)?.length || 0
    return regular + once
  }
}