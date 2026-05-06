import { create } from 'zustand'

export interface AppState {
  sidePanelVisible: boolean
  sidePanelWidth: number
  sidePanelTab: 'files' | 'outline' | 'search'
  statusBarVisible: boolean
  isFullscreen: boolean
  contextMenu: { visible: boolean; x: number; y: number; type: string } | null
  modal: string | null
  toggleSidePanel: () => void
  setSidePanelWidth: (width: number) => void
  setSidePanelTab: (tab: AppState['sidePanelTab']) => void
  toggleStatusBar: () => void
  setFullscreen: (fullscreen: boolean) => void
  showContextMenu: (x: number, y: number, type: string) => void
  hideContextMenu: () => void
  showModal: (modal: string) => void
  hideModal: () => void
}

export const useAppStore = create<AppState>((set) => ({
  sidePanelVisible: true,
  sidePanelWidth: 260,
  sidePanelTab: 'files',
  statusBarVisible: true,
  isFullscreen: false,
  contextMenu: null,
  modal: null,
  toggleSidePanel: () => set((state) => ({ sidePanelVisible: !state.sidePanelVisible })),
  setSidePanelWidth: (width) => set({ sidePanelWidth: width }),
  setSidePanelTab: (tab) => set({ sidePanelTab: tab }),
  toggleStatusBar: () => set((state) => ({ statusBarVisible: !state.statusBarVisible })),
  setFullscreen: (fullscreen) => set({ isFullscreen: fullscreen }),
  showContextMenu: (x, y, type) => set({ contextMenu: { visible: true, x, y, type } }),
  hideContextMenu: () => set({ contextMenu: null }),
  showModal: (modal) => set({ modal }),
  hideModal: () => set({ modal: null }),
}))
