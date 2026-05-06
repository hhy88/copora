import { useState } from 'react'
import type { ExportFormat } from '../../types'
import './modals.css'

interface ExportOptions {
  pdfTheme: 'light' | 'dark'
  pdfPageSize: 'A4' | 'A3' | 'Letter' | 'Custom'
  pdfMargins: string
  pdfHeaderFooter: boolean
  pdfEmbedFonts: boolean
  htmlStandalone: boolean
  htmlIncludeTheme: boolean
}

const formats: { id: ExportFormat; icon: string; name: string }[] = [
  { id: 'pdf', icon: '📄', name: 'PDF' },
  { id: 'html', icon: '🌐', name: 'HTML' },
  { id: 'docx', icon: '📝', name: 'DOCX' },
  { id: 'txt', icon: '📃', name: 'TXT' },
  { id: 'latex', icon: '∑', name: 'LaTeX' },
  { id: 'epub', icon: '📖', name: 'EPUB' },
  { id: 'png', icon: '🖼️', name: 'PNG' },
  { id: 'svg', icon: '🎨', name: 'SVG' },
]

export function ExportModal() {
  const [selectedFormat, setSelectedFormat] = useState<ExportFormat>('pdf')
  const [exporting, setExporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [options, setOptions] = useState<ExportOptions>({
    pdfTheme: 'light',
    pdfPageSize: 'A4',
    pdfMargins: '20mm',
    pdfHeaderFooter: false,
    pdfEmbedFonts: true,
    htmlStandalone: true,
    htmlIncludeTheme: true,
  })

  const updateOption = <K extends keyof ExportOptions>(key: K, value: ExportOptions[K]) => {
    setOptions((prev) => ({ ...prev, [key]: value }))
  }

  const handleExport = () => {
    setExporting(true)
    setProgress(0)

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval)
          setExporting(false)
          return 100
        }
        return prev + Math.random() * 15 + 5
      })
    }, 200)
  }

  const renderPdfOptions = () => (
    <div className="export-options">
      <h4>PDF 选项</h4>
      <div className="setting-row">
        <span className="setting-label">主题</span>
        <select
          className="setting-select"
          value={options.pdfTheme}
          onChange={(e) => updateOption('pdfTheme', e.target.value as 'light' | 'dark')}
        >
          <option value="light">浅色</option>
          <option value="dark">深色</option>
        </select>
      </div>
      <div className="setting-row">
        <span className="setting-label">页面大小</span>
        <select
          className="setting-select"
          value={options.pdfPageSize}
          onChange={(e) => updateOption('pdfPageSize', e.target.value as ExportOptions['pdfPageSize'])}
        >
          <option value="A4">A4</option>
          <option value="A3">A3</option>
          <option value="Letter">Letter</option>
          <option value="Custom">自定义</option>
        </select>
      </div>
      <div className="setting-row">
        <span className="setting-label">页边距</span>
        <input
          className="setting-input"
          type="text"
          value={options.pdfMargins}
          onChange={(e) => updateOption('pdfMargins', e.target.value)}
          style={{ width: 100 }}
        />
      </div>
      <div className="setting-row">
        <span className="setting-label">包含页眉页脚</span>
        <button
          className={`setting-toggle${options.pdfHeaderFooter ? ' active' : ''}`}
          onClick={() => updateOption('pdfHeaderFooter', !options.pdfHeaderFooter)}
        />
      </div>
      <div className="setting-row">
        <span className="setting-label">嵌入字体</span>
        <button
          className={`setting-toggle${options.pdfEmbedFonts ? ' active' : ''}`}
          onClick={() => updateOption('pdfEmbedFonts', !options.pdfEmbedFonts)}
        />
      </div>
    </div>
  )

  const renderHtmlOptions = () => (
    <div className="export-options">
      <h4>HTML 选项</h4>
      <div className="setting-row">
        <span className="setting-label">独立文件</span>
        <button
          className={`setting-toggle${options.htmlStandalone ? ' active' : ''}`}
          onClick={() => updateOption('htmlStandalone', !options.htmlStandalone)}
        />
      </div>
      {!options.htmlStandalone && (
        <div className="setting-description">导出为包含资源文件夹的 HTML</div>
      )}
      <div className="setting-row">
        <span className="setting-label">包含主题 CSS</span>
        <button
          className={`setting-toggle${options.htmlIncludeTheme ? ' active' : ''}`}
          onClick={() => updateOption('htmlIncludeTheme', !options.htmlIncludeTheme)}
        />
      </div>
    </div>
  )

  return (
    <div className="modal-overlay">
      <div className="modal-dialog" style={{ width: 520 }}>
        <div className="modal-header">
          <h3>导出</h3>
        </div>
        <div className="modal-body">
          <div className="export-format-grid">
            {formats.map((fmt) => (
              <div
                key={fmt.id}
                className={`export-format-card${selectedFormat === fmt.id ? ' selected' : ''}`}
                onClick={() => setSelectedFormat(fmt.id)}
              >
                <div className="format-icon">{fmt.icon}</div>
                <div className="format-name">{fmt.name}</div>
              </div>
            ))}
          </div>

          {selectedFormat === 'pdf' && renderPdfOptions()}
          {selectedFormat === 'html' && renderHtmlOptions()}

          {exporting && (
            <div className="export-progress">
              <div className="export-progress-bar">
                <div
                  className="export-progress-fill"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <div className="export-progress-text">
                正在导出... {Math.min(Math.round(progress), 100)}%
              </div>
            </div>
          )}
        </div>
        <div className="modal-footer">
          <button className="btn" disabled={exporting}>取消</button>
          <button
            className="btn btn-primary"
            onClick={handleExport}
            disabled={exporting}
          >
            {exporting ? '导出中...' : '导出'}
          </button>
        </div>
      </div>
    </div>
  )
}
