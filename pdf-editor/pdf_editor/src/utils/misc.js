export function uid() {
  return '_' + Math.random().toString(36).substr(2, 9) + Date.now().toString(36)
}

export function generateId() {
  return uid()
}

export function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max)
}

export function formatBytes(bytes) {
  if (!bytes || bytes === 0) return '0 B'
  
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  const k = 1024
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${units[i]}`
}

export function formatFileSize(bytes) {
  return formatBytes(bytes)
}

export function debounce(func, wait) {
  let timeout
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout)
      func(...args)
    }
    clearTimeout(timeout)
    timeout = setTimeout(later, wait)
  }
}

export function throttle(func, limit) {
  let inThrottle
  return function(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => inThrottle = false, limit)
    }
  }
}

export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (obj instanceof Map) return new Map(Array.from(obj, ([k, v]) => [k, deepClone(v)]))
  if (obj instanceof Set) return new Set(Array.from(obj, v => deepClone(v)))
  
  if (obj instanceof Object) {
    const clonedObj = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        clonedObj[key] = deepClone(obj[key])
      }
    }
    return clonedObj
  }
  
  throw new Error('Unable to copy object. Type not supported.')
}

export function isEqual(obj1, obj2) {
  if (obj1 === obj2) return true
  
  if (typeof obj1 !== 'object' || typeof obj2 !== 'object' || obj1 == null || obj2 == null) {
    return false
  }
  
  const keys1 = Object.keys(obj1)
  const keys2 = Object.keys(obj2)
  
  if (keys1.length !== keys2.length) return false
  
  for (const key of keys1) {
    if (!keys2.includes(key)) return false
    if (!isEqual(obj1[key], obj2[key])) return false
  }
  
  return true
}

export function downloadFile(blob, filename) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve(img)
    img.onerror = reject
    img.src = src
  })
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

export function randomFloat(min, max) {
  return Math.random() * (max - min) + min
}

export function roundTo(value, decimals) {
  return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals)
}

export function capitalize(str) {
  return str.charAt(0).toUpperCase() + str.slice(1)
}

export function truncate(str, length, suffix = '...') {
  if (str.length <= length) return str
  return str.substring(0, length - suffix.length) + suffix
}

export function sanitizeFilename(filename) {
  return filename.replace(/[^a-z0-9_\-\.]/gi, '_')
}

export function getFileExtension(filename) {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2)
}

export function removeFileExtension(filename) {
  return filename.replace(/\.[^/.]+$/, '')
}

export function parseQueryString(queryString) {
  const params = {}
  const queries = queryString.replace(/^\?/, '').split('&')
  
  queries.forEach(query => {
    const [key, value] = query.split('=')
    if (key) {
      params[decodeURIComponent(key)] = decodeURIComponent(value || '')
    }
  })
  
  return params
}

export function buildQueryString(params) {
  return Object.keys(params)
    .map(key => `${encodeURIComponent(key)}=${encodeURIComponent(params[key])}`)
    .join('&')
}

export function isObject(value) {
  return value && typeof value === 'object' && value.constructor === Object
}

export function isEmpty(value) {
  if (value == null) return true
  if (typeof value === 'string' || Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

export function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (obj && obj.hasOwnProperty(key)) {
      result[key] = obj[key]
    }
    return result
  }, {})
}

export function omit(obj, keys) {
  const result = { ...obj }
  keys.forEach(key => delete result[key])
  return result
}

export function groupBy(array, key) {
  return array.reduce((result, item) => {
    const group = typeof key === 'function' ? key(item) : item[key]
    if (!result[group]) result[group] = []
    result[group].push(item)
    return result
  }, {})
}

export function unique(array) {
  return [...new Set(array)]
}

export function sortBy(array, key, order = 'asc') {
  return [...array].sort((a, b) => {
    const aVal = typeof key === 'function' ? key(a) : a[key]
    const bVal = typeof key === 'function' ? key(b) : b[key]
    
    if (aVal < bVal) return order === 'asc' ? -1 : 1
    if (aVal > bVal) return order === 'asc' ? 1 : -1
    return 0
  })
}

export function chunk(array, size) {
  const chunks = []
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size))
  }
  return chunks
}

export function flatten(array) {
  return array.reduce((flat, item) => {
    return flat.concat(Array.isArray(item) ? flatten(item) : item)
  }, [])
}

export function getTimestamp() {
  return Date.now()
}

export function formatDate(date, format = 'YYYY-MM-DD HH:mm:ss') {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  const hours = String(d.getHours()).padStart(2, '0')
  const minutes = String(d.getMinutes()).padStart(2, '0')
  const seconds = String(d.getSeconds()).padStart(2, '0')
  
  return format
    .replace('YYYY', year)
    .replace('MM', month)
    .replace('DD', day)
    .replace('HH', hours)
    .replace('mm', minutes)
    .replace('ss', seconds)
}

export function memoize(fn) {
  const cache = new Map()
  return (...args) => {
    const key = JSON.stringify(args)
    if (cache.has(key)) return cache.get(key)
    const result = fn(...args)
    cache.set(key, result)
    return result
  }
}

export function once(fn) {
  let called = false
  let result
  return (...args) => {
    if (!called) {
      called = true
      result = fn(...args)
    }
    return result
  }
}