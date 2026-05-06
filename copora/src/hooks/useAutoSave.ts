import { useState, useEffect, useRef } from 'react'
import { useFileStore, useSettingsStore } from '../stores'
import { SessionService } from '../services/session-service'

export function useAutoSave(): { lastSaved: Date | null; isSaving: boolean } {
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const contentRef = useRef<string>('')

  const content = useFileStore((state) => state.content)
  const activeTabId = useFileStore((state) => state.activeTabId)
  const openTabs = useFileStore((state) => state.openTabs)
  const autoSaveEnabled = useSettingsStore((state) => state.autoSave)
  const autoSaveInterval = useSettingsStore((state) => state.autoSaveInterval)

  useEffect(() => {
    if (!autoSaveEnabled || !activeTabId) return
    if (content === contentRef.current) return

    contentRef.current = content

    if (timerRef.current) {
      clearTimeout(timerRef.current)
    }

    setIsSaving(true)

    timerRef.current = setTimeout(() => {
      const activeTab = useFileStore.getState().openTabs.find((t) => t.id === useFileStore.getState().activeTabId)
      if (activeTab) {
        SessionService.autoSave(content, activeTab.filePath)
      }
      setLastSaved(new Date())
      setIsSaving(false)
      timerRef.current = null
    }, autoSaveInterval)

    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current)
      }
    }
  }, [content, activeTabId, autoSaveEnabled, autoSaveInterval, openTabs])

  return { lastSaved, isSaving }
}
