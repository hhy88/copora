import { useState } from 'react'
import { useSettingsStore } from '../../stores'
import { useThemeStore } from '../../stores'
import type { ThemeInfo } from '../../stores'
import './modals.css'

const categories = [
  { id: 'general', label: '通用' },
  { id: 'editor', label: '编辑' },
  { id: 'save', label: '保存' },
  { id: 'images', label: '图片' },
  { id: 'diagrams', label: '图表' },
  { id: 'formulas', label: '公式' },
  { id: 'shortcuts', label: '快捷键' },
  { id: 'appearance', label: '外观' },
  { id: 'language', label: '语言' },
  { id: 'privacy', label: '隐私' },
  { id: 'updates', label: '更新' },
]

const defaultShortcuts = [
  { action: '新建文件', key: 'Ctrl+N' },
  { action: '打开文件', key: 'Ctrl+O' },
  { action: '保存', key: 'Ctrl+S' },
  { action: '另存为', key: 'Ctrl+Shift+S' },
  { action: '撤销', key: 'Ctrl+Z' },
  { action: '重做', key: 'Ctrl+Y' },
  { action: '查找', key: 'Ctrl+F' },
  { action: '替换', key: 'Ctrl+H' },
  { action: '加粗', key: 'Ctrl+B' },
  { action: '斜体', key: 'Ctrl+I' },
  { action: '链接', key: 'Ctrl+K' },
  { action: '源码模式', key: 'Ctrl+/' },
  { action: '偏好设置', key: 'Ctrl+,' },
]

const themePreviewColors: Record<string, { bg: string; text: string }> = {
  'github-light': { bg: '#ffffff', text: '#24292e' },
  'github-dark': { bg: '#0d1117', text: '#c9d1d9' },
  'newsprint': { bg: '#f5f3ee', text: '#333333' },
  'night': { bg: '#1e1e2e', text: '#cdd6f4' },
  'pixyll': { bg: '#ffffff', text: '#333333' },
  'whitey': { bg: '#ffffff', text: '#333333' },
}

