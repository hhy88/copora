import { useFileStore } from '../../stores'
import './layout.css'

export function TitleBar() {
  const activeTabId = useFileStore((s) => s.activeTabId)
  const openTabs = useFileStore((s) => s.openTabs)
  const activeTab = openTabs.find((t) => t.id === activeTabId)

  return (
    <div className="title-bar">
      <div className="title-bar-left">
        <svg
          className="title-bar-icon"
          viewBox="0 0 16 16"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="16" height="16" rx="3" fill="var(--accent-color)" />
          <path
            d="M4 4h8v1.5H4V4zm0 3.25h5.5V8.75H4V7.25zm0 3.25h8V12H4v-1.5z"
            fill="white"
          />
        </svg>
        <span className="title-bar-title">Copora</span>
      </div>
      <div className="title-bar-center">
        {activeTab ? activeTab.fileName : 'Copora'}
      </div>
      <div className="title-bar-right">
        <button className="title-bar-btn" type="button" aria-label="Minimize">
          <svg width="10" height="1" viewBox="0 0 10 1">
            <rect width="10" height="1" fill="currentColor" />
          </svg>
        </button>
        <button className="title-bar-btn" type="button" aria-label="Maximize">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
            <rect
              x="0.5"
              y="0.5"
              width="9"
              height="9"
              stroke="currentColor"
              fill="none"
            />
          </svg>
        </button>
        <button
          className="title-bar-btn title-bar-btn-close"
          type="button"
          aria-label="Close"
        >
          <svg width="10" height="10" viewBox="0 0 10 10">
            <path
              d="M1 1L9 9M9 1L1 9"
              stroke="currentColor"
              strokeWidth="1.2"
              fill="none"
            />
          </svg>
        </button>
      </div>
    </div>
  )
}
