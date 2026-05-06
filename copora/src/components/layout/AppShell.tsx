import { useThemeStore, useAppStore } from '../../stores'
import { TitleBar } from './TitleBar'
import { MenuBar } from './MenuBar'
import SidePanel from '../sidebar/SidePanel'
import EditorCanvas from './EditorCanvas'
import { StatusBar } from './StatusBar'
import { ExportModal } from '../modals/ExportModal'
import { SettingsModal } from '../modals/SettingsModal'
import { AboutModal } from '../modals/AboutModal'
import './layout.css'

export default function AppShell() {
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const statusBarVisible = useAppStore((s) => s.statusBarVisible)
  const modal = useAppStore((s) => s.modal)

  return (
    <div className="app-shell" data-theme={currentTheme}>
      <TitleBar />
      <MenuBar />
      <div className="main-content">
        <SidePanel />
        <EditorCanvas />
      </div>
      {statusBarVisible && <StatusBar />}
      {modal === 'export' && <ExportModal />}
      {modal === 'settings' && <SettingsModal />}
      {modal === 'about' && <AboutModal />}
    </div>
  )
}