export function SettingsModal() {
  const [activeCategory, setActiveCategory] = useState('general')
  const settings = useSettingsStore()
  const themes = useThemeStore((s) => s.availableThemes)
  const currentTheme = useThemeStore((s) => s.currentTheme)
  const setTheme = useThemeStore((s) => s.setTheme)

  const [localSettings, setLocalSettings] = useState({
    autoSave: settings.autoSave,
    autoSaveInterval: settings.autoSaveInterval,
    spellCheck: settings.spellCheck,
    showLineNumber: settings.showLineNumber,
    defaultEncoding: settings.defaultEncoding,
    defaultLineEnding: settings.defaultLineEnding,
    imageStorageStrategy: settings.imageStorageStrategy,
    customImagePath: settings.customImagePath,
    theme: settings.theme,
    fontFamily: settings.fontFamily,
    fontFamilyMono: settings.fontFamilyMono,
    fontSize: settings.fontSize,
    lineHeight: settings.lineHeight,
    language: settings.language,
  })

  const updateLocal = <K extends keyof typeof localSettings>(key: K, value: (typeof localSettings)[K]) => {
    setLocalSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleApply = () => {
    for (const [key, value] of Object.entries(localSettings)) {
      settings.updateSetting(key as keyof typeof localSettings, value)
    }
    if (localSettings.theme !== currentTheme) {
      setTheme(localSettings.theme)
    }
  }

  const renderGeneral = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">语言</div>
          <div className="setting-description">界面显示语言</div>
        </div>
        <select
          className="setting-select"
          value={localSettings.language}
          onChange={(e) => updateLocal('language', e.target.value)}
        >
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">启动行为</div>
          <div className="setting-description">启动时打开上次编辑的文件</div>
        </div>
        <button className="setting-toggle active" onClick={() => {}} />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">默认编码</div>
          <div className="setting-description">新建文件的默认编码</div>
        </div>
        <select
          className="setting-select"
          value={localSettings.defaultEncoding}
          onChange={(e) => updateLocal('defaultEncoding', e.target.value)}
        >
          <option value="UTF-8">UTF-8</option>
          <option value="UTF-16">UTF-16</option>
          <option value="GBK">GBK</option>
          <option value="GB2312">GB2312</option>
        </select>
      </div>
    </>
  )

  const renderEditor = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">自动保存</div>
          <div className="setting-description">编辑时自动保存文件</div>
        </div>
        <button
          className={`setting-toggle${localSettings.autoSave ? ' active' : ''}`}
          onClick={() => updateLocal('autoSave', !localSettings.autoSave)}
        />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">自动保存间隔</div>
          <div className="setting-description">自动保存的时间间隔（毫秒）</div>
        </div>
        <div className="setting-control">
          <input
            className="setting-input"
            type="number"
            value={localSettings.autoSaveInterval}
            onChange={(e) => updateLocal('autoSaveInterval', Number(e.target.value))}
            style={{ width: 80 }}
            min={1000}
            step={1000}
          />
          <span style={{ fontSize: 12, color: 'var(--text-tertiary)' }}>ms</span>
        </div>
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">拼写检查</div>
          <div className="setting-description">启用拼写检查功能</div>
        </div>
        <button
          className={`setting-toggle${localSettings.spellCheck ? ' active' : ''}`}
          onClick={() => updateLocal('spellCheck', !localSettings.spellCheck)}
        />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">显示行号</div>
          <div className="setting-description">在源码模式下显示行号</div>
        </div>
        <button
          className={`setting-toggle${localSettings.showLineNumber ? ' active' : ''}`}
          onClick={() => updateLocal('showLineNumber', !localSettings.showLineNumber)}
        />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">默认换行符</div>
          <div className="setting-description">新建文件的默认换行符</div>
        </div>
        <select
          className="setting-select"
          value={localSettings.defaultLineEnding}
          onChange={(e) => updateLocal('defaultLineEnding', e.target.value)}
        >
          <option value="LF">LF (Unix)</option>
          <option value="CRLF">CRLF (Windows)</option>
          <option value="CR">CR (Mac)</option>
        </select>
      </div>
    </>
  )

  const renderSave = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">自动保存间隔</div>
          <div className="setting-description">{localSettings.autoSaveInterval / 1000} 秒</div>
        </div>
        <input
          className="setting-slider"
          type="range"
          min={1000}
          max={30000}
          step={1000}
          value={localSettings.autoSaveInterval}
          onChange={(e) => updateLocal('autoSaveInterval', Number(e.target.value))}
        />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">备份位置</div>
          <div className="setting-description">自动备份文件的存储路径</div>
        </div>
        <div className="setting-control">
          <input
            className="setting-input"
            type="text"
            value="~/Copora/backup"
            readOnly
            style={{ width: 200 }}
          />
          <button className="btn" style={{ padding: '4px 10px', fontSize: 12 }}>浏览</button>
        </div>
      </div>
    </>
  )

  const renderImages = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">图片存储策略</div>
          <div className="setting-description">插入图片时的存储方式</div>
        </div>
        <select
          className="setting-select"
          value={localSettings.imageStorageStrategy}
          onChange={(e) => updateLocal('imageStorageStrategy', e.target.value as 'relative' | 'absolute' | 'custom')}
        >
          <option value="relative">相对路径</option>
          <option value="absolute">绝对路径</option>
          <option value="custom">自定义路径</option>
        </select>
      </div>
      {localSettings.imageStorageStrategy === 'custom' && (
        <div className="setting-row">
          <div>
            <div className="setting-label">自定义路径</div>
            <div className="setting-description">图片存储的自定义目录路径</div>
          </div>
          <input
            className="setting-input"
            type="text"
            value={localSettings.customImagePath}
            onChange={(e) => updateLocal('customImagePath', e.target.value)}
            style={{ width: 200 }}
            placeholder="./assets/images"
          />
        </div>
      )}
    </>
  )

  const renderDiagrams = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">图表引擎</div>
          <div className="setting-description">用于渲染图表的引擎</div>
        </div>
        <select className="setting-select" defaultValue="mermaid">
          <option value="mermaid">Mermaid</option>
        </select>
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">图表主题</div>
          <div className="setting-description">Mermaid 图表的默认主题</div>
        </div>
        <select className="setting-select" defaultValue="default">
          <option value="default">Default</option>
          <option value="dark">Dark</option>
          <option value="forest">Forest</option>
          <option value="neutral">Neutral</option>
        </select>
      </div>
    </>
  )

  const renderFormulas = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">公式引擎</div>
          <div className="setting-description">用于渲染数学公式的引擎</div>
        </div>
        <select className="setting-select" defaultValue="katex">
          <option value="katex">KaTeX</option>
        </select>
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">行内公式</div>
          <div className="setting-description">启用 $...$ 行内公式语法</div>
        </div>
        <button className="setting-toggle active" onClick={() => {}} />
      </div>
    </>
  )

  const renderShortcuts = () => (
    <div className="shortcut-list">
      {defaultShortcuts.map((shortcut) => (
        <div key={shortcut.action} className="shortcut-item">
          <span>{shortcut.action}</span>
          <div className="setting-control">
            <span className="shortcut-key">{shortcut.key}</span>
            <button className="shortcut-edit-btn">编辑</button>
          </div>
        </div>
      ))}
    </div>
  )

  const renderAppearance = () => (
    <>
      <div className="setting-row setting-row-vertical">
        <div className="setting-label">主题</div>
        <div className="theme-grid">
          {themes.map((t: ThemeInfo) => {
            const colors = themePreviewColors[t.id] || { bg: '#ffffff', text: '#333333' }
            return (
              <div
                key={t.id}
                className={`theme-card${localSettings.theme === t.id ? ' selected' : ''}`}
                onClick={() => updateLocal('theme', t.id)}
              >
                <div
                  className="theme-card-preview"
                  style={{
                    background: colors.bg,
                    border: `1px solid var(--border-color)`,
                  }}
                />
                <div className="theme-card-name">{t.name}</div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">中文字体</div>
          <div className="setting-description">编辑器中文内容使用的字体</div>
        </div>
        <input
          className="setting-input"
          type="text"
          value={localSettings.fontFamily}
          onChange={(e) => updateLocal('fontFamily', e.target.value)}
          style={{ width: 180 }}
        />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">英文字体</div>
          <div className="setting-description">编辑器英文/代码内容使用的字体</div>
        </div>
        <input
          className="setting-input"
          type="text"
          value={localSettings.fontFamilyMono}
          onChange={(e) => updateLocal('fontFamilyMono', e.target.value)}
          style={{ width: 180 }}
        />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">字体大小</div>
          <div className="setting-description">{localSettings.fontSize}px</div>
        </div>
        <input
          className="setting-slider"
          type="range"
          min={12}
          max={28}
          step={1}
          value={localSettings.fontSize}
          onChange={(e) => updateLocal('fontSize', Number(e.target.value))}
        />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">行高</div>
          <div className="setting-description">{localSettings.lineHeight.toFixed(1)}</div>
        </div>
        <input
          className="setting-slider"
          type="range"
          min={1.0}
          max={2.5}
          step={0.1}
          value={localSettings.lineHeight}
          onChange={(e) => updateLocal('lineHeight', Number(e.target.value))}
        />
      </div>
    </>
  )

  const renderLanguage = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">界面语言</div>
          <div className="setting-description">应用程序界面显示语言</div>
        </div>
        <select
          className="setting-select"
          value={localSettings.language}
          onChange={(e) => updateLocal('language', e.target.value)}
        >
          <option value="zh-CN">简体中文</option>
          <option value="zh-TW">繁體中文</option>
          <option value="en">English</option>
          <option value="ja">日本語</option>
          <option value="ko">한국어</option>
        </select>
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">拼写检查语言</div>
          <div className="setting-description">拼写检查使用的字典语言</div>
        </div>
        <select className="setting-select" defaultValue="zh-CN">
          <option value="zh-CN">简体中文</option>
          <option value="en">English</option>
        </select>
      </div>
    </>
  )

  const renderPrivacy = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">遥测数据</div>
          <div className="setting-description">发送匿名使用数据以帮助改进 Copora</div>
        </div>
        <button className="setting-toggle" onClick={() => {}} />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">崩溃报告</div>
          <div className="setting-description">自动发送崩溃报告</div>
        </div>
        <button className="setting-toggle" onClick={() => {}} />
      </div>
    </>
  )

  const renderUpdates = () => (
    <>
      <div className="setting-row">
        <div>
          <div className="setting-label">自动检查更新</div>
          <div className="setting-description">启动时自动检查新版本</div>
        </div>
        <button className="setting-toggle active" onClick={() => {}} />
      </div>
      <div className="setting-row">
        <div>
          <div className="setting-label">当前版本</div>
        </div>
        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>0.0.0</span>
      </div>
    </>
  )

  const renderContent = () => {
    switch (activeCategory) {
      case 'general': return renderGeneral()
      case 'editor': return renderEditor()
      case 'save': return renderSave()
      case 'images': return renderImages()
      case 'diagrams': return renderDiagrams()
      case 'formulas': return renderFormulas()
      case 'shortcuts': return renderShortcuts()
      case 'appearance': return renderAppearance()
      case 'language': return renderLanguage()
      case 'privacy': return renderPrivacy()
      case 'updates': return renderUpdates()
      default: return null
    }
  }

  return (
    <div className="modal-overlay">
      <div className="modal-dialog settings-modal">
        <div className="modal-header">
          <h3>偏好设置</h3>
          <button className="modal-close">×</button>
        </div>
        <div className="modal-body">
          <div className="settings-sidebar">
            {categories.map((cat) => (
              <div
                key={cat.id}
                className={`settings-sidebar-item${activeCategory === cat.id ? ' active' : ''}`}
                onClick={() => setActiveCategory(cat.id)}
              >
                {cat.label}
              </div>
            ))}
          </div>
          <div className="settings-content">
            {renderContent()}
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn">取消</button>
          <button className="btn btn-primary" onClick={handleApply}>应用</button>
        </div>
      </div>
    </div>
  )
}
