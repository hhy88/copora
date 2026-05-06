import { create } from 'zustand'

export interface SettingsState {
  autoSave: boolean
  autoSaveInterval: number
  spellCheck: boolean
  showLineNumber: boolean
  defaultEncoding: string
  defaultLineEnding: string
  imageStorageStrategy: 'relative' | 'absolute' | 'custom'
  customImagePath: string
  theme: string
  fontFamily: string
  fontFamilyMono: string
  fontSize: number
  lineHeight: number
  language: string
  updateSetting: <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => void
  resetToDefaults: () => void
  loadSettings: () => void
  saveSettings: () => void
}

const STORAGE_KEY = 'copora-settings'

const defaultSettings = {
  autoSave: true,
  autoSaveInterval: 5000,
  spellCheck: false,
  showLineNumber: false,
  defaultEncoding: 'UTF-8',
  defaultLineEnding: 'LF',
  imageStorageStrategy: 'relative' as const,
  customImagePath: '',
  theme: 'github-light',
  fontFamily: 'sans-serif',
  fontFamilyMono: 'monospace',
  fontSize: 16,
  lineHeight: 1.6,
  language: 'en',
}

type PersistableKey = keyof typeof defaultSettings

export const useSettingsStore = create<SettingsState>((set, get) => ({
  ...defaultSettings,
  updateSetting: (key, value) => {
    set({ [key]: value } as unknown as Partial<SettingsState>)
    get().saveSettings()
  },
  resetToDefaults: () => {
    set({ ...defaultSettings })
    get().saveSettings()
  },
  loadSettings: () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<typeof defaultSettings>
        const valid: Partial<typeof defaultSettings> = {}
        for (const key of Object.keys(defaultSettings) as PersistableKey[]) {
          if (key in parsed && parsed[key] !== undefined) {
            valid[key] = parsed[key] as (typeof defaultSettings)[PersistableKey]
          }
        }
        set(valid)
      }
    } catch {
      // ignore
    }
  },
  saveSettings: () => {
    try {
      const state = get()
      const toSave: Record<string, unknown> = {}
      for (const key of Object.keys(defaultSettings) as PersistableKey[]) {
        toSave[key] = state[key]
      }
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave))
    } catch {
      // ignore
    }
  },
}))
