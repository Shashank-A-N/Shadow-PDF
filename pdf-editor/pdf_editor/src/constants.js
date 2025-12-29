export const TOOLS = {
  SELECT: 'select',
  HAND: 'hand',
  TEXT: 'text',
  DRAW: 'draw',
  HIGHLIGHT: 'highlight',
  RECT: 'rect',
  OVAL: 'oval',
  LINE: 'line',
  IMAGE: 'image',
  SIGNATURE: 'signature',
  FORM: 'form',
  OCR: 'ocr',
  ERASER: 'eraser'
}

export const OBJECT_TYPES = {
  TEXT: 'text',
  PATH: 'path',
  RECT: 'rect',
  OVAL: 'oval',
  LINE: 'line',
  IMAGE: 'image',
  HIGHLIGHT: 'highlight',
  SIGNATURE: 'signature',
  FORM_FIELD: 'form-field'
}

export const FORM_FIELD_TYPES = {
  TEXT_INPUT: 'text-input',
  CHECKBOX: 'checkbox',
  RADIO: 'radio',
  SELECT: 'select',
  TEXTAREA: 'textarea',
  BUTTON: 'button'
}

export const KEYBOARD_SHORTCUTS = {
  SAVE: { key: 's', ctrl: true, action: 'save' },
  OPEN: { key: 'o', ctrl: true, action: 'open' },
  UNDO: { key: 'z', ctrl: true, action: 'undo' },
  REDO: { key: 'y', ctrl: true, action: 'redo' },
  COPY: { key: 'c', ctrl: true, action: 'copy' },
  PASTE: { key: 'v', ctrl: true, action: 'paste' },
  CUT: { key: 'x', ctrl: true, action: 'cut' },
  DELETE: { key: 'Delete', action: 'delete' },
  SELECT_ALL: { key: 'a', ctrl: true, action: 'selectAll' },
  ZOOM_IN: { key: '+', ctrl: true, action: 'zoomIn' },
  ZOOM_OUT: { key: '-', ctrl: true, action: 'zoomOut' },
  FIT_WIDTH: { key: '0', ctrl: true, action: 'fitWidth' },
  TOOL_SELECT: { key: 'v', action: 'toolSelect' },
  TOOL_HAND: { key: 'h', action: 'toolHand' },
  TOOL_TEXT: { key: 't', action: 'toolText' },
  TOOL_DRAW: { key: 'p', action: 'toolDraw' },
  TOOL_RECT: { key: 'r', action: 'toolRect' },
  TOOL_OVAL: { key: 'o', action: 'toolOval' },
  TOOL_LINE: { key: 'l', action: 'toolLine' }
}

export const EVENTS = {
  STATE_CHANGED: 'state:changed',
  DOCUMENT_LOADED: 'document:loaded',
  DOCUMENT_SAVED: 'document:saved',
  PAGE_CHANGED: 'page:changed',
  ZOOM_CHANGED: 'zoom:changed',
  SELECTION_CHANGED: 'selection:changed',
  OBJECT_ADDED: 'object:added',
  OBJECT_UPDATED: 'object:updated',
  OBJECT_DELETED: 'object:deleted',
  LAYER_ADDED: 'layer:added',
  LAYER_DELETED: 'layer:deleted',
  LAYER_CHANGED: 'layer:changed',
  TOOL_CHANGED: 'tool:changed',
  HISTORY_CHANGED: 'history:changed',
  RENDER_REQUESTED: 'render:requested',
  THUMBNAIL_RENDERED: 'thumbnail:rendered',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info'
}

export const CONFIG = {
  APP_NAME: 'PDF Editor Ultra',
  VERSION: '1.0.0',
  MAX_FILE_SIZE: 100 * 1024 * 1024,
  AUTO_SAVE_INTERVAL: 60000,
  GRID_SIZE: 20,
  SNAP_THRESHOLD: 10,
  HISTORY_SIZE: 100,
  DEFAULT_ZOOM: 1,
  MIN_ZOOM: 0.1,
  MAX_ZOOM: 5,
  ZOOM_STEP: 0.1,
  DEFAULT_FONT: 'Helvetica',
  DEFAULT_FONT_SIZE: 16,
  DEFAULT_LINE_WIDTH: 2,
  DEFAULT_COLOR: '#000000',
  DEFAULT_FILL: 'transparent',
  SELECTION_COLOR: '#3B82F6',
  SELECTION_HANDLE_SIZE: 8,
  DOUBLE_CLICK_DELAY: 300,
  CANVAS_PADDING: 40,
  THUMBNAIL_WIDTH: 100,
  THUMBNAIL_HEIGHT: 141,
  RENDER_QUALITY: {
    LOW: 1,
    MEDIUM: 1.5,
    HIGH: 2
  },
  STORAGE_KEYS: {
    THEME: 'theme',
    RECENT_FILES: 'recent-files',
    SETTINGS: 'settings',
    AUTOSAVE: 'autosave'
  }
}

