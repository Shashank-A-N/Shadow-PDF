export function pointInRect(point, rect) {
  return (
    point.x >= rect.x &&
    point.x <= rect.x + rect.width &&
    point.y >= rect.y &&
    point.y <= rect.y + rect.height
  )
}

export function rectIntersects(rect1, rect2) {
  return !(
    rect1.x + rect1.width < rect2.x ||
    rect2.x + rect2.width < rect1.x ||
    rect1.y + rect1.height < rect2.y ||
    rect2.y + rect2.height < rect1.y
  )
}

export function hitRect(rect1, rect2) {
  return rectIntersects(rect1, rect2)
}

export function pointInCircle(point, circle) {
  const dx = point.x - circle.x
  const dy = point.y - circle.y
  return dx * dx + dy * dy <= circle.radius * circle.radius
}

export function pointInEllipse(point, ellipse) {
  const dx = point.x - ellipse.x
  const dy = point.y - ellipse.y
  const a = ellipse.width / 2
  const b = ellipse.height / 2
  return (dx * dx) / (a * a) + (dy * dy) / (b * b) <= 1
}

export function pointOnLine(point, line, threshold = 5) {
  const dx = line.x2 - line.x1
  const dy = line.y2 - line.y1
  const length = Math.sqrt(dx * dx + dy * dy)
  
  if (length === 0) {
    return distance(point, { x: line.x1, y: line.y1 }) <= threshold
  }
  
  const t = Math.max(0, Math.min(1, ((point.x - line.x1) * dx + (point.y - line.y1) * dy) / (length * length)))
  const projection = {
    x: line.x1 + t * dx,
    y: line.y1 + t * dy
  }
  
  return distance(point, projection) <= threshold
}

export function distance(point1, point2) {
  const dx = point2.x - point1.x
  const dy = point2.y - point1.y
  return Math.sqrt(dx * dx + dy * dy)
}

export function manhattanDistance(point1, point2) {
  return Math.abs(point2.x - point1.x) + Math.abs(point2.y - point1.y)
}

export function midpoint(point1, point2) {
  return {
    x: (point1.x + point2.x) / 2,
    y: (point1.y + point2.y) / 2
  }
}

export function angle(point1, point2) {
  return Math.atan2(point2.y - point1.y, point2.x - point1.x)
}

export function angleDegrees(point1, point2) {
  return (angle(point1, point2) * 180) / Math.PI
}

export function rotatePoint(point, center, angle) {
  const cos = Math.cos(angle)
  const sin = Math.sin(angle)
  const dx = point.x - center.x
  const dy = point.y - center.y
  
  return {
    x: center.x + dx * cos - dy * sin,
    y: center.y + dx * sin + dy * cos
  }
}

export function rotatePointDegrees(point, center, degrees) {
  return rotatePoint(point, center, (degrees * Math.PI) / 180)
}

export function scalePoint(point, center, scale) {
  return {
    x: center.x + (point.x - center.x) * scale,
    y: center.y + (point.y - center.y) * scale
  }
}

export function translatePoint(point, dx, dy) {
  return {
    x: point.x + dx,
    y: point.y + dy
  }
}

export function getBoundingBox(points) {
  if (points.length === 0) return null
  
  let minX = Infinity
  let minY = Infinity
  let maxX = -Infinity
  let maxY = -Infinity
  
  points.forEach(point => {
    minX = Math.min(minX, point.x)
    minY = Math.min(minY, point.y)
    maxX = Math.max(maxX, point.x)
    maxY = Math.max(maxY, point.y)
  })
  
  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY
  }
}

export function rectCenter(rect) {
  return {
    x: rect.x + rect.width / 2,
    y: rect.y + rect.height / 2
  }
}

export function rectCorners(rect) {
  return {
    topLeft: { x: rect.x, y: rect.y },
    topRight: { x: rect.x + rect.width, y: rect.y },
    bottomLeft: { x: rect.x, y: rect.y + rect.height },
    bottomRight: { x: rect.x + rect.width, y: rect.y + rect.height }
  }
}

export function normalizeRect(rect) {
  const x = rect.width < 0 ? rect.x + rect.width : rect.x
  const y = rect.height < 0 ? rect.y + rect.height : rect.y
  const width = Math.abs(rect.width)
  const height = Math.abs(rect.height)
  
  return { x, y, width, height }
}

export function expandRect(rect, amount) {
  return {
    x: rect.x - amount,
    y: rect.y - amount,
    width: rect.width + amount * 2,
    height: rect.height + amount * 2
  }
}

export function intersectRects(rect1, rect2) {
  const x = Math.max(rect1.x, rect2.x)
  const y = Math.max(rect1.y, rect2.y)
  const width = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - x
  const height = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - y
  
  if (width <= 0 || height <= 0) return null
  
  return { x, y, width, height }
}

export function unionRects(rect1, rect2) {
  const x = Math.min(rect1.x, rect2.x)
  const y = Math.min(rect1.y, rect2.y)
  const width = Math.max(rect1.x + rect1.width, rect2.x + rect2.width) - x
  const height = Math.max(rect1.y + rect1.height, rect2.y + rect2.height) - y
  
  return { x, y, width, height }
}

export function lineIntersection(line1, line2) {
  const x1 = line1.x1, y1 = line1.y1, x2 = line1.x2, y2 = line1.y2
  const x3 = line2.x1, y3 = line2.y1, x4 = line2.x2, y4 = line2.y2
  
  const denom = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
  if (denom === 0) return null
  
  const t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / denom
  const u = -((x1 - x2) * (y1 - y3) - (y1 - y2) * (x1 - x3)) / denom
  
  if (t >= 0 && t <= 1 && u >= 0 && u <= 1) {
    return {
      x: x1 + t * (x2 - x1),
      y: y1 + t * (y2 - y1)
    }
  }
  
  return null
}

export function snapToGrid(point, gridSize) {
  return {
    x: Math.round(point.x / gridSize) * gridSize,
    y: Math.round(point.y / gridSize) * gridSize
  }
}

export function snapToGuides(point, guides, threshold = 5) {
  let snappedX = point.x
  let snappedY = point.y
  
  guides.horizontal?.forEach(y => {
    if (Math.abs(point.y - y) < threshold) {
      snappedY = y
    }
  })
  
  guides.vertical?.forEach(x => {
    if (Math.abs(point.x - x) < threshold) {
      snappedX = x
    }
  })
  
  return { x: snappedX, y: snappedY }
}

export function lerp(start, end, t) {
  return start + (end - start) * t
}

export function lerpPoint(point1, point2, t) {
  return {
    x: lerp(point1.x, point2.x, t),
    y: lerp(point1.y, point2.y, t)
  }
}

export function clampPoint(point, bounds) {
  return {
    x: Math.max(bounds.x, Math.min(point.x, bounds.x + bounds.width)),
    y: Math.max(bounds.y, Math.min(point.y, bounds.y + bounds.height))
  }
}

export function polygonArea(points) {
  let area = 0
  for (let i = 0; i < points.length; i++) {
    const j = (i + 1) % points.length
    area += points[i].x * points[j].y
    area -= points[j].x * points[i].y
  }
  return Math.abs(area / 2)
}

export function polygonCentroid(points) {
  let x = 0, y = 0
  points.forEach(point => {
    x += point.x
    y += point.y
  })
  return { x: x / points.length, y: y / points.length }
}