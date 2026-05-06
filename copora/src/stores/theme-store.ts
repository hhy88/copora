import { create } from 'zustand'

export interface ThemeInfo {
  id: string
  name: string
  isDark: boolean
}

export interface ThemeState {
  currentTheme: string
  availableThemes: ThemeInfo[]
  customThemes: string[]
  setTheme: (themeId: string) => void
  addCustomTheme: (themeId: string) => void
  removeCustomTheme: (themeId: string) => void
}

const STORAGE_KEY = 'copora-theme'

const defaultAvailableThemes: ThemeInfo[] = [
  { id: 'github-light', name: 'GitHub Light', isDark: false },
  { id: 'github-dark', name: 'GitHub Dark', isDark: true },
  { id: 'newsprint', name: 'Newsprint', isDark: false },
  { id: 'night', name: 'Night', isDark: true },
  { id: 'pixyll', name: 'Pixyll', isDark: false },
  { id: 'whitey', name: 'Whitey', isDark: false },
]

export const useThemeStore = create<ThemeState>((set, get) => ({
  currentTheme: 'github-light',
  availableThemes: defaultAvailableThemes,
  customThemes: [],
  setTheme: (themeId) => {
    set({ currentTheme: themeId })
    try {
      localStorage.setItem(STORAGE_KEY, themeId)
    } catch {
      // ignore
    }
  },
  addCustomTheme: (themeId) =>
    set((state) => {
      if (state.customThemes.includes(themeId)) return state
      return { customThemes: [...state.customThemes, themeId] }
    }),
  removeCustomTheme: (themeId) =>
    set((state) => ({
      customThemes: state.customThemes.filter((t) => t !== themeId),
    })),
}))

try {
  const saved = localStorage.getItem(STORAGE_KEY)
  if (saved) {
    useThemeStore.getState().setTheme(saved)
  }
} catch {
  // ignore
}
