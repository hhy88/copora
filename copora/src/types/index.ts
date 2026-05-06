export type EditorMode = 'wysiwyg' | 'source' | 'source-readonly'

export type SidePanelTab = 'files' | 'outline' | 'search'

export interface FileNode {
  id: string
  name: string
  path: string
  isDir: boolean
  children?: FileNode[]
  isModified?: boolean
  isExpanded?: boolean
}

export interface HeadingItem {
  id: string
  level: number
  text: string
  line: number
}

export interface TabInfo {
  id: string
  filePath: string
  fileName: string
  isModified: boolean
  isPinned: boolean
}

export interface EditorSettings {
  autoSave: boolean
  autoSaveInterval: number
  spellCheck: boolean
  showLineNumber: boolean
  defaultEncoding: string
  defaultLineEnding: string
  imageStorageStrategy: string
  theme: string
  fontFamily: string
  fontSize: number
  lineHeight: number
}

export interface WordStats {
  totalChars: number
  chineseChars: number
  englishChars: number
  charsNoSpaces: number
  paragraphs: number
  images: number
}

export type ExportFormat = 'pdf' | 'html' | 'docx' | 'txt' | 'latex' | 'epub' | 'png' | 'svg'
