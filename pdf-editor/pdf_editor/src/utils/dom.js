export function createElement(tag, attributes = {}, children = []) {
  const element = document.createElement(tag)
  
  Object.entries(attributes).forEach(([key, value]) => {
    if (key === 'className') {
      element.className = value
    } else if (key === 'dataset') {
      Object.entries(value).forEach(([dataKey, dataValue]) => {
        element.dataset[dataKey] = dataValue
      })
    } else if (key.startsWith('on') && typeof value === 'function') {
      const event = key.substring(2).toLowerCase()
      element.addEventListener(event, value)
    } else {
      element.setAttribute(key, value)
    }
  })
  
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child))
    } else if (child instanceof Node) {
      element.appendChild(child)
    }
  })
  
  return element
}

export function removeElement(element) {
  if (element && element.parentNode) {
    element.parentNode.removeChild(element)
  }
}

export function clearElement(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild)
  }
}

export function addClass(element, ...classes) {
  element.classList.add(...classes)
}

export function removeClass(element, ...classes) {
  element.classList.remove(...classes)
}

export function toggleClass(element, className, force) {
  return element.classList.toggle(className, force)
}

export function hasClass(element, className) {
  return element.classList.contains(className)
}

export function setAttributes(element, attributes) {
  Object.entries(attributes).forEach(([key, value]) => {
    element.setAttribute(key, value)
  })
}

export function getPosition(element) {
  const rect = element.getBoundingClientRect()
  return {
    x: rect.left + window.scrollX,
    y: rect.top + window.scrollY,
    width: rect.width,
    height: rect.height
  }
}

export function setStyle(element, styles) {
  Object.entries(styles).forEach(([property, value]) => {
    element.style[property] = value
  })
}

export function show(element, display = 'block') {
  element.style.display = display
}

export function hide(element) {
  element.style.display = 'none'
}

export function isVisible(element) {
  return element.offsetParent !== null
}

export function fadeIn(element, duration = 300) {
  element.style.opacity = 0
  element.style.display = 'block'
  
  let start = null
  const animate = (timestamp) => {
    if (!start) start = timestamp
    const progress = timestamp - start
    element.style.opacity = Math.min(progress / duration, 1)
    
    if (progress < duration) {
      requestAnimationFrame(animate)
    }
  }
  
  requestAnimationFrame(animate)
}

export function fadeOut(element, duration = 300) {
  element.style.opacity = 1
  
  let start = null
  const animate = (timestamp) => {
    if (!start) start = timestamp
    const progress = timestamp - start
    element.style.opacity = 1 - Math.min(progress / duration, 1)
    
    if (progress < duration) {
      requestAnimationFrame(animate)
    } else {
      element.style.display = 'none'
    }
  }
  
  requestAnimationFrame(animate)
}

export function slideDown(element, duration = 300) {
  element.style.height = '0'
  element.style.overflow = 'hidden'
  element.style.display = 'block'
  
  const targetHeight = element.scrollHeight
  let start = null
  
  const animate = (timestamp) => {
    if (!start) start = timestamp
    const progress = timestamp - start
    element.style.height = `${Math.min((progress / duration) * targetHeight, targetHeight)}px`
    
    if (progress < duration) {
      requestAnimationFrame(animate)
    } else {
      element.style.height = ''
      element.style.overflow = ''
    }
  }
  
  requestAnimationFrame(animate)
}

export function slideUp(element, duration = 300) {
  const startHeight = element.scrollHeight
  element.style.height = `${startHeight}px`
  element.style.overflow = 'hidden'
  
  let start = null
  const animate = (timestamp) => {
    if (!start) start = timestamp
    const progress = timestamp - start
    element.style.height = `${startHeight - Math.min((progress / duration) * startHeight, startHeight)}px`
    
    if (progress < duration) {
      requestAnimationFrame(animate)
    } else {
      element.style.display = 'none'
      element.style.height = ''
      element.style.overflow = ''
    }
  }
  
  requestAnimationFrame(animate)
}

export function on(element, event, handler, options) {
  element.addEventListener(event, handler, options)
  return () => element.removeEventListener(event, handler, options)
}

export function off(element, event, handler, options) {
  element.removeEventListener(event, handler, options)
}

export function delegate(parent, selector, event, handler) {
  parent.addEventListener(event, (e) => {
    const target = e.target.closest(selector)
    if (target) {
      handler.call(target, e)
    }
  })
}

export function scrollTo(element, options = {}) {
  element.scrollIntoView({
    behavior: options.smooth ? 'smooth' : 'auto',
    block: options.block || 'start',
    inline: options.inline || 'nearest'
  })
}

export function offset(element) {
  const rect = element.getBoundingClientRect()
  return {
    top: rect.top + window.scrollY,
    left: rect.left + window.scrollX,
    width: rect.width,
    height: rect.height
  }
}

export function copyToClipboard(text) {
  if (navigator.clipboard && navigator.clipboard.writeText) {
    return navigator.clipboard.writeText(text)
  }
  
  const textarea = document.createElement('textarea')
  textarea.value = text
  textarea.style.position = 'fixed'
  textarea.style.opacity = '0'
  document.body.appendChild(textarea)
  textarea.select()
  
  try {
    document.execCommand('copy')
    document.body.removeChild(textarea)
    return Promise.resolve()
  } catch (err) {
    document.body.removeChild(textarea)
    return Promise.reject(err)
  }
}

export function parseHTML(html) {
  const template = document.createElement('template')
  template.innerHTML = html.trim()
  return template.content.firstChild
}

export function insertAfter(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode.nextSibling)
}

export function insertBefore(newNode, referenceNode) {
  referenceNode.parentNode.insertBefore(newNode, referenceNode)
}

export function replaceElement(newNode, oldNode) {
  oldNode.parentNode.replaceChild(newNode, oldNode)
}

export function closest(element, selector) {
  return element.closest(selector)
}

export function matches(element, selector) {
  return element.matches(selector)
}

export function siblings(element) {
  return Array.from(element.parentNode.children).filter(child => child !== element)
}

export function index(element) {
  return Array.from(element.parentNode.children).indexOf(element)
}

export function getData(element, key) {
  return element.dataset[key]
}

export function setData(element, key, value) {
  element.dataset[key] = value
}

export function serialize(form) {
  const formData = new FormData(form)
  const data = {}
  
  for (const [key, value] of formData.entries()) {
    if (data[key]) {
      if (!Array.isArray(data[key])) {
        data[key] = [data[key]]
      }
      data[key].push(value)
    } else {
      data[key] = value
    }
  }
  
  return data
}

export function isInViewport(element) {
  const rect = element.getBoundingClientRect()
  return (
    rect.top >= 0 &&
    rect.left >= 0 &&
    rect.bottom <= (window.innerHeight || document.documentElement.clientHeight) &&
    rect.right <= (window.innerWidth || document.documentElement.clientWidth)
  )
}