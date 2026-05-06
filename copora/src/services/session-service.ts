const SESSION_KEY = 'copora-session'
const AUTOSAVE_PREFIX = 'copora-autosave-'

export function saveSession(state: {
  openTabs: any[]
  activeTabId: string
  windowBounds: any
}): void {
  try {
    localStorage.setItem(SESSION_KEY, JSON.stringify(state))
  } catch {
    // ignore
  }
}

export function loadSession(): {
  openTabs: any[]
  activeTabId: string
  windowBounds: any
} | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (raw) {
      return JSON.parse(raw) as {
        openTabs: any[]
        activeTabId: string
        windowBounds: any
      }
    }
  } catch {
    // ignore
  }
  return null
}

export function clearSession(): void {
  try {
    localStorage.removeItem(SESSION_KEY)
  } catch {
    // ignore
  }
}

export function autoSave(content: string, filePath: string): void {
  try {
    const key = AUTOSAVE_PREFIX + filePath
    localStorage.setItem(key, JSON.stringify({ content, timestamp: Date.now() }))
  } catch {
    // ignore
  }
}

export function getAutoSave(filePath: string): { content: string; timestamp: number } | null {
  try {
    const key = AUTOSAVE_PREFIX + filePath
    const raw = localStorage.getItem(key)
    if (raw) {
      return JSON.parse(raw) as { content: string; timestamp: number }
    }
  } catch {
    // ignore
  }
  return null
}

export function clearAutoSave(filePath: string): void {
  try {
    const key = AUTOSAVE_PREFIX + filePath
    localStorage.removeItem(key)
  } catch {
    // ignore
  }
}

export const SessionService = {
  saveSession,
  loadSession,
  clearSession,
  autoSave,
  getAutoSave,
  clearAutoSave,
}
