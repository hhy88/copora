import { create } from 'zustand'

export interface FileNode {
  id: string
  name: string
  path: string
  isDir: boolean
  children?: FileNode[]
  isModified?: boolean
  isExpanded?: boolean
}

export interface RecentFile {
  path: string
  name: string
  lastOpened: number
}

export interface OpenTab {
  id: string
  filePath: string
  fileName: string
  isModified: boolean
  isPinned: boolean
}

export interface FileState {
  files: FileNode[]
  rootPath: string | null
  recentFiles: RecentFile[]
  openTabs: OpenTab[]
  activeTabId: string | null
  content: string
  setRootPath: (path: string | null) => void
  setFiles: (files: FileNode[]) => void
  openFile: (tab: OpenTab) => void
  closeTab: (tabId: string) => void
  setActiveTab: (tabId: string | null) => void
  updateContent: (content: string) => void
  markModified: (tabId: string, modified: boolean) => void
  addRecentFile: (path: string, name: string) => void
  clearRecentFiles: () => void
  moveTab: (fromIndex: number, toIndex: number) => void
}

export const useFileStore = create<FileState>((set) => ({
  files: [],
  rootPath: null,
  recentFiles: [],
  openTabs: [{
    id: 'welcome',
    filePath: '/welcome.md',
    fileName: '欢迎.md',
    isModified: false,
    isPinned: false,
  }],
  activeTabId: 'welcome',
  content: `# 欢迎使用 Copora

Copora 是一款本地轻量化 Markdown 编辑阅读一体化客户端，完整复刻 Typora 全部原生能力。

## 快速开始

- 点击 **文件 → 打开** 或按 \`Ctrl+O\` 打开 Markdown 文件
- 点击 **文件 → 新建** 或按 \`Ctrl+N\` 创建新文档
- 按 \`Ctrl+/\` 切换源码模式

## Markdown 语法示例

### 文本样式

**加粗文本**、*斜体文本*、~~删除线~~、\`行内代码\`、==高亮文本==

### 列表

1. 有序列表项 1
2. 有序列表项 2
3. 有序列表项 3

- 无序列表项 A
- 无序列表项 B
- 无序列表项 C

- [ ] 待办事项
- [x] 已完成事项

### 引用

> 这是一段引用文本
> 可以多行嵌套

### 代码块

\`\`\`javascript
function hello() {
  console.log("Hello, Copora!");
}
\`\`\`

### 表格

| 功能 | 快捷键 | 描述 |
|------|--------|------|
| 加粗 | Ctrl+B | 切换加粗 |
| 斜体 | Ctrl+I | 切换斜体 |
| 链接 | Ctrl+K | 插入链接 |
| 保存 | Ctrl+S | 保存文件 |

### 数学公式

行内公式: $E = mc^2$

块级公式:

$$
\\sum_{i=1}^{n} x_i = x_1 + x_2 + \\cdots + x_n
$$

---

开始你的写作之旅吧！
`,
  setRootPath: (path) => set({ rootPath: path }),
  setFiles: (files) => set({ files }),
  openFile: (tab) =>
    set((state) => {
      const exists = state.openTabs.some((t) => t.id === tab.id)
      const openTabs = exists ? state.openTabs : [...state.openTabs, tab]
      return { openTabs, activeTabId: tab.id }
    }),
  closeTab: (tabId) =>
    set((state) => {
      const openTabs = state.openTabs.filter((t) => t.id !== tabId)
      let activeTabId = state.activeTabId
      if (activeTabId === tabId) {
        const idx = state.openTabs.findIndex((t) => t.id === tabId)
        if (openTabs.length > 0) {
          activeTabId = openTabs[Math.min(idx, openTabs.length - 1)].id
        } else {
          activeTabId = null
        }
      }
      return { openTabs, activeTabId }
    }),
  setActiveTab: (tabId) => set({ activeTabId: tabId }),
  updateContent: (content) => set({ content }),
  markModified: (tabId, modified) =>
    set((state) => ({
      openTabs: state.openTabs.map((t) => (t.id === tabId ? { ...t, isModified: modified } : t)),
    })),
  addRecentFile: (path, name) =>
    set((state) => {
      const filtered = state.recentFiles.filter((f) => f.path !== path)
      return { recentFiles: [{ path, name, lastOpened: Date.now() }, ...filtered].slice(0, 20) }
    }),
  clearRecentFiles: () => set({ recentFiles: [] }),
  moveTab: (fromIndex, toIndex) =>
    set((state) => {
      const openTabs = [...state.openTabs]
      const [moved] = openTabs.splice(fromIndex, 1)
      openTabs.splice(toIndex, 0, moved)
      return { openTabs }
    }),
}))
