import './modals.css'

export function AboutModal() {
  return (
    <div className="modal-overlay">
      <div className="modal-dialog about-modal">
        <div className="modal-body">
          <div className="about-logo">📝</div>
          <h3 className="about-title">Copora - Markdown 编辑器</h3>
          <div className="about-version">版本 0.0.0</div>
          <div className="about-copyright">© 2024 Copora. All rights reserved.</div>
          <div className="about-links">
            <a href="https://copora.app" target="_blank" rel="noopener noreferrer">官方网站</a>
            <a href="https://github.com/copora/copora" target="_blank" rel="noopener noreferrer">GitHub</a>
            <a href="https://github.com/copora/copora/blob/main/LICENSE" target="_blank" rel="noopener noreferrer">许可证</a>
          </div>
        </div>
        <div className="modal-footer" style={{ justifyContent: 'center' }}>
          <button className="btn btn-primary">确定</button>
        </div>
      </div>
    </div>
  )
}
