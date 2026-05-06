import { useState, useMemo, useCallback } from 'react'
import { useEditorStore } from '../../stores/editor-store'
import { useFileStore } from '../../stores/file-store'
import type { FileNode } from '../../stores/file-store'

interface SearchResult {
  filePath: string
  fileName: string
  line: number
  text: string
  matchStart: number
  matchEnd: number
}

function collectAllFiles(nodes: FileNode[], results: { path: string; name: string }[] = []) {
  for (const node of nodes) {
    if (!node.isDir) {
      results.push({ path: node.path, name: node.name })
    }
    if (node.children) {
      collectAllFiles(node.children, results)
    }
  }
  return results
}

function escapeRegex(str: string) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

export default function SearchPanel() {
  const findReplace = useEditorStore((s) => s.findReplace)
  const setFindReplace = useEditorStore((s) => s.setFindReplace)
  const updateFindState = useEditorStore((s) => s.updateFindState)
  const content = useFileStore((s) => s.content)
  const files = useFileStore((s) => s.files)

  const [showReplace, setShowReplace] = useState(false)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [currentResultIndex, setCurrentResultIndex] = useState(0)

  const allFiles = useMemo(() => collectAllFiles(files), [files])

  const performSearch = useCallback(() => {
    const keyword = findReplace.keyword
    if (!keyword) {
      setSearchResults([])
      updateFindState(0, 0)
      return
    }

    let regex: RegExp | null = null
    try {
      if (findReplace.regex) {
        regex = new RegExp(keyword, findReplace.caseSensitive ? 'g' : 'gi')
      } else {
        const escaped = escapeRegex(keyword)
        const pattern = findReplace.wholeWord ? `\\b${escaped}\\b` : escaped
        regex = new RegExp(pattern, findReplace.caseSensitive ? 'g' : 'gi')
      }
    } catch {
      setSearchResults([])
      updateFindState(0, 0)
      return
    }

    const results: SearchResult[] = []

    const currentLines = content.split('\n')
    for (let i = 0; i < currentLines.length; i++) {
      const line = currentLines[i]
      let match: RegExpExecArray | null
      const lineRegex = new RegExp(regex.source, regex.flags)
      while ((match = lineRegex.exec(line)) !== null) {
        results.push({
          filePath: '__current__',
          fileName: '(当前文档)',
          line: i + 1,
          text: line,
          matchStart: match.index,
          matchEnd: match.index + match[0].length,
        })
        if (!regex.global) break
      }
    }

    for (const file of allFiles) {
      if (file.path === '__current__') continue
    }

    setSearchResults(results)
    setCurrentResultIndex(results.length > 0 ? 0 : 0)
    updateFindState(0, results.length)
  }, [findReplace.keyword, findReplace.caseSensitive, findReplace.wholeWord, findReplace.regex, content, allFiles, updateFindState])

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        performSearch()
      }
    },
    [performSearch]
  )

  const handlePrev = useCallback(() => {
    if (searchResults.length === 0) return
    const prev = currentResultIndex > 0 ? currentResultIndex - 1 : searchResults.length - 1
    setCurrentResultIndex(prev)
    updateFindState(prev, searchResults.length)
  }, [searchResults, currentResultIndex, updateFindState])

  const handleNext = useCallback(() => {
    if (searchResults.length === 0) return
    const next = currentResultIndex < searchResults.length - 1 ? currentResultIndex + 1 : 0
    setCurrentResultIndex(next)
    updateFindState(next, searchResults.length)
  }, [searchResults, currentResultIndex, updateFindState])

  const handleReplace = useCallback(() => {
    if (searchResults.length === 0 || currentResultIndex >= searchResults.length) return
    const result = searchResults[currentResultIndex]
    if (result.filePath === '__current__') {
      const lines = content.split('\n')
      if (result.line - 1 < lines.length) {
        const line = lines[result.line - 1]
        const newLine =
          line.substring(0, result.matchStart) +
          findReplace.replaceText +
          line.substring(result.matchEnd)
        lines[result.line - 1] = newLine
        useFileStore.getState().updateContent(lines.join('\n'))
      }
    }
    performSearch()
  }, [searchResults, currentResultIndex, content, findReplace.replaceText, performSearch])

  const handleReplaceAll = useCallback(() => {
    if (!findReplace.keyword) return
    let regex: RegExp | null = null
    try {
      if (findReplace.regex) {
        regex = new RegExp(findReplace.keyword, findReplace.caseSensitive ? 'g' : 'gi')
      } else {
        const escaped = escapeRegex(findReplace.keyword)
        const pattern = findReplace.wholeWord ? `\\b${escaped}\\b` : escaped
        regex = new RegExp(pattern, findReplace.caseSensitive ? 'g' : 'gi')
      }
    } catch {
      return
    }
    const newContent = content.replace(regex, findReplace.replaceText)
    useFileStore.getState().updateContent(newContent)
    performSearch()
  }, [findReplace, content, performSearch])

  const highlightMatch = useCallback((text: string, start: number, end: number) => {
    return (
      <>
        {text.substring(0, start)}
        <mark>{text.substring(start, end)}</mark>
        {text.substring(end)}
      </>
    )
  }, [])

  return (
    <div className="search-panel">
      <div className="search-input-row">
        <span className="search-input-icon">🔍</span>
        <input
          className="search-input"
          type="text"
          value={findReplace.keyword}
          onChange={(e) => setFindReplace({ keyword: e.target.value })}
          onKeyDown={handleKeyDown}
          placeholder="搜索..."
        />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        <div className="search-toggles">
          <button
            className={`search-toggle${findReplace.caseSensitive ? ' active' : ''}`}
            onClick={() => setFindReplace({ caseSensitive: !findReplace.caseSensitive })}
            title="区分大小写"
          >
            Aa
          </button>
          <button
            className={`search-toggle${findReplace.wholeWord ? ' active' : ''}`}
            onClick={() => setFindReplace({ wholeWord: !findReplace.wholeWord })}
            title="全字匹配"
          >
            W
          </button>
          <button
            className={`search-toggle${findReplace.regex ? ' active' : ''}`}
            onClick={() => setFindReplace({ regex: !findReplace.regex })}
            title="正则表达式"
          >
            .*
          </button>
        </div>

        <div className="search-nav">
          <button className="search-nav-btn" onClick={handlePrev} title="上一个">
            ▲
          </button>
          <button className="search-nav-btn" onClick={handleNext} title="下一个">
            ▼
          </button>
        </div>

        <span className="search-count">
          {searchResults.length > 0
            ? `${currentResultIndex + 1}/${searchResults.length}`
            : '无结果'}
        </span>
      </div>

      <div style={{ display: 'flex', gap: 4 }}>
        <button
          className="search-toggle"
          onClick={() => setShowReplace(!showReplace)}
          title="替换"
          style={{ width: 'auto', padding: '0 6px' }}
        >
          {showReplace ? '▾' : '▸'} 替换
        </button>
      </div>

      {showReplace && (
        <>
          <div className="search-input-row">
            <input
              className="search-input"
              type="text"
              value={findReplace.replaceText}
              onChange={(e) => setFindReplace({ replaceText: e.target.value })}
              placeholder="替换为..."
            />
          </div>
          <div className="search-replace-row">
            <button className="search-replace-btn" onClick={handleReplace}>
              替换
            </button>
            <button className="search-replace-btn replace-all" onClick={handleReplaceAll}>
              全部替换
            </button>
          </div>
        </>
      )}

      <div className="search-results">
        {searchResults.map((result, index) => (
          <div
            key={`${result.filePath}-${result.line}-${index}`}
            className="search-result-item"
            onClick={() => {
              setCurrentResultIndex(index)
              updateFindState(index, searchResults.length)
              window.dispatchEvent(
                new CustomEvent('outline-navigate', { detail: { line: result.line } })
              )
            }}
          >
            <div className="search-result-file">
              {result.fileName}:{result.line}
            </div>
            <div className="search-result-line">
              {highlightMatch(result.text, result.matchStart, result.matchEnd)}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
