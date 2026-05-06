/// <reference types="vite/client" />

declare module 'markdown-it-task-lists' {
  import type MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginSimple
  export default plugin
}

declare module 'markdown-it-footnote' {
  import type MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginSimple
  export default plugin
}

declare module 'markdown-it-mark' {
  import type MarkdownIt from 'markdown-it'
  const plugin: MarkdownIt.PluginSimple
  export default plugin
}

interface FilePickerAcceptType {
  description?: string
  accept: Record<string, string[]>
}

interface ShowOpenFilePickerOptions {
  types?: FilePickerAcceptType[]
  multiple?: boolean
}

interface ShowSaveFilePickerOptions {
  suggestedName?: string
  types?: FilePickerAcceptType[]
}

interface ShowDirectoryPickerOptions {
  id?: string
  mode?: 'read' | 'readwrite'
}

interface Window {
  showOpenFilePicker(options?: ShowOpenFilePickerOptions): Promise<FileSystemFileHandle[]>
  showDirectoryPicker(options?: ShowDirectoryPickerOptions): Promise<FileSystemDirectoryHandle>
  showSaveFilePicker(options?: ShowSaveFilePickerOptions): Promise<FileSystemFileHandle>
}
