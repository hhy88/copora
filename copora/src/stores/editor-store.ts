import { create } from 'zustand'

export interface WordStats {
  totalChars: number
  chineseChars: number
  englishChars: number
  charsNoSpaces: number
  paragraphs: number
  images: number
}

export interface FindReplaceState {
  visible: boolean
  keyword: string
  replaceText: string
  caseSensitive: boolean
  wholeWord: boolean
  regex: boolean
  currentIndex: number
  totalMatches: number
}

export interface EditorState {
  mode: 'wysiwyg' | 'source' | 'source-readonly'
  cursorLine: number
  cursorCol: number
  encoding: string
  lineEnding: string
  isReadOnly: boolean
  wordStats: WordStats
  findReplace: FindReplaceState
  setMode: (mode: EditorState['mode']) => void
  setCursorPosition: (line: number, col: number) => void
  setWordStats: (stats: Partial<WordStats>) => void
  toggleFindReplace: () => void
  setFindReplace: (patch: Partial<FindReplaceState>) => void
  updateFindState: (currentIndex: number, totalMatches: number) => void
}

const defaultWordStats: WordStats = {
  totalChars: 0,
  chineseChars: 0,
  englishChars: 0,
  charsNoSpaces: 0,
  paragraphs: 0,
  images: 0,
}

const defaultFindReplace: FindReplaceState = {
  visible: false,
  keyword: '',
  replaceText: '',
  caseSensitive: false,
  wholeWord: false,
  regex: false,
  currentIndex: 0,
  totalMatches: 0,
}

export const useEditorStore = create<EditorState>((set) => ({
  mode: 'wysiwyg',
  cursorLine: 1,
  cursorCol: 1,
  encoding: 'UTF-8',
  lineEnding: 'LF',
  isReadOnly: false,
  wordStats: { ...defaultWordStats },
  findReplace: { ...defaultFindReplace },
  setMode: (mode) => set({ mode, isReadOnly: mode === 'source-readonly' }),
  setCursorPosition: (line, col) => set({ cursorLine: line, cursorCol: col }),
  setWordStats: (stats) => set((state) => ({ wordStats: { ...state.wordStats, ...stats } })),
  toggleFindReplace: () => set((state) => ({ findReplace: { ...state.findReplace, visible: !state.findReplace.visible } })),
  setFindReplace: (patch) => set((state) => ({ findReplace: { ...state.findReplace, ...patch } })),
  updateFindState: (currentIndex, totalMatches) => set((state) => ({ findReplace: { ...state.findReplace, currentIndex, totalMatches } })),
}))