export const PAGE_SIZES = {
  A4: { width: 595.28, height: 841.89, name: 'A4' },
  LETTER: { width: 612, height: 792, name: 'Letter' },
  LEGAL: { width: 612, height: 1008, name: 'Legal' },
  A3: { width: 841.89, height: 1190.55, name: 'A3' },
  A5: { width: 419.53, height: 595.28, name: 'A5' },
  TABLOID: { width: 792, height: 1224, name: 'Tabloid' }
}

export const STANDARD_FONTS = {
  HELVETICA: 'Helvetica',
  HELVETICA_BOLD: 'Helvetica-Bold',
  HELVETICA_OBLIQUE: 'Helvetica-Oblique',
  HELVETICA_BOLD_OBLIQUE: 'Helvetica-BoldOblique',
  TIMES_ROMAN: 'Times-Roman',
  TIMES_BOLD: 'Times-Bold',
  TIMES_ITALIC: 'Times-Italic',
  TIMES_BOLD_ITALIC: 'Times-BoldItalic',
  COURIER: 'Courier',
  COURIER_BOLD: 'Courier-Bold',
  COURIER_OBLIQUE: 'Courier-Oblique',
  COURIER_BOLD_OBLIQUE: 'Courier-BoldOblique',
  SYMBOL: 'Symbol',
  ZAPF_DINGBATS: 'ZapfDingbats'
}

export const COLORS = {
  BLACK: '#000000',
  WHITE: '#FFFFFF',
  RED: '#EF4444',
  GREEN: '#10B981',
  BLUE: '#3B82F6',
  YELLOW: '#FBBF24',
  ORANGE: '#F97316',
  PURPLE: '#8B5CF6',
  PINK: '#EC4899',
  GRAY: '#6B7280'
}

export const EXPORT_FORMATS = {
  PDF: 'pdf',
  PNG: 'png',
  JPG: 'jpg',
  SVG: 'svg',
  HTML: 'html'
}

export const MIME_TYPES = {
  PDF: 'application/pdf',
  PNG: 'image/png',
  JPG: 'image/jpeg',
  SVG: 'image/svg+xml',
  HTML: 'text/html'
}

export const ERROR_MESSAGES = {
  FILE_TOO_LARGE: 'File size exceeds maximum allowed size',
  INVALID_FILE_TYPE: 'Invalid file type. Please select a PDF file',
  LOAD_FAILED: 'Failed to load PDF file',
  SAVE_FAILED: 'Failed to save PDF file',
  EXPORT_FAILED: 'Failed to export file',
  OCR_FAILED: 'OCR processing failed',
  NO_PAGES: 'Document has no pages',
  INVALID_PAGE: 'Invalid page number',
  PERMISSION_DENIED: 'Permission denied',
  NETWORK_ERROR: 'Network error occurred'
}

export const CURSORS = {
  DEFAULT: 'default',
  POINTER: 'pointer',
  MOVE: 'move',
  CROSSHAIR: 'crosshair',
  TEXT: 'text',
  GRAB: 'grab',
  GRABBING: 'grabbing',
  RESIZE_N: 'n-resize',
  RESIZE_S: 's-resize',
  RESIZE_E: 'e-resize',
  RESIZE_W: 'w-resize',
  RESIZE_NE: 'ne-resize',
  RESIZE_NW: 'nw-resize',
  RESIZE_SE: 'se-resize',
  RESIZE_SW: 'sw-resize'
}

export const TRANSFORM_HANDLES = {
  TOP_LEFT: 'tl',
  TOP_CENTER: 'tc',
  TOP_RIGHT: 'tr',
  MIDDLE_LEFT: 'ml',
  MIDDLE_RIGHT: 'mr',
  BOTTOM_LEFT: 'bl',
  BOTTOM_CENTER: 'bc',
  BOTTOM_RIGHT: 'br',
  ROTATE: 'rotate'
}

export const OCR_LANGUAGES = {
  ENG: 'eng',
  SPA: 'spa',
  FRA: 'fra',
  DEU: 'deu',
  ITA: 'ita',
  POR: 'por',
  RUS: 'rus',
  CHI_SIM: 'chi_sim',
  CHI_TRA: 'chi_tra',
  JPN: 'jpn',
  KOR: 'kor',
  ARA: 'ara'
}

export const ANNOTATION_TYPES = {
  NOTE: 'note',
  COMMENT: 'comment',
  STAMP: 'stamp',
  REDACT: 'redact'
}

export const STAMP_TYPES = {
  APPROVED: 'approved',
  REJECTED: 'rejected',
  DRAFT: 'draft',
  FINAL: 'final',
  CONFIDENTIAL: 'confidential',
  FOR_REVIEW: 'for-review',
  SIGNATURE_HERE: 'signature-here'
}